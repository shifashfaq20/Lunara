import type { BuildingId, GameState, ResourceKey, Resources } from '../types/game';
import { BUILDINGS, GREENHOUSE_EXTRAS, MAX_BUILDING_LEVEL, type BuildingLevelSpec } from '../data/buildings';
import { RESOURCE_META } from '../data/resources';
import { GAME_RULES } from './config';
import { addLog, aliveCrew, roleAlive } from './stateUtils';
import { round } from '../utils/math';

export interface BuildingEffects {
  solarOutput: number; // kWh/day at full sun, including habitat panels
  oxygenOutput: number; // kg/day from the generator (excludes habitat unit)
  waterRecovery: number; // fraction 0–1 including the habitat loop
  greenhouseFood: number;
  greenhouseWater: number;
  greenhouseOxygen: number;
  greenhouseMorale: number;
  shielding: number; // fraction 0–1 including habitat walls
  batteryCapacity: number; // kWh including habitat battery
  healing: number;
  research: number;
  criticalUpkeep: number;
  auxiliaryUpkeep: number;
}

const levelSpec = (id: BuildingId, level: number): BuildingLevelSpec | undefined =>
  level > 0 ? BUILDINGS[id].levels[level - 1] : undefined;

/** Aggregates the passive effects of every built building at its current level and condition. */
export function getBuildingEffects(state: GameState): BuildingEffects {
  const h = GAME_RULES.habitat;
  const b = state.buildings;
  const cond = (id: BuildingId) => b[id].condition / 100;
  const out = (id: BuildingId) => (levelSpec(id, b[id].level)?.output ?? 0) * cond(id);

  const recyclerLevel = levelSpec('waterRecycler', b.waterRecycler.level);
  const waterRecovery = recyclerLevel
    ? h.baseWaterRecovery + (recyclerLevel.output - h.baseWaterRecovery) * cond('waterRecycler')
    : h.baseWaterRecovery;

  const gh = b.greenhouse.level;
  const ghIdx = gh - 1;

  let criticalUpkeep = 0;
  let auxiliaryUpkeep = 0;
  for (const def of Object.values(BUILDINGS)) {
    const spec = levelSpec(def.id, b[def.id].level);
    if (!spec) continue;
    if (def.powerPriority === 'critical') criticalUpkeep += spec.upkeepPower;
    if (def.powerPriority === 'auxiliary') auxiliaryUpkeep += spec.upkeepPower;
  }

  return {
    solarOutput: h.baseSolar + out('solarFarm'),
    oxygenOutput: out('oxygenGenerator'),
    waterRecovery,
    greenhouseFood: out('greenhouse'),
    greenhouseWater: gh > 0 ? GREENHOUSE_EXTRAS.waterUse[ghIdx] : 0,
    greenhouseOxygen: gh > 0 ? GREENHOUSE_EXTRAS.oxygen[ghIdx] * cond('greenhouse') : 0,
    greenhouseMorale: gh > 0 ? GREENHOUSE_EXTRAS.morale[ghIdx] * cond('greenhouse') : 0,
    shielding: Math.min(0.9, h.baseShielding + out('radiationShelter')),
    batteryCapacity: h.baseBatteryCapacity + out('batteryStorage'),
    healing: out('medicalBay'),
    research: out('researchLab'),
    criticalUpkeep,
    auxiliaryUpkeep,
  };
}

export const getPowerCapacity = (state: GameState) => Math.round(getBuildingEffects(state).batteryCapacity);

export const maxConcurrentConstruction = (state: GameState) => Math.max(1, Math.floor(aliveCrew(state).length / 2));

export const activeConstructionCount = (state: GameState) =>
  Object.values(state.buildings).filter((b) => b.construction !== null).length;

export function getBuildDays(state: GameState, id: BuildingId, level: number): number {
  const spec = levelSpec(id, level);
  if (!spec) return 0;
  const saved = roleAlive(state, 'engineer') ? GAME_RULES.roleBonuses.engineerBuildDaysSaved : 0;
  return Math.max(1, spec.buildDays - saved);
}

export function describeShortfall(resources: Resources, cost: Partial<Resources>): string | null {
  for (const [key, amount] of Object.entries(cost) as [ResourceKey, number][]) {
    if (resources[key] < amount) {
      const meta = RESOURCE_META[key];
      const missing = Math.ceil(amount - resources[key]);
      return `Needs ${missing} ${meta.unit} more ${meta.label.toLowerCase()}`;
    }
  }
  return null;
}

export interface ConstructionCheck {
  ok: boolean;
  reason?: string;
  nextLevel: number;
  cost: Partial<Resources>;
  buildDays: number;
}

