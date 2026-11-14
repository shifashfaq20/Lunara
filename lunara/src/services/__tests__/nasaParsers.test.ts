import {
  flareRank,
  flareStrength,
  parseCmes,
  parseDonkiBody,
  parseFlares,
  parseImageSearch,
  parseStorms,
} from '../nasaParsers';

describe('NASA payload parsers', () => {
  it('parses DONKI flares, dropping incomplete entries and sorting newest first', () => {
    const flares = parseFlares([
      { flrID: 'a', classType: 'M1.2', peakTime: '2026-10-01T10:00Z', sourceLocation: 'N10E20', activeRegionNum: 14001 },
      { flrID: 'b', classType: 'X2.0', peakTime: '2026-10-05T10:00Z' },
      { flrID: 'c', peakTime: '2026-10-06T10:00Z' },
    ]);
    expect(flares.map((f) => f.id)).toEqual(['b', 'a']);
    expect(flares[1].activeRegion).toBe(14001);
    expect(flares[0].sourceLocation).toBe(undefined);
  });

  it('takes CME speed from the most accurate analysis only when present', () => {
    const cmes = parseCmes([
      { activityID: 'x', startTime: '2026-10-02T00:00Z', cmeAnalyses: [{ speed: 400 }, { speed: 650, isMostAccurate: true }] },
      { activityID: 'y', startTime: '2026-10-01T00:00Z', cmeAnalyses: null },
    ]);
    expect(cmes[0].speedKmS).toBe(650);
    expect(cmes[1].speedKmS).toBe(undefined);
  });

  it('reports the maximum Kp index of a storm', () => {
    const storms = parseStorms([{ gstID: 'g', startTime: '2026-10-03T00:00Z', allKpIndex: [{ kpIndex: 5 }, { kpIndex: 7.33 }] }]);
    expect(storms[0].maxKp).toBe(7.33);
  });

  it('handles empty and malformed bodies', () => {
    expect(parseDonkiBody('')).toEqual([]);
    expect(parseFlares(null)).toEqual([]);
    expect(parseFlares({ error: 'rate limited' })).toEqual([]);
    expect(parseImageSearch({})).toEqual([]);
  });

  it('parses NASA image library results with https thumbnails only', () => {
    const images = parseImageSearch({
      collection: {
        items: [
          {
            data: [{ nasa_id: 'as11-40-5875', title: 'Apollo 11', date_created: '1969-07-20T00:00:00Z', center: 'JSC' }],
            links: [{ href: 'https://images-assets.nasa.gov/image/as11-40-5875/as11-40-5875~thumb.jpg', rel: 'preview', render: 'image' }],
          },
          { data: [{ nasa_id: 'bad', title: 'No link' }], links: [] },
        ],
      },
    });
    expect(images).toHaveLength(1);
    expect(images[0].center).toBe('JSC');
  });

  it('describes flare strength from its class', () => {
    expect(flareStrength('C3.1')).toBe('minor');
    expect(flareStrength('M5.0')).toBe('moderate');
    expect(flareStrength('X1.4')).toBe('strong');
    expect(flareStrength('X12')).toBe('extreme');
  });

  it('ranks flare classes numerically, not alphabetically', () => {
    const sorted = ['X2.0', 'M9.9', 'X10', 'C1.0'].sort((a, b) => flareRank(b) - flareRank(a));
    expect(sorted).toEqual(['X10', 'X2.0', 'M9.9', 'C1.0']);
  });
});
