import { useState } from 'react';
import { Pressable, View } from 'react-native';
import type { LogEntry, LogTone } from '@/types/game';
import { palette } from '@/constants/theme';
import { AppText } from './ui/AppText';

const DOT: Record<LogTone, string> = {
  info: palette.textMuted,
  success: palette.cyan,
  warning: palette.amber,
  critical: palette.red,
};

export function ActivityLog({ entries, initial = 8 }: { entries: LogEntry[]; initial?: number }) {
  const [expanded, setExpanded] = useState(false);
  const ordered = [...entries].reverse();
  const visible = expanded ? ordered : ordered.slice(0, initial);

  if (!entries.length) {
    return <AppText variant="caption">Nothing logged yet. Events appear here as the mission unfolds.</AppText>;
  }

  return (
    <View className="rounded-panel border border-line bg-glass-deep px-4 py-2">
      {visible.map((e, i) => (
        <View
          key={e.id}
          className="flex-row py-2.5"
          style={{ gap: 12, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: palette.line }}
          accessible
          accessibilityLabel={`Day ${e.day}. ${e.message}`}
        >
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: DOT[e.tone], marginTop: 6 }} />
          <View style={{ flex: 1 }}>
            <AppText variant="micro" numeric>
              Day {e.day}
            </AppText>
            <AppText variant="caption" color={e.tone === 'info' ? palette.textSoft : palette.text}>
              {e.message}
            </AppText>
          </View>
        </View>
      ))}
      {ordered.length > initial ? (
        <Pressable
          onPress={() => setExpanded((v) => !v)}
          accessibilityRole="button"
          style={{ minHeight: 44, justifyContent: 'center', borderTopWidth: 1, borderTopColor: palette.line }}
        >
          <AppText variant="caption" weight="semibold" color={palette.cyan}>
            {expanded ? 'Show recent entries only' : `Show all ${ordered.length} entries`}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}
