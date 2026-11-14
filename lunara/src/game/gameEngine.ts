/**
 * LUNARA game engine: pure functions that take a GameState and return a new one.
 * React components never calculate game rules; they call these actions.
 */
import type {
  ActionResult,
  BuildingId,
  GameState,
  MissionConfig,
  OperationsMode,
  RadiationLevel,
  ResourceKey,
} from '../types/game';
import { RESOURCE_META } from '../data/resources';
import { GAME_RULES, OPERATIONS_MODES } from './config';
import { createRng } from './rng';
import { createMission, getMissionDefinition, getSunlight } from './missions';
import { dailyNeeds, netResources, simulateResources } from './resourceManager';
import {
  advanceConstruction,
  applyConstructionStart,
  applyRepair,
  canConstruct,
  canRepair,
  getBuildingEffects,
  getPowerCapacity,
} from './buildingManager';
import { averageHealth, averageMorale, updateCrew } from './crewManager';
import { applyEmergencyDecision, maybeTriggerEmergency } from './eventManager';
import { evaluateObjectives } from './objectiveManager';
import { addLog, aliveCrew, cloneState, hasActiveModifier, modifierMax, modifierProduct } from './stateUtils';
import { clamp, round } from '../utils/math';

const ok = (state: GameState, message?: string): ActionResult => ({ ok: true, state, message });
const fail = (state: GameState, error: string): ActionResult => ({ ok: false, state, error });

export function radiationLevelFor(index: number): RadiationLevel {
  const l = GAME_RULES.radiation.levels;
  if (index >= l.severe) return 'severe';
  if (index >= l.high) return 'high';
  if (index >= l.elevated) return 'elevated';
  return 'nominal';
}

export function startMission(config: MissionConfig, now = new Date()): GameState {
  return createMission(config, now);
}

function finish(state: GameState, status: GameState['status'], reason: string, now: Date) {
  state.status = status;
  state.endReason = reason;
  state.endedAt = now.toISOString();
  state.activeEmergencies = [];
  const tone = status === 'success' ? 'success' : status === 'aborted' ? 'warning' : 'critical';
  addLog(state, tone, reason);
}

function processDeliveries(state: GameState) {
  const commsDown = hasActiveModifier(state, 'commsDown');
  const capacity = getPowerCapacity(state);
  const remaining = [];
  for (const delivery of state.deliveries) {
    if (delivery.arrivalDay > state.day) {
      remaining.push(delivery);
      continue;
    }
    if (commsDown) {
      remaining.push({ ...delivery, arrivalDay: state.day + 1 });
      addLog(state, 'warning', `${delivery.label} is holding in orbit: no link to guide the landing.`);
      continue;
    }
    const parts: string[] = [];
    for (const [key, amount] of Object.entries(delivery.resources) as [ResourceKey, number][]) {
      const max = key === 'power' ? capacity : Number.POSITIVE_INFINITY;
      state.resources[key] = round(clamp(state.resources[key] + amount, 0, max), 2);
      parts.push(`+${amount} ${RESOURCE_META[key].unit} ${RESOURCE_META[key].label.toLowerCase()}`);
    }
    addLog(state, 'success', `${delivery.label} landed: ${parts.join(', ')}.`);
  }
  state.deliveries = remaining;
}

/**
 * Ends the current day. Order of operations:
 * 1–3. consumption, production and building effects (simulateResources)
 * 4. crew health, morale and radiation exposure
 *    construction crews finish their shift (new buildings run from tomorrow)
 * 7. success / failure check
 * 5. eligible emergencies for the new day
 * 6. objectives
 * 8. saving is done by the persistence layer after every state change.
 */
