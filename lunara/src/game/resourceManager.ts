import type { GameState, ResourceKey, Resources } from '../types/game';
import { BUILDINGS } from '../data/buildings';
import { emptyResources } from '../data/resources';
import { DIFFICULTY_SETTINGS, GAME_RULES, OPERATIONS_MODES } from './config';
import { getBuildingEffects, getPowerCapacity } from './buildingManager';
import { aliveCrew, hasActiveModifier, modifierProduct, roleAlive } from './stateUtils';
import { clamp, round } from '../utils/math';

export interface DailyNeeds {
  oxygen: number;
  water: number;
  food: number;
}

/** Gross daily crew needs before any recycling or production. */
export function dailyNeeds(state: GameState, day = state.day): DailyNeeds {
  const crew = aliveCrew(state).length;
  const mult = DIFFICULTY_SETTINGS[state.config.difficulty].consumptionMultiplier;
  const p = GAME_RULES.perCrewDaily;
  return {
    oxygen: p.oxygen * crew * mult,
    water: p.water * crew * mult,
    food: p.food * crew * mult * modifierProduct(state, 'foodRation', day),
  };
}

/** Days the current stock would last against gross crew needs. Infinity when nobody consumes it. */
export function daysOfSupply(state: GameState, key: 'oxygen' | 'water' | 'food'): number {
  const need = dailyNeeds(state)[key];
  return need > 0 ? state.resources[key] / need : Infinity;
}

export interface ResourceSimulation {
  resources: Resources;
  produced: Resources;
  consumed: Resources;
  shortage: { oxygen: number; water: number; food: number }; // 0–1 share of need not met
  criticalPower: number;
  auxiliaryPower: number;
  research: number;
  healing: number;
  greenhouseMorale: number;
  fieldworkActive: boolean;
}

const r2 = (n: number) => round(n, 2);

/**
 * One day of consumption and production.
 * Power is allocated to life support first (critical), then to the greenhouse and lab (auxiliary).
 * Systems run in proportion to the power they receive.
 */
