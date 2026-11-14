import AsyncStorage from '@react-native-async-storage/async-storage';
import type { GameState } from '../types/game';
import { parseSavedMission } from '../game/persistence';

const MISSION_KEY = 'lunara:mission:v1';
const CACHE_PREFIX = 'lunara:cache:';

export async function saveMission(state: GameState): Promise<void> {
  await AsyncStorage.setItem(MISSION_KEY, JSON.stringify(state));
}

export async function loadMission(): Promise<GameState | null> {
  const raw = await AsyncStorage.getItem(MISSION_KEY);
  const parsed = parseSavedMission(raw);
  if (raw && !parsed) {
    // Unreadable or outdated save: remove it so the app starts cleanly.
    await AsyncStorage.removeItem(MISSION_KEY);
  }
  return parsed;
}

export async function clearMission(): Promise<void> {
  await AsyncStorage.removeItem(MISSION_KEY);
}

interface CacheEnvelope<T> {
  savedAt: number;
  data: T;
}

export async function readCache<T>(key: string): Promise<{ data: T; savedAt: number } | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEnvelope<T>;
    return typeof parsed.savedAt === 'number' ? parsed : null;
  } catch {
    return null;
  }
}

export async function writeCache<T>(key: string, data: T): Promise<void> {
  try {
    const envelope: CacheEnvelope<T> = { savedAt: Date.now(), data };
    await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(envelope));
  } catch {
    // Caching is best-effort; a failed write must never break the screen.
  }
}
