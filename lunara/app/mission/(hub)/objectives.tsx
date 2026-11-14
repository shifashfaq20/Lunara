import { View } from 'react-native';
import { computeScore } from '@/game/scoring';
import { useGame } from '@/state/GameProvider';
import { Screen } from '@/components/ui/Screen';
import { AppText } from '@/components/ui/AppText';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ObjectiveItem } from '@/components/ObjectiveItem';
import { ScoreBreakdown } from '@/components/ScoreBreakdown';
import { useTabBarSpace } from '@/components/MissionTabBar';

export default function ObjectivesScreen() {
  const { state } = useGame();
  const tabSpace = useTabBarSpace();
  if (!state) return null;

  const done = state.objectives.filter((o) => o.status === 'completed').length;
  const score = computeScore(state);

  return (
    <Screen bottomSpace={tabSpace}>
      <AppText variant="title" accessibilityRole="header">
        Mission objectives
      </AppText>
      <AppText variant="body" className="mt-1" numeric>
        {done} of {state.objectives.length} complete. Objectives are worth 25 of the 100 score points.
      </AppText>

      <View className="mt-5" style={{ gap: 10 }}>
        {state.objectives.map((o) => (
          <ObjectiveItem key={o.id} objective={o} config={state.config} />
        ))}
      </View>

      <SectionHeader
        title="How your score adds up"
        detail={state.status === 'active' ? 'A live projection, recalculated every day' : 'Final result'}
      />
      <ScoreBreakdown score={score} projected={state.status === 'active'} />
    </Screen>
  );
}
