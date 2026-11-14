import { memo, useEffect, useMemo } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedProps, useReducedMotion, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { palette } from '@/constants/theme';
import { createRng } from '@/game/rng';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/**
 * Welcome-screen hero: the curve of the lunar surface, Earth low on the horizon,
 * and a small outpost whose beacon blinks. Drawn in SVG so it is sharp on every screen.
 */
export const MoonHorizon = memo(function MoonHorizon({ height }: { height: number }) {
  const reduceMotion = useReducedMotion();
  const beacon = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion) return;
    beacon.value = withRepeat(withSequence(withTiming(0.15, { duration: 900 }), withTiming(1, { duration: 900 })), -1);
  }, [beacon, reduceMotion]);

  const beaconProps = useAnimatedProps(() => ({ opacity: beacon.value }));

  const craters = useMemo(() => {
    const rng = createRng(1969);
    return Array.from({ length: 26 }, () => {
      const y = 380 + rng.next() * 160;
      const depth = (y - 360) / 180; // closer craters appear larger
      const rx = 6 + rng.next() * 26 * depth;
      return { x: rng.next() * 420 - 10, y, rx, ry: rx * (0.22 + depth * 0.18) };
    });
  }, []);

  return (
    <View style={{ height, width: '100%' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width="100%" height="100%" viewBox="0 0 400 540" preserveAspectRatio="xMidYMax slice">
        <Defs>
          <RadialGradient id="earth" cx="38%" cy="35%" r="70%">
            <Stop offset="0" stopColor="#9ED0FF" />
            <Stop offset="0.45" stopColor={palette.earth} />
            <Stop offset="1" stopColor="#1B3F8F" />
          </RadialGradient>
          <RadialGradient id="earthGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0.6" stopColor={palette.earth} stopOpacity="0.28" />
            <Stop offset="1" stopColor={palette.earth} stopOpacity="0" />
          </RadialGradient>
          <LinearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#C9CED8" />
            <Stop offset="0.18" stopColor="#8A90A0" />
            <Stop offset="0.6" stopColor="#3C4256" />
            <Stop offset="1" stopColor={palette.abyss} />
          </LinearGradient>
          <LinearGradient id="rim" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0" />
            <Stop offset="0.35" stopColor="#FFFFFF" stopOpacity="0.55" />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
          </LinearGradient>
          <LinearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0.55" stopColor={palette.void} stopOpacity="0" />
            <Stop offset="1" stopColor={palette.void} stopOpacity="1" />
          </LinearGradient>
        </Defs>

        {/* Earth with a night-side terminator */}
        <Circle cx="292" cy="150" r="70" fill="url(#earthGlow)" />
        <Circle cx="292" cy="150" r="38" fill="url(#earth)" />
        <Path d="M 292 112 A 38 38 0 0 1 292 188 A 22 38 0 0 0 292 112 Z" fill={palette.void} opacity={0.72} />

        {/* Lunar surface: a huge circle so the horizon curves */}
        <Circle cx="200" cy="1260" r="900" fill="url(#ground)" />
        <Path d="M -40 372 Q 200 342 440 372" stroke="url(#rim)" strokeWidth={1.5} fill="none" />

        {craters.map((c, i) => (
          <G key={i}>
            <Ellipse cx={c.x} cy={c.y} rx={c.rx} ry={c.ry} fill="#1F2438" opacity={0.55} />
            <Ellipse cx={c.x + c.rx * 0.08} cy={c.y - c.ry * 0.25} rx={c.rx * 0.92} ry={c.ry * 0.7} fill="#B9BFCC" opacity={0.12} />
          </G>
        ))}

        {/* Outpost silhouette on the ridge */}
        <G>
          <Rect x="78" y="350" width="2" height="22" fill="#D7DCE6" />
          <Path d="M 60 352 L 98 346" stroke="#D7DCE6" strokeWidth={1.5} />
          <Rect x="62" y="342" width="34" height="6" fill={palette.cyan} opacity={0.35} />
          <Path d="M 100 372 Q 118 344 136 372 Z" fill="#E6EAF2" />
          <Rect x="132" y="362" width="26" height="10" rx={2} fill="#CBD1DD" />
          <Rect x="160" y="356" width="1.5" height="16" fill="#D7DCE6" />
          <AnimatedCircle cx="160.75" cy="355" r={2.6} fill={palette.cyan} animatedProps={beaconProps} />
        </G>

        <Rect x="0" y="0" width="400" height="540" fill="url(#fade)" />
      </Svg>
    </View>
  );
});
