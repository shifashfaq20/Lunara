import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { BookOpen, House } from 'lucide-react-native';
import type { GameState } from '@/types/game';
import { palette, toneColor } from '@/constants/theme';
import { getMissionDefinition } from '@/game/missions';
import { currentSunlight, daysRemaining, radiationTone, sunlightForecast } from '@/game/selectors';
import { goHome } from '@/utils/navigation';
import { AppText } from './ui/AppText';
import { Badge } from './ui/Badge';
import { SunlightDial, SunlightForecast } from './SunlightDial';

const RADIATION_LABEL = { nominal: 'Nominal', elevated: 'Elevated', high: 'High', severe: 'Severe' } as const;

function IconButton({ icon: Icon, label, onPress }: { icon: typeof BookOpen; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      className="items-center justify-center rounded-chip border border-line bg-glass-deep"
      style={({ pressed }) => ({ width: 44, height: 44, opacity: pressed ? 0.7 : 1 })}
    >
      <Icon size={19} color={palette.textSoft} />
    </Pressable>
  );
}

export function MissionHeader({ state }: { state: GameState }) {
  const mission = getMissionDefinition(state.config.missionType);
  const sunlight = currentSunlight(state);
  const remaining = daysRemaining(state);
  const ended = state.status !== 'active';
  const radTone = radiationTone(state.radiation.level);

  return (
    <View>
      <View className="flex-row items-center justify-between">
        <View>
          <AppText variant="caption" weight="semibold" color={palette.cyan} style={{ letterSpacing: 3 }}>
            LUNARA
          </AppText>
          <AppText variant="caption">{mission.site}</AppText>
        </View>
        <View className="flex-row" style={{ gap: 8 }}>
          <IconButton icon={BookOpen} label="Open the Learning Center" onPress={() => router.push('/learning')} />
          <IconButton icon={House} label="Back to the welcome screen" onPress={goHome} />
        </View>
      </View>

      <View className="mt-5 flex-row items-center justify-between">
        <View accessible accessibilityLabel={`Mission day ${state.day} of ${state.config.durationDays}. ${remaining} days remaining.`}>
          <AppText variant="caption">Mission day</AppText>
          <View className="flex-row items-baseline" style={{ gap: 6 }}>
            <AppText variant="hero" numeric>
              {state.day}
            </AppText>
            <AppText variant="lead" numeric>
              / {state.config.durationDays}
            </AppText>
          </View>
          <AppText variant="caption" numeric>
            {ended ? 'Mission ended' : `${remaining} day${remaining === 1 ? '' : 's'} remaining`}
          </AppText>
        </View>
        <SunlightDial sunlight={sunlight} size={84} />
      </View>

      <View className="mt-4 flex-row flex-wrap items-center" style={{ gap: 8 }}>
        <Badge
          tone={radTone}
          label={`Radiation ${RADIATION_LABEL[state.radiation.level].toLowerCase()} (index ${state.radiation.index}, simulated)`}
        />
        {state.modifiers.some((m) => m.kind === 'commsDown') ? <Badge tone="caution" label="No link to Earth" /> : null}
      </View>

      {!ended ? (
        <View className="mt-4 rounded-card border border-line px-4 pb-3 pt-3">
          <View className="mb-2 flex-row justify-between">
            <AppText variant="caption" weight="semibold" color={palette.textSoft}>
              Sunlight outlook
            </AppText>
            <AppText variant="micro" color={toneColor.caution.fg}>
              Amber = dim, plan battery use
            </AppText>
          </View>
          <SunlightForecast days={sunlightForecast(state)} />
        </View>
      ) : null}
    </View>
  );
}
