import type { MissionConfig, ObjectiveId } from '../types/game';
import { GAME_RULES } from '../game/config';

export interface ObjectiveDefinition {
  id: ObjectiveId;
  category: 'survival' | 'resources' | 'construction' | 'science' | 'crew';
  title: (config: MissionConfig) => string;
  description: (config: MissionConfig) => string;
}

const pct = (n: number) => `${Math.round(n * 100)}%`;
const T = GAME_RULES.objectiveThresholds;

export const researchTarget = (config: MissionConfig) => config.durationDays * GAME_RULES.researchTargetPerDay;

export const OBJECTIVES: ObjectiveDefinition[] = [
  {
    id: 'survive',
    category: 'survival',
    title: (c) => `Survive ${c.durationDays} lunar days`,
    description: () => 'Keep at least one crew member alive until the final day ends.',
  },
  {
    id: 'oxygenReserve',
    category: 'resources',
    title: () => 'Maintain sufficient oxygen',
    description: () =>
      `End at least ${pct(T.reserveRatio)} of days with ${GAME_RULES.reserveDaysTarget}+ days of oxygen in storage.`,
  },
  {
    id: 'waterReserve',
    category: 'resources',
    title: () => 'Maintain sufficient water',
    description: () =>
      `End at least ${pct(T.reserveRatio)} of days with ${GAME_RULES.reserveDaysTarget}+ days of water in storage.`,
  },
  {
    id: 'buildGreenhouse',
    category: 'construction',
    title: () => 'Build a greenhouse',
    description: () => 'Complete a Hydroponic Greenhouse to start growing fresh food.',
  },
  {
    id: 'buildShelter',
    category: 'construction',
    title: () => 'Construct a radiation shelter',
    description: () => 'Complete a Radiation Shelter to protect the crew from solar storms.',
  },
  {
    id: 'research',
    category: 'science',
    title: (c) => `Complete ${researchTarget(c)} research points`,
    description: () => 'Run the Research Laboratory and science pushes to gather samples and data.',
  },
  {
    id: 'emergencyResponse',
    category: 'crew',
    title: () => 'Respond well to emergencies',
    description: () => `Rate at least ${pct(T.emergencyRatio)} of emergency decisions as optimal or acceptable.`,
  },
  {
    id: 'crewWellbeing',
    category: 'crew',
    title: () => 'Maintain crew health and morale',
    description: () =>
      `On ${pct(T.wellbeingRatio)} of days, keep average health at ${T.wellbeingHealth}+ and morale at ${T.wellbeingMorale}+.`,
  },
  {
    id: 'returnFuel',
    category: 'survival',
    title: () => 'Keep the return fuel reserve',
    description: () => `Finish with at least ${GAME_RULES.returnFuelReserve} kg of fuel for the trip home.`,
  },
];

export const objectiveDefinition = (id: ObjectiveId) => OBJECTIVES.find((o) => o.id === id)!;
