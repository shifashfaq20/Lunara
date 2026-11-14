import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { ShieldCheck, Siren } from 'lucide-react-native';
import { EMERGENCIES, EMERGENCY_ORDER } from '@/data/emergencies';
import { BUILDINGS } from '@/data/buildings';
import { RESOURCE_META } from '@/data/resources';
import { DIFFICULTY_SETTINGS } from '@/game/config';
import { FIRST_EMERGENCY_DAY } from '@/game/eventManager';
import { isModifierActive } from '@/game/stateUtils';
import type { ResourceKey } from '@/types/game';
import { palette } from '@/constants/theme';
import { useGame } from '@/state/GameProvider';
import { useEmergencyModal } from '@/state/EmergencyModalContext';
import { Screen } from '@/components/ui/Screen';
import { AppText } from '@/components/ui/AppText';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { EMERGENCY_ICONS } from '@/components/icons';
import { useTabBarSpace } from '@/components/MissionTabBar';

const RATING = {
  optimal: { label: 'Optimal', tone: 'nominal' as const },
  acceptable: { label: 'Acceptable', tone: 'caution' as const },
  risky: { label: 'Risky', tone: 'critical' as const },
};

export default function EmergencyCenterScreen() {
  const { state } = useGame();
  const modal = useEmergencyModal();
  const tabSpace = useTabBarSpace();
  const [openGuide, setOpenGuide] = useState<string | null>(null);
  if (!state) return null;

  const active = state.activeEmergencies[0];
  const def = active ? EMERGENCIES[active.emergencyId] : null;
  const effects = state.modifiers.filter((m) => isModifierActive(m, state.day));
  const chance = Math.round(DIFFICULTY_SETTINGS[state.config.difficulty].emergencyChance * 100);

  return (
    <Screen bottomSpace={tabSpace}>
      <AppText variant="title" accessibilityRole="header">
        Emergency center
      </AppText>
      <AppText variant="body" className="mt-1">
        From day {FIRST_EMERGENCY_DAY}, each new day has a {chance}% chance of an emergency on this difficulty.
      </AppText>

      <SectionHeader title="Active emergency" />
      {active && def ? (
        <View className="rounded-panel border border-red p-5" style={{ gap: 10, backgroundColor: palette.redDim }}>
          <Badge label={def.severity === 'critical' ? 'Critical' : 'Warning'} tone={def.severity === 'critical' ? 'critical' : 'caution'} />
          <AppText variant="heading">{def.title}</AppText>
          <AppText variant="body">{def.summary}</AppText>
          {active.targetBuilding ? (
            <AppText variant="caption" color={palette.amber}>
              Affected system: {BUILDINGS[active.targetBuilding].name}
            </AppText>
          ) : null}
          <Button label="Choose a response" icon={Siren} onPress={modal.open} />
        </View>
      ) : (
        <View className="flex-row items-center rounded-panel border border-line bg-glass p-5" style={{ gap: 14 }}>
          <ShieldCheck size={26} color={palette.cyan} />
          <View style={{ flex: 1 }}>
            <AppText variant="body" weight="semibold" color={palette.text}>
              No active emergencies
            </AppText>
            <AppText variant="caption">
              {state.status === 'active' ? 'Systems nominal. Keep reserves up so the next one hurts less.' : 'The mission has ended.'}
            </AppText>
          </View>
        </View>
      )}

      <SectionHeader title="Effects in progress" detail="Temporary changes from emergencies and decisions" />
      {effects.length || state.deliveries.length ? (
        <View className="rounded-panel border border-line bg-glass-deep px-4 py-2">
          {effects.map((m, i) => {
            const left = m.untilDay - state.day;
            return (
              <View key={m.id} className="flex-row justify-between py-2.5" style={{ borderTopWidth: i === 0 ? 0 : 1, borderTopColor: palette.line }}>
                <AppText variant="caption" color={palette.text}>
                  {m.label}
                </AppText>
                <AppText variant="caption" numeric>
                  {left <= 1 ? 'Today' : `${left} days`}
                </AppText>
              </View>
            );
          })}
          {state.deliveries.map((d, i) => (
            <View
              key={d.id}
              className="py-2.5"
              style={{ borderTopWidth: i === 0 && effects.length === 0 ? 0 : 1, borderTopColor: palette.line }}
            >
              <View className="flex-row justify-between">
                <AppText variant="caption" color={palette.text}>
                  {d.label}
                </AppText>
                <AppText variant="caption" numeric>
                  Day {d.arrivalDay}
                </AppText>
              </View>
              <AppText variant="micro">
                {(Object.entries(d.resources) as [ResourceKey, number][])
                  .map(([k, v]) => `${v} ${RESOURCE_META[k].unit} ${RESOURCE_META[k].label.toLowerCase()}`)
                  .join(', ')}
              </AppText>
            </View>
          ))}
        </View>
      ) : (
        <AppText variant="caption">Nothing in progress.</AppText>
      )}

      <SectionHeader title="Decision history" detail={`${state.decisions.length} decision${state.decisions.length === 1 ? '' : 's'} logged`} />
      {state.decisions.length ? (
        <View style={{ gap: 10 }}>
          {[...state.decisions].reverse().map((d, i) => {
            const Icon = EMERGENCY_ICONS[d.emergencyId];
            return (
              <View key={`${d.day}-${i}`} className="rounded-card border border-line bg-glass px-4 py-3.5" style={{ gap: 6 }}>
                <View className="flex-row items-center justify-between" style={{ gap: 8 }}>
                  <View className="flex-row items-center" style={{ gap: 8, flex: 1 }}>
                    <Icon size={16} color={palette.textSoft} />
                    <AppText variant="caption" weight="semibold" color={palette.text} style={{ flex: 1 }} numberOfLines={1}>
                      Day {d.day}: {d.emergencyTitle}
                    </AppText>
                  </View>
                  <Badge label={RATING[d.rating].label} tone={RATING[d.rating].tone} />
                </View>
                <AppText variant="caption" color={palette.textSoft}>
                  {d.choiceLabel}
                </AppText>
                <AppText variant="micro">{d.outcome}</AppText>
              </View>
            );
          })}
        </View>
      ) : (
        <AppText variant="caption">No decisions yet. Your choices and their ratings will be recorded here.</AppText>
      )}

      <SectionHeader title="Field guide" detail="The real science behind each emergency" />
      <View style={{ gap: 8 }}>
        {EMERGENCY_ORDER.map((id) => {
          const e = EMERGENCIES[id];
          const Icon = EMERGENCY_ICONS[id];
          const open = openGuide === id;
          return (
            <Pressable
              key={id}
              onPress={() => setOpenGuide(open ? null : id)}
              accessibilityRole="button"
              accessibilityState={{ expanded: open }}
              className="rounded-card border border-line px-4 py-3"
            >
              <View className="flex-row items-center" style={{ gap: 10, minHeight: 24 }}>
                <Icon size={16} color={palette.violet} />
                <AppText variant="caption" weight="semibold" color={palette.text} style={{ flex: 1 }}>
                  {e.title}
                </AppText>
              </View>
              {open ? (
                <AppText variant="caption" className="mt-2">
                  {e.science}
                </AppText>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}
