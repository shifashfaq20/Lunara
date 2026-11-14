import { Pressable, View } from 'react-native';
import { palette } from '@/constants/theme';
import { AppText } from './AppText';

export function SectionHeader({
  title,
  detail,
  actionLabel,
  onAction,
}: {
  title: string;
  detail?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View className="mb-3 mt-7 flex-row items-end justify-between" style={{ gap: 12 }}>
      <View style={{ flex: 1 }}>
        <AppText variant="heading" accessibilityRole="header">
          {title}
        </AppText>
        {detail ? <AppText variant="caption" className="mt-0.5">{detail}</AppText> : null}
      </View>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} accessibilityRole="button" hitSlop={12}>
          <AppText variant="caption" weight="semibold" color={palette.cyan}>
            {actionLabel}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}
