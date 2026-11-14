/**
 * Scripted commanders used by the tests to play whole missions.
 * Not a test file itself (jest only picks up *.test.ts).
 */
import type { BuildingId, GameState } from '../../types/game';
import { EMERGENCIES } from '../../data/emergencies';
import { constructBuilding, endDay, repairBuilding, resolveEmergency, setOperationsMode } from '../gameEngine';
import { canConstruct, canRepair, getPowerCapacity } from '../buildingManager';
import { getChoiceStatus } from '../eventManager';
import { researchTarget } from '../../data/objectives';

const RANK = { optimal: 0, acceptable: 1, risky: 2 } as const;

export type DecisionPolicy = 'careful' | 'reckless';

export function resolveFirstAvailable(state: GameState, now: Date, policy: DecisionPolicy = 'careful'): GameState {
  let s = state;
  const dir = policy === 'careful' ? 1 : -1;
  while (s.activeEmergencies.length && s.status === 'active') {
    const em = s.activeEmergencies[0];
    const choices = [...EMERGENCIES[em.emergencyId].choices].sort((a, b) => dir * (RANK[a.rating] - RANK[b.rating]));
    const pick = choices.find((c) => getChoiceStatus(s, c).available)!;
    const r = resolveEmergency(s, em.instanceId, pick.id, now);
    if (!r.ok) throw new Error(r.error);
    s = r.state;
  }
  return s;
}

const BUILD_ORDER: BuildingId[] = [
  'oxygenGenerator',
  'waterRecycler',
  'solarFarm',
  'greenhouse',
  'batteryStorage',
  'radiationShelter',
  'researchLab',
  'solarFarm',
  'medicalBay',
  'batteryStorage',
  'greenhouse',
  'researchLab',
  'oxygenGenerator',
  'waterRecycler',
];

/** Builds in a sensible order, keeps fuel for the trip home, repairs damage, manages power. */
export function playSmart(initial: GameState, now: Date, policy: DecisionPolicy = 'careful'): GameState {
  let s = initial;
  let guard = 0;
  while (s.status === 'active' && guard++ < 200) {
    s = resolveFirstAvailable(s, now, policy);
    if (s.status !== 'active') break;

    for (const id of Object.keys(s.buildings) as BuildingId[]) {
      if (s.buildings[id].condition < 70 && canRepair(s, id).ok) {
        const r = repairBuilding(s, id, now);
        if (r.ok) s = r.state;
      }
    }

    const levelsQueued: Partial<Record<BuildingId, number>> = {};
    for (const id of BUILD_ORDER) {
      levelsQueued[id] = (levelsQueued[id] ?? 0) + 1;
      const b = s.buildings[id];
      const current = b.level + (b.construction ? 1 : 0);
      if (current >= levelsQueued[id]!) continue;
      const check = canConstruct(s, id);
      const fuelAfter = s.resources.fuel - (check.cost.fuel ?? 0);
      if (check.ok && fuelAfter >= 28) {
        const r = constructBuilding(s, id, now);
        if (r.ok) s = r.state;
      }
      break; // strictly follow the order
    }

    const lowPower = s.resources.power < getPowerCapacity(s) * 0.25;
    const behindOnScience = s.research < researchTarget(s.config) * (s.day / s.config.durationDays);
    const mode = lowPower ? 'conservation' : behindOnScience && s.resources.fuel > 40 ? 'science' : 'standard';
    const m = setOperationsMode(s, mode, now);
    if (m.ok) s = m.state;

    const r = endDay(s, now);
    if (!r.ok) throw new Error(r.error);
    s = r.state;
  }
  return s;
}

/** Never builds anything; picks the free option in every emergency. */
export function playIdle(initial: GameState, now: Date): GameState {
  let s = initial;
  let guard = 0;
  while (s.status === 'active' && guard++ < 200) {
    s = resolveFirstAvailable(s, now);
    if (s.status !== 'active') break;
    const r = endDay(s, now);
    if (!r.ok) throw new Error(r.error);
    s = r.state;
  }
  return s;
}
