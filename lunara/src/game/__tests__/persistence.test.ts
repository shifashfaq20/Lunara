import { parseSavedMission } from '../persistence';
import { startMission } from '../gameEngine';

const NOW = new Date('2026-11-08T00:00:00Z');

describe('saved mission parsing', () => {
  it('restores a valid save', () => {
    const s = startMission({ missionType: 'lunar', difficulty: 'beginner', crewSize: 3, durationDays: 15, seed: 9 }, NOW);
    expect(parseSavedMission(JSON.stringify(s))).toEqual(s);
  });

  it('rejects corrupt or incompatible data', () => {
    expect(parseSavedMission(null)).toBeNull();
    expect(parseSavedMission('{not json')).toBeNull();
    expect(parseSavedMission(JSON.stringify({ hello: 'world' }))).toBeNull();
    const s = startMission({ missionType: 'lunar', difficulty: 'beginner', crewSize: 3, durationDays: 15, seed: 9 }, NOW);
    expect(parseSavedMission(JSON.stringify({ ...s, version: 999 }))).toBeNull();
  });
});
