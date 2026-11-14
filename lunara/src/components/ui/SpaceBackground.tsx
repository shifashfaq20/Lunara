import { memo, useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { palette } from '@/constants/theme';
import { createRng } from '@/game/rng';

/** Fixed starfield over a navy-to-black gradient. Deterministic so it never flickers between renders. */
export const SpaceBackground = memo(function SpaceBackground({ density = 70 }: { density?: number }) {
  const stars = useMemo(() => {
    const rng = createRng(4242);
    return Array.from({ length: density }, () => ({
      x: rng.next() * 100,
      y: rng.next() * 100,
      r: rng.next() < 0.88 ? 0.6 + rng.next() * 0.6 : 1.3 + rng.next() * 0.5,
      o: 0.25 + rng.next() * 0.6,
    }));
  }, [density]);

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id="space" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={palette.navy} />
            <Stop offset="0.45" stopColor={palette.abyss} />
            <Stop offset="1" stopColor={palette.void} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#space)" />
        {stars.map((s, i) => (
          <Circle key={i} cx={`${s.x}%`} cy={`${s.y}%`} r={s.r} fill="#FFFFFF" opacity={s.o} />
        ))}
      </Svg>
    </View>
  );
});
