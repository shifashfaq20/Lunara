import { memo } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from 'react-native-svg';
import { palette } from '@/constants/theme';
import { litDiscPath } from '@/utils/moonPhase';
import { AppText } from './ui/AppText';

/**
 * LUNARA's signature gauge: a Moon disc whose lit portion equals the sunlight
 * reaching the outpost's solar arrays today.
 */
export const SunlightDial = memo(function SunlightDial({ sunlight, size = 76 }: { sunlight: number; size?: number }) {
  const r = size / 2 - 3;
  const c = size / 2;
  const pct = Math.round(sunlight * 100);
  return (
    <View className="items-center" accessible accessibilityLabel={`Sunlight at the outpost: ${pct} percent`}>
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id="lit" cx="65%" cy="40%" r="75%">
            <Stop offset="0" stopColor="#F4F6FA" />
            <Stop offset="0.7" stopColor={palette.regolith} />
            <Stop offset="1" stopColor="#7E8597" />
          </RadialGradient>
        </Defs>
        <Circle cx={c} cy={c} r={r + 2.5} fill="none" stroke={palette.lineStrong} strokeWidth={1} />
        <Circle cx={c} cy={c} r={r} fill={palette.hull} />
        <Path d={litDiscPath(c, c, r, sunlight)} fill="url(#lit)" />
        <Circle cx={c - r * 0.3} cy={c - r * 0.25} r={r * 0.16} fill="#000" opacity={0.12} />
        <Circle cx={c + r * 0.35} cy={c + r * 0.3} r={r * 0.11} fill="#000" opacity={0.14} />
        <Circle cx={c + r * 0.1} cy={c - r * 0.45} r={r * 0.08} fill="#000" opacity={0.12} />
      </Svg>
      <AppText variant="micro" className="mt-1" numeric>
        {pct}% sunlight
      </AppText>
    </View>
  );
});

/** Seven-day sunlight outlook. Deterministic in the game, so the player can plan battery use. */
export function SunlightForecast({ days }: { days: { day: number; sunlight: number }[] }) {
  return (
    <View accessible accessibilityLabel={`Sunlight forecast: ${days.map((d) => `day ${d.day} ${Math.round(d.sunlight * 100)} percent`).join(', ')}`}>
      <View className="flex-row items-end" style={{ gap: 6, height: 34 }}>
        {days.map((d, i) => (
          <View key={d.day} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: 34 }}>
            <View
              style={{
                width: '100%',
                maxWidth: 22,
                height: Math.max(4, d.sunlight * 30),
                borderRadius: 4,
                backgroundColor: i === 0 ? palette.cyan : d.sunlight < 0.55 ? palette.amber : palette.regolith,
                opacity: i === 0 ? 1 : 0.55,
              }}
            />
          </View>
        ))}
      </View>
      <View className="mt-1 flex-row" style={{ gap: 6 }}>
        {days.map((d, i) => (
          <AppText key={d.day} variant="micro" numeric style={{ flex: 1, textAlign: 'center' }}>
            {i === 0 ? 'Today' : d.day}
          </AppText>
        ))}
      </View>
    </View>
  );
}
