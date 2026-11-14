import { Linking, Pressable, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { ExternalLink } from 'lucide-react-native';
import { learningTopic } from '@/data/learning';
import { palette } from '@/constants/theme';
import { Screen } from '@/components/ui/Screen';
import { TopBar } from '@/components/ui/TopBar';
import { AppText } from '@/components/ui/AppText';
import { SectionHeader } from '@/components/ui/SectionHeader';

export default function LearningTopicScreen() {
  const { topic } = useLocalSearchParams<{ topic: string }>();
  const t = typeof topic === 'string' ? learningTopic(topic) : undefined;

  if (!t) {
    return (
      <Screen>
        <TopBar title="Learning Center" />
        <AppText variant="title">Topic not found</AppText>
        <AppText variant="body" className="mt-2">
          Go back and choose a topic from the list.
        </AppText>
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar title="Learning Center" />
      <AppText variant="display" accessibilityRole="header">
        {t.title}
      </AppText>
      <AppText variant="lead" className="mt-2">
        {t.summary}
      </AppText>

      <View className="mt-4" style={{ gap: 22 }}>
        {t.sections.map((s) => (
          <View key={s.heading} style={{ gap: 6 }}>
            <AppText variant="heading" accessibilityRole="header">
              {s.heading}
            </AppText>
            <AppText variant="body" style={{ lineHeight: 24 }}>
              {s.body}
            </AppText>
          </View>
        ))}
      </View>

      <View className="mt-8 rounded-panel border p-5" style={{ borderColor: palette.violet, backgroundColor: palette.violetDim, gap: 6 }}>
        <AppText variant="body" weight="semibold" color={palette.violet}>
          How LUNARA simplifies this
        </AppText>
        <AppText variant="body">{t.inGame}</AppText>
      </View>

      <SectionHeader title="Sources" />
      <View style={{ gap: 8 }}>
        {t.sources.map((src) =>
          src.url ? (
            <Pressable
              key={src.label}
              onPress={() => Linking.openURL(src.url!)}
              accessibilityRole="link"
              accessibilityLabel={`${src.label}. Opens your browser.`}
              className="flex-row items-center rounded-card border border-line px-4 py-3"
              style={{ gap: 10, minHeight: 48 }}
            >
              <AppText variant="caption" color={palette.text} style={{ flex: 1 }}>
                {src.label}
              </AppText>
              <ExternalLink size={16} color={palette.textMuted} />
            </Pressable>
          ) : (
            <View key={src.label} className="rounded-card border border-line px-4 py-3">
              <AppText variant="caption">{src.label}</AppText>
            </View>
          ),
        )}
      </View>
    </Screen>
  );
}