export function canConstruct(state: GameState, id: BuildingId): ConstructionCheck {
  const building = state.buildings[id];
  const def = BUILDINGS[id];
  const nextLevel = building.level + 1;
  const spec = levelSpec(id, nextLevel);
  const base = { nextLevel, cost: spec?.cost ?? {}, buildDays: getBuildDays(state, id, nextLevel) };

  if (state.status !== 'active') return { ...base, ok: false, reason: 'The mission has ended.' };
  if (building.construction) return { ...base, ok: false, reason: 'Already under construction' };
  if (!spec || building.level >= MAX_BUILDING_LEVEL) return { ...base, ok: false, reason: 'Fully upgraded' };
  for (const req of def.requires ?? []) {
    if (state.buildings[req.id].level < req.level) {
      return { ...base, ok: false, reason: `Requires ${BUILDINGS[req.id].name}` };
    }
  }
  if (aliveCrew(state).length === 0) return { ...base, ok: false, reason: 'No crew available' };
  if (activeConstructionCount(state) >= maxConcurrentConstruction(state)) {
    return { ...base, ok: false, reason: 'All construction crews are busy' };
  }
  const shortfall = describeShortfall(state.resources, spec.cost);
  if (shortfall) return { ...base, ok: false, reason: shortfall };
  return { ...base, ok: true };
}

/** Mutates the given draft state. Caller must validate with canConstruct first. */
export function applyConstructionStart(state: GameState, id: BuildingId) {
  const check = canConstruct(state, id);
  if (!check.ok) throw new Error(check.reason);
  for (const [key, amount] of Object.entries(check.cost) as [ResourceKey, number][]) {
    state.resources[key] = round(state.resources[key] - amount, 2);
  }
  state.buildings[id].construction = {
    targetLevel: check.nextLevel,
    daysRemaining: check.buildDays,
    totalDays: check.buildDays,
  };
  const verb = check.nextLevel === 1 ? 'Construction started on' : `Upgrade to level ${check.nextLevel} started on`;
  addLog(state, 'info', `${verb} the ${BUILDINGS[id].name} (${check.buildDays} day${check.buildDays > 1 ? 's' : ''}).`);
}

/** Advances every construction job by one day. Returns the buildings completed. */
export function advanceConstruction(state: GameState): BuildingId[] {
  const completed: BuildingId[] = [];
  for (const building of Object.values(state.buildings)) {
    if (!building.construction) continue;
    building.construction.daysRemaining -= 1;
    if (building.construction.daysRemaining <= 0) {
      building.level = building.construction.targetLevel;
      building.condition = 100;
      building.construction = null;
      state.stats.buildingsCompleted += 1;
      completed.push(building.id);
      addLog(state, 'success', `${BUILDINGS[building.id].name} level ${building.level} is online.`);
    }
  }
  return completed;
}

export function getRepairCost(state: GameState, id: BuildingId): number {
  const building = state.buildings[id];
  if (building.level === 0 || building.condition >= 100) return 0;
  const discount = roleAlive(state, 'engineer') ? 1 - GAME_RULES.roleBonuses.engineerRepairDiscount : 1;
  return Math.ceil(((100 - building.condition) / 100) * GAME_RULES.repair.materialsPerFullRepair * discount);
}

export function canRepair(state: GameState, id: BuildingId): { ok: boolean; reason?: string; cost: number } {
  const building = state.buildings[id];
  const cost = getRepairCost(state, id);
  if (state.status !== 'active') return { ok: false, reason: 'The mission has ended.', cost };
  if (building.level === 0) return { ok: false, reason: 'Not built', cost };
  if (building.condition >= 100) return { ok: false, reason: 'No repairs needed', cost };
  if (aliveCrew(state).length === 0) return { ok: false, reason: 'No crew available', cost };
  if (state.resources.materials < cost) {
    return { ok: false, reason: `Needs ${Math.ceil(cost - state.resources.materials)} kg more materials`, cost };
  }
  return { ok: true, cost };
}

export function applyRepair(state: GameState, id: BuildingId) {
  const check = canRepair(state, id);
  if (!check.ok) throw new Error(check.reason);
  state.resources.materials = round(state.resources.materials - check.cost, 2);
  state.buildings[id].condition = 100;
  addLog(state, 'success', `${BUILDINGS[id].name} repaired to full condition (${check.cost} kg materials).`);
}

export const builtBuildings = (state: GameState): BuildingId[] =>
  (Object.keys(state.buildings) as BuildingId[]).filter((id) => state.buildings[id].level > 0);
