import type { BuildingId, CrewMember, DecisionRating, GameState, ObjectiveProgress, Resources } from '../types/game';
import { BUILDINGS } from '../data/buildings';
import { researchTarget } from '../data/objectives';
import { computeScore, resourceEfficiency, type ScoreBreakdown } from './scoring';

export interface MissionReport {
  resultTitle: string;
  resultDetail: string;
  daysSurvived: number;
  durationDays: number;
  crew: CrewMember[];
  crewSurvived: number;
  finalResources: Resources;
  buildings: { id: BuildingId; name: string; level: number; condition: number }[];
  emergenciesEncountered: number;
  decisionCounts: Record<DecisionRating, number>;
  decisions: GameState['decisions'];
  objectives: ObjectiveProgress[];
  objectivesCompleted: number;
  resourceEfficiency: number; // 0–100
  research: number;
  researchTarget: number;
  cumulativeExposure: number;
  peakRadiationIndex: number;
  score: ScoreBreakdown;
}

const TITLES: Record<GameState['status'], string> = {
  active: 'Mission in progress',
  success: 'Mission accomplished',
  failed: 'Mission lost',
  aborted: 'Mission aborted',
};

export function buildMissionReport(state: GameState): MissionReport {
  const decisionCounts: Record<DecisionRating, number> = { optimal: 0, acceptable: 0, risky: 0 };
  for (const d of state.decisions) decisionCounts[d.rating] += 1;
  return {
    resultTitle: TITLES[state.status],
    resultDetail: state.endReason ?? '',
    daysSurvived: state.stats.daysSimulated,
    durationDays: state.config.durationDays,
    crew: state.crew,
    crewSurvived: state.crew.filter((c) => c.alive).length,
    finalResources: state.resources,
    buildings: (Object.keys(state.buildings) as BuildingId[])
      .filter((id) => state.buildings[id].level > 0)
      .map((id) => ({
        id,
        name: BUILDINGS[id].name,
        level: state.buildings[id].level,
        condition: state.buildings[id].condition,
      })),
    emergenciesEncountered: state.stats.emergenciesEncountered,
    decisionCounts,
    decisions: state.decisions,
    objectives: state.objectives,
    objectivesCompleted: state.objectives.filter((o) => o.status === 'completed').length,
    resourceEfficiency: Math.round(resourceEfficiency(state) * 100),
    research: Math.floor(state.research),
    researchTarget: researchTarget(state.config),
    cumulativeExposure: state.radiation.cumulativeExposure,
    peakRadiationIndex: state.stats.peakRadiationIndex,
    score: computeScore(state),
  };
}
