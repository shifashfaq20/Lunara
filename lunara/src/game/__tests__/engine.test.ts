import type { GameState, MissionConfig } from '../../types/game';
import { EMERGENCIES } from '../../data/emergencies';
import { BUILDINGS } from '../../data/buildings';
import {
  abortMission,
  constructBuilding,
  endDay,
  repairBuilding,
  resolveEmergency,
  setOperationsMode,
  startMission,
} from '../gameEngine';
import { canConstruct, getPowerCapacity } from '../buildingManager';
import { getChoiceStatus, triggerEmergency } from '../eventManager';
import { simulateResources } from '../resourceManager';
import { computeScore, ratingFor } from '../scoring';
import { buildMissionReport } from '../report';
import { createRng } from '../rng';
import { cloneState } from '../stateUtils';
import { playSmart, playIdle } from './strategies';

const NOW = new Date('2026-11-08T00:00:00Z');
const config = (over: Partial<MissionConfig> = {}): MissionConfig => ({
  missionType: 'lunar',
  difficulty: 'intermediate',
  crewSize: 4,
  durationDays: 30,
  seed: 12345,
  ...over,
});

const mustOk = (r: ReturnType<typeof endDay>): GameState => {
  if (!r.ok) throw new Error(r.error);
  return r.state;
};

