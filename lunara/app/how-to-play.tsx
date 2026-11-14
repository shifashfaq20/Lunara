import { View } from 'react-native';
import { router } from 'expo-router';
import { Rocket } from 'lucide-react-native';
import { palette } from '@/constants/theme';
import { Screen } from '@/components/ui/Screen';
import { TopBar } from '@/components/ui/TopBar';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SimulationNotice } from '@/components/SimulationNotice';

const STEPS = [
  {
    title: 'Plan the mission',
    body: 'Pick a difficulty, crew size and mission length. Each crew member brings a skill, such as faster building or better healing.',
  },
  {
    title: 'Secure life support first',
    body: 'Your habitat only makes part of the oxygen the crew breathes. Build the Oxygen Generator and Water Recycler early, then a Solar Farm to power them.',
  },
  {
    title: 'Watch the sunlight',
    body: 'The Moon disc in mission control shows today’s sunlight. When the outlook turns amber, solar output drops. Battery Storage carries you through.',
  },
  {
    title: 'End the day',
    body: 'Each tap of End Day runs the simulation: the crew eats, breathes and drinks, buildings produce, construction advances and new events may appear.',
  },
  {
    title: 'Handle emergencies',
    body: 'Solar storms, leaks and breakdowns need a decision before the day can end. Every option has a cost; the best one depends on what you have built.',
  },
  {
    title: 'Finish strong',
    body: 'Survive to the final day with your crew healthy and your objectives complete. The mission report explains every point of your score.',
  },
];

const TIPS = [
  'The yesterday balance on the dashboard shows exactly what was made and used. Use it to spot slow leaks.',
  'When power runs short, life support is powered first. The greenhouse and lab lose power before oxygen does.',
  'Science push mode earns research faster but burns fuel and raises radiation exposure.',
  'Keep at least 20 kg of fuel. It is your crew’s ride home and your only way to evacuate early.',
  'Cargo landers arrive every 10 days, but only if the link to Earth is working.',
];

export default function HowToPlayScreen() {
  return (
    <Screen>
      <TopBar title="How to play" />
      <AppText variant="title" accessibilityRole="header">
        How to command the outpost
      </AppText>
      <AppText variant="body" className="mt-1">
        One turn is one Earth day on the Moon.
      </AppText>

      <View className="mt-6" style={{ gap: 12 }}>
        {STEPS.map((s, i) => (
          <View key={s.title} className="flex-row rounded-card border border-line bg-glass px-4 py-4" style={{ gap: 14 }}>
            <View
              className="items-center justify-center rounded-chip"
              style={{ width: 30, height: 30, borderWidth: 1, borderColor: palette.cyan }}
            >
              <AppText variant="caption" weight="bold" color={palette.cyan} numeric>
                {i + 1}
              </AppText>
            </View>
            <View style={{ flex: 1, gap: 3 }}>
              <AppText variant="body" weight="semibold" color={palette.text}>
                {s.title}
              </AppText>
              <AppText variant="caption">{s.body}</AppText>
            </View>
          </View>
        ))}
      </View>

      <SectionHeader title="Commander tips" />
      <View className="rounded-panel border border-line bg-glass-deep px-5 py-3">
        {TIPS.map((tip, i) => (
          <AppText key={i} variant="caption" color={palette.textSoft} className="py-2" style={{ borderTopWidth: i === 0 ? 0 : 1, borderTopColor: palette.line }}>
            {tip}
          </AppText>
        ))}
      </View>

      <View className="mt-7" style={{ gap: 12 }}>
        <SimulationNotice />
        <Button label="Plan a mission" icon={Rocket} onPress={() => router.replace('/mission/select')} />
      </View>
    </Screen>
  );
}
