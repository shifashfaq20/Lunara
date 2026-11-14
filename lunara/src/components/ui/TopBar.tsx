import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { palette } from '@/constants/theme';
import { goHome } from '@/utils/navigation';
import { AppText } from './AppText';

/** Simple back bar for stack screens. */
export function TopBar({ title, right, onBack }: { title?: string; right?: ReactNode; onBack?: () => void }) {
  const back = onBack ?? (() => (router.canGoBack() ? router.back() : goHome()));
  return (
    <View className="mb-4 flex-row items-center justify-between" style={{ minHeight: 44 }}>
      <Pressable
        onPress={back}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        hitSlop={10}
        className="flex-row items-center"
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, gap: 2 })}
      >
        <ChevronLeft size={22} color={palette.cyan} />
        <AppText variant="body" weight="medium" color={palette.cyan}>
          Back
        </AppText>
      </Pressable>
      {title ? (
        <AppText variant="caption" weight="semibold" color={palette.textSoft} numberOfLines={1}>
          {title}
        </AppText>
      ) : null}
      <View style={{ minWidth: 60, alignItems: 'flex-end' }}>{right}</View>
    </View>
  );
}