describe('mission setup', () => {
  it('creates a valid starting state', () => {
    const s = startMission(config(), NOW);
    expect(s.status).toBe('active');
    expect(s.day).toBe(1);
    expect(s.crew).toHaveLength(4);
    expect(s.crew.map((c) => c.role)).toEqual(['commander', 'engineer', 'scientist', 'medic']);
    expect(Object.keys(s.buildings)).toHaveLength(8);
    expect(Object.values(s.buildings).every((b) => b.level === 0)).toBe(true);
    expect(s.objectives).toHaveLength(9);
    expect(s.resources.oxygen).toBeGreaterThan(0);
    expect(s.deliveries.map((d) => d.arrivalDay)).toEqual([11, 21]);
  });

  it('scales supplies with difficulty', () => {
    const easy = startMission(config({ difficulty: 'beginner' }), NOW);
    const hard = startMission(config({ difficulty: 'expert' }), NOW);
    expect(easy.resources.materials).toBeGreaterThan(hard.resources.materials);
    expect(easy.resources.oxygen).toBeGreaterThan(hard.resources.oxygen);
  });

  it('rejects invalid configurations', () => {
    expect(() => startMission(config({ crewSize: 9 }), NOW)).toThrow();
    expect(() => startMission(config({ durationDays: 7 }), NOW)).toThrow();
    expect(() => startMission(config({ missionType: 'mars' }), NOW)).toThrow();
  });

  it('is deterministic for a given seed and action sequence', () => {
    const a = playSmart(startMission(config(), NOW), NOW);
    const b = playSmart(startMission(config(), NOW), NOW);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('survives a JSON round trip (persistence format)', () => {
    const s = mustOk(endDay(startMission(config(), NOW), NOW));
    expect(JSON.parse(JSON.stringify(s))).toEqual(s);
  });
});

describe('construction', () => {
  it('enforces prerequisites', () => {
    const s = startMission(config(), NOW);
    const check = canConstruct(s, 'greenhouse');
    expect(check.ok).toBe(false);
    expect(check.reason).toBe('Requires Water Recycler');
    const r = constructBuilding(s, 'greenhouse', NOW);
    expect(r.ok).toBe(false);
    expect(r.state).toBe(s); // original state untouched
  });

  it('deducts the cost and completes after the build time', () => {
    let s = startMission(config(), NOW);
    const before = s.resources.materials;
    s = mustOk(constructBuilding(s, 'oxygenGenerator', NOW));
    expect(s.resources.materials).toBe(before - 40);
    const job = s.buildings.oxygenGenerator.construction!;
    // Engineer on the crew saves one day: 2 - 1 = 1 day.
    expect(job.totalDays).toBe(1);
    s = mustOk(endDay(s, NOW));
    expect(s.buildings.oxygenGenerator.level).toBe(1);
    expect(s.buildings.oxygenGenerator.construction).toBeNull();
  });

  it('prevents construction without enough resources', () => {
    const s = startMission(config(), NOW);
    s.resources.materials = 10;
    const r = constructBuilding(s, 'solarFarm', NOW);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/Needs 25 kg more materials/);
  });

  it('limits parallel construction to the available crews', () => {
    let s = startMission(config(), NOW); // 4 crew → 2 crews
    s = mustOk(constructBuilding(s, 'solarFarm', NOW));
    s = mustOk(constructBuilding(s, 'waterRecycler', NOW));
    const r = constructBuilding(s, 'medicalBay', NOW);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe('All construction crews are busy');
  });

  it('repairs damaged buildings for materials', () => {
    let s = startMission(config(), NOW);
    s = mustOk(constructBuilding(s, 'solarFarm', NOW));
    s = mustOk(endDay(s, NOW));
    s.activeEmergencies = [];
    s.buildings.solarFarm.condition = 50;
    const before = s.resources.materials;
    s = mustOk(repairBuilding(s, 'solarFarm', NOW));
    expect(s.buildings.solarFarm.condition).toBe(100);
    expect(s.resources.materials).toBe(before - 9); // ceil(0.5 × 24 × 0.75)
  });
});

describe('daily simulation', () => {
  it('consumes oxygen faster than the habitat unit alone can produce', () => {
    const s = startMission(config(), NOW);
    const sim = simulateResources(s, 1);
    expect(sim.consumed.oxygen).toBeCloseTo(3.36, 2);
    expect(sim.produced.oxygen).toBeCloseTo(1.01, 2); // 30% of 3.36
    expect(sim.resources.oxygen).toBeLessThan(s.resources.oxygen);
  });

  it('gives life support power priority over the greenhouse and lab', () => {
    const s = startMission(config(), NOW);
    s.buildings.waterRecycler.level = 1;
    s.buildings.greenhouse.level = 1;
    s.buildings.researchLab.level = 1;
    s.resources.power = 0;
    const sim = simulateResources(s, 0.4);
    // 22 × 0.4 = 8.8 kWh vs 21 kWh critical demand
    expect(sim.criticalPower).toBeLessThan(1);
    expect(sim.auxiliaryPower).toBe(0);
    expect(sim.produced.food).toBe(0);
  });

  it('never stores more power than battery capacity', () => {
    let s = startMission(config(), NOW);
    s.resources.power = getPowerCapacity(s);
    s = mustOk(endDay(s, NOW));
    expect(s.resources.power).toBeLessThanOrEqual(getPowerCapacity(s));
  });

  it('records a transparent day report', () => {
    const s = mustOk(endDay(startMission(config(), NOW), NOW));
    expect(s.lastReport).not.toBeNull();
    expect(s.lastReport!.day).toBe(1);
    expect(s.lastReport!.sunlight).toBe(1);
    expect(s.stats.daysSimulated).toBe(1);
    expect(s.day).toBe(2);
  });
});

describe('emergencies', () => {
  const withStorm = () => {
    const s = startMission(config(), NOW);
    s.day = 5;
    const rng = createRng(1);
    const em = triggerEmergency(s, rng, 'solarStorm')!;
    return { s, em };
  };

  it('blocks End Day until the emergency is resolved', () => {
    const { s } = withStorm();
    const r = endDay(s, NOW);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/Resolve the active emergency/);
  });

  it('disables choices whose requirements are not met', () => {
    const { s, em } = withStorm();
    const shelter = EMERGENCIES.solarStorm.choices.find((c) => c.id === 'shelter')!;
    expect(getChoiceStatus(s, shelter).available).toBe(false);
    const r = resolveEmergency(s, em.instanceId, 'shelter', NOW);
    expect(r.ok).toBe(false);
  });

  it('shelter decisions reduce radiation exposure compared with continuing', () => {
    const { s, em } = withStorm();
    s.buildings.radiationShelter.level = 1;
    const sheltered = mustOk(endDay(mustOk(resolveEmergency(s, em.instanceId, 'shelter', NOW)), NOW));
    const reckless = mustOk(endDay(mustOk(resolveEmergency(s, em.instanceId, 'continue', NOW)), NOW));
    expect(sheltered.lastReport!.radiationIndex).toBeGreaterThanOrEqual(85);
    expect(sheltered.lastReport!.dailyExposure).toBeLessThan(reckless.lastReport!.dailyExposure);
    expect(sheltered.decisions[0].rating).toBe('optimal');
    expect(reckless.decisions[0].rating).toBe('risky');
  });

  it('every emergency always has at least one affordable choice from a fresh base', () => {
    for (const def of Object.values(EMERGENCIES)) {
      const s = startMission(config(), NOW);
      s.resources = { oxygen: 0, water: 0, food: 0, power: 0, fuel: 0, materials: 0 };
      const available = def.choices.filter((c) => getChoiceStatus(s, c).available);
      expect(available.length).toBeGreaterThan(0);
    }
  });

  it('charges choice costs and applies consequences', () => {
    const s = startMission(config(), NOW);
    s.day = 4;
    const em = triggerEmergency(s, createRng(2), 'waterLeak')!;
    const before = { ...s.resources };
    const after = mustOk(resolveEmergency(s, em.instanceId, 'patch', NOW));
    // Engineer discount: ceil(15 × 0.75) = 12
    expect(after.resources.materials).toBe(before.materials - 12);
    expect(after.resources.water).toBe(before.water - 8);
    expect(after.activeEmergencies).toHaveLength(0);
  });
});

