import { View } from 'react-native';
import type { CrewMember } from '@/types/game';
import { ROLES } from '@/data/crew';
import { crewCondition } from '@/game/crewManager';
import { statTone } from '@/game/selectors';
import { palette, toneColor, type Tone } from '@/constants/theme';
import { AppText } from './ui/AppText';
import { Badge } from './ui/Badge';
import { ProgressIndicator } from './ProgressIndicator';

const CONDITION: Record<ReturnType<typeof crewCondition>, { label: string; tone: Tone }> = {
  healthy: { label: 'Healthy', tone: 'nominal' },
  strained: { label: 'Strained', tone: 'caution' },
  injured: { label: 'Injured', tone: 'caution' },
  critical: { label: 'Critical', tone: 'critical' },
  lost: { label: 'Lost', tone: 'neutral' },
};

const initials = (name: string) =>
  name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2);

export function CrewCard({ member }: { member: CrewMember }) {
  const condition = CONDITION[crewCondition(member)];
  const role = ROLES[member.role];
  const ring = toneColor[condition.tone].fg;

  return (
    <View
      accessible
      accessibilityLabel={
        member.alive
          ? `${member.name}, ${role.title}. Health ${Math.round(member.health)}, morale ${Math.round(member.morale)}. ${condition.label}.`
          : `${member.name}, ${role.title}. Lost on day ${member.dayLost}.`
      }
      className="flex-row items-center rounded-card border border-line bg-glass px-4 py-3"
      style={{ gap: 12, opacity: member.alive ? 1 : 0.5 }}
    >
      <View
        className="items-center justify-center rounded-chip"
        style={{ width: 42, height: 42, borderWidth: 2, borderColor: ring, backgroundColor: palette.hull }}
      >
        <AppText variant="caption" weight="bold" color={palette.text}>
          {initials(member.name)}
        </AppText>
      </View>
      <View style={{ flex: 1 }}>
        <View className="flex-row items-center justify-between" style={{ gap: 8 }}>
          <View style={{ flex: 1 }}>
            <AppText variant="body" weight="semibold" color={palette.text} numberOfLines={1}>
              {member.name}
            </AppText>
            <AppText variant="micro">{role.title}</AppText>
          </View>
          <Badge label={condition.label} tone={condition.tone} />
        </View>
        {member.alive ? (
          <View className="mt-2 flex-row" style={{ gap: 12 }}>
            <View style={{ flex: 1 }}>
              <AppText variant="micro" numeric>
                Health {Math.round(member.health)}
              </AppText>
              <ProgressIndicator value={member.health / 100} tone={statTone(member.health)} height={4} label="Health" />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="micro" numeric>
                Morale {Math.round(member.morale)}
              </AppText>
              <ProgressIndicator value={member.morale / 100} tone={statTone(member.morale)} height={4} label="Morale" />
            </View>
          </View>
        ) : (
          <AppText variant="micro" className="mt-1">
            Lost on day {member.dayLost}
          </AppText>
        )}
      </View>
    </View>
  );
}
