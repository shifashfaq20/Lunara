import { View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { toneColor, type Tone } from '@/constants/theme';
import { AppText } from './AppText';

export function Badge({ label, tone = 'neutral', icon: Icon }: { label: string; tone?: Tone; icon?: LucideIcon }) {
  const c = toneColor[tone];
  return (
    <View
      className="flex-row items-center self-start rounded-chip px-2.5 py-1"
      style={{ backgroundColor: c.bg, gap: 5 }}
    >
      {Icon ? <Icon size={12} color={c.fg} strokeWidth={2.4} /> : null}
      <AppText variant="micro" weight="semibold" color={c.fg}>
        {label}
      </AppText>
    </View>
  );
}
