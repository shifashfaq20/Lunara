import type { GameState } from '../types/game';
import { GAME_RULES } from './config';

/**
 * Validates a value loaded from storage before the app trusts it.
 * Returns null for corrupt data or saves from an incompatible version.
 */
export function parseSavedMission(raw: string | null): GameState | null {
  if (!raw) return null;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isGameState(value)) return null;
  if (value.version !== GAME_RULES.stateVersion) return null;
  return value;
}

function isGameState(v: unknown): v is GameState {
  if (typeof v !== 'object' || v === null) return false;
  const s = v as Record<string, unknown>;
  const resources = s.resources as Record<string, unknown> | undefined;
  return (
    typeof s.version === 'number' &&
    typeof s.day === 'number' &&
    typeof s.status === 'string' &&
    typeof s.config === 'object' &&
    Array.isArray(s.crew) &&
    typeof s.buildings === 'object' &&
    Array.isArray(s.log) &&
    Array.isArray(s.objectives) &&
    typeof s.stats === 'object' &&
    !!resources &&
    ['oxygen', 'water', 'food', 'power', 'fuel', 'materials'].every((k) => typeof resources[k] === 'number')
  );
}
