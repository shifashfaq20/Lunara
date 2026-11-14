/**
 * Single source of truth for LUNARA colours.
 * Consumed by tailwind.config.js (NativeWind classes) and by TypeScript
 * (SVG fills, Reanimated styles) through src/constants/theme.ts.
 */
const palette = {
  void: '#03050B',        // space black — deepest background
  abyss: '#070C1D',       // deep navy, lower
  navy: '#0C1636',        // deep navy, upper
  hull: '#121D42',        // raised surfaces
  hullLight: '#1A2856',
  line: 'rgba(148, 176, 255, 0.16)',
  lineStrong: 'rgba(148, 176, 255, 0.32)',
  glass: 'rgba(22, 34, 78, 0.55)',
  glassDeep: 'rgba(10, 16, 40, 0.72)',

  cyan: '#3EE6FF',        // electric cyan — nominal / primary action
  cyanDim: 'rgba(62, 230, 255, 0.14)',
  violet: '#A99CFF',      // soft violet — science / learning
  violetDim: 'rgba(169, 156, 255, 0.16)',
  amber: '#FFB341',       // caution
  amberDim: 'rgba(255, 179, 65, 0.16)',
  red: '#FF4D5E',         // critical
  redDim: 'rgba(255, 77, 94, 0.16)',
  regolith: '#B9BFCC',    // lunar grey
  earth: '#5AA9FF',

  text: '#EEF3FF',
  textSoft: '#AEB9D6',
  textMuted: '#6F7DA3',
};

module.exports = palette;
