import { View } from 'react-native';
import { Info } from 'lucide-react-native';
import { palette } from '@/constants/theme';
import { AppText } from './ui/AppText';

export function SimulationNotice({ text }: { text?: string }) {
  return (
    <View className="flex-row rounded-card border border-line px-4 py-3" style={{ gap: 10 }}>
      <Info size={16} color={palette.textMuted} style={{ marginTop: 2 }} />
      <AppText variant="caption" style={{ flex: 1 }}>
        {text ??
          'Simplified educational simulation. Numbers are tuned for gameplay and are not NASA engineering specifications.'}
      </AppText>
    </View>
  );
}
