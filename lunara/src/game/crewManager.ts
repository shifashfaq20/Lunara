import type { CrewMember, GameState } from '../types/game';
import { CREW_NAMES, ROLE_ORDER } from '../data/crew';
import { GAME_RULES, OPERATIONS_MODES } from './config';
import { createRng, type Rng } from './rng';
import { addLog, aliveCrew, hasActiveModifier, modifierSum, roleAlive } from './stateUtils';
import { average, clamp, round } from '../utils/math';

export function generateCrew(seed: number, size: number): CrewMember[] {
  const rng = createRng(seed ^ 0x5eed);
  const names = [...CREW_NAMES];
  // Fisher–Yates shuffle with the seeded RNG so the roster is reproducible.
  for (let i = names.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1));
    [names[i], names[j]] = [names[j], names[i]];
  }
  return ROLE_ORDER.slice(0, size).map((role, i) => ({
    id: `crew-${i + 1}`,
    name: names[i],
    role,
    health: GAME_RULES.crew.startHealth,
    morale: GAME_RULES.crew.startMorale,
    alive: true,
  }));
}

export const averageHealth = (state: GameState) => round(average(aliveCrew(state).map((c) => c.health)), 1);
export const averageMorale = (state: GameState) => round(average(aliveCrew(state).map((c) => c.morale)), 1);

export type CrewCondition = 'healthy' | 'strained' | 'injured' | 'critical' | 'lost';

export function crewCondition(member: CrewMember): CrewCondition {
  if (!member.alive) return 'lost';
  if (member.health >= 75) return 'healthy';
  if (member.health >= 50) return 'strained';
  if (member.health >= 25) return 'injured';
  return 'critical';
}

export interface CrewDayInput {
  day: number;
  shortage: { oxygen: number; water: number; food: number };
  criticalPower: number;
  dailyExposure: number;
  healing: number;
  greenhouseMorale: number;
}

/** Marks crew with health at zero as lost and applies the morale shock to survivors. */
export function resolveCrewLosses(state: GameState, day: number): CrewMember[] {
  const lost: CrewMember[] = [];
  for (const member of state.crew) {
    if (member.alive && member.health <= 0) {
      member.alive = false;
      member.health = 0;
      member.dayLost = day;
      lost.push(member);
    }
  }
  if (lost.length) {
    for (const member of aliveCrew(state)) {
      member.morale = clamp(member.morale - GAME_RULES.crew.lossMoraleShock * lost.length, 0, 100);
    }
    for (const member of lost) {
      addLog(state, 'critical', `${member.name} has died. The crew is devastated.`, day);
    }
  }
  return lost;
}

/** Daily health and morale update for every living crew member. Mutates state. */
export function updateCrew(state: GameState, input: CrewDayInput): CrewMember[] {
  const c = GAME_RULES.crew;
  const mode = OPERATIONS_MODES[state.operationsMode];
  const { shortage } = input;
  const anyShortage = shortage.oxygen > 0 || shortage.water > 0 || shortage.food > 0;
  const commander = roleAlive(state, 'commander') ? c.commanderMorale : 0;
  const commsDown = hasActiveModifier(state, 'commsDown', input.day) ? -2 : 0;
  const drain = modifierSum(state, 'moraleDrain', input.day);
  const radiationHarm = Math.max(0, input.dailyExposure - c.radiationHealthThreshold) * c.radiationHealthFactor;

  for (const member of aliveCrew(state)) {
    let dh = 0;
    let dm = c.moraleDrift + commander + input.greenhouseMorale + mode.moralePerDay + commsDown + drain;

    dh -= c.oxygenShortageHealth * shortage.oxygen;
    dh -= c.waterShortageHealth * shortage.water;
    dh -= c.foodShortageHealth * shortage.food;
    dm -= c.shortageMorale * (shortage.oxygen + shortage.water + shortage.food);
    dm -= c.powerShortageMorale * (1 - input.criticalPower);
    dh -= radiationHarm;
    dh += mode.healthPerDay;
    dh += input.healing;
    if (!anyShortage && member.morale >= 40) dh += c.naturalRecovery;
    if (member.health < 40) dm -= 1;

    member.health = round(clamp(member.health + dh, 0, 100), 1);
    member.morale = round(clamp(member.morale + dm, 0, 100), 1);
  }
  return resolveCrewLosses(state, input.day);
}

export function injureRandomCrew(state: GameState, amount: number, rng: Rng): CrewMember | null {
  const alive = aliveCrew(state);
  if (!alive.length) return null;
  const member = rng.pick(alive);
  member.health = round(clamp(member.health + amount, 0, 100), 1);
  return member;
}
