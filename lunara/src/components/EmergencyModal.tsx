import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CircleCheck, TriangleAlert, X } from 'lucide-react-native';
import type { DecisionRecord } from '@/types/game';
import { EMERGENCIES } from '@/data/emergencies';
import { BUILDINGS } from '@/data/buildings';
import { getChoiceStatus } from '@/game/eventManager';
import { palette, toneColor } from '@/constants/theme';
import { useGame } from '@/state/GameProvider';
import { useEmergencyModal } from '@/state/EmergencyModalContext';
import { EMERGENCY_ICONS } from './icons';
import { AppText } from './ui/AppText';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { CostChips } from './CostChips';

const RATING = {
  optimal: { label: 'Optimal decision', tone: 'nominal' as const },
  acceptable: { label: 'Acceptable decision', tone: 'caution' as const },
  risky: { label: 'Risky decision', tone: 'critical' as const },
};

/**
 * Decision sheet for the active emergency. Opens automatically when a new emergency appears.
 * Ratings stay hidden until the player commits, so the choice is a real judgement call.
 */
export function EmergencyModal() {
  const { state, resolveEmergency } = useGame();
  const { visible, open, close } = useEmergencyModal();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<DecisionRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showScience, setShowScience] = useState(false);
  const lastOpened = useRef<string | null>(null);

  const active = state?.activeEmergencies[0];

  useEffect(() => {
    if (active && active.instanceId !== lastOpened.current) {
      lastOpened.current = active.instanceId;
      setSelected(null);
      setOutcome(null);
      setError(null);
      setShowScience(false);
      open();
    }
  }, [active, open]);

  if (!state) return null;
  const def = active ? EMERGENCIES[active.emergencyId] : null;
  const Icon = def ? EMERGENCY_ICONS[def.id] : TriangleAlert;

  const confirm = () => {
    if (!active || !selected) return;
    const result = resolveEmergency(active.instanceId, selected);
    if (!result) return;
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setOutcome(result.state.decisions[result.state.decisions.length - 1] ?? null);
  };

  const finish = () => {
    close();
    setOutcome(null);
    if (state.status !== 'active') router.replace('/mission/report');
  };

  const showSheet = visible && (!!def || !!outcome);

  return (
    <Modal visible={showSheet} transparent animationType="fade" onRequestClose={outcome ? finish : close}>
      <View style={{ flex: 1, backgroundColor: 'rgba(2, 4, 10, 0.78)', justifyContent: 'flex-end' }}>
        <View
          className="rounded-t-[28px] border border-line-strong bg-abyss"
          style={{ maxHeight: '92%', paddingBottom: insets.bottom + 16, paddingLeft: insets.left, paddingRight: insets.right }}
        >
          {outcome ? (
            <View className="px-6 pt-7" style={{ gap: 16 }} accessibilityViewIsModal>
              <CircleCheck size={34} color={toneColor[RATING[outcome.rating].tone].fg} />
              <AppText variant="title" accessibilityRole="header">
                Decision logged
              </AppText>
              <Badge label={RATING[outcome.rating].label} tone={RATING[outcome.rating].tone} />
              <AppText variant="lead">{outcome.outcome}</AppText>
              <Button label="Return to mission control" onPress={finish} />
            </View>
          ) : def && active ? (
            <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }} accessibilityViewIsModal>
              <View className="flex-row items-start justify-between">
                <View
                  className="items-center justify-center rounded-control"
                  style={{ width: 52, height: 52, backgroundColor: def.severity === 'critical' ? palette.redDim : palette.amberDim }}
                >
                  <Icon size={26} color={def.severity === 'critical' ? palette.red : palette.amber} />
                </View>
                <Pressable
                  onPress={close}
                  accessibilityRole="button"
                  accessibilityLabel="Decide later"
                  accessibilityHint="Closes this sheet. You must decide before ending the day."
                  hitSlop={10}
                  className="flex-row items-center"
                  style={{ gap: 4, minHeight: 44 }}
                >
                  <AppText variant="caption" color={palette.textSoft}>
                    Decide later
                  </AppText>
                  <X size={18} color={palette.textSoft} />
                </Pressable>
              </View>

              <View style={{ gap: 6 }}>
                <Badge
                  label={`${def.severity === 'critical' ? 'Critical' : 'Warning'}, day ${active.dayTriggered}`}
                  tone={def.severity === 'critical' ? 'critical' : 'caution'}
                />
                <AppText variant="title" accessibilityRole="header">
                  {def.title}
                </AppText>
                <AppText variant="lead">{def.summary}</AppText>
                {def.targetsBuilding ? (
                  <AppText variant="caption" color={palette.amber}>
                    Affected system: {active.targetBuilding ? BUILDINGS[active.targetBuilding].name : 'Habitat module'}
                  </AppText>
                ) : null}
              </View>

              <Pressable
                onPress={() => setShowScience((v) => !v)}
                accessibilityRole="button"
                accessibilityState={{ expanded: showScience }}
                className="rounded-card border border-line px-4 py-3"
                style={{ backgroundColor: palette.violetDim }}
              >
                <AppText variant="caption" weight="semibold" color={palette.violet}>
                  {showScience ? 'Hide the science' : 'Why does this happen?'}
                </AppText>
                {showScience ? (
                  <AppText variant="caption" color={palette.textSoft} className="mt-1.5">
                    {def.science}
                  </AppText>
                ) : null}
              </Pressable>

              <AppText variant="heading" accessibilityRole="header">
                Your decision
              </AppText>
              {def.choices.map((choice) => {
                const status = getChoiceStatus(state, choice);
                const isSelected = selected === choice.id;
                return (
                  <Pressable
                    key={choice.id}
                    onPress={() => status.available && setSelected(choice.id)}
                    disabled={!status.available}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected, disabled: !status.available }}
                    accessibilityLabel={`${choice.label}. ${choice.description}${status.available ? '' : `. Unavailable: ${status.reason}`}`}
                    style={({ pressed }) => ({ opacity: status.available ? (pressed ? 0.85 : 1) : 0.45 })}
                  >
                    <View
                      className="rounded-card px-4 py-3.5"
                      style={{
                        borderWidth: isSelected ? 2 : 1,
                        borderColor: isSelected ? palette.cyan : palette.line,
                        backgroundColor: isSelected ? palette.cyanDim : palette.glass,
                        gap: 6,
                      }}
                    >
                      <AppText variant="body" weight="semibold" color={palette.text}>
                        {choice.label}
                      </AppText>
                      <AppText variant="caption">{choice.description}</AppText>
                      <CostChips cost={status.cost} available={state.resources} emptyLabel="No up-front cost" />
                      {!status.available ? (
                        <AppText variant="micro" color={palette.amber}>
                          {status.reason}
                        </AppText>
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
              {error ? (
                <AppText variant="caption" color={palette.red}>
                  {error}
                </AppText>
              ) : null}
              <Button label="Confirm decision" onPress={confirm} disabled={!selected} />
            </ScrollView>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}
