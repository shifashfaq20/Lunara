export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const round = (value: number, decimals = 1) => {
  const f = 10 ** decimals;
  return Math.round(value * f) / f;
};

export const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

export const average = (values: number[]) => (values.length ? sum(values) / values.length : 0);
