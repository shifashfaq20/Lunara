import { View } from 'react-native';
import type { ResourceKey, Resources } from '@/types/game';
import { RESOURCE_META } from '@/data/resources';
import { palette } from '@/constants/theme';
import { RESOURCE_ICONS } from './icons';
import { AppText } from './ui/AppText';

/** Shows a resource cost; amounts the base cannot afford turn red. */
export function CostChips({ cost, available, emptyLabel = 'No cost' }: { cost: Partial<Resources>; available?: Resources; emptyLabel?: string }) {
  const entries = Object.entries(cost).filter(([, v]) => (v ?? 0) > 0) as [ResourceKey, number][];
  if (!entries.length) {
    return <AppText variant="caption">{emptyLabel}</AppText>;
  }
  return (
    <View className="flex-row flex-wrap" style={{ gap: 6 }}>
      {entries.map(([key, amount]) => {
        const Icon = RESOURCE_ICONS[key];
        const short = available ? available[key] < amount : false;
        const color = short ? palette.red : palette.textSoft;
        return (
          <View
            key={key}
            className="flex-row items-center rounded-chip px-2.5 py-1"
            style={{ gap: 4, backgroundColor: short ? palette.redDim : 'rgba(148,176,255,0.08)' }}
            accessibilityLabel={`${amount} ${RESOURCE_META[key].unit} ${RESOURCE_META[key].label}${short ? ', not enough' : ''}`}
          >
            <Icon size={12} color={color} />
            <AppText variant="micro" weight="semibold" color={color} numeric>
              {amount} {RESOURCE_META[key].unit}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}