export function simulateResources(state: GameState, sunlight: number, day = state.day): ResourceSimulation {
  const fx = getBuildingEffects(state);
  const mode = OPERATIONS_MODES[state.operationsMode];
  const h = GAME_RULES.habitat;
  const needs = dailyNeeds(state, day);
  const crewCount = aliveCrew(state).length;
  const produced = emptyResources();
  const consumed = emptyResources();
  const res = { ...state.resources };

  const ghLevel = state.buildings.greenhouse.level;
  const labLevel = state.buildings.researchLab.level;
  const researchHalted = hasActiveModifier(state, 'researchHalt', day);
  const greenhouseRunning = ghLevel > 0 && !hasActiveModifier(state, 'greenhouseOffline', day);
  const labRunning = labLevel > 0 && !researchHalted && mode.labResearchMultiplier > 0;

  // ── Fuel: rover sorties in science mode ──
  const fieldworkActive = mode.fuelPerDay > 0 && !researchHalted && res.fuel >= mode.fuelPerDay && crewCount > 0;
  if (fieldworkActive) {
    consumed.fuel = mode.fuelPerDay;
    res.fuel = r2(res.fuel - mode.fuelPerDay);
  }

  // ── Power ──
  const solar = fx.solarOutput * sunlight;
  produced.power = r2(solar);
  const criticalDemand = Math.max(
    0,
    h.basePowerDemand + h.powerPerCrew * crewCount + fx.criticalUpkeep + Math.min(0, mode.extraPowerDemand),
  );
  const ghUpkeep = greenhouseRunning ? BUILDINGS.greenhouse.levels[ghLevel - 1].upkeepPower : 0;
  const labUpkeep = labRunning ? BUILDINGS.researchLab.levels[labLevel - 1].upkeepPower : 0;
  const auxiliaryDemand = ghUpkeep + labUpkeep + (fieldworkActive ? Math.max(0, mode.extraPowerDemand) : 0);
  const available = res.power + solar;
  const criticalPower = criticalDemand > 0 ? clamp(available / criticalDemand, 0, 1) : 1;
  const remaining = Math.max(0, available - criticalDemand);
  const auxiliaryPower = auxiliaryDemand > 0 ? clamp(remaining / auxiliaryDemand, 0, 1) : 1;
  const powerUsed = Math.min(available, criticalDemand + auxiliaryDemand);
  consumed.power = r2(powerUsed);
  res.power = r2(clamp(available - powerUsed, 0, getPowerCapacity(state)));

  // ── Oxygen ──
  const o2Mult = modifierProduct(state, 'oxygenOutput', day);
  const ghOxygen = greenhouseRunning ? fx.greenhouseOxygen * auxiliaryPower : 0;
  const habitatOxygen = h.baseOxygenShare * GAME_RULES.perCrewDaily.oxygen * state.config.crewSize;
  const o2Made = (habitatOxygen + fx.oxygenOutput * o2Mult) * criticalPower + ghOxygen;
  produced.oxygen = r2(o2Made);
  consumed.oxygen = r2(needs.oxygen);
  const o2Raw = res.oxygen + o2Made - needs.oxygen;
  const o2Short = o2Raw < 0 && needs.oxygen > 0 ? clamp(-o2Raw / needs.oxygen, 0, 1) : 0;
  res.oxygen = r2(Math.max(0, o2Raw));

  // ── Water ──
  const ghWater = greenhouseRunning ? fx.greenhouseWater * auxiliaryPower : 0;
  const recovered =
    needs.water * fx.waterRecovery * criticalPower + ghWater * h.greenhouseWaterRecovery * criticalPower;
  produced.water = r2(recovered);
  consumed.water = r2(needs.water + ghWater);
  const waterRaw = res.water + recovered - needs.water - ghWater;
  const waterShort = waterRaw < 0 && needs.water > 0 ? clamp(-waterRaw / needs.water, 0, 1) : 0;
  res.water = r2(Math.max(0, waterRaw));

  // ── Food ──
  const botanist = roleAlive(state, 'botanist') ? GAME_RULES.roleBonuses.botanistFood : 1;
  const food = greenhouseRunning ? fx.greenhouseFood * auxiliaryPower * botanist : 0;
  produced.food = r2(food);
  consumed.food = r2(needs.food);
  const foodRaw = res.food + food - needs.food;
  const foodShort = foodRaw < 0 && needs.food > 0 ? clamp(-foodRaw / needs.food, 0, 1) : 0;
  res.food = r2(Math.max(0, foodRaw));

  // ── Research ──
  const scientist = roleAlive(state, 'scientist') ? GAME_RULES.roleBonuses.scientistResearch : 1;
  const lab = labRunning ? fx.research * auxiliaryPower * mode.labResearchMultiplier * scientist : 0;
  const geologist = roleAlive(state, 'geologist') ? GAME_RULES.roleBonuses.geologistFieldResearch : 0;
  const field = fieldworkActive ? mode.fieldResearch + geologist : 0;

  // ── Health support ──
  const medic = roleAlive(state, 'medic') ? GAME_RULES.roleBonuses.medicHealing : 1;

  return {
    resources: res,
    produced,
    consumed,
    shortage: { oxygen: r2(o2Short), water: r2(waterShort), food: r2(foodShort) },
    criticalPower: r2(criticalPower),
    auxiliaryPower: r2(auxiliaryPower),
    research: r2(lab + field),
    healing: r2(fx.healing * criticalPower * medic),
    greenhouseMorale: r2(greenhouseRunning ? fx.greenhouseMorale * auxiliaryPower : 0),
    fieldworkActive,
  };
}

export function netResources(produced: Resources, consumed: Resources): Resources {
  const net = emptyResources();
  for (const key of Object.keys(net) as ResourceKey[]) net[key] = r2(produced[key] - consumed[key]);
  return net;
}
