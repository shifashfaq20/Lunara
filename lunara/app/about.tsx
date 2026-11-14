import { Linking, Pressable, View } from 'react-native';
import Constants from 'expo-constants';
import { ExternalLink } from 'lucide-react-native';
import { palette } from '@/constants/theme';
import { Screen } from '@/components/ui/Screen';
import { TopBar } from '@/components/ui/TopBar';
import { AppText } from '@/components/ui/AppText';
import { SectionHeader } from '@/components/ui/SectionHeader';

const LINKS = [
  { label: 'NASA Open APIs', url: 'https://api.nasa.gov/' },
  { label: 'NASA DONKI space weather database', url: 'https://ccmc.gsfc.nasa.gov/DONKI/' },
  { label: 'NASA Image and Video Library', url: 'https://images.nasa.gov/' },
  { label: 'NASA Moon Trek', url: 'https://trek.nasa.gov/moon/' },
];

export default function AboutScreen() {
  const version = Constants.expoConfig?.version ?? '1.0.0';
  return (
    <Screen>
      <TopBar title="About" />
      <AppText variant="title" accessibilityRole="header">
        About LUNARA
      </AppText>
      <AppText variant="body" className="mt-2" style={{ lineHeight: 24 }}>
        LUNARA is a strategy game for young space explorers. You run a small outpost near the Moon’s south pole and learn why
        oxygen, water, power and shielding matter so much to real crews.
      </AppText>

      <SectionHeader title="What is real and what is simulated" />
      <View className="rounded-panel border border-line bg-glass p-5" style={{ gap: 10 }}>
        <AppText variant="body">
          The game’s resources, building outputs, emergencies and radiation index are a simplified educational simulation. They
          are tuned for gameplay and are not NASA engineering specifications or real astronaut measurements.
        </AppText>
        <AppText variant="body">
          The Learning Center shows real NASA data: recent space-weather events from the DONKI database and photographs from the
          NASA Image and Video Library. That data is labelled with its source and is never mixed into the game’s numbers.
        </AppText>
      </View>

      <SectionHeader title="Your data" />
      <AppText variant="body">
        Mission progress is saved only on this device. LUNARA has no accounts, no tracking and no advertising. The only network
        requests are to NASA’s public servers when you open the Learning Center.
      </AppText>

      <SectionHeader title="Data sources" />
      <View style={{ gap: 8 }}>
        {LINKS.map((l) => (
          <Pressable
            key={l.url}
            onPress={() => Linking.openURL(l.url)}
            accessibilityRole="link"
            accessibilityLabel={`${l.label}. Opens your browser.`}
            className="flex-row items-center rounded-card border border-line px-4 py-3"
            style={{ gap: 10, minHeight: 48 }}
          >
            <AppText variant="caption" color={palette.text} style={{ flex: 1 }}>
              {l.label}
            </AppText>
            <ExternalLink size={16} color={palette.textMuted} />
          </Pressable>
        ))}
      </View>

      <AppText variant="micro" className="mt-6">
        NASA data and imagery are used under NASA’s media guidelines. LUNARA is not affiliated with or endorsed by NASA. Version{' '}
        {version}.
      </AppText>
    </Screen>
  );
}