export function endDay(state: GameState, now = new Date()): ActionResult {
  if (state.status !== 'active') return fail(state, 'This mission has already ended.');
  if (state.activeEmergencies.length > 0) return fail(state, 'Resolve the active emergency before ending the day.');

  const s = cloneState(state);
  const rng = createRng(s.rngState);
  const mission = getMissionDefinition(s.config.missionType);
  const day = s.day;

  // 1–3. Resources
  const sunlight = getSunlight(mission, day);
  const sim = simulateResources(s, sunlight, day);
  s.resources = sim.resources;
  s.research = round(s.research + sim.research, 2);
  for (const key of Object.keys(sim.produced) as ResourceKey[]) {
    s.stats.totalProduced[key] = round(s.stats.totalProduced[key] + sim.produced[key], 2);
    s.stats.totalConsumed[key] = round(s.stats.totalConsumed[key] + sim.consumed[key], 2);
  }

  // Radiation (simulated index, not a measured dose)
  const r = GAME_RULES.radiation;
  const index = clamp(Math.max(mission.radiationBase + rng.int(r.noiseMin, r.noiseMax), modifierMax(s, 'radiationSpike', day)), 0, 100);
  const shielding = getBuildingEffects(s).shielding;
  const exposureMult = OPERATIONS_MODES[s.operationsMode].exposureMultiplier * modifierProduct(s, 'exposureMult', day);
  const dailyExposure = round((index / 10) * (1 - shielding) * exposureMult, 2);
  s.radiation = {
    index,
    level: radiationLevelFor(index),
    cumulativeExposure: round(s.radiation.cumulativeExposure + dailyExposure, 2),
  };
  s.stats.peakRadiationIndex = Math.max(s.stats.peakRadiationIndex, index);

  // 4. Crew
  updateCrew(s, {
    day,
    shortage: sim.shortage,
    criticalPower: sim.criticalPower,
    dailyExposure,
    healing: sim.healing,
    greenhouseMorale: sim.greenhouseMorale,
  });

  // Construction crews finish their shift.
  advanceConstruction(s);

  // Logs for what went wrong today.
  if (sim.shortage.oxygen > 0) addLog(s, 'critical', 'Oxygen ran out. The crew is suffering from hypoxia.', day);
  if (sim.shortage.water > 0) addLog(s, 'critical', 'Water ran out. The crew is dehydrated.', day);
  if (sim.shortage.food > 0) addLog(s, 'critical', 'Food ran out. The crew went hungry.', day);
  if (sim.criticalPower < 1) {
    addLog(s, 'critical', `Life support received only ${Math.round(sim.criticalPower * 100)}% of the power it needed.`, day);
  } else if (sim.auxiliaryPower < 1) {
    addLog(s, 'warning', `Greenhouse and lab ran at ${Math.round(sim.auxiliaryPower * 100)}% power.`, day);
  }
  if (index >= r.levels.high) addLog(s, 'warning', `Radiation index peaked at ${index} (simulated).`, day);

  // Daily statistics
  const alive = aliveCrew(s).length;
  const needs = dailyNeeds(s, day);
  const reserve = GAME_RULES.reserveDaysTarget;
  const T = GAME_RULES.objectiveThresholds;
  const avgH = averageHealth(s);
  const avgM = averageMorale(s);
  const oxygenOk = alive > 0 && s.resources.oxygen >= needs.oxygen * reserve;
  const waterOk = alive > 0 && s.resources.water >= needs.water * reserve;
  s.stats.daysSimulated += 1;
  s.stats.sumAvgHealth = round(s.stats.sumAvgHealth + avgH, 2);
  s.stats.sumAvgMorale = round(s.stats.sumAvgMorale + avgM, 2);
  if (oxygenOk) s.stats.daysOxygenOk += 1;
  if (waterOk) s.stats.daysWaterOk += 1;
  if (alive > 0 && avgH >= T.wellbeingHealth && avgM >= T.wellbeingMorale) s.stats.daysWellbeingOk += 1;
  const shortages = (['oxygen', 'water', 'food'] as const).filter((k) => sim.shortage[k] > 0);
  if (shortages.length === 0 && sim.criticalPower >= 1) s.stats.daysWithoutShortage += 1;
  if (alive > 0 && !oxygenOk && sim.shortage.oxygen === 0) {
    addLog(s, 'warning', `Oxygen reserve is below ${reserve} days.`, day);
  }
  if (alive > 0 && !waterOk && sim.shortage.water === 0) {
    addLog(s, 'warning', `Water reserve is below ${reserve} days.`, day);
  }

  s.lastReport = {
    day,
    sunlight,
    radiationIndex: index,
    dailyExposure,
    produced: sim.produced,
    consumed: sim.consumed,
    net: netResources(sim.produced, sim.consumed),
    criticalPower: sim.criticalPower,
    auxiliaryPower: sim.auxiliaryPower,
    shortages: shortages.length ? [...shortages] : sim.criticalPower < 1 ? ['power'] : [],
    researchGained: sim.research,
  };
  addLog(s, 'info', `Day ${day} complete. Sunlight ${Math.round(sunlight * 100)}%, research +${round(sim.research, 1)}.`, day);

  // 7. End conditions
  if (alive === 0) {
    finish(s, 'failed', `Mission failed on day ${day}: all crew members were lost.`, now);
  } else if (day >= s.config.durationDays) {
    finish(s, 'success', `Mission complete. ${alive} of ${s.crew.length} crew survived all ${day} days.`, now);
  } else {
    s.day = day + 1;
    s.modifiers = s.modifiers.filter((m) => m.untilDay > s.day);
    processDeliveries(s);
    // 5. Emergencies for the new day
    maybeTriggerEmergency(s, rng);
  }

  // 6. Objectives
  s.objectives = evaluateObjectives(s);
  s.rngState = rng.state;
  s.updatedAt = now.toISOString();
  return ok(s);
}

