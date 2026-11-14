import type { GameState, ObjectiveId, ObjectiveProgress, ObjectiveStatus } from '../types/game';
import { OBJECTIVES, researchTarget } from '../data/objectives';
import { GAME_RULES } from './config';
import { clamp, round } from '../utils/math';

const T = GAME_RULES.objectiveThresholds;

const isFinal = (state: GameState) => state.status !== 'active';

/** "Keep X on most days" objectives fail permanently once the allowance of bad days is used up. */
function allowanceObjective(
  id: ObjectiveId,
  state: GameState,
  okDays: number,
  requiredRatio: number,
  label: string,
): ObjectiveProgress {
  const D = state.config.durationDays;
  const simulated = state.stats.daysSimulated;
  const allowed = Math.floor((1 - requiredRatio) * D);
  const misses = simulated - okDays;
  const progress = simulated === 0 ? 1 : okDays / simulated;
  let status: ObjectiveStatus;
  if (misses > allowed) status = 'failed';
  else if (isFinal(state)) status = state.status === 'failed' ? 'failed' : 'completed';
  else status = allowed > 0 && misses >= allowed ? 'atRisk' : 'inProgress';
  const detail =
    misses > allowed
      ? `${misses} ${label} days. The limit was ${allowed}.`
      : `${misses} of ${allowed} allowed ${label} day${allowed === 1 ? '' : 's'} used.`;
  return { id, progress: round(progress, 3), status, detail };
}

function constructionObjective(id: ObjectiveId, state: GameState, building: 'greenhouse' | 'radiationShelter') {
  const b = state.buildings[building];
  if (b.level > 0) return { id, progress: 1, status: 'completed' as const, detail: `Level ${b.level} online.` };
  if (b.construction) {
    const done = (b.construction.totalDays - b.construction.daysRemaining) / b.construction.totalDays;
    const left = b.construction.daysRemaining;
    return {
      id,
      progress: round(0.1 + done * 0.85, 3),
      status: (isFinal(state) ? 'failed' : 'inProgress') as ObjectiveStatus,
      detail: `Under construction, ${left} day${left === 1 ? '' : 's'} left.`,
    };
  }
  return {
    id,
    progress: 0,
    status: (isFinal(state) ? 'failed' : 'inProgress') as ObjectiveStatus,
    detail: 'Not started. Build it from the Base screen.',
  };
}

export function evaluateObjectives(state: GameState): ObjectiveProgress[] {
  const D = state.config.durationDays;
  const s = state.stats;
  const final = isFinal(state);

  const results: Record<ObjectiveId, ObjectiveProgress> = {
    survive: {
      id: 'survive',
      progress: round(clamp(s.daysSimulated / D, 0, 1), 3),
      status: state.status === 'success' ? 'completed' : final ? 'failed' : 'inProgress',
      detail: `Day ${s.daysSimulated} of ${D} complete.`,
    },
    oxygenReserve: allowanceObjective('oxygenReserve', state, s.daysOxygenOk, T.reserveRatio, 'low-oxygen'),
    waterReserve: allowanceObjective('waterReserve', state, s.daysWaterOk, T.reserveRatio, 'low-water'),
    buildGreenhouse: constructionObjective('buildGreenhouse', state, 'greenhouse'),
    buildShelter: constructionObjective('buildShelter', state, 'radiationShelter'),
    research: (() => {
      const target = researchTarget(state.config);
      const progress = clamp(state.research / target, 0, 1);
      let status: ObjectiveStatus = progress >= 1 ? 'completed' : final ? 'failed' : 'inProgress';
      const daysLeft = D - s.daysSimulated;
      const rate = state.lastReport?.researchGained ?? 0;
      if (status === 'inProgress' && s.daysSimulated > 0 && rate * daysLeft < target - state.research) status = 'atRisk';
      return {
        id: 'research' as const,
        progress: round(progress, 3),
        status,
        detail: `${Math.floor(state.research)} of ${target} points.`,
      };
    })(),
    emergencyResponse: (() => {
      const total = state.decisions.length;
      if (total === 0) {
        return {
          id: 'emergencyResponse' as const,
          progress: 1,
          status: (final ? 'completed' : 'inProgress') as ObjectiveStatus,
          detail: 'No emergencies handled yet.',
        };
      }
      const good = state.decisions.filter((d) => d.rating !== 'risky').length;
      const ratio = good / total;
      const ok = ratio >= T.emergencyRatio;
      return {
        id: 'emergencyResponse' as const,
        progress: round(ratio, 3),
        status: (final ? (ok ? 'completed' : 'failed') : ok ? 'inProgress' : 'atRisk') as ObjectiveStatus,
        detail: `${good} of ${total} decisions rated optimal or acceptable.`,
      };
    })(),
    crewWellbeing: allowanceObjective('crewWellbeing', state, s.daysWellbeingOk, T.wellbeingRatio, 'low-wellbeing'),
    returnFuel: (() => {
      const reserve = GAME_RULES.returnFuelReserve;
      if (state.status === 'aborted') {
        return { id: 'returnFuel' as const, progress: 1, status: 'completed' as const, detail: 'Reserve used for the early return.' };
      }
      const fuel = state.resources.fuel;
      const ok = fuel >= reserve;
      return {
        id: 'returnFuel' as const,
        progress: round(clamp(fuel / reserve, 0, 1), 3),
        status: (final ? (ok && state.status === 'success' ? 'completed' : 'failed') : ok ? 'inProgress' : 'atRisk') as ObjectiveStatus,
        detail: `${Math.floor(fuel)} of ${reserve} kg reserved.`,
      };
    })(),
  };

  return OBJECTIVES.map((o) => results[o.id]);
}
