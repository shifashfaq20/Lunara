import { View } from 'react-native';
import { BUILDING_ORDER } from '@/data/buildings';
import { activeConstructionCount, getBuildingEffects, getPowerCapacity, maxConcurrentConstruction } from '@/game/buildingManager';
import { palette } from '@/constants/theme';
import { useGame } from '@/state/GameProvider';
import { Screen } from '@/components/ui/Screen';
import { AppText } from '@/components/ui/AppText';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { BuildingCard } from '@/components/BuildingCard';
import { SimulationNotice } from '@/components/SimulationNotice';
import { useTabBarSpace } from '@/components/MissionTabBar';

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ width: '50%', paddingVertical: 6 }} accessible accessibilityLabel={`${label}: ${value}`}>
      <AppText variant="micro">{label}</AppText>
      <AppText variant="body" weight="semibold" color={palette.text} numeric>
        {value}
      </AppText>
    </View>
  );
}

export default function BaseScreen() {
  const { state } = useGame();
  const tabSpace = useTabBarSpace();
  if (!state) return null;

  const fx = getBuildingEffects(state);
  const nextCargo = state.deliveries.reduce<number | null>((min, d) => (min === null || d.arrivalDay < min ? d.arrivalDay : min), null);
  const built = BUILDING_ORDER.filter((id) => state.buildings[id].level > 0).length;

  return (
    <Screen bottomSpace={tabSpace}>
      <AppText variant="title" accessibilityRole="header">
        Base construction
      </AppText>
      <AppText variant="body" className="mt-1">
        Construction costs are paid up front. Buildings start working the day after they are finished.
      </AppText>

      <View className="mt-5 flex-row flex-wrap rounded-panel border border-line bg-glass px-5 py-3">
        <Fact label="Construction crews busy" value={`${activeConstructionCount(state)} of ${maxConcurrentConstruction(state)}`} />
        <Fact label="Buildings online" value={`${built} of ${BUILDING_ORDER.length}`} />
        <Fact label="Materials" value={`${Math.floor(state.resources.materials)} kg`} />
        <Fact label="Next cargo lander" value={nextCargo ? `Day ${nextCargo}` : 'None scheduled'} />
        <Fact label="Solar at full sun" value={`${Math.round(fx.solarOutput)} kWh/day`} />
        <Fact label="Battery capacity" value={`${getPowerCapacity(state)} kWh`} />
      </View>

      <SectionHeader title="Structures" detail="Each crew of two can work on one project at a time." />
      <View style={{ gap: 14 }}>
        {BUILDING_ORDER.map((id) => (
          <BuildingCard key={id} id={id} state={state} />
        ))}
      </View>

      <View className="mt-6">
        <SimulationNotice />
      </View>
    </Screen>
  );
}
