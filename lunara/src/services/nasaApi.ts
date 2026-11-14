/**
 * NASA open-data client.
 *
 * Sources:
 *  - DONKI (Space Weather Database Of Notifications, Knowledge, Information), via https://api.nasa.gov
 *  - NASA Image and Video Library, https://images-api.nasa.gov (no key required)
 *
 * The API key comes from EXPO_PUBLIC_NASA_API_KEY (see .env.example) and falls back to
 * NASA's public DEMO_KEY. Nothing secret is hard-coded.
 */
import type { NasaImage, NasaResult, SpaceWeatherSummary } from '../types/nasa';
import {
  isoDate,
  parseCmes,
  parseDonkiBody,
  parseFlares,
  parseImageSearch,
  parseParticleEvents,
  parseStorms,
} from './nasaParsers';
import { readCache, writeCache } from './storage';

const API_BASE = 'https://api.nasa.gov';
const IMAGES_BASE = 'https://images-api.nasa.gov';
const API_KEY = process.env.EXPO_PUBLIC_NASA_API_KEY || 'DEMO_KEY';
const TIMEOUT_MS = 12000;
const SPACE_WEATHER_TTL = 3 * 60 * 60 * 1000;
const IMAGES_TTL = 24 * 60 * 60 * 1000;

export type NasaErrorKind = 'offline' | 'timeout' | 'rateLimit' | 'server' | 'parse';

export class NasaApiError extends Error {
  constructor(
    public kind: NasaErrorKind,
    message: string,
  ) {
    super(message);
    this.name = 'NasaApiError';
  }
}

export const usingDemoKey = API_KEY === 'DEMO_KEY';

async function fetchText(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
  } catch (e) {
    const aborted = (e as Error)?.name === 'AbortError';
    throw new NasaApiError(
      aborted ? 'timeout' : 'offline',
      aborted ? 'NASA did not respond in time.' : 'Could not reach NASA. Check your connection.',
    );
  } finally {
    clearTimeout(timer);
  }
  if (response.status === 429) {
    throw new NasaApiError(
      'rateLimit',
      usingDemoKey
        ? 'NASA’s shared demo key hit its hourly limit. Add your own free key in .env to avoid this.'
        : 'NASA’s rate limit was reached. Try again later.',
    );
  }
  if (!response.ok) throw new NasaApiError('server', `NASA returned an error (${response.status}).`);
  return response.text();
}

async function fetchJson(url: string): Promise<unknown> {
  const text = await fetchText(url);
  try {
    return parseDonkiBody(text);
  } catch {
    throw new NasaApiError('parse', 'NASA sent data the app could not read.');
  }
}

async function withCache<T>(key: string, ttl: number, source: string, load: () => Promise<T>): Promise<NasaResult<T>> {
  const cached = await readCache<T>(key);
  if (cached && Date.now() - cached.savedAt < ttl) {
    return { data: cached.data, fetchedAt: new Date(cached.savedAt).toISOString(), source, fromCache: true };
  }
  try {
    const data = await load();
    await writeCache(key, data);
    return { data, fetchedAt: new Date().toISOString(), source, fromCache: false };
  } catch (e) {
    // Prefer showing older real data (clearly dated) over showing nothing.
    if (cached) {
      return { data: cached.data, fetchedAt: new Date(cached.savedAt).toISOString(), source, fromCache: true };
    }
    throw e;
  }
}

const DONKI_FEEDS = {
  flares: 'FLR',
  cmes: 'CME',
  particleEvents: 'SEP',
  storms: 'GST',
} as const;

const FEED_NAMES: Record<keyof typeof DONKI_FEEDS, string> = {
  flares: 'Solar flares',
  cmes: 'Coronal mass ejections',
  particleEvents: 'Solar energetic particles',
  storms: 'Geomagnetic storms',
};

/** Real space-weather events from the last 30 days, from NASA DONKI. */
export function getSpaceWeather(force = false): Promise<NasaResult<SpaceWeatherSummary>> {
  const load = async (): Promise<SpaceWeatherSummary> => {
    const end = new Date();
    const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    const range = `startDate=${isoDate(start)}&endDate=${isoDate(end)}&api_key=${encodeURIComponent(API_KEY)}`;
    const keys = Object.keys(DONKI_FEEDS) as (keyof typeof DONKI_FEEDS)[];
    const results = await Promise.allSettled(keys.map((k) => fetchJson(`${API_BASE}/DONKI/${DONKI_FEEDS[k]}?${range}`)));
    if (results.every((r) => r.status === 'rejected')) {
      throw (results[0] as PromiseRejectedResult).reason;
    }
    const value = (i: number) => (results[i].status === 'fulfilled' ? (results[i] as PromiseFulfilledResult<unknown>).value : []);
    return {
      rangeStart: isoDate(start),
      rangeEnd: isoDate(end),
      flares: parseFlares(value(0)),
      cmes: parseCmes(value(1)),
      particleEvents: parseParticleEvents(value(2)),
      storms: parseStorms(value(3)),
      unavailable: keys.filter((_, i) => results[i].status === 'rejected').map((k) => FEED_NAMES[k]),
    };
  };
  const ttl = force ? 0 : SPACE_WEATHER_TTL;
  return withCache('donki-30d', ttl, 'NASA DONKI space weather database', load);
}

/** Photographs from the NASA Image and Video Library. */
export function searchNasaImages(query: string, force = false): Promise<NasaResult<NasaImage[]>> {
  const load = async () => {
    const url = `${IMAGES_BASE}/search?q=${encodeURIComponent(query)}&media_type=image&page_size=24`;
    return parseImageSearch(await fetchJson(url));
  };
  const ttl = force ? 0 : IMAGES_TTL;
  return withCache(`images-${query.toLowerCase()}`, ttl, 'NASA Image and Video Library', load);
}

/** Larger rendition of a library thumbnail; falls back to the thumbnail if absent. */
export const mediumImageUrl = (thumbUrl: string) => thumbUrl.replace('~thumb.', '~medium.');
