import { Alert, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FileText, Siren, Sunset } from 'lucide-react-native';
import type { OperationsMode } from '@/types/game';
import { EMERGENCIES } from '@/data/emergencies';
import { GAME_RULES, OPERATIONS_MODES } from '@/game/config';
import { averageHealth, averageMorale } from '@/game/crewManager';
import { canAbort } from '@/game/gameEngine';
import { operationsEffects, resourceView, statTone } from '@/game/selectors';
import { palette, toneColor } from '@/constants/theme';
import { useGame } from '@/state/GameProvider';
import { useEmergencyModal } from '@/state/EmergencyModalContext';
import { Screen } from '@/components/ui/Screen';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { MissionHeader } from '@/components/MissionHeader';
import { ResourceCard } from '@/components/ResourceCard';
import { CrewCard } from '@/components/CrewCard';
import { DayReportPanel } from '@/components/DayReportPanel';
import { ObjectiveItem } from '@/components/ObjectiveItem';
import { ActivityLog } from '@/components/ActivityLog';
import { SimulationNotice } from '@/components/SimulationNotice';
import { EMERGENCY_ICONS } from '@/components/icons';
import { useTabBarSpace } from '@/components/MissionTabBar';

const MODES: OperationsMode[] = ['standard', 'science', 'conservation'];
const RESOURCE_ROWS = [
  ['oxygen', 'water'],
  ['food', 'power'],
  ['fuel', 'materials'],
] as const;
const FOOTER_HEIGHT = 76;

function Vital({ label, value, tone }: { label: string; value: string; tone: keyof typeof toneColor }) {
  return (
    <View style={{ flex: 1 }} accessible accessibilityLabel={`${label}: ${value}`}>
      <AppText variant="micro">{label}</AppText>
      <AppText variant="heading" numeric color={toneColor[tone].fg}>
        {value}
      </AppText>
    </View>
  );
}

