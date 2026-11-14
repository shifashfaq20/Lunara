const palette = require('./src/constants/palette');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        void: palette.void,
        abyss: palette.abyss,
        navy: palette.navy,
        hull: palette.hull,
        'hull-light': palette.hullLight,
        line: palette.line,
        'line-strong': palette.lineStrong,
        glass: palette.glass,
        'glass-deep': palette.glassDeep,
        cyan: palette.cyan,
        'cyan-dim': palette.cyanDim,
        violet: palette.violet,
        'violet-dim': palette.violetDim,
        amber: palette.amber,
        'amber-dim': palette.amberDim,
        red: palette.red,
        'red-dim': palette.redDim,
        regolith: palette.regolith,
        earth: palette.earth,
        ink: palette.text,
        'ink-soft': palette.textSoft,
        'ink-muted': palette.textMuted,
      },
      fontSize: {
        // Type scale (ratio ~1.25), sizes in px with explicit line heights.
        micro: ['11px', { lineHeight: '14px' }],
        caption: ['12.5px', { lineHeight: '17px' }],
        body: ['15px', { lineHeight: '22px' }],
        lead: ['17px', { lineHeight: '25px' }],
        heading: ['20px', { lineHeight: '26px' }],
        title: ['26px', { lineHeight: '31px' }],
        display: ['38px', { lineHeight: '42px' }],
        hero: ['48px', { lineHeight: '50px' }],
      },
      borderRadius: {
        chip: '999px',
        control: '14px',
        card: '18px',
        panel: '24px',
      },
      spacing: {
        gutter: '20px',
      },
    },
  },
  plugins: [],
};
