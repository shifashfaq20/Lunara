/**
 * Deterministic pseudo-random generator (mulberry32).
 * The generator state is stored in GameState so a saved mission replays identically,
 * and tests can assert exact outcomes from a seed.
 */
export interface Rng {
  next(): number; // [0, 1)
  int(min: number, max: number): number; // inclusive
  pick<T>(items: readonly T[]): T;
  readonly state: number;
}

export function createRng(seed: number): Rng {
  let s = seed | 0;
  const next = () => {
    s = (s + 0x6d2b79f5) | 0;
    let r = Math.imul(s ^ (s >>> 15), 1 | s);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int(min, max) {
      return Math.floor(next() * (max - min + 1)) + min;
    },
    pick(items) {
      return items[Math.floor(next() * items.length)];
    },
    get state() {
      return s;
    },
  };
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 2 ** 31);
}
