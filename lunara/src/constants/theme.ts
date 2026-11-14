import { Platform } from 'react-native';
import palette from './palette';

export { palette };

/** Spacing scale (px). Mirrors Tailwind's 4px grid. */
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 40,
} as const;

/** Radius by hierarchy: panels > cards > controls > chips. */
export const radii = {
  chip: 999,
  control: 14,
  card: 18,
  panel: 24,
} as const;

export const typography = {
  micro: 11,
  caption: 12.5,
  body: 15,
  lead: 17,
  heading: 20,
  title: 26,
  display: 38,
  hero: 48,
} as const;

/** Tabular figures keep telemetry columns from jittering as values change. */
export const numericStyle = { fontVariant: ['tabular-nums' as const] };

export const shadows = {
  glow: Platform.select({
    ios: {
      shadowColor: palette.cyan,
      shadowOpacity: 0.35,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 0 },
    },
    default: { elevation: 6 },
  }),
  lift: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOpacity: 0.45,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 10 },
    },
    default: { elevation: 8 },
  }),
};

/** Minimum comfortable touch target (Apple HIG 44pt, Material 48dp). */
export const TOUCH_TARGET = 48;

export type Tone = 'nominal' | 'caution' | 'critical' | 'science' | 'neutral';

export const toneColor: Record<Tone, { fg: string; bg: string }> = {
  nominal: { fg: palette.cyan, bg: palette.cyanDim },
  caution: { fg: palette.amber, bg: palette.amberDim },
  critical: { fg: palette.red, bg: palette.redDim },
  science: { fg: palette.violet, bg: palette.violetDim },
  neutral: { fg: palette.textSoft, bg: 'rgba(174,185,214,0.12)' },
};
