import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import { toneColor, type Tone } from '@/constants/theme';

export interface ProgressIndicatorProps {
  /** 0–1 */
  value: number;
  tone?: Tone;
  height?: number;
  label?: string;
}

/** Horizontal gauge that animates when the value changes (e.g. after ending a day). */
export function ProgressIndicator({ value, tone = 'nominal', height = 6, label }: ProgressIndicatorProps) {
  const clamped = Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(clamped);

  useEffect(() => {
    progress.value = reduceMotion
      ? clamped
      : withTiming(clamped, { duration: 650, easing: Easing.out(Easing.cubic) });
  }, [clamped, reduceMotion, progress]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));
  const color = toneColor[tone].fg;

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
      style={{ height, borderRadius: height, backgroundColor: 'rgba(148,176,255,0.12)', overflow: 'hidden' }}
    >
      <Animated.View style={[{ height, borderRadius: height, backgroundColor: color }, fillStyle]} />
    </View>
  );
}
