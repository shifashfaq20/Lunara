import type { BuildingId, Resources } from '../types/game';

export interface BuildingLevelSpec {
  level: number;
  cost: Partial<Resources>;
  buildDays: number;
  upkeepPower: number; // kWh/day
  /** Output at 100% condition and full power. Meaning depends on the building. */
  output: number;
  summary: string;
}

export interface BuildingDefinition {
  id: BuildingId;
  name: string;
  role: string;
  description: string;
  outputLabel: string;
  outputUnit: string;
  /** Life-support buildings get power first when supply is short. */
  powerPriority: 'critical' | 'auxiliary' | 'none';
  requires?: { id: BuildingId; level: number }[];
  levels: BuildingLevelSpec[];
  learnTopic: string;
}

export const BUILDINGS: Record<BuildingId, BuildingDefinition> = {
  solarFarm: {
    id: 'solarFarm',
    name: 'Solar Farm',
    role: 'Power generation',
    description: 'Tracking solar arrays on the crater rim. Output follows the local sunlight level.',
    outputLabel: 'Power at full sun',
    outputUnit: 'kWh/day',
    powerPriority: 'none',
    learnTopic: 'solar-energy',
    levels: [
      { level: 1, cost: { materials: 35 }, buildDays: 2, upkeepPower: 0, output: 35, summary: 'One array wing.' },
      { level: 2, cost: { materials: 50, fuel: 5 }, buildDays: 2, upkeepPower: 0, output: 60, summary: 'Second wing on a taller mast.' },
      { level: 3, cost: { materials: 75, fuel: 8 }, buildDays: 3, upkeepPower: 0, output: 90, summary: 'Full ridge-line array.' },
    ],
  },
  oxygenGenerator: {
    id: 'oxygenGenerator',
    name: 'Oxygen Generator',
    role: 'Life support',
    description: 'Splits water into oxygen and hydrogen by electrolysis, like the space station system.',
    outputLabel: 'Oxygen',
    outputUnit: 'kg/day',
    powerPriority: 'critical',
    learnTopic: 'oxygen-systems',
    levels: [
      { level: 1, cost: { materials: 40, power: 10 }, buildDays: 2, upkeepPower: 7, output: 3.0, summary: 'Single electrolysis stack.' },
      { level: 2, cost: { materials: 55, power: 15 }, buildDays: 2, upkeepPower: 10, output: 4.6, summary: 'Twin stacks with redundancy.' },
      { level: 3, cost: { materials: 80, power: 20 }, buildDays: 3, upkeepPower: 13, output: 6.4, summary: 'High-pressure cell array.' },
    ],
  },
  waterRecycler: {
    id: 'waterRecycler',
    name: 'Water Recycler',
    role: 'Life support',
    description: 'Recovers water from humidity, hygiene and urine through distillation and filtration.',
    outputLabel: 'Water recovered',
    outputUnit: '% of use',
    powerPriority: 'critical',
    learnTopic: 'water-recycling',
    levels: [
      { level: 1, cost: { materials: 35, power: 8 }, buildDays: 2, upkeepPower: 5, output: 0.8, summary: 'Condensate and hygiene loop.' },
      { level: 2, cost: { materials: 50, power: 10 }, buildDays: 2, upkeepPower: 7, output: 0.9, summary: 'Adds urine distillation.' },
      { level: 3, cost: { materials: 75, power: 15 }, buildDays: 3, upkeepPower: 9, output: 0.98, summary: 'Adds brine processing, matching the ISS milestone.' },
    ],
  },
  greenhouse: {
    id: 'greenhouse',
    name: 'Hydroponic Greenhouse',
    role: 'Food and morale',
    description: 'LED-lit hydroponic racks. Grows fresh food, adds a little oxygen and lifts crew spirits.',
    outputLabel: 'Food',
    outputUnit: 'kg/day',
    powerPriority: 'auxiliary',
    requires: [{ id: 'waterRecycler', level: 1 }],
    learnTopic: 'growing-food',
    levels: [
      { level: 1, cost: { materials: 45, water: 20 }, buildDays: 3, upkeepPower: 8, output: 3.2, summary: 'Salad greens and herbs.' },
      { level: 2, cost: { materials: 60, water: 25 }, buildDays: 3, upkeepPower: 11, output: 5.4, summary: 'Adds dwarf wheat and potatoes.' },
      { level: 3, cost: { materials: 85, water: 30 }, buildDays: 4, upkeepPower: 14, output: 8.0, summary: 'Stacked racks, full rotation.' },
    ],
  },
  radiationShelter: {
    id: 'radiationShelter',
    name: 'Radiation Shelter',
    role: 'Crew protection',
    description: 'A sleeping core buried under bagged regolith. Cuts daily exposure and protects the crew during solar storms.',
    outputLabel: 'Extra shielding',
    outputUnit: '% blocked',
    powerPriority: 'critical',
    learnTopic: 'radiation-protection',
    levels: [
      { level: 1, cost: { materials: 40, fuel: 8 }, buildDays: 2, upkeepPower: 1, output: 0.35, summary: '1 m of regolith cover.' },
      { level: 2, cost: { materials: 55, fuel: 10 }, buildDays: 3, upkeepPower: 1, output: 0.5, summary: 'Thicker cover and water walls.' },
      { level: 3, cost: { materials: 75, fuel: 12 }, buildDays: 3, upkeepPower: 2, output: 0.62, summary: 'Fully bermed storm shelter.' },
    ],
  },
  batteryStorage: {
    id: 'batteryStorage',
    name: 'Battery Storage',
    role: 'Energy storage',
    description: 'Stores surplus solar energy so the base can ride through low-sunlight periods.',
    outputLabel: 'Extra capacity',
    outputUnit: 'kWh',
    powerPriority: 'none',
    requires: [{ id: 'solarFarm', level: 1 }],
    learnTopic: 'solar-energy',
    levels: [
      { level: 1, cost: { materials: 30 }, buildDays: 1, upkeepPower: 0, output: 100, summary: 'One battery module.' },
      { level: 2, cost: { materials: 45 }, buildDays: 2, upkeepPower: 0, output: 200, summary: 'Two modules with thermal control.' },
      { level: 3, cost: { materials: 65, fuel: 4 }, buildDays: 2, upkeepPower: 0, output: 320, summary: 'Full storage bank.' },
    ],
  },
  medicalBay: {
    id: 'medicalBay',
    name: 'Medical Bay',
    role: 'Crew health',
    description: 'Diagnostics, treatment and an exercise station. Restores crew health each day.',
    outputLabel: 'Healing',
    outputUnit: 'health/day',
    powerPriority: 'critical',
    learnTopic: 'astronaut-survival',
    levels: [
      { level: 1, cost: { materials: 35, power: 5 }, buildDays: 2, upkeepPower: 4, output: 2.0, summary: 'First-aid and monitoring.' },
      { level: 2, cost: { materials: 50, power: 8 }, buildDays: 2, upkeepPower: 5, output: 3.2, summary: 'Treatment bed and ultrasound.' },
      { level: 3, cost: { materials: 70, power: 10 }, buildDays: 3, upkeepPower: 6, output: 4.5, summary: 'Full clinic with exercise suite.' },
    ],
  },
  researchLab: {
    id: 'researchLab',
    name: 'Research Laboratory',
    role: 'Science',
    description: 'Analyses regolith and ice samples. Generates research points each day.',
    outputLabel: 'Research',
    outputUnit: 'points/day',
    powerPriority: 'auxiliary',
    requires: [{ id: 'solarFarm', level: 1 }],
    learnTopic: 'habitat-design',
    levels: [
      { level: 1, cost: { materials: 45, power: 10 }, buildDays: 3, upkeepPower: 7, output: 4, summary: 'Sample prep and microscopy.' },
      { level: 2, cost: { materials: 60, power: 12 }, buildDays: 3, upkeepPower: 9, output: 7, summary: 'Spectrometers and ice analysis.' },
      { level: 3, cost: { materials: 85, power: 15 }, buildDays: 4, upkeepPower: 12, output: 11, summary: 'Full geochemistry suite.' },
    ],
  },
};

export const BUILDING_ORDER: BuildingId[] = [
  'solarFarm',
  'oxygenGenerator',
  'waterRecycler',
  'greenhouse',
  'radiationShelter',
  'batteryStorage',
  'medicalBay',
  'researchLab',
];

export const MAX_BUILDING_LEVEL = 3;

/** Secondary greenhouse effects per level (index = level - 1). */
export const GREENHOUSE_EXTRAS = {
  waterUse: [5, 8, 11], // L/day for irrigation, mostly recovered as transpiration
  oxygen: [0.2, 0.35, 0.5], // kg/day from photosynthesis
  morale: [0.6, 1.0, 1.4], // morale/day from fresh food and greenery
};
