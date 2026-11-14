import type { ActiveEmergency, BuildingId, EmergencyId, GameState, ResourceKey, Resources } from '../types/game';
import { EMERGENCIES, type ChoiceEffect, type EmergencyChoice } from '../data/emergencies';
import { BUILDINGS } from '../data/buildings';
import { DIFFICULTY_SETTINGS, GAME_RULES } from './config';
import { builtBuildings, describeShortfall, getPowerCapacity } from './buildingManager';
import { injureRandomCrew, resolveCrewLosses } from './crewManager';
import type { Rng } from './rng';
import { addLog, aliveCrew, hasActiveModifier, nextId, roleAlive } from './stateUtils';
import { clamp, round } from '../utils/math';

/** Earliest day an emergency can appear, so players can learn the controls first. */
export const FIRST_EMERGENCY_DAY = 3;

export function eligibleEmergencies(state: GameState): { id: EmergencyId; weight: number }[] {
  return (Object.keys(EMERGENCIES) as EmergencyId[])
    .filter((id) => id !== state.lastEmergencyId)
    .map((id) => ({ id, weight: EMERGENCIES[id].weight(state) }))
    .filter((e) => e.weight > 0);
}

/**
 * Rolls for a new emergency on the current day. Mutates state when one triggers.
 * At most one emergency is active at a time.
 */
export function maybeTriggerEmergency(state: GameState, rng: Rng): ActiveEmergency | null {
  if (state.status !== 'active') return null;
  if (state.day < FIRST_EMERGENCY_DAY || state.activeEmergencies.length > 0) return null;
  if (aliveCrew(state).length === 0) return null;
  const chance = DIFFICULTY_SETTINGS[state.config.difficulty].emergencyChance;
  if (rng.next() >= chance) return null;
  return triggerEmergency(state, rng);
}

export function triggerEmergency(state: GameState, rng: Rng, forcedId?: EmergencyId): ActiveEmergency | null {
  let id: EmergencyId | undefined = forcedId;
  if (!id) {
    const pool = eligibleEmergencies(state);
    const total = pool.reduce((acc, e) => acc + e.weight, 0);
    if (total <= 0) return null;
    let roll = rng.next() * total;
    for (const entry of pool) {
      roll -= entry.weight;
      if (roll <= 0) {
        id = entry.id;
        break;
      }
    }
    id = id ?? pool[pool.length - 1].id;
  }
  const def = EMERGENCIES[id];
  const built = builtBuildings(state);
  const emergency: ActiveEmergency = {
    instanceId: nextId(state, 'emergency'),
    emergencyId: id,
    dayTriggered: state.day,
    targetBuilding: def.targetsBuilding && built.length ? rng.pick(built) : undefined,
  };
  state.activeEmergencies.push(emergency);
  state.lastEmergencyId = id;
  state.stats.emergenciesEncountered += 1;
  if (def.onTrigger) applyChoiceEffect(state, def.onTrigger, emergency.targetBuilding, rng);
  addLog(state, def.severity === 'critical' ? 'critical' : 'warning', `Emergency: ${def.title}.`);
  return emergency;
}

/** Up-front cost of a choice after role bonuses. */
export function getChoiceCost(state: GameState, choice: EmergencyChoice): Partial<Resources> {
  const cost: Partial<Resources> = { ...(choice.cost ?? {}) };
  if (choice.isRepair && cost.materials && roleAlive(state, 'engineer')) {
    cost.materials = Math.ceil(cost.materials * (1 - GAME_RULES.roleBonuses.engineerRepairDiscount));
  }
  return cost;
}

export interface ChoiceStatus {
  available: boolean;
  reason?: string;
  cost: Partial<Resources>;
}

export function getChoiceStatus(state: GameState, choice: EmergencyChoice): ChoiceStatus {
  const cost = getChoiceCost(state, choice);
  const req = choice.requires;
  if (req?.building && state.buildings[req.building.id].level < req.building.level) {
    return { available: false, reason: `Requires ${BUILDINGS[req.building.id].name}`, cost };
  }
  if (req?.role && !roleAlive(state, req.role)) {
    return { available: false, reason: `Requires a living ${req.role}`, cost };
  }
  if (req?.notModifier && hasActiveModifier(state, req.notModifier)) {
    return { available: false, reason: 'Not possible while the link to Earth is down', cost };
  }
  const shortfall = describeShortfall(state.resources, cost);
  if (shortfall) return { available: false, reason: shortfall, cost };
  return { available: true, cost };
}

