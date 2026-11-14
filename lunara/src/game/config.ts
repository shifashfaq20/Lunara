import type { Difficulty, OperationsMode, ResourceKey } from '../types/game';

/**
 * Tunable rules for the LUNARA simulation.
 * All values are SIMPLIFIED for gameplay. Where a value echoes a real-world figure,
 * it is noted, but none of these are NASA engineering specifications.
 */
export const GAME_RULES = {
  stateVersion: 1,

  /** Daily needs per crew member. */
  perCrewDaily: {
    oxygen: 0.84, // kg — close to a commonly used planning figure for one adult
    water: 3.8, // L — about a gallon for drinking, food prep and hygiene
    food: 1.8, // kg — packaged food
  },

  /** The landed habitat module's built-in systems before any construction. */
  habitat: {
    baseSolar: 22, // kWh/day at full sunlight (roof-mounted panels)
    baseOxygenShare: 0.3, // compact electrolysis unit sized to cover 30% of the launch crew's oxygen
    baseWaterRecovery: 0.5, // fraction of used water recovered
    baseBatteryCapacity: 80, // kWh
    baseShielding: 0.15, // fraction of radiation blocked by habitat walls
    basePowerDemand: 10, // kWh/day for avionics, thermal control, lights
    powerPerCrew: 1.5, // kWh/day per crew member
    greenhouseWaterRecovery: 0.9, // transpired water mostly condensed back
  },

  reserveDaysTarget: 3, // a resource is "sufficient" if it covers this many days
  returnFuelReserve: 20, // kg of fuel to keep for crew return
  abortFuelCost: 20,
  researchTargetPerDay: 5, // research target = this × mission duration

  objectiveThresholds: {
    reserveRatio: 0.9, // share of days a reserve must stay sufficient
    wellbeingRatio: 0.8,
    wellbeingHealth: 60,
    wellbeingMorale: 50,
    emergencyRatio: 0.7, // share of decisions rated optimal or acceptable
  },

  crew: {
    startHealth: 92,
    startMorale: 80,
    moraleDrift: -0.6, // isolation and workload, per day
    commanderMorale: 0.4,
    naturalRecovery: 1, // health/day when nothing is short
    oxygenShortageHealth: 30, // health lost per day at 100% shortage
    waterShortageHealth: 12,
    foodShortageHealth: 6,
    shortageMorale: 8,
    powerShortageMorale: 6,
    lossMoraleShock: 12,
    radiationHealthThreshold: 3, // daily exposure above this harms health
    radiationHealthFactor: 1.2,
  },

  radiation: {
    noiseMin: -4,
    noiseMax: 6,
    levels: { elevated: 25, high: 45, severe: 70 },
  },

  roleBonuses: {
    engineerBuildDaysSaved: 1,
    engineerRepairDiscount: 0.25,
    scientistResearch: 1.25,
    medicHealing: 1.4,
    botanistFood: 1.2,
    geologistFieldResearch: 2,
  },

  repair: {
    materialsPerFullRepair: 24, // materials to restore 0% → 100%
  },

  resupply: {
    interval: 10,
    cargoFixed: { materials: 70, fuel: 10 } as Partial<Record<ResourceKey, number>>,
    cargoPerCrew: { food: 6, oxygen: 1, water: 5 } as Partial<Record<ResourceKey, number>>,
  },

  logLimit: 160,
} as const;

export interface DifficultySettings {
  label: string;
  summary: string;
  startMultiplier: number;
  consumptionMultiplier: number;
  emergencyChance: number;
  resupplyMultiplier: number;
}

export const DIFFICULTY_SETTINGS: Record<Difficulty, DifficultySettings> = {
  beginner: {
    label: 'Beginner',
    summary: 'Generous supplies, fewer emergencies.',
    startMultiplier: 1.35,
    consumptionMultiplier: 0.9,
    emergencyChance: 0.14,
    resupplyMultiplier: 1.25,
  },
  intermediate: {
    label: 'Intermediate',
    summary: 'Balanced supplies and regular emergencies.',
    startMultiplier: 1,
    consumptionMultiplier: 1,
    emergencyChance: 0.22,
    resupplyMultiplier: 1,
  },
  expert: {
    label: 'Expert',
    summary: 'Tight margins, frequent emergencies, lighter cargo.',
    startMultiplier: 0.8,
    consumptionMultiplier: 1.1,
    emergencyChance: 0.32,
    resupplyMultiplier: 0.7,
  },
};

export interface ModeSettings {
  label: string;
  summary: string;
  fieldResearch: number; // research/day from surface sorties
  labResearchMultiplier: number;
  fuelPerDay: number;
  exposureMultiplier: number;
  extraPowerDemand: number;
  healthPerDay: number;
  moralePerDay: number;
}

export const OPERATIONS_MODES: Record<OperationsMode, ModeSettings> = {
  standard: {
    label: 'Standard',
    summary: 'Normal schedule with short surface walks.',
    fieldResearch: 0,
    labResearchMultiplier: 1,
    fuelPerDay: 0,
    exposureMultiplier: 1,
    extraPowerDemand: 0,
    healthPerDay: 0,
    moralePerDay: 0,
  },
  science: {
    label: 'Science push',
    summary: 'Rover sorties for samples. More research, fuel and radiation exposure.',
    fieldResearch: 3,
    labResearchMultiplier: 1.2,
    fuelPerDay: 3,
    exposureMultiplier: 1.4,
    extraPowerDemand: 4,
    healthPerDay: -0.5,
    moralePerDay: 0.3,
  },
  conservation: {
    label: 'Conservation',
    summary: 'Crew stays indoors, the lab is switched off and heating is turned down. Saves power, costs morale.',
    fieldResearch: 0,
    labResearchMultiplier: 0,
    fuelPerDay: 0,
    exposureMultiplier: 0.85,
    extraPowerDemand: -3,
    healthPerDay: 0,
    moralePerDay: -2,
  },
};

export const CREW_SIZE_OPTIONS = [2, 3, 4, 5, 6] as const;
export const DURATION_OPTIONS = [15, 30, 45] as const;
