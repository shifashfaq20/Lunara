import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming, cancelAnimation } from 'react-native-reanimated';
import type { ResourceView } from '@/game/selectors';
import { palette, toneColor } from '@/constants/theme';
import { RESOURCE_ICONS } from './icons';
import { AppText } from './ui/AppText';
import { ProgressIndicator } from './ProgressIndicator';

function formatTrend(trend: number, unit: string) {
  const sign = trend > 0 ? '+' : trend < 0 ? '−' : '±';
  return `${sign}${Math.abs(trend).toFixed(Math.abs(trend) < 10 ? 1 : 0)} ${unit} yesterday`;
}

export function ResourceCard({ view }: { view: ResourceView }) {
  const Icon = RESOURCE_ICONS[view.key];
  const c = toneColor[view.tone];
  const critical = view.tone === 'critical';
  const reduceMotion = useReducedMotion();
  const pulse = useSharedValue(0);

  // A slow border pulse only when a resource is critical: it should draw the eye, not decorate.
  useEffect(() => {
    if (critical && !reduceMotion) {
      pulse.value = withRepeat(withTiming(1, { duration: 1100 }), -1, true);
    } else {
      cancelAnimation(pulse);
      pulse.value = 0;
    }
  }, [critical, reduceMotion, pulse]);

  const borderStyle = useAnimatedStyle(() => ({
    borderColor: critical ? `rgba(255, 77, 94, ${0.35 + pulse.value * 0.55})` : palette.line,
  }));

  return (
    <Animated.View
      accessible
      accessibilityLabel={`${view.label}: ${view.value} ${view.unit}. ${view.status}.${view.trend !== null ? ` ${formatTrend(view.trend, view.unit)}.` : ''}`}
      style={[{ flex: 1, borderWidth: 1, borderRadius: 18, padding: 14, backgroundColor: palette.glass, minHeight: 132 }, borderStyle]}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center" style={{ gap: 7 }}>
          <Icon size={16} color={c.fg} strokeWidth={2.2} />
          <AppText variant="caption" weight="semibold" color={palette.textSoft}>
            {view.label}
          </AppText>
        </View>
      </View>
      <View className="mt-2 flex-row items-baseline" style={{ gap: 4 }}>
        <AppText variant="title" numeric>
          {view.value}
        </AppText>
        <AppText variant="caption">{view.unit}</AppText>
      </View>
      <View className="mb-2 mt-2">
        <ProgressIndicator value={view.fraction} tone={view.tone} />
      </View>
      <AppText variant="micro" color={view.tone === 'neutral' ? palette.textMuted : c.fg} numberOfLines={2}>
        {view.status}
      </AppText>
      {view.trend !== null ? (
        <AppText variant="micro" numeric className="mt-0.5">
          {formatTrend(view.trend, view.unit)}
        </AppText>
      ) : null}
    </Animated.View>
  );
}
