import { View } from 'react-native';
import { router, Stack } from 'expo-router';
import { Rocket } from 'lucide-react-native';
import { palette } from '@/constants/theme';
import { useGame } from '@/state/GameProvider';
import { EmergencyModalProvider } from '@/state/EmergencyModalContext';
import { MissionTabBar } from '@/components/MissionTabBar';
import { EmergencyModal } from '@/components/EmergencyModal';
import { Screen } from '@/components/ui/Screen';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';

/** In-mission shell: screens, a bottom tab bar, and the emergency decision sheet. */
export default function MissionHubLayout() {
  const { state, hydrated } = useGame();

  if (!hydrated) return <View style={{ flex: 1, backgroundColor: palette.void }} />;

  if (!state) {
    return (
      <Screen>
        <View style={{ gap: 14, marginTop: 80 }}>
          <AppText variant="title">No active mission</AppText>
          <AppText variant="body">Plan a mission to open mission control.</AppText>
          <Button label="Plan a mission" icon={Rocket} onPress={() => router.replace('/mission/select')} />
        </View>
      </Screen>
    );
  }

  return (
    <EmergencyModalProvider>
      <View style={{ flex: 1, backgroundColor: palette.void }}>
        <Stack screenOptions={{ headerShown: false, animation: 'none', contentStyle: { backgroundColor: palette.void } }} />
        <MissionTabBar alertCount={state.activeEmergencies.length} />
        <EmergencyModal />
      </View>
    </EmergencyModalProvider>
  );
}
