import { useMemo } from 'react';
import { Alert, View } from 'react-native';
import { router } from 'expo-router';
import { House, LayoutDashboard, Rocket } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { RESOURCE_META, RESOURCE_ORDER } from '@/data/resources';
import { ROLES } from '@/data/crew';
import { buildMissionReport } from '@/game/report';
import { palette, toneColor, type Tone } from '@/constants/theme';
import { useGame } from '@/state/GameProvider';
import { goHome } from '@/utils/navigation';
import { Screen } from '@/components/ui/Screen';
import { AppText } from '@/components/ui/AppText';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ObjectiveItem } from '@/components/ObjectiveItem';
import { ScoreBreakdown } from '@/components/ScoreBreakdown';
import { SimulationNotice } from '@/components/SimulationNotice';
import { RESOURCE_ICONS } from '@/components/icons';

const RATING_TONE: Record<string, Tone> = { legendary: 'science', excellent: 'nominal', survived: 'caution', failed: 'critical' };
const DECISION = {
  optimal: { label: 'Optimal', tone: 'nominal' as const },
  acceptable: { label: 'Acceptable', tone: 'caution' as const },
  risky: { label: 'Risky', tone: 'critical' as const },
};

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <View style={{ width: '50%', paddingVertical: 8, paddingRight: 8 }} accessible accessibilityLabel={`${label}: ${value}. ${note ?? ''}`}>
      <AppText variant="micro">{label}</AppText>
      <AppText variant="heading" numeric>
        {value}
      </AppText>
      {note ? <AppText variant="micro">{note}</AppText> : null}
    </View>
  );
}

