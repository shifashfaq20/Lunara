/**
 * LUNARA game model.
 *
 * Every number in this model belongs to a SIMPLIFIED EDUCATIONAL SIMULATION.
 * Units (kg, L, kWh) are used so the game reads like real life-support planning,
 * but values are tuned for gameplay and are not NASA engineering specifications.
 */

export type ResourceKey = 'oxygen' | 'water' | 'food' | 'power' | 'fuel' | 'materials';
export type Resources = Record<ResourceKey, number>;

export type Difficulty = 'beginner' | 'intermediate' | 'expert';
export type MissionTypeId = 'lunar' | 'mars';
export type OperationsMode = 'standard' | 'science' | 'conservation';
export type MissionStatus = 'active' | 'success' | 'failed' | 'aborted';
export type RadiationLevel = 'nominal' | 'elevated' | 'high' | 'severe';
export type LogTone = 'info' | 'success' | 'warning' | 'critical';

export type BuildingId =
  | 'solarFarm'
  | 'oxygenGenerator'
  | 'waterRecycler'
  | 'greenhouse'
  | 'radiationShelter'
  | 'batteryStorage'
  | 'medicalBay'
  | 'researchLab';

export type CrewRole = 'commander' | 'engineer' | 'scientist' | 'medic' | 'botanist' | 'geologist';

export type EmergencyId =
  | 'solarStorm'
  | 'oxygenMalfunction'
  | 'waterLeak'
  | 'powerShortage'
  | 'foodShortage'
  | 'equipmentDamage'
  | 'commsFailure'
  | 'micrometeorite';

export type DecisionRating = 'optimal' | 'acceptable' | 'risky';

export type ObjectiveId =
  | 'survive'
  | 'oxygenReserve'
  | 'waterReserve'
  | 'buildGreenhouse'
  | 'buildShelter'
  | 'research'
  | 'emergencyResponse'
  | 'crewWellbeing'
  | 'returnFuel';

export type ObjectiveStatus = 'inProgress' | 'atRisk' | 'completed' | 'failed';

export interface MissionConfig {
  missionType: MissionTypeId;
  difficulty: Difficulty;
  crewSize: number;
  durationDays: number;
  seed: number;
}

export interface CrewMember {
  id: string;
  name: string;
  role: CrewRole;
  health: number; // 0–100
  morale: number; // 0–100
  alive: boolean;
  dayLost?: number;
}

export interface ConstructionJob {
  targetLevel: number;
  daysRemaining: number;
  totalDays: number;
}

export interface BuildingState {
  id: BuildingId;
  level: number; // 0 = not built
  condition: number; // 0–100 (%), scales production
  construction: ConstructionJob | null;
}

export type ModifierKind =
  | 'radiationSpike' // value = minimum radiation index for the day
  | 'exposureMult' // value = multiplier on crew radiation exposure
  | 'foodRation' // value = multiplier on food consumption
  | 'oxygenOutput' // value = multiplier on oxygen production
  | 'researchHalt' // value ignored; research output is 0
  | 'greenhouseOffline' // value ignored; greenhouse produces nothing
  | 'commsDown' // value ignored; resupply delayed, morale drain
  | 'moraleDrain'; // value = morale change per day (negative)

export interface Modifier {
  id: string;
  kind: ModifierKind;
  value: number;
  startDay: number; // inclusive
  untilDay: number; // exclusive
  label: string;
}

export interface Delivery {
  id: string;
  arrivalDay: number;
  resources: Partial<Resources>;
  label: string;
}

export interface ActiveEmergency {
  instanceId: string;
  emergencyId: EmergencyId;
  dayTriggered: number;
  targetBuilding?: BuildingId;
}

export interface DecisionRecord {
  day: number;
  emergencyId: EmergencyId;
  emergencyTitle: string;
  choiceId: string;
  choiceLabel: string;
  rating: DecisionRating;
  outcome: string;
}

export interface LogEntry {
  id: string;
  day: number;
  tone: LogTone;
  message: string;
}

export interface ObjectiveProgress {
  id: ObjectiveId;
  progress: number; // 0–1
  status: ObjectiveStatus;
  detail: string;
}

export interface MissionStats {
  daysSimulated: number;
  sumAvgHealth: number;
  sumAvgMorale: number;
  daysOxygenOk: number;
  daysWaterOk: number;
  daysWellbeingOk: number;
  daysWithoutShortage: number;
  totalProduced: Resources;
  totalConsumed: Resources;
  peakRadiationIndex: number;
  emergenciesEncountered: number;
  buildingsCompleted: number;
}

export interface DayReport {
  day: number;
  sunlight: number;
  radiationIndex: number;
  dailyExposure: number;
  produced: Resources;
  consumed: Resources;
  net: Resources;
  criticalPower: number; // 0–1 share of life-support demand met
  auxiliaryPower: number; // 0–1 share of greenhouse/lab demand met
  shortages: ResourceKey[];
  researchGained: number;
}

export interface RadiationState {
  index: number; // simulated 0–100 risk index, NOT a dose measurement
  level: RadiationLevel;
  cumulativeExposure: number; // simulated exposure points
}

export interface GameState {
  version: number;
  id: string;
  config: MissionConfig;
  status: MissionStatus;
  endReason?: string;
  day: number; // the day currently being managed (1-based)
  resources: Resources;
  crew: CrewMember[];
  buildings: Record<BuildingId, BuildingState>;
  operationsMode: OperationsMode;
  radiation: RadiationState;
  research: number;
  activeEmergencies: ActiveEmergency[];
  decisions: DecisionRecord[];
  lastEmergencyId?: EmergencyId;
  modifiers: Modifier[];
  deliveries: Delivery[];
  objectives: ObjectiveProgress[];
  log: LogEntry[];
  stats: MissionStats;
  lastReport: DayReport | null;
  rngState: number;
  seq: number;
  startedAt: string;
  updatedAt: string;
  endedAt?: string;
}

export type ActionResult =
  | { ok: true; state: GameState; message?: string }
  | { ok: false; state: GameState; error: string };