/** Applies a consequence bundle to the draft state. Returns human-readable notes. */
export function applyChoiceEffect(
  state: GameState,
  effect: ChoiceEffect,
  target: BuildingId | undefined,
  rng: Rng,
): string[] {
  const notes: string[] = [];

  if (effect.resources) {
    const capacity = getPowerCapacity(state);
    for (const [key, delta] of Object.entries(effect.resources) as [ResourceKey, number][]) {
      const max = key === 'power' ? capacity : Number.POSITIVE_INFINITY;
      state.resources[key] = round(clamp(state.resources[key] + delta, 0, max), 2);
    }
  }

  if (effect.crewHealth || effect.crewMorale) {
    for (const member of aliveCrew(state)) {
      member.health = round(clamp(member.health + (effect.crewHealth ?? 0), 0, 100), 1);
      member.morale = round(clamp(member.morale + (effect.crewMorale ?? 0), 0, 100), 1);
    }
  }

  if (effect.injureOne) {
    const member = injureRandomCrew(state, effect.injureOne, rng);
    if (member) notes.push(`${member.name} was hurt (${effect.injureOne} health).`);
  }

  if (effect.exposure) {
    state.radiation.cumulativeExposure = round(state.radiation.cumulativeExposure + effect.exposure, 2);
  }

  if (effect.buildingCondition) {
    const id = effect.buildingCondition.target === 'target' ? target : effect.buildingCondition.target;
    if (id && state.buildings[id].level > 0) {
      const b = state.buildings[id];
      b.condition = clamp(Math.round(b.condition + effect.buildingCondition.delta), 0, 100);
      notes.push(`${BUILDINGS[id].name} condition is now ${b.condition}%.`);
    }
  }

  for (const m of effect.modifiers ?? []) {
    state.modifiers.push({
      id: nextId(state, 'mod'),
      kind: m.kind,
      value: m.value,
      startDay: state.day,
      untilDay: state.day + m.days,
      label: m.label,
    });
  }

  if (effect.research) state.research = round(state.research + effect.research, 2);

  if (effect.delivery) {
    state.deliveries.push({
      id: nextId(state, 'delivery'),
      arrivalDay: state.day + effect.delivery.inDays,
      resources: effect.delivery.resources,
      label: effect.delivery.label,
    });
    notes.push(`${effect.delivery.label} expected on day ${state.day + effect.delivery.inDays}.`);
  }

  return notes;
}

/**
 * Applies the player's decision to the draft state. Returns an error string when invalid.
 * Crew losses caused by the decision are resolved here; mission failure is checked by the engine.
 */
export function applyEmergencyDecision(
  state: GameState,
  instanceId: string,
  choiceId: string,
  rng: Rng,
): { error?: string; message?: string } {
  const active = state.activeEmergencies.find((e) => e.instanceId === instanceId);
  if (!active) return { error: 'That emergency is no longer active.' };
  const def = EMERGENCIES[active.emergencyId];
  const choice = def.choices.find((c) => c.id === choiceId);
  if (!choice) return { error: 'Unknown decision.' };
  const status = getChoiceStatus(state, choice);
  if (!status.available) return { error: status.reason ?? 'That option is not available.' };

  for (const [key, amount] of Object.entries(status.cost) as [ResourceKey, number][]) {
    state.resources[key] = round(state.resources[key] - amount, 2);
  }

  const notes = applyChoiceEffect(state, choice.effect, active.targetBuilding, rng);
  let outcome = choice.outcome;
  if (choice.risk && rng.next() < choice.risk.chance) {
    notes.push(...applyChoiceEffect(state, choice.risk.effect, active.targetBuilding, rng));
    outcome = `${outcome} ${choice.risk.message}`;
  }
  const fullOutcome = [outcome, ...notes].join(' ');

  state.activeEmergencies = state.activeEmergencies.filter((e) => e.instanceId !== instanceId);
  state.decisions.push({
    day: state.day,
    emergencyId: def.id,
    emergencyTitle: def.title,
    choiceId: choice.id,
    choiceLabel: choice.label,
    rating: choice.rating,
    outcome: fullOutcome,
  });
  const tone = choice.rating === 'risky' ? 'warning' : 'success';
  addLog(state, tone, `${def.title}: ${choice.label.toLowerCase()}. ${outcome}`);
  resolveCrewLosses(state, state.day);
  return { message: fullOutcome };
}
