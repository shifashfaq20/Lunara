import type { DecisionRating, GameState } from '../types/game';
import { researchTarget } from '../data/objectives';
import { daysOfSupply } from './resourceManager';
import { clamp, round } from '../utils/math';

export type MissionRating = 'legendary' | 'excellent' | 'survived' | 'failed';

export interface ScoreComponent {
  id: string;
  label: string;
  points: number;
  max: number;
  explanation: string;
}

export interface ScoreBreakdown {
  total: number;
  rating: MissionRating;
  ratingLabel: string;
  cap?: { value: number; reason: string };
  components: ScoreComponent[];
}

export const RATING_BANDS: { min: number; rating: MissionRating; label: string }[] = [
  { min: 90, rating: 'legendary', label: 'Legendary Commander' },
  { min: 75, rating: 'excellent', label: 'Excellent Mission' },
  { min: 50, rating: 'survived', label: 'Mission Survived' },
  { min: 0, rating: 'failed', label: 'Mission Failed' },
];

export const DECISION_POINTS: Record<DecisionRating, number> = { optimal: 1, acceptable: 0.6, risky: 0.1 };

export function ratingFor(total: number) {
  return RATING_BANDS.find((b) => total >= b.min)!;
}

/** Share of resources the base held at the end, measured as days of supply (capped at 5 days each). */
export function reserveScore(state: GameState): number {
  const keys = ['oxygen', 'water', 'food'] as const;
  const scores = keys.map((k) => {
    const d = daysOfSupply(state, k);
    return Number.isFinite(d) ? clamp(d / 5, 0, 1) : 0;
  });
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

/** Resource efficiency 0–1: shortage-free days plus healthy final reserves. */
export function resourceEfficiency(state: GameState): number {
  const days = state.stats.daysSimulated;
  const shortageFree = days ? state.stats.daysWithoutShortage / days : 1;
  return clamp(shortageFree * 0.6 + reserveScore(state) * 0.4, 0, 1);
}

/** Transparent 100-point score. Every component explains how it was calculated. */
export function computeScore(state: GameState): ScoreBreakdown {
  const s = state.stats;
  const D = state.config.durationDays;
  const days = s.daysSimulated;
  const crewTotal = state.crew.length;
  const crewAlive = state.crew.filter((c) => c.alive).length;
  const objectivesDone = state.objectives.filter((o) => o.status === 'completed').length;
  const avgHealth = days ? s.sumAvgHealth / days : 0;
  const avgMorale = days ? s.sumAvgMorale / days : 0;
  const decisionAvg = state.decisions.length
    ? state.decisions.reduce((acc, d) => acc + DECISION_POINTS[d.rating], 0) / state.decisions.length
    : 1;
  const efficiency = resourceEfficiency(state);
  const target = researchTarget(state.config);

  const components: ScoreComponent[] = [
    {
      id: 'days',
      label: 'Days survived',
      max: 15,
      points: (days / D) * 15,
      explanation: `${days} of ${D} days × 15`,
    },
    {
      id: 'crew',
      label: 'Crew survival',
      max: 15,
      points: (crewAlive / crewTotal) * 15,
      explanation: `${crewAlive} of ${crewTotal} crew alive × 15`,
    },
    {
      id: 'objectives',
      label: 'Objectives',
      max: 25,
      points: state.objectives.length ? (objectivesDone / state.objectives.length) * 25 : 0,
      explanation: `${objectivesDone} of ${state.objectives.length} completed × 25`,
    },
    {
      id: 'wellbeing',
      label: 'Crew wellbeing',
      max: 15,
      points: (avgHealth / 100) * 8 + (avgMorale / 100) * 7,
      explanation: `Average health ${Math.round(avgHealth)} (×8) and morale ${Math.round(avgMorale)} (×7)`,
    },
    {
      id: 'emergencies',
      label: 'Emergency response',
      max: 15,
      points: decisionAvg * 15,
      explanation: state.decisions.length
        ? `Average decision value ${round(decisionAvg, 2)} (optimal 1, acceptable 0.6, risky 0.1) × 15`
        : 'No emergencies to handle: full marks',
    },
    {
      id: 'efficiency',
      label: 'Resource efficiency',
      max: 10,
      points: efficiency * 10,
      explanation: `${s.daysWithoutShortage} shortage-free days and final reserves → ${Math.round(efficiency * 100)}% × 10`,
    },
    {
      id: 'science',
      label: 'Scientific progress',
      max: 5,
      points: clamp(state.research / target, 0, 1) * 5,
      explanation: `${Math.floor(state.research)} of ${target} research points × 5`,
    },
  ].map((c) => ({ ...c, points: round(c.points, 1) }));

  let total = Math.round(components.reduce((acc, c) => acc + c.points, 0));
  let cap: ScoreBreakdown['cap'];
  if (state.status === 'failed' && total > 49) {
    cap = { value: 49, reason: 'A failed mission cannot score above 49.' };
    total = 49;
  } else if (state.status === 'aborted' && total > 74) {
    cap = { value: 74, reason: 'An aborted mission cannot score above 74.' };
    total = 74;
  }
  const band = ratingFor(total);
  return { total, rating: band.rating, ratingLabel: band.label, cap, components };
}