export default function DashboardScreen() {
  const { state, endDay, setMode, abort } = useGame();
  const modal = useEmergencyModal();
  const tabSpace = useTabBarSpace();
  const insets = useSafeAreaInsets();
  if (!state) return null;

  const ended = state.status !== 'active';
  const active = state.activeEmergencies[0];
  const activeDef = active ? EMERGENCIES[active.emergencyId] : null;
  const alive = state.crew.filter((c) => c.alive).length;
  const health = averageHealth(state);
  const morale = averageMorale(state);
  const openObjectives = state.objectives.filter((o) => o.status !== 'completed').slice(0, 3);

  const onEndDay = () => {
    if (active) {
      modal.open();
      return;
    }
    const result = endDay();
    if (!result) return;
    if (!result.ok) {
      Alert.alert('Cannot end the day', result.error);
      return;
    }
    if (result.state.status !== 'active') router.replace('/mission/report');
  };

  const onModeChange = (mode: OperationsMode) => {
    const result = setMode(mode);
    if (result?.ok && result.message) Alert.alert('Heads up', result.message);
    if (result && !result.ok) Alert.alert('Cannot change plan', result.error);
  };

  const onAbort = () => {
    const check = canAbort(state);
    if (!check.ok) {
      Alert.alert('Evacuation not possible', check.reason);
      return;
    }
    Alert.alert(
      'Abort the mission?',
      `The crew launches home using ${GAME_RULES.abortFuelCost} kg of fuel. The mission ends now and the score is capped at 74.`,
      [
        { text: 'Stay on the Moon', style: 'cancel' },
        {
          text: 'Evacuate',
          style: 'destructive',
          onPress: () => {
            const result = abort();
            if (result?.ok) router.replace('/mission/report');
            else if (result) Alert.alert('Evacuation failed', result.error);
          },
        },
      ],
    );
  };

  const ActiveIcon = active ? EMERGENCY_ICONS[active.emergencyId] : Siren;

  return (
    <Screen
      bottomSpace={tabSpace + FOOTER_HEIGHT}
      overlay={
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: tabSpace,
            paddingTop: 10,
            paddingBottom: 12,
            paddingLeft: insets.left + 20,
            paddingRight: insets.right + 20,
            backgroundColor: 'rgba(5, 8, 20, 0.92)',
            borderTopWidth: 1,
            borderTopColor: palette.line,
          }}
        >
          <View style={{ width: '100%', maxWidth: 680, alignSelf: 'center' }}>
            {ended ? (
              <Button label="View mission report" icon={FileText} onPress={() => router.replace('/mission/report')} />
            ) : active ? (
              <Button
                variant="danger"
                icon={Siren}
                label="Decide on the emergency first"
                onPress={modal.open}
                accessibilityHint="Opens the emergency decision sheet. The day cannot end until you decide."
              />
            ) : (
              <Button
                label={`End day ${state.day}`}
                icon={Sunset}
                onPress={onEndDay}
                accessibilityHint="Runs one day of the simulation: consumption, production, crew health and possible emergencies."
              />
            )}
          </View>
        </View>
      }
    >
      <MissionHeader state={state} />

      {active && activeDef ? (
        <Pressable
          onPress={modal.open}
          accessibilityRole="button"
          accessibilityLabel={`Emergency: ${activeDef.title}. Open to decide.`}
          className="mt-5 flex-row items-center rounded-card border border-red px-4 py-3.5"
          style={{ gap: 12, backgroundColor: palette.redDim }}
        >
          <ActiveIcon size={22} color={palette.red} />
          <View style={{ flex: 1 }}>
            <AppText variant="body" weight="semibold" color={palette.text}>
              {activeDef.title}
            </AppText>
            <AppText variant="caption" color={palette.textSoft}>
              Tap to choose how the crew responds.
            </AppText>
          </View>
        </Pressable>
      ) : null}

      {ended ? (
        <View className="mt-5 rounded-card border border-line-strong bg-hull px-4 py-3.5">
          <AppText variant="body" weight="semibold" color={palette.text}>
            {state.endReason}
          </AppText>
        </View>
      ) : null}

      <SectionHeader title="Resources" detail="Bars show reserves. Amber and red mean act soon." />
      <View style={{ gap: 12 }}>
        {RESOURCE_ROWS.map((row) => (
          <View key={row[0]} className="flex-row" style={{ gap: 12 }}>
            {row.map((key) => (
              <ResourceCard key={key} view={resourceView(state, key)} />
            ))}
          </View>
        ))}
      </View>

      <SectionHeader title="Crew" detail={`${alive} of ${state.crew.length} on station`} />
      <View className="mb-3 flex-row rounded-card border border-line bg-glass-deep px-4 py-3" style={{ gap: 8 }}>
        <Vital label="Avg. health" value={alive ? `${Math.round(health)}` : '—'} tone={statTone(health)} />
        <Vital label="Avg. morale" value={alive ? `${Math.round(morale)}` : '—'} tone={statTone(morale)} />
        <Vital label="Exposure (sim.)" value={state.radiation.cumulativeExposure.toFixed(0)} tone="science" />
      </View>
      <View style={{ gap: 10 }}>
        {state.crew.map((member) => (
          <CrewCard key={member.id} member={member} />
        ))}
      </View>

      <SectionHeader title="Operations plan" detail="Applies to every day until you change it." />
      <SegmentedControl
        accessibilityLabel="Operations plan"
        segments={MODES.map((m) => ({ value: m, label: OPERATIONS_MODES[m].label, disabled: ended }))}
        value={state.operationsMode}
        onChange={onModeChange}
      />
      <View className="mt-3 rounded-card border border-line px-4 py-3" style={{ gap: 4 }}>
        <AppText variant="caption" color={palette.textSoft}>
          {OPERATIONS_MODES[state.operationsMode].summary}
        </AppText>
        {operationsEffects(state.operationsMode).map((effect) => (
          <AppText key={effect} variant="micro">
            {effect}
          </AppText>
        ))}
      </View>

      <SectionHeader
        title={state.lastReport ? `Day ${state.lastReport.day} balance` : 'Daily balance'}
        detail="What the base made and used"
      />
      {state.lastReport ? (
        <DayReportPanel report={state.lastReport} />
      ) : (
        <AppText variant="caption">End your first day to see where every kilogram and kilowatt-hour went.</AppText>
      )}

      <SectionHeader title="Objectives" actionLabel="See all" onAction={() => router.replace('/mission/objectives')} />
      {openObjectives.length ? (
        <View style={{ gap: 10 }}>
          {openObjectives.map((o) => (
            <ObjectiveItem key={o.id} objective={o} config={state.config} compact />
          ))}
        </View>
      ) : (
        <AppText variant="caption">Every objective is complete.</AppText>
      )}

      <SectionHeader title="Mission log" />
      <ActivityLog entries={state.log} />

      <View className="mt-8" style={{ gap: 14 }}>
        <SimulationNotice />
        {!ended ? (
          <Pressable onPress={onAbort} accessibilityRole="button" hitSlop={8} style={{ alignSelf: 'center', minHeight: 44, justifyContent: 'center' }}>
            <AppText variant="caption" weight="semibold" color={palette.red}>
              Abort mission and evacuate the crew
            </AppText>
          </Pressable>
        ) : null}
      </View>
    </Screen>
  );
}
