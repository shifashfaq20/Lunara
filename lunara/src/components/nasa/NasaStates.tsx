import { ActivityIndicator, View } from 'react-native';
import { CloudOff, RefreshCw } from 'lucide-react-native';
import { palette } from '@/constants/theme';
import { AppText } from '../ui/AppText';
import { Button } from '../ui/Button';

export function NasaLoading({ label }: { label: string }) {
  return (
    <View className="flex-row items-center py-6" style={{ gap: 12 }} accessibilityLiveRegion="polite">
      <ActivityIndicator color={palette.cyan} />
      <AppText variant="caption">{label}</AppText>
    </View>
  );
}

export function NasaError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View className="py-3" style={{ gap: 12 }} accessibilityLiveRegion="polite">
      <View className="flex-row" style={{ gap: 10 }}>
        <CloudOff size={18} color={palette.amber} />
        <AppText variant="caption" color={palette.textSoft} style={{ flex: 1 }}>
          {message} The game itself works offline; only this live NASA data needs a connection.
        </AppText>
      </View>
      <Button label="Try again" icon={RefreshCw} variant="secondary" compact onPress={onRetry} />
    </View>
  );
}

export function sourceLine(source: string, fetchedAt: string, fromCache: boolean) {
  const when = new Date(fetchedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  return `Source: ${source}. ${fromCache ? 'Saved copy from' : 'Retrieved'} ${when}.`;
}
