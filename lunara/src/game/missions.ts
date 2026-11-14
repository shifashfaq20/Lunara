import type { BuildingId, BuildingState, GameState, MissionConfig, MissionTypeId, Resources } from '../types/game';
import { BUILDING_ORDER } from '../data/buildings';
import { emptyResources } from '../data/resources';
import { DIFFICULTY_SETTINGS, GAME_RULES } from './config';
import { generateCrew } from './crewManager';
import { evaluateObjectives } from './objectiveManager';
import { round } from '../utils/math';
import { addLog } from './stateUtils';

export interface MissionDefinition {
  id: MissionTypeId;
  name: string;
  site: string;
  available: boolean;
  tagline: string;
  description: string;
  facts: { label: string; value: string }[];
  /** Simplified sunlight model at the outpost site. */
  illumination: { cycleDays: number; mean: number; amplitude: number };
  radiationBase: number;
  resupplyInterval: number;
}

export const MISSIONS: Record<MissionTypeId, MissionDefinition> = {
  lunar: {
    id: 'lunar',
    name: 'Lunar Outpost',
    site: 'South polar crater rim',
    available: true,
    tagline: 'Establish humanity’s first long-stay base near the lunar south pole.',
    description:
      'Your landers touched down on a sunlit ridge beside permanently shadowed craters. Sunlight is plentiful but low on the horizon, and it dims as the Moon moves through its month-long cycle.',
    facts: [
      { label: 'Gravity', value: 'About 1/6 of Earth' },
      { label: 'Day–night cycle', value: '29.5 Earth days' },
      { label: 'Atmosphere', value: 'Almost none' },
    ],
    illumination: { cycleDays: 29.5, mean: 0.7, amplitude: 0.3 },
    radiationBase: 14,
    resupplyInterval: GAME_RULES.resupply.interval,
  },
  mars: {
    id: 'mars',
    name: 'Mars Expedition',
    site: 'In development',
    available: false,
    tagline: 'Coming in a future update.',
    description: 'Mars missions will use the same engine with a thin CO₂ atmosphere, dust storms and a 24.6-hour sol.',
    facts: [
      { label: 'Gravity', value: 'About 3/8 of Earth' },
      { label: 'Day length', value: '24.6 hours' },
    ],
    illumination: { cycleDays: 1, mean: 0.45, amplitude: 0 },
    radiationBase: 10,
    resupplyInterval: 0,
  },
};

export const getMissionDefinition = (id: MissionTypeId) => MISSIONS[id];

/** Sunlight factor 0–1 at the outpost for a given mission day (simplified cosine model). */
export function getSunlight(mission: MissionDefinition, day: number): number {
  const { cycleDays, mean, amplitude } = mission.illumination;
  const phase = (2 * Math.PI * (day - 1)) / cycleDays;
  return round(mean + amplitude * Math.cos(phase), 2);
}

export function startingResources(config: MissionConfig): Resources {
  const d = DIFFICULTY_SETTINGS[config.difficulty];
  const n = config.crewSize;
  const m = d.startMultiplier;
  const p = GAME_RULES.perCrewDaily;
  return {
    oxygen: round(p.oxygen * n * 8 * m, 1),
    water: Math.round(p.water * n * 10 * m),
    food: Math.round(p.food * n * 18 * m),
    power: 70,
    fuel: Math.round((40 + 6 * n) * m),
    materials: Math.round((170 + 15 * n) * m),
  };
}

export function validateConfig(config: MissionConfig): string | null {
  const mission = MISSIONS[config.missionType];
  if (!mission) return 'Unknown mission type.';
  if (!mission.available) return `${mission.name} is not available yet.`;
  if (!Number.isInteger(config.crewSize) || config.crewSize < 2 || config.crewSize > 6) return 'Crew size must be 2–6.';
  if (![15, 30, 45].includes(config.durationDays)) return 'Mission duration must be 15, 30 or 45 days.';
  if (!DIFFICULTY_SETTINGS[config.difficulty]) return 'Unknown difficulty.';
  return null;
}

export function createMission(config: MissionConfig, now = new Date()): GameState {
  const error = validateConfig(config);
  if (error) throw new Error(error);
  const mission = MISSIONS[config.missionType];
  const difficulty = DIFFICULTY_SETTINGS[config.difficulty];

  const buildings = Object.fromEntries(
    BUILDING_ORDER.map((id) => [id, { id, level: 0, condition: 100, construction: null } satisfies BuildingState]),
  ) as Record<BuildingId, BuildingState>;

  const state: GameState = {
    version: GAME_RULES.stateVersion,
    id: `mission-${config.seed}-${now.getTime()}`,
    config,
    status: 'active',
    day: 1,
    resources: startingResources(config),
    crew: generateCrew(config.seed, config.crewSize),
    buildings,
    operationsMode: 'standard',
    radiation: { index: mission.radiationBase, level: 'nominal', cumulativeExposure: 0 },
    research: 0,
    activeEmergencies: [],
    decisions: [],
    modifiers: [],
    deliveries: [],
    objectives: [],
    log: [],
    stats: {
      daysSimulated: 0,
      sumAvgHealth: 0,
      sumAvgMorale: 0,
      daysOxygenOk: 0,
      daysWaterOk: 0,
      daysWellbeingOk: 0,
      daysWithoutShortage: 0,
      totalProduced: emptyResources(),
      totalConsumed: emptyResources(),
      peakRadiationIndex: mission.radiationBase,
      emergenciesEncountered: 0,
      buildingsCompleted: 0,
    },
    lastReport: null,
    rngState: config.seed,
    seq: 0,
    startedAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  // Schedule cargo landers.
  if (mission.resupplyInterval > 0) {
    const cargo: Partial<Resources> = {};
    const { cargoFixed, cargoPerCrew } = GAME_RULES.resupply;
    for (const [key, value] of Object.entries(cargoFixed)) {
      cargo[key as keyof Resources] = Math.round((value ?? 0) * difficulty.resupplyMultiplier);
    }
    for (const [key, value] of Object.entries(cargoPerCrew)) {
      cargo[key as keyof Resources] = Math.round((value ?? 0) * config.crewSize * difficulty.resupplyMultiplier);
    }
    for (let d = mission.resupplyInterval; d < config.durationDays; d += mission.resupplyInterval) {
      state.seq += 1;
      state.deliveries.push({ id: `delivery-${state.seq}`, arrivalDay: d + 1, resources: { ...cargo }, label: 'Cargo lander' });
    }
  }

  addLog(state, 'info', `${mission.name} established at the ${mission.site.toLowerCase()}. Crew of ${config.crewSize} on site.`);
  addLog(state, 'info', 'Habitat systems online: compact oxygen unit, basic water loop, roof solar panels.');
  state.objectives = evaluateObjectives(state);
  return state;
}
