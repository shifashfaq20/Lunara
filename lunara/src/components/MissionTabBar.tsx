import { Pressable, View } from 'react-native';
import { router, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Hammer, LayoutDashboard, Siren, Target } from 'lucide-react-native';
import { palette } from '@/constants/theme';
import { AppText } from './ui/AppText';

export const TAB_BAR_HEIGHT = 62;

const TABS = [
  { href: '/mission/dashboard', label: 'Control', icon: LayoutDashboard },
  { href: '/mission/base', label: 'Base', icon: Hammer },
  { href: '/mission/emergencies', label: 'Alerts', icon: Siren },
  { href: '/mission/objectives', label: 'Goals', icon: Target },
] as const;

export function useTabBarSpace() {
  const insets = useSafeAreaInsets();
  return TAB_BAR_HEIGHT + insets.bottom;
}

export function MissionTabBar({ alertCount }: { alertCount: number }) {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  return (
    <View
      accessibilityRole="tablist"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right,
        backgroundColor: 'rgba(5, 8, 20, 0.94)',
        borderTopWidth: 1,
        borderTopColor: palette.line,
      }}
    >
      <View className="flex-row" style={{ height: TAB_BAR_HEIGHT, maxWidth: 680, width: '100%', alignSelf: 'center' }}>
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          const Icon = tab.icon;
          const color = active ? palette.cyan : palette.textMuted;
          const badge = tab.label === 'Alerts' && alertCount > 0;
          return (
            <Pressable
              key={tab.href}
              onPress={() => !active && router.replace(tab.href)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={badge ? `${tab.label}, ${alertCount} active emergency` : tab.label}
              style={({ pressed }) => ({ flex: 1, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.7 : 1 })}
            >
              <View>
                <Icon size={22} color={color} strokeWidth={active ? 2.4 : 2} />
                {badge ? (
                  <View
                    style={{
                      position: 'absolute',
                      top: -3,
                      right: -8,
                      minWidth: 16,
                      height: 16,
                      borderRadius: 8,
                      backgroundColor: palette.red,
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingHorizontal: 3,
                    }}
                  >
                    <AppText variant="micro" weight="bold" color="#FFFFFF" style={{ fontSize: 10, lineHeight: 12 }}>
                      {alertCount}
                    </AppText>
                  </View>
                ) : null}
              </View>
              <AppText variant="micro" weight={active ? 'semibold' : 'regular'} color={color} className="mt-1">
                {tab.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
