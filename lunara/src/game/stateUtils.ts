import type { CrewMember, CrewRole, GameState, LogTone, Modifier, ModifierKind } from '../types/game';
import { GAME_RULES } from './config';

/** Game state is plain JSON, so a JSON round-trip is a safe deep copy. */
export const cloneState = (state: GameState): GameState => JSON.parse(JSON.stringify(state));

export function nextId(state: GameState, prefix: string): string {
  state.seq += 1;
  return `${prefix}-${state.seq}`;
}

export function addLog(state: GameState, tone: LogTone, message: string, day = state.day) {
  state.log.push({ id: nextId(state, 'log'), day, tone, message });
  if (state.log.length > GAME_RULES.logLimit) {
    state.log.splice(0, state.log.length - GAME_RULES.logLimit);
  }
}

export const aliveCrew = (state: GameState): CrewMember[] => state.crew.filter((c) => c.alive);

export const roleAlive = (state: GameState, role: CrewRole) => state.crew.some((c) => c.alive && c.role === role);

export const isModifierActive = (m: Modifier, day: number) => m.startDay <= day && day < m.untilDay;

export const activeModifiers = (state: GameState, kind: ModifierKind, day = state.day) =>
  state.modifiers.filter((m) => m.kind === kind && isModifierActive(m, day));

export const hasActiveModifier = (state: GameState, kind: ModifierKind, day = state.day) =>
  activeModifiers(state, kind, day).length > 0;

/** Product of all active multiplier modifiers of a kind (1 when none). */
export const modifierProduct = (state: GameState, kind: ModifierKind, day = state.day) =>
  activeModifiers(state, kind, day).reduce((acc, m) => acc * m.value, 1);

export const modifierSum = (state: GameState, kind: ModifierKind, day = state.day) =>
  activeModifiers(state, kind, day).reduce((acc, m) => acc + m.value, 0);

export const modifierMax = (state: GameState, kind: ModifierKind, day = state.day) =>
  activeModifiers(state, kind, day).reduce((acc, m) => Math.max(acc, m.value), 0);
