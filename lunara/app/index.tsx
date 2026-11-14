import { Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FileText, Info, ListChecks, Play, Rocket, Telescope, type LucideIcon } from 'lucide-react-native';
import { palette } from '@/constants/theme';
import { useGame } from '@/state/GameProvider';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { SpaceBackground } from '@/components/ui/SpaceBackground';
import { MoonHorizon } from '@/components/MoonHorizon';

function NavTile({ icon: Icon, label, onPress }: { icon: LucideIcon; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({ flex: 1, opacity: pressed ? 0.75 : 1 })}
    >
      <View className="items-start rounded-card border border-line bg-glass-deep px-3.5 py-3.5" style={{ minHeight: 78, gap: 8 }}>
        <Icon size={20} color={palette.violet} />
        <AppText variant="caption" weight="semibold" color={palette.text}>
          {label}
        </AppText>
      </View>
    </Pressable>
  );
}

export default function WelcomeScreen() {
  const { state, hydrated } = useGame();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  if (!hydrated) return <View style={{ flex: 1, backgroundColor: palette.void }} />;

  const resumable = state?.status === 'active';
  const finished = !!state && state.status !== 'active';

  return (
    <View style={{ flex: 1, backgroundColor: palette.void }}>
      <SpaceBackground />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 32 }} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeIn.duration(1100)}>
          <MoonHorizon height={Math.min(height * 0.46, 440) + insets.top} />
        </Animated.View>

        <View
          style={{
            marginTop: -36,
            paddingLeft: insets.left + 24,
            paddingRight: insets.right + 24,
            width: '100%',
            maxWidth: 680,
            alignSelf: 'center',
          }}
        >
          <Animated.View entering={FadeInDown.delay(250).duration(800)}>
            <AppText
              accessibilityRole="header"
              accessibilityLabel="LUNARA, Junior Astronaut Mission Trainer"
              style={{ fontSize: 15, fontWeight: '800', letterSpacing: 9, color: palette.cyan }}
            >
              LUNARA
            </AppText>
            <AppText variant="caption" className="mt-1">
              Junior Astronaut Mission Trainer
            </AppText>
            <AppText variant="display" className="mt-6" style={{ letterSpacing: -0.6 }}>
              {'Your Mission.\nYour Crew.\nYour Survival.'}
            </AppText>
            <AppText variant="lead" className="mt-4">
              Command an outpost near the Moon’s south pole. Build life support, balance oxygen, water, food and power, and make
              the calls that keep your crew alive.
            </AppText>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(500).duration(800)} style={{ gap: 12, marginTop: 28 }}>
            {resumable && state ? (
              <Button label={`Resume mission, day ${state.day}`} icon={Play} onPress={() => router.push('/mission/dashboard')} />
            ) : null}
            {finished ? (
              <Button label="View last mission report" icon={FileText} variant="secondary" onPress={() => router.push('/mission/report')} />
            ) : null}
            <Button
              label={resumable ? 'Start a new mission' : 'Start mission'}
              icon={Rocket}
              variant={resumable ? 'secondary' : 'primary'}
              onPress={() => router.push('/mission/select')}
            />
            <View className="mt-1 flex-row" style={{ gap: 10 }}>
              <NavTile icon={ListChecks} label="How to play" onPress={() => router.push('/how-to-play')} />
              <NavTile icon={Telescope} label="Space facts" onPress={() => router.push('/learning')} />
              <NavTile icon={Info} label="About LUNARA" onPress={() => router.push('/about')} />
            </View>
          </Animated.View>

          <AppText variant="micro" className="mt-8">
            An educational simulation that uses NASA open data. Not affiliated with or endorsed by NASA.
          </AppText>
        </View>
      </ScrollView>
    </View>
  );
}