export default function MissionReportScreen() {
  const { state, discardMission } = useGame();
  const report = useMemo(() => (state && state.status !== 'active' ? buildMissionReport(state) : null), [state]);

  if (!state) {
    return (
      <Screen>
        <View style={{ gap: 14, marginTop: 80 }}>
          <AppText variant="title">No mission report yet</AppText>
          <AppText variant="body">Reports are written when a mission ends.</AppText>
          <Button label="Back to the welcome screen" icon={House} onPress={goHome} />
        </View>
      </Screen>
    );
  }

  if (!report) {
    return (
      <Screen>
        <View style={{ gap: 14, marginTop: 80 }}>
          <AppText variant="title">Mission still in progress</AppText>
          <AppText variant="body">The report is written when the mission ends. You are on day {state.day}.</AppText>
          <Button label="Return to mission control" icon={LayoutDashboard} onPress={() => router.replace('/mission/dashboard')} />
        </View>
      </Screen>
    );
  }

  const tone = RATING_TONE[report.score.rating];

  const newMission = () => {
    Alert.alert('Start a new mission?', 'This report will be cleared from the device.', [
      { text: 'Keep reading', style: 'cancel' },
      {
        text: 'New mission',
        onPress: async () => {
          await discardMission();
          router.replace('/mission/select');
        },
      },
    ]);
  };

  return (
    <Screen>
      <Animated.View entering={FadeInDown.duration(700)}>
        <AppText variant="caption" weight="semibold" color={palette.cyan} style={{ letterSpacing: 3 }}>
          LUNARA
        </AppText>
        <AppText variant="caption">Mission report</AppText>
        <AppText variant="display" className="mt-3" accessibilityRole="header">
          {report.resultTitle}
        </AppText>
        <AppText variant="lead" className="mt-2">
          {report.resultDetail}
        </AppText>

        <View className="mt-6 rounded-panel border p-6" style={{ borderColor: toneColor[tone].fg, backgroundColor: toneColor[tone].bg }}>
          <AppText variant="caption" color={toneColor[tone].fg} weight="semibold">
            Commander rating
          </AppText>
          <View className="flex-row items-end justify-between" style={{ gap: 12 }}>
            <AppText variant="title" style={{ flex: 1 }}>
              {report.score.ratingLabel}
            </AppText>
            <AppText variant="hero" numeric color={toneColor[tone].fg} accessibilityLabel={`Score ${report.score.total} out of 100`}>
              {report.score.total}
            </AppText>
          </View>
          <AppText variant="micro" className="mt-1">
            out of 100 points
          </AppText>
        </View>
      </Animated.View>

      <SectionHeader title="Mission summary" />
      <View className="flex-row flex-wrap rounded-panel border border-line bg-glass px-5 py-3">
        <Stat label="Days survived" value={`${report.daysSurvived} / ${report.durationDays}`} />
        <Stat label="Crew survival" value={`${report.crewSurvived} / ${report.crew.length}`} />
        <Stat label="Objectives completed" value={`${report.objectivesCompleted} / ${report.objectives.length}`} />
        <Stat label="Resource efficiency" value={`${report.resourceEfficiency}%`} note="Shortage-free days and final reserves" />
        <Stat label="Scientific progress" value={`${report.research} / ${report.researchTarget}`} note="Research points" />
        <Stat label="Emergencies" value={`${report.emergenciesEncountered}`} note={`${report.decisions.length} decisions made`} />
        <Stat label="Radiation exposure" value={report.cumulativeExposure.toFixed(0)} note="Simulated points, not a dose" />
        <Stat label="Peak radiation index" value={`${report.peakRadiationIndex}`} note="Simulated 0–100 index" />
      </View>

      <SectionHeader title="Crew" />
      <View style={{ gap: 8 }}>
        {report.crew.map((c) => (
          <View key={c.id} className="flex-row items-center justify-between rounded-card border border-line bg-glass px-4 py-3" style={{ gap: 8 }}>
            <View style={{ flex: 1 }}>
              <AppText variant="body" weight="semibold" color={palette.text}>
                {c.name}
              </AppText>
              <AppText variant="micro">{ROLES[c.role].title}</AppText>
            </View>
            {c.alive ? (
              <AppText variant="caption" numeric>
                Health {Math.round(c.health)}, morale {Math.round(c.morale)}
              </AppText>
            ) : (
              <Badge label={`Lost on day ${c.dayLost}`} tone="critical" />
            )}
          </View>
        ))}
      </View>

      <SectionHeader title="Final resources" />
      <View className="flex-row flex-wrap rounded-panel border border-line bg-glass p-4" style={{ rowGap: 14 }}>
        {RESOURCE_ORDER.map((key) => {
          const Icon = RESOURCE_ICONS[key];
          const meta = RESOURCE_META[key];
          return (
            <View key={key} style={{ width: '33.33%', gap: 4 }} accessible accessibilityLabel={`${meta.label}: ${report.finalResources[key].toFixed(meta.decimals)} ${meta.unit}`}>
              <Icon size={16} color={palette.textMuted} />
              <AppText variant="body" weight="semibold" color={palette.text} numeric>
                {report.finalResources[key].toFixed(meta.decimals)} <AppText variant="micro">{meta.unit}</AppText>
              </AppText>
              <AppText variant="micro">{meta.label}</AppText>
            </View>
          );
        })}
      </View>

      <SectionHeader title="Buildings constructed" detail={`${report.buildings.length} of 8`} />
      {report.buildings.length ? (
        <View className="rounded-panel border border-line bg-glass-deep px-4 py-2">
          {report.buildings.map((b, i) => (
            <View key={b.id} className="flex-row justify-between py-2.5" style={{ borderTopWidth: i === 0 ? 0 : 1, borderTopColor: palette.line }}>
              <AppText variant="caption" color={palette.text}>
                {b.name}
              </AppText>
              <AppText variant="caption" numeric>
                Level {b.level}, {b.condition}% condition
              </AppText>
            </View>
          ))}
        </View>
      ) : (
        <AppText variant="caption">No buildings were completed.</AppText>
      )}

      <SectionHeader
        title="Decisions"
        detail={`${report.decisionCounts.optimal} optimal, ${report.decisionCounts.acceptable} acceptable, ${report.decisionCounts.risky} risky`}
      />
      {report.decisions.length ? (
        <View style={{ gap: 8 }}>
          {report.decisions.map((d, i) => (
            <View key={i} className="rounded-card border border-line bg-glass px-4 py-3" style={{ gap: 4 }}>
              <View className="flex-row items-center justify-between" style={{ gap: 8 }}>
                <AppText variant="caption" weight="semibold" color={palette.text} style={{ flex: 1 }}>
                  Day {d.day}: {d.emergencyTitle}
                </AppText>
                <Badge label={DECISION[d.rating].label} tone={DECISION[d.rating].tone} />
              </View>
              <AppText variant="micro">{d.choiceLabel}</AppText>
            </View>
          ))}
        </View>
      ) : (
        <AppText variant="caption">No emergencies occurred.</AppText>
      )}

      <SectionHeader title="Objectives" />
      <View style={{ gap: 8 }}>
        {report.objectives.map((o) => (
          <ObjectiveItem key={o.id} objective={o} config={state.config} compact />
        ))}
      </View>

      <SectionHeader title="Score breakdown" detail="Every point and how it was earned" />
      <ScoreBreakdown score={report.score} />

      <View className="mt-7" style={{ gap: 12 }}>
        <SimulationNotice />
        <Button label="Plan a new mission" icon={Rocket} onPress={newMission} />
        <Button label="Back to the welcome screen" icon={House} variant="secondary" onPress={goHome} />
      </View>
    </Screen>
  );
}
