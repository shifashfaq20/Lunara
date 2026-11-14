import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette } from '@/constants/theme';
import { SpaceBackground } from './SpaceBackground';

export interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  /** Extra space at the bottom for floating bars (tab bar, sticky actions). */
  bottomSpace?: number;
  /** Rendered outside the scroll area, above the content (e.g. a sticky footer). */
  overlay?: ReactNode;
}

/** Full-screen container: starfield, safe areas (including side insets on foldables) and a readable max width. */
export function Screen({ children, scroll = true, bottomSpace = 0, overlay }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const padding = {
    paddingTop: insets.top + 12,
    paddingBottom: insets.bottom + 28 + bottomSpace,
    paddingLeft: insets.left + 20,
    paddingRight: insets.right + 20,
  };
  const content = <View style={{ width: '100%', maxWidth: 680, alignSelf: 'center' }}>{children}</View>;

  return (
    <View style={{ flex: 1, backgroundColor: palette.void }}>
      <SpaceBackground />
      {scroll ? (
        <ScrollView contentContainerStyle={padding} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {content}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, padding]}>{content}</View>
      )}
      {overlay}
    </View>
  );
}
