import { View } from 'react-native';
import { CircleCheck, CircleX, Clock, TriangleAlert } from 'lucide-react-native';
import type { MissionConfig, ObjectiveProgress, ObjectiveStatus } from '@/types/game';
import { objectiveDefinition } from '@/data/objectives';
import { palette, toneColor, type Tone } from '@/constants/theme';
import { AppText } from './ui/AppText';
import { ProgressIndicator } from './ProgressIndicator';

const STATUS: Record<ObjectiveStatus, { label: string; tone: Tone; icon: typeof Clock }> = {
  inProgress: { label: 'In progress', tone: 'nominal', icon: Clock },
  atRisk: { label: 'At risk', tone: 'caution', icon: TriangleAlert },
  completed: { label: 'Complete', tone: 'nominal', icon: CircleCheck },
  failed: { label: 'Failed', tone: 'critical', icon: CircleX },
};

export function ObjectiveItem({ objective, config, compact }: { objective: ObjectiveProgress; config: MissionConfig; compact?: boolean }) {
  const def = objectiveDefinition(objective.id);
  const s = STATUS[objective.status];
  const Icon = s.icon;
  const color = toneColor[s.tone].fg;
  return (
    <View
      accessible
      accessibilityLabel={`${def.title(config)}. ${s.label}. ${objective.detail}`}
      className="flex-row rounded-card border border-line bg-glass px-4 py-3.5"
      style={{ gap: 12 }}
    >
      <Icon size={20} color={color} style={{ marginTop: 1 }} />
      <View style={{ flex: 1 }}>
        <View className="flex-row items-start justify-between" style={{ gap: 8 }}>
          <AppText variant="body" weight="semibold" color={palette.text} style={{ flex: 1 }}>
            {def.title(config)}
          </AppText>
          <AppText variant="micro" weight="semibold" color={color}>
            {s.label}
          </AppText>
        </View>
        {!compact ? <AppText variant="caption" className="mt-0.5">{def.description(config)}</AppText> : null}
        <View className="mt-2.5">
          <ProgressIndicator value={objective.progress} tone={objective.status === 'failed' ? 'critical' : s.tone} height={5} />
        </View>
        <AppText variant="micro" className="mt-1.5" numeric>
          {objective.detail}
        </AppText>
      </View>
    </View>
  );
}
