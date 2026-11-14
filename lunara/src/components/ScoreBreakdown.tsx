import { View } from 'react-native';
import type { ScoreBreakdown as Score } from '@/game/scoring';
import { palette } from '@/constants/theme';
import { AppText } from './ui/AppText';
import { ProgressIndicator } from './ProgressIndicator';

/** Every point in the score, with the arithmetic that produced it. */
export function ScoreBreakdown({ score, projected }: { score: Score; projected?: boolean }) {
  return (
    <View className="rounded-panel border border-line bg-glass p-5" style={{ gap: 14 }}>
      {score.components.map((c) => (
        <View key={c.id} accessible accessibilityLabel={`${c.label}: ${c.points} of ${c.max} points. ${c.explanation}`}>
          <View className="mb-1.5 flex-row justify-between">
            <AppText variant="caption" weight="semibold" color={palette.text}>
              {c.label}
            </AppText>
            <AppText variant="caption" numeric>
              {c.points} / {c.max}
            </AppText>
          </View>
          <ProgressIndicator value={c.points / c.max} tone="science" height={5} />
          <AppText variant="micro" className="mt-1">
            {c.explanation}
          </AppText>
        </View>
      ))}
      <View className="flex-row items-center justify-between pt-3" style={{ borderTopWidth: 1, borderTopColor: palette.line }}>
        <AppText variant="body" weight="semibold" color={palette.text}>
          {projected ? 'Score if the mission ended now' : 'Final score'}
        </AppText>
        <AppText variant="heading" numeric color={palette.violet}>
          {score.total} / 100
        </AppText>
      </View>
      {score.cap ? <AppText variant="micro">{score.cap.reason}</AppText> : null}
      <AppText variant="micro">90–100 Legendary Commander, 75–89 Excellent Mission, 50–74 Mission Survived, below 50 Mission Failed.</AppText>
    </View>
  );
}
