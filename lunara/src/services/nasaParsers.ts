/**
 * Pure parsers for NASA API payloads. They never invent values:
 * missing fields stay undefined and malformed entries are dropped.
 */
import type {
  CoronalMassEjection,
  GeomagneticStorm,
  NasaImage,
  SolarFlare,
  SolarParticleEvent,
} from '../types/nasa';

type Json = Record<string, unknown>;
const str = (v: unknown) => (typeof v === 'string' && v.length ? v : undefined);
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);
const asArray = (v: unknown): Json[] => (Array.isArray(v) ? (v.filter((x) => x && typeof x === 'object') as Json[]) : []);
const byNewest = <T>(get: (x: T) => string) => (a: T, b: T) => get(b).localeCompare(get(a));

export function parseFlares(payload: unknown): SolarFlare[] {
  return asArray(payload)
    .map((f) => ({
      id: str(f.flrID) ?? '',
      classType: str(f.classType) ?? '',
      peakTime: str(f.peakTime) ?? str(f.beginTime) ?? '',
      sourceLocation: str(f.sourceLocation),
      activeRegion: num(f.activeRegionNum),
      link: str(f.link),
    }))
    .filter((f) => f.id && f.classType && f.peakTime)
    .sort(byNewest((f) => f.peakTime));
}

export function parseCmes(payload: unknown): CoronalMassEjection[] {
  return asArray(payload)
    .map((c) => {
      const analyses = asArray(c.cmeAnalyses);
      const best = analyses.find((a) => a.isMostAccurate === true) ?? analyses[0];
      return {
        id: str(c.activityID) ?? '',
        startTime: str(c.startTime) ?? '',
        speedKmS: best ? num(best.speed) : undefined,
        note: str(c.note),
        link: str(c.link),
      };
    })
    .filter((c) => c.id && c.startTime)
    .sort(byNewest((c) => c.startTime));
}

export function parseParticleEvents(payload: unknown): SolarParticleEvent[] {
  return asArray(payload)
    .map((e) => ({ id: str(e.sepID) ?? '', eventTime: str(e.eventTime) ?? '', link: str(e.link) }))
    .filter((e) => e.id && e.eventTime)
    .sort(byNewest((e) => e.eventTime));
}

export function parseStorms(payload: unknown): GeomagneticStorm[] {
  return asArray(payload)
    .map((g) => {
      const kps = asArray(g.allKpIndex)
        .map((k) => num(k.kpIndex))
        .filter((k): k is number => k !== undefined);
      return {
        id: str(g.gstID) ?? '',
        startTime: str(g.startTime) ?? '',
        maxKp: kps.length ? Math.max(...kps) : undefined,
        link: str(g.link),
      };
    })
    .filter((g) => g.id && g.startTime)
    .sort(byNewest((g) => g.startTime));
}

export function parseImageSearch(payload: unknown): NasaImage[] {
  const collection = (payload as Json | null)?.collection as Json | undefined;
  return asArray(collection?.items)
    .map((item) => {
      const data = asArray(item.data)[0] ?? {};
      const link = asArray(item.links).find((l) => str(l.render) === 'image' || str(l.rel) === 'preview');
      return {
        nasaId: str(data.nasa_id) ?? '',
        title: str(data.title) ?? '',
        description: str(data.description),
        dateCreated: str(data.date_created),
        center: str(data.center),
        thumbUrl: str(link?.href) ?? '',
      };
    })
    .filter((i) => i.nasaId && i.title && i.thumbUrl.startsWith('https://'));
}

/** DONKI sometimes answers an empty range with an empty body instead of []. */
export function parseDonkiBody(text: string): unknown {
  const trimmed = text.trim();
  return trimmed ? JSON.parse(trimmed) : [];
}

/** Flare class letter → plain-language strength. */
export function flareStrength(classType: string): 'minor' | 'moderate' | 'strong' | 'extreme' {
  const letter = classType.charAt(0).toUpperCase();
  const magnitude = parseFloat(classType.slice(1)) || 1;
  if (letter === 'X') return magnitude >= 10 ? 'extreme' : 'strong';
  if (letter === 'M') return 'moderate';
  return 'minor';
}

export const isoDate = (d: Date) => d.toISOString().slice(0, 10);

const FLARE_LETTERS: Record<string, number> = { A: 1, B: 2, C: 3, M: 4, X: 5 };

/** Sortable strength of a flare class, so X10 ranks above X2 and M9.9 below X1. */
export function flareRank(classType: string): number {
  const letter = FLARE_LETTERS[classType.charAt(0).toUpperCase()] ?? 0;
  const magnitude = parseFloat(classType.slice(1)) || 0;
  return letter * 1000 + magnitude;
}
