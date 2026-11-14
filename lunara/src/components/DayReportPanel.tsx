import { View } from 'react-native';
import type { DayReport, ResourceKey } from '@/types/game';
import { RESOURCE_META } from '@/data/resources';
import { palette } from '@/constants/theme';
import { AppText } from './ui/AppText';

const ROWS: ResourceKey[] = ['oxygen', 'water', 'food', 'power'];

const fmt = (n: number) => (Math.abs(n) < 10 ? n.toFixed(1) : Math.round(n).toString());

/** Yesterday's balance sheet: what was made, used and the net change. */
export function DayReportPanel({ report }: { report: DayReport }) {
  return (
    <View className="rounded-panel border border-line bg-glass p-5">
      <View className="flex-row pb-2" style={{ borderBottomWidth: 1, borderBottomColor: palette.line }}>
        <AppText variant="micro" style={{ flex: 1.4 }}>
          Resource
        </AppText>
        <AppText variant="micro" style={{ flex: 1, textAlign: 'right' }}>
          Made
        </AppText>
        <AppText variant="micro" style={{ flex: 1, textAlign: 'right' }}>
          Used
        </AppText>
        <AppText variant="micro" style={{ flex: 1, textAlign: 'right' }}>
          Net
        </AppText>
      </View>
      {ROWS.map((key) => {
        const net = report.net[key];
        const color = net < 0 ? palette.amber : net > 0 ? palette.cyan : palette.textSoft;
        return (
          <View key={key} className="flex-row py-2" accessible accessibilityLabel={`${RESOURCE_META[key].label}: made ${fmt(report.produced[key])}, used ${fmt(report.consumed[key])}, net ${fmt(net)} ${RESOURCE_META[key].unit}`}>
            <AppText variant="caption" color={palette.textSoft} style={{ flex: 1.4 }}>
              {RESOURCE_META[key].label} ({RESOURCE_META[key].unit})
            </AppText>
            <AppText variant="caption" numeric style={{ flex: 1, textAlign: 'right' }}>
              {fmt(report.produced[key])}
            </AppText>
            <AppText variant="caption" numeric style={{ flex: 1, textAlign: 'right' }}>
              {fmt(report.consumed[key])}
            </AppText>
            <AppText variant="caption" weight="semibold" numeric color={color} style={{ flex: 1, textAlign: 'right' }}>
              {net > 0 ? '+' : ''}
              {fmt(net)}
            </AppText>
          </View>
        );
      })}
      <View className="mt-2 pt-3" style={{ borderTopWidth: 1, borderTopColor: palette.line, gap: 4 }}>
        <AppText variant="caption" numeric>
          Life support got {Math.round(report.criticalPower * 100)}% of the power it needed; greenhouse and lab got{' '}
          {Math.round(report.auxiliaryPower * 100)}%.
        </AppText>
        <AppText variant="caption" numeric>
          Sunlight {Math.round(report.sunlight * 100)}%. Radiation index {report.radiationIndex}, crew exposure +
          {report.dailyExposure.toFixed(1)} points (simulated). Research +{report.researchGained.toFixed(1)}.
        </AppText>
      </View>
    </View>
  );
}