describe('mission end and scoring', () => {
  it('fails a mission where the commander builds nothing', () => {
    const final = playIdle(startMission(config(), NOW), NOW);
    expect(final.status).toBe('failed');
    expect(computeScore(final).total).toBeLessThanOrEqual(49);
    expect(computeScore(final).ratingLabel).toBe('Mission Failed');
  });

  it('a sensible strategy survives on every difficulty', () => {
    for (const difficulty of ['beginner', 'intermediate', 'expert'] as const) {
      for (const seed of [1, 2, 3, 4, 5]) {
        const final = playSmart(startMission(config({ difficulty, seed }), NOW), NOW);
        expect(final.status).toBe('success');
        expect(computeScore(final).total).toBeGreaterThanOrEqual(50);
      }
    }
  });

  it('reckless emergency decisions score lower than careful ones', () => {
    let careful = 0;
    let reckless = 0;
    for (const seed of [11, 22, 33, 44, 55, 66]) {
      careful += computeScore(playSmart(startMission(config({ seed }), NOW), NOW, 'careful')).total;
      reckless += computeScore(playSmart(startMission(config({ seed }), NOW), NOW, 'reckless')).total;
    }
    expect(careful).toBeGreaterThan(reckless);
  });

  it('supports 15- and 45-day missions', () => {
    for (const durationDays of [15, 45]) {
      const final = playSmart(startMission(config({ durationDays, seed: 3 }), NOW), NOW);
      expect(final.stats.daysSimulated).toBe(durationDays);
      expect(final.status).toBe('success');
    }
  });

  it('ends exactly on the final day', () => {
    const final = playSmart(startMission(config({ durationDays: 15, difficulty: 'beginner' }), NOW), NOW);
    expect(final.status).toBe('success');
    expect(final.stats.daysSimulated).toBe(15);
    expect(endDay(final, NOW).ok).toBe(false);
  });

  it('score components add up and explain themselves', () => {
    const final = playSmart(startMission(config(), NOW), NOW);
    const score = computeScore(final);
    const sum = score.components.reduce((a, c) => a + c.points, 0);
    expect(Math.abs(Math.round(sum) - score.total)).toBeLessThanOrEqual(1);
    expect(score.components.reduce((a, c) => a + c.max, 0)).toBe(100);
    for (const c of score.components) {
      expect(c.points).toBeLessThanOrEqual(c.max);
      expect(c.explanation.length).toBeGreaterThan(0);
    }
  });

  it('maps scores to rating bands', () => {
    expect(ratingFor(95).label).toBe('Legendary Commander');
    expect(ratingFor(80).label).toBe('Excellent Mission');
    expect(ratingFor(60).label).toBe('Mission Survived');
    expect(ratingFor(10).label).toBe('Mission Failed');
  });

  it('aborting needs fuel and caps the score', () => {
    const s = startMission(config(), NOW);
    const poor = cloneState(s);
    poor.resources.fuel = 5;
    expect(abortMission(poor, NOW).ok).toBe(false);
    const aborted = mustOk(abortMission(s, NOW));
    expect(aborted.status).toBe('aborted');
    expect(computeScore(aborted).total).toBeLessThanOrEqual(74);
    expect(buildMissionReport(aborted).resultTitle).toBe('Mission aborted');
  });

  it('builds a complete mission report', () => {
    const final = playSmart(startMission(config(), NOW), NOW);
    const report = buildMissionReport(final);
    expect(report.daysSurvived).toBe(30);
    expect(report.buildings.length).toBeGreaterThan(4);
    expect(report.objectives).toHaveLength(9);
    expect(report.resourceEfficiency).toBeGreaterThan(0);
    expect(report.decisions.length).toBe(final.decisions.length);
  });
});

describe('operations modes', () => {
  it('science push burns fuel and adds research', () => {
    let s = startMission(config(), NOW);
    s = mustOk(setOperationsMode(s, 'science', NOW));
    const fuel = s.resources.fuel;
    s = mustOk(endDay(s, NOW));
    expect(s.resources.fuel).toBe(fuel - 3);
    expect(s.research).toBeGreaterThan(0);
  });

  it('every building level has a cost, build time and output', () => {
    for (const def of Object.values(BUILDINGS)) {
      expect(def.levels).toHaveLength(3);
      for (const level of def.levels) {
        expect(Object.keys(level.cost).length).toBeGreaterThan(0);
        expect(level.buildDays).toBeGreaterThan(0);
        expect(level.output).toBeGreaterThan(0);
      }
    }
  });
});

