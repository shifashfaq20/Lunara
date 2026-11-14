import { View } from 'react-native';
import { House } from 'lucide-react-native';
import { goHome } from '@/utils/navigation';
import { Screen } from '@/components/ui/Screen';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';

export default function NotFoundScreen() {
  return (
    <Screen>
      <View style={{ gap: 14, marginTop: 80 }}>
        <AppText variant="title">Signal lost</AppText>
        <AppText variant="body">This screen does not exist. Head back to the welcome screen.</AppText>
        <Button label="Back to the welcome screen" icon={House} onPress={goHome} />
      </View>
    </Screen>
  );
}
