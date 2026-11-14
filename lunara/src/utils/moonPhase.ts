/**
 * SVG path for the lit part of a disc, with the light coming from the right.
 * fraction 0 = dark, 0.5 = half, 1 = full.
 */
export function litDiscPath(cx: number, cy: number, r: number, fraction: number): string {
  const f = Math.min(1, Math.max(0, fraction));
  if (f <= 0.001) return '';
  if (f >= 0.999) return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx} ${cy + r} A ${r} ${r} 0 1 1 ${cx} ${cy - r} Z`;
  const rx = Math.abs(2 * f - 1) * r;
  const sweep = f > 0.5 ? 1 : 0;
  return `M ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${cx} ${cy + r} A ${rx} ${r} 0 0 ${sweep} ${cx} ${cy - r} Z`;
}
