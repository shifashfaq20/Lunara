/**
 * Read-only views of the game state for the UI. Pure functions: no React, no side effects.
 */
import type { GameState, ResourceKey } from '../types/game';
import { RESOURCE_META } from '../data/resources';
import { GAME_RULES, OPERATIONS_MODES } from './config';
import { getPowerCapacity } from './buildingManager';
import { daysOfSupply } from './resourceManager';
import { getMissionDefinition, getSunlight } from './missions';

export type StatusTone = 'nominal' | 'caution' | 'critical' | 'science' | 'neutral';

export interface ResourceView {
  key: ResourceKey;
  label: string;
  unit: string;
  value: string;
  fraction: number; // 0–1 for the gauge
  tone: StatusTone;
  status: string;
  trend: number | null; // yesterday's net change
}

const fmt = (n: number, decimals: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

export function resourceView(state: GameState, key: ResourceKey): ResourceView {
  const meta = RESOURCE_META[key];
  const amount = state.resources[key];
  const trend = state.lastReport ? state.lastReport.net[key] : null;
  const base = { key, label: meta.label, unit: meta.unit, value: fmt(amount, meta.decimals), trend };

  if (key === 'oxygen' || key === 'water' || key === 'food') {
    const days = daysOfSupply(state, key);
    const tone: StatusTone = days < 2 ? 'critical' : days < GAME_RULES.reserveDaysTarget + 2 ? 'caution' : 'nominal';
    const status = Number.isFinite(days) ? `${days < 10 ? days.toFixed(1) : Math.round(days)} days of supply` : 'No crew consuming';
    return { ...base, fraction: Number.isFinite(days) ? Math.min(1, days / 15) : 1, tone, status };
  }
  if (key === 'power') {
    const capacity = getPowerCapacity(state);
    const f = capacity ? amount / capacity : 0;
    const tone: StatusTone = f < 0.15 ? 'critical' : f < 0.35 ? 'caution' : 'nominal';
    return { ...base, fraction: f, tone, status: `${Math.round(f * 100)}% of ${capacity} kWh stored` };
  }
  if (key === 'fuel') {
    const reserve = GAME_RULES.returnFuelReserve;
    const tone: StatusTone = amount < reserve ? 'critical' : amount < reserve * 1.5 ? 'caution' : 'nominal';
    return { ...base, fraction: Math.min(1, amount / (reserve * 4)), tone, status: `${reserve} kg kept for return` };
  }
  return { ...base, fraction: Math.min(1, amount / 300), tone: 'neutral', status: 'For building and repairs' };
}

export function sunlightForecast(state: GameState, days = 7): { day: number; sunlight: number }[] {
  const mission = getMissionDefinition(state.config.missionType);
  return Array.from({ length: days }, (_, i) => {
    const day = state.day + i;
    return { day, sunlight: getSunlight(mission, day) };
  }).filter((d) => d.day <= state.config.durationDays);
}

export const currentSunlight = (state: GameState) =>
  getSunlight(getMissionDefinition(state.config.missionType), state.day);

export function radiationTone(level: GameState['radiation']['level']): StatusTone {
  return level === 'severe' ? 'critical' : level === 'high' ? 'critical' : level === 'elevated' ? 'caution' : 'nominal';
}

export function statTone(value: number): StatusTone {
  return value >= 70 ? 'nominal' : value >= 45 ? 'caution' : 'critical';
}

export const daysRemaining = (state: GameState) => Math.max(0, state.config.durationDays - state.stats.daysSimulated);

/** Plain-language list of what an operations mode changes, derived from the rules config. */
export function operationsEffects(mode: GameState['operationsMode']): string[] {
  const m = OPERATIONS_MODES[mode];
  const out: string[] = [];
  if (m.fieldResearch) out.push(`+${m.fieldResearch} research a day from rover sorties`);
  if (m.labResearchMultiplier === 0) out.push('Research lab switched off');
  else if (m.labResearchMultiplier !== 1) out.push(`Lab research ×${m.labResearchMultiplier}`);
  if (m.fuelPerDay) out.push(`−${m.fuelPerDay} kg fuel a day`);
  if (m.extraPowerDemand > 0) out.push(`+${m.extraPowerDemand} kWh power a day`);
  if (m.extraPowerDemand < 0) out.push(`${m.extraPowerDemand} kWh power a day`);
  if (m.exposureMultiplier !== 1) out.push(`Radiation exposure ×${m.exposureMultiplier}`);
  if (m.moralePerDay) out.push(`${m.moralePerDay > 0 ? '+' : ''}${m.moralePerDay} morale a day`);
  if (m.healthPerDay) out.push(`${m.healthPerDay} health a day from fatigue`);
  return out.length ? out : ['No changes to the normal schedule'];
}
