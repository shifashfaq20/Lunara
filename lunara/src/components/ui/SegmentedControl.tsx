import { Pressable, View } from 'react-native';
import { palette } from '@/constants/theme';
import { AppText } from './AppText';

export interface Segment<T extends string | number> {
  value: T;
  label: string;
  disabled?: boolean;
}

export function SegmentedControl<T extends string | number>({
  segments,
  value,
  onChange,
  accessibilityLabel,
}: {
  segments: Segment<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
}) {
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      className="flex-row rounded-control border border-line bg-glass-deep p-1"
      style={{ gap: 4 }}
    >
      {segments.map((s) => {
        const selected = s.value === value;
        return (
          <Pressable
            key={String(s.value)}
            onPress={() => onChange(s.value)}
            disabled={s.disabled}
            accessibilityRole="radio"
            accessibilityLabel={s.label}
            accessibilityState={{ selected, disabled: !!s.disabled }}
            style={({ pressed }) => ({ flex: 1, opacity: s.disabled ? 0.35 : pressed ? 0.8 : 1 })}
          >
            <View
              className="items-center justify-center rounded-[10px] px-2"
              style={{ minHeight: 42, backgroundColor: selected ? palette.cyanDim : 'transparent', borderWidth: 1, borderColor: selected ? palette.cyan : 'transparent' }}
            >
              <AppText variant="caption" weight="semibold" color={selected ? palette.cyan : palette.textSoft} numberOfLines={1}>
                {s.label}
              </AppText>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
