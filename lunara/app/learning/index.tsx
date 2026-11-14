import { Linking, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { ChevronRight, ExternalLink } from 'lucide-react-native';
import { LEARNING_TOPICS } from '@/data/learning';
import { palette } from '@/constants/theme';
import { Screen } from '@/components/ui/Screen';
import { TopBar } from '@/components/ui/TopBar';
import { AppText } from '@/components/ui/AppText';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SpaceWeatherPanel } from '@/components/nasa/SpaceWeatherPanel';
import { NasaImageGallery } from '@/components/nasa/NasaImageGallery';

export default function LearningCenterScreen() {
  return (
    <Screen>
      <TopBar title="Learning Center" />
      <AppText variant="title" accessibilityRole="header">
        How people survive on the Moon
      </AppText>
      <AppText variant="body" className="mt-1">
        The science behind every system in LUNARA, plus live data from NASA.
      </AppText>

      <View className="mt-6">
        <SpaceWeatherPanel />
      </View>

      <SectionHeader title="Topics" />
      <View style={{ gap: 10 }}>
        {LEARNING_TOPICS.map((t) => (
          <Pressable
            key={t.id}
            onPress={() => router.push({ pathname: '/learning/[topic]', params: { topic: t.id } })}
            accessibilityRole="button"
            accessibilityLabel={`${t.title}. ${t.summary}`}
            style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
          >
            <View className="flex-row items-center rounded-card border border-line bg-glass px-4 py-3.5" style={{ gap: 12 }}>
              <View style={{ flex: 1 }}>
                <AppText variant="body" weight="semibold" color={palette.text}>
                  {t.title}
                </AppText>
                <AppText variant="caption">{t.summary}</AppText>
              </View>
              <ChevronRight size={18} color={palette.textMuted} />
            </View>
          </Pressable>
        ))}
      </View>

      <View className="mt-7">
        <NasaImageGallery />
      </View>

      <Pressable
        onPress={() => Linking.openURL('https://trek.nasa.gov/moon/')}
        accessibilityRole="link"
        accessibilityLabel="Explore the real lunar surface in NASA Moon Trek. Opens your browser."
        className="mt-6 flex-row items-center rounded-panel border border-line-strong px-5 py-4"
        style={{ gap: 14, backgroundColor: palette.violetDim }}
      >
        <View style={{ flex: 1 }}>
          <AppText variant="body" weight="semibold" color={palette.text}>
            Explore the real Moon in NASA Moon Trek
          </AppText>
          <AppText variant="caption">Mapped terrain, landing sites and the south polar region, in your browser.</AppText>
        </View>
        <ExternalLink size={18} color={palette.violet} />
      </Pressable>
    </Screen>
  );
}
