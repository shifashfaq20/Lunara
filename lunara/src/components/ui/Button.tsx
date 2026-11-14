import { ActivityIndicator, Pressable, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { palette, TOUCH_TARGET } from '@/constants/theme';
import { AppText } from './AppText';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const SURFACE: Record<Variant, string> = {
  primary: 'bg-cyan',
  secondary: 'bg-glass border border-line-strong',
  ghost: 'bg-transparent',
  danger: 'bg-red-dim border border-red',
};

const LABEL: Record<Variant, string> = {
  primary: palette.void,
  secondary: palette.text,
  ghost: palette.cyan,
  danger: palette.red,
};

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: LucideIcon;
  disabled?: boolean;
  loading?: boolean;
  compact?: boolean;
  accessibilityHint?: string;
}

export function Button({ label, onPress, variant = 'primary', icon: Icon, disabled, loading, compact, accessibilityHint }: ButtonProps) {
  const inactive = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      hitSlop={compact ? 6 : 0}
      style={({ pressed }) => ({ opacity: inactive ? 0.4 : pressed ? 0.82 : 1, transform: [{ scale: pressed ? 0.985 : 1 }] })}
    >
      <View
        className={`flex-row items-center justify-center rounded-control ${compact ? 'px-4' : 'px-5'} ${SURFACE[variant]}`}
        style={{ minHeight: compact ? 40 : TOUCH_TARGET + 4, gap: 8 }}
      >
        {loading ? (
          <ActivityIndicator color={LABEL[variant]} />
        ) : Icon ? (
          <Icon size={compact ? 16 : 18} color={LABEL[variant]} strokeWidth={2.2} />
        ) : null}
        <AppText variant={compact ? 'caption' : 'body'} weight="semibold" color={LABEL[variant]}>
          {label}
        </AppText>
      </View>
    </Pressable>
  );
}
