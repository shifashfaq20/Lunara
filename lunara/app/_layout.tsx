import '../global.css';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GameProvider, useGame } from '@/state/GameProvider';
import { palette } from '@/constants/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

/** Keeps the splash screen up until any saved mission has been restored. */
function SplashGate() {
  const { hydrated } = useGame();
  useEffect(() => {
    if (hydrated) SplashScreen.hideAsync().catch(() => {});
  }, [hydrated]);
  return null;
}

export default function RootLayout() {
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(palette.void).catch(() => {});
  }, []);

  return (
    <SafeAreaProvider>
      <GameProvider>
        <SplashGate />
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'fade',
            contentStyle: { backgroundColor: palette.void },
          }}
        />
      </GameProvider>
    </SafeAreaProvider>
  );
}
