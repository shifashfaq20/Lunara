import { useMemo, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Lock, Rocket } from 'lucide-react-native';
import type { Difficulty, MissionTypeId } from '@/types/game';
import { CREW_SIZE_OPTIONS, DIFFICULTY_SETTINGS, DURATION_OPTIONS } from '@/game/config';
import { MISSIONS, startingResources } from '@/game/missions';
import { randomSeed } from '@/game/rng';
import { ROLE_ORDER, ROLES } from '@/data/crew';
import { RESOURCE_META, RESOURCE_ORDER } from '@/data/resources';
import { palette } from '@/constants/theme';
import { useGame } from '@/state/GameProvider';
import { Screen } from '@/components/ui/Screen';
import { TopBar } from '@/components/ui/TopBar';
import { AppText } from '@/components/ui/AppText';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { SimulationNotice } from '@/components/SimulationNotice';
import { RESOURCE_ICONS } from '@/components/icons';

const DIFFICULTIES: Difficulty[] = ['beginner', 'intermediate', 'expert'];

export default function MissionSelectScreen() {
  const { state, startMission } = useGame();
  const [missionType, setMissionType] = useState<MissionTypeId>('lunar');
  const [difficulty, setDifficulty] = useState<Difficulty>('intermediate');
  const [crewSize, setCrewSize] = useState<number>(4);
  const [durationDays, setDurationDays] = useState<number>(30);

  const supplies = useMemo(
    () => startingResources({ missionType, difficulty, crewSize, durationDays, seed: 0 }),
    [missionType, difficulty, crewSize, durationDays],
  );

  const launch = () => {
    const go = () => {
      startMission({ missionType, difficulty, crewSize, durationDays, seed: randomSeed() });
      router.replace('/mission/dashboard');
    };
    if (state?.status === 'active') {
      Alert.alert('Replace your current mission?', `Your mission on day ${state.day} will be lost.`, [
        { text: 'Keep it', style: 'cancel' },
        { text: 'Replace', style: 'destructive', onPress: go },
      ]);
    } else {
      go();
    }
  };

  return (
    <Screen>
      <TopBar title="Mission planning" />
      <AppText variant="title" accessibilityRole="header">
        Plan your mission
      </AppText>
      <AppText variant="body" className="mt-1">
        Choose where you land, how hard it is, and who comes with you.
      </AppText>

      <SectionHeader title="Destination" />
      <View style={{ gap: 12 }}>
        {(Object.values(MISSIONS)).map((m) => {
          const selected = m.id === missionType;
          return (
            <Pressable
              key={m.id}
              onPress={() => m.available && setMissionType(m.id)}
              disabled={!m.available}
              accessibilityRole="radio"
              accessibilityState={{ selected, disabled: !m.available }}
              accessibilityLabel={`${m.name}. ${m.available ? m.tagline : 'In development, not available yet.'}`}
            >
              <View
                className="rounded-panel p-5"
                style={{
                  borderWidth: selected ? 2 : 1,
                  borderColor: selected ? palette.cyan : palette.line,
                  backgroundColor: selected ? palette.cyanDim : palette.glass,
                  opacity: m.available ? 1 : 0.55,
                  gap: 8,
                }}
              >
                <View className="flex-row items-center justify-between">
                  <AppText variant="heading">{m.name}</AppText>
                  {m.available ? <Badge label={m.site} tone="nominal" /> : <Badge label="In development" tone="neutral" icon={Lock} />}
                </View>
                <AppText variant="body">{m.available ? m.description : m.description}</AppText>
                <View className="flex-row flex-wrap" style={{ gap: 16 }}>
                  {m.facts.map((f) => (
                    <View key={f.label}>
                      <AppText variant="micro">{f.label}</AppText>
                      <AppText variant="caption" weight="semibold" color={palette.textSoft}>
                        {f.value}
                      </AppText>
                    </View>
                  ))}
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>

      <SectionHeader title="Difficulty" />
      <View style={{ gap: 10 }} accessibilityRole="radiogroup">
        {DIFFICULTIES.map((d) => {
          const s = DIFFICULTY_SETTINGS[d];
          const selected = d === difficulty;
          return (
            <Pressable
              key={d}
              onPress={() => setDifficulty(d)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={`${s.label}. ${s.summary}`}
            >
              <View
                className="flex-row items-center rounded-card px-4 py-3.5"
                style={{
                  gap: 14,
                  borderWidth: selected ? 2 : 1,
                  borderColor: selected ? palette.cyan : palette.line,
                  backgroundColor: selected ? palette.cyanDim : palette.glass,
                }}
              >
                <View style={{ flex: 1 }}>
                  <AppText variant="body" weight="semibold" color={palette.text}>
                    {s.label}
                  </AppText>
                  <AppText variant="caption">{s.summary}</AppText>
                </View>
                <AppText variant="micro" numeric style={{ textAlign: 'right' }}>
                  {Math.round(s.emergencyChance * 100)}% daily{'\n'}emergency chance
                </AppText>
              </View>
            </Pressable>
          );
        })}
      </View>

      <SectionHeader title="Crew size" detail="Bigger crews build faster and bring more skills, but use more supplies." />
      <SegmentedControl
        accessibilityLabel="Crew size"
        segments={CREW_SIZE_OPTIONS.map((n) => ({ value: n, label: `${n}` }))}
        value={crewSize}
        onChange={setCrewSize}
      />
      <View className="mt-3 rounded-card border border-line px-4 py-3" style={{ gap: 6 }}>
        {ROLE_ORDER.slice(0, crewSize).map((role) => (
          <AppText key={role} variant="caption">
            <AppText variant="caption" weight="semibold" color={palette.text}>
              {ROLES[role].title}.{' '}
            </AppText>
            {ROLES[role].bonus}
          </AppText>
        ))}
      </View>

      <SectionHeader title="Mission length" detail="Measured in Earth days on the lunar surface." />
      <SegmentedControl
        accessibilityLabel="Mission length"
        segments={DURATION_OPTIONS.map((d) => ({ value: d, label: `${d} days` }))}
        value={durationDays}
        onChange={setDurationDays}
      />

      <SectionHeader title="Starting supplies" detail="Cargo landers bring more every 10 days." />
      <View className="flex-row flex-wrap rounded-panel border border-line bg-glass p-4" style={{ rowGap: 14 }}>
        {RESOURCE_ORDER.map((key) => {
          const Icon = RESOURCE_ICONS[key];
          return (
            <View key={key} style={{ width: '33.33%', gap: 4 }} accessible accessibilityLabel={`${RESOURCE_META[key].label}: ${supplies[key]} ${RESOURCE_META[key].unit}`}>
              <Icon size={16} color={palette.textMuted} />
              <AppText variant="body" weight="semibold" color={palette.text} numeric>
                {supplies[key]} <AppText variant="micro">{RESOURCE_META[key].unit}</AppText>
              </AppText>
              <AppText variant="micro">{RESOURCE_META[key].label}</AppText>
            </View>
          );
        })}
      </View>

      <View className="mt-6" style={{ gap: 14 }}>
        <SimulationNotice />
        <Button label="Launch mission" icon={Rocket} onPress={launch} />
      </View>
    </Screen>
  );
}