export function constructBuilding(state: GameState, id: BuildingId, now = new Date()): ActionResult {
  const check = canConstruct(state, id);
  if (!check.ok) return fail(state, check.reason ?? 'Cannot build right now.');
  const s = cloneState(state);
  applyConstructionStart(s, id);
  s.objectives = evaluateObjectives(s);
  s.updatedAt = now.toISOString();
  return ok(s);
}

export function repairBuilding(state: GameState, id: BuildingId, now = new Date()): ActionResult {
  const check = canRepair(state, id);
  if (!check.ok) return fail(state, check.reason ?? 'Cannot repair right now.');
  const s = cloneState(state);
  applyRepair(s, id);
  s.updatedAt = now.toISOString();
  return ok(s);
}

export function resolveEmergency(state: GameState, instanceId: string, choiceId: string, now = new Date()): ActionResult {
  if (state.status !== 'active') return fail(state, 'This mission has already ended.');
  const s = cloneState(state);
  const rng = createRng(s.rngState);
  const result = applyEmergencyDecision(s, instanceId, choiceId, rng);
  if (result.error) return fail(state, result.error);
  if (aliveCrew(s).length === 0) {
    finish(s, 'failed', `Mission failed on day ${s.day}: all crew members were lost.`, now);
  }
  s.objectives = evaluateObjectives(s);
  s.rngState = rng.state;
  s.updatedAt = now.toISOString();
  return ok(s, result.message);
}

export function setOperationsMode(state: GameState, mode: OperationsMode, now = new Date()): ActionResult {
  if (state.status !== 'active') return fail(state, 'This mission has already ended.');
  if (!OPERATIONS_MODES[mode]) return fail(state, 'Unknown operations mode.');
  if (state.operationsMode === mode) return ok(state);
  const s = cloneState(state);
  s.operationsMode = mode;
  addLog(s, 'info', `Operations plan changed to ${OPERATIONS_MODES[mode].label.toLowerCase()}.`);
  s.updatedAt = now.toISOString();
  const warning =
    mode === 'science' && s.resources.fuel < OPERATIONS_MODES.science.fuelPerDay
      ? 'Not enough fuel for rover sorties. Field research will not run.'
      : undefined;
  return ok(s, warning);
}

export function canAbort(state: GameState): { ok: boolean; reason?: string } {
  if (state.status !== 'active') return { ok: false, reason: 'The mission has already ended.' };
  if (aliveCrew(state).length === 0) return { ok: false, reason: 'No crew left to evacuate.' };
  if (state.resources.fuel < GAME_RULES.abortFuelCost) {
    return { ok: false, reason: `Evacuation needs ${GAME_RULES.abortFuelCost} kg of fuel.` };
  }
  return { ok: true };
}

export function abortMission(state: GameState, now = new Date()): ActionResult {
  const check = canAbort(state);
  if (!check.ok) return fail(state, check.reason ?? 'Cannot abort.');
  const s = cloneState(state);
  s.resources.fuel = round(s.resources.fuel - GAME_RULES.abortFuelCost, 2);
  finish(s, 'aborted', `Mission aborted on day ${s.day}. ${aliveCrew(s).length} crew evacuated to the return vehicle.`, now);
  s.objectives = evaluateObjectives(s);
  s.updatedAt = now.toISOString();
  return ok(s);
}
