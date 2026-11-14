import { Alert, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Hammer, Wrench } from 'lucide-react-native';
import type { BuildingId, GameState } from '@/types/game';
import { BUILDINGS, MAX_BUILDING_LEVEL } from '@/data/buildings';
import { canConstruct, canRepair } from '@/game/buildingManager';
import { palette, toneColor } from '@/constants/theme';
import { useGame } from '@/state/GameProvider';
import { BUILDING_ICONS } from './icons';
import { AppText } from './ui/AppText';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { CostChips } from './CostChips';
import { ProgressIndicator } from './ProgressIndicator';

function formatOutput(id: BuildingId, value: number) {
  const def = BUILDINGS[id];
  if (def.outputUnit.startsWith('%')) return `${Math.round(value * 100)}${def.outputUnit}`;
  return `${value % 1 === 0 ? value : value.toFixed(1)} ${def.outputUnit}`;
}

function LevelPips({ level, building }: { level: number; building: boolean }) {
  return (
    <View className="flex-row" style={{ gap: 4 }} accessibilityLabel={`Level ${level} of ${MAX_BUILDING_LEVEL}`}>
      {Array.from({ length: MAX_BUILDING_LEVEL }, (_, i) => {
        const filled = i < level;
        const pending = building && i === level;
        return (
          <View
            key={i}
            style={{
              width: 16,
              height: 5,
              borderRadius: 3,
              backgroundColor: filled ? palette.cyan : pending ? palette.amber : 'rgba(148,176,255,0.18)',
            }}
          />
        );
      })}
    </View>
  );
}

export function BuildingCard({ id, state }: { id: BuildingId; state: GameState }) {
  const { construct, repair } = useGame();
  const def = BUILDINGS[id];
  const b = state.buildings[id];
  const Icon = BUILDING_ICONS[id];
  const current = b.level > 0 ? def.levels[b.level - 1] : null;
  const next = b.level < MAX_BUILDING_LEVEL ? def.levels[b.level] : null;
  const check = canConstruct(state, id);
  const repairCheck = canRepair(state, id);
  const conditionTone = b.condition >= 75 ? 'nominal' : b.condition >= 45 ? 'caution' : 'critical';

  const onBuild = () => {
    const result = construct(id);
    if (result && !result.ok) Alert.alert('Cannot build', result.error);
  };
  const onRepair = () => {
    const result = repair(id);
    if (result && !result.ok) Alert.alert('Cannot repair', result.error);
  };

  return (
    <View className="rounded-panel border border-line bg-glass p-5">
      <View className="flex-row items-start" style={{ gap: 14 }}>
        <View
          className="items-center justify-center rounded-control"
          style={{ width: 46, height: 46, backgroundColor: b.level > 0 ? palette.cyanDim : 'rgba(148,176,255,0.08)' }}
        >
          <Icon size={22} color={b.level > 0 ? palette.cyan : palette.textMuted} />
        </View>
        <View style={{ flex: 1 }}>
          <View className="flex-row items-center justify-between" style={{ gap: 8 }}>
            <AppText variant="heading" style={{ flex: 1 }} numberOfLines={1}>
              {def.name}
            </AppText>
            <LevelPips level={b.level} building={!!b.construction} />
          </View>
          <AppText variant="caption">{def.role}</AppText>
        </View>
      </View>

      <AppText variant="body" className="mt-3">
        {def.description}
      </AppText>

      {current ? (
        <View className="mt-4 flex-row" style={{ gap: 16 }}>
          <View style={{ flex: 1 }}>
            <AppText variant="micro">{def.outputLabel}</AppText>
            <AppText variant="body" weight="semibold" color={palette.text} numeric>
              {formatOutput(id, current.output)}
            </AppText>
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="micro">Power use</AppText>
            <AppText variant="body" weight="semibold" color={palette.text} numeric>
              {current.upkeepPower} kWh/day
            </AppText>
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="micro">Condition</AppText>
            <AppText variant="body" weight="semibold" color={toneColor[conditionTone].fg} numeric>
              {b.condition}%
            </AppText>
          </View>
        </View>
      ) : null}

      {b.construction ? (
        <View className="mt-4" accessible accessibilityLabel={`Building level ${b.construction.targetLevel}, ${b.construction.daysRemaining} days left`}>
          <View className="mb-1.5 flex-row justify-between">
            <AppText variant="caption" weight="semibold" color={palette.amber}>
              Building level {b.construction.targetLevel}
            </AppText>
            <AppText variant="caption" numeric>
              {b.construction.daysRemaining} day{b.construction.daysRemaining === 1 ? '' : 's'} left
            </AppText>
          </View>
          <ProgressIndicator
            value={(b.construction.totalDays - b.construction.daysRemaining) / b.construction.totalDays}
            tone="caution"
          />
        </View>
      ) : null}

      {next && !b.construction ? (
        <View className="mt-4 rounded-card border border-line px-4 py-3">
          <View className="flex-row items-center justify-between">
            <AppText variant="caption" weight="semibold" color={palette.textSoft}>
              {b.level === 0 ? 'Build' : `Upgrade to level ${next.level}`}
            </AppText>
            <AppText variant="caption" numeric>
              {check.buildDays} day{check.buildDays === 1 ? '' : 's'} to build
            </AppText>
          </View>
          <AppText variant="caption" className="mt-1">
            {next.summary} {def.outputLabel}: {formatOutput(id, next.output)}
            {next.upkeepPower ? `, uses ${next.upkeepPower} kWh/day.` : '.'}
          </AppText>
          <View className="mt-2.5">
            <CostChips cost={next.cost} available={state.resources} />
          </View>
          {def.requires?.some((r) => state.buildings[r.id].level < r.level) ? (
            <AppText variant="micro" className="mt-2" color={palette.amber}>
              Needs {def.requires.map((r) => BUILDINGS[r.id].name).join(' and ')} first.
            </AppText>
          ) : null}
        </View>
      ) : null}

      {b.level >= MAX_BUILDING_LEVEL && !b.construction ? (
        <View className="mt-3">
          <Badge label="Fully upgraded" tone="nominal" />
        </View>
      ) : null}

      <View className="mt-4" style={{ gap: 10 }}>
        {next && !b.construction ? (
          <Button
            label={b.level === 0 ? `Build ${def.name}` : `Upgrade to level ${next.level}`}
            icon={Hammer}
            onPress={onBuild}
            disabled={!check.ok}
            accessibilityHint={check.ok ? undefined : check.reason}
          />
        ) : null}
        {!check.ok && next && !b.construction && check.reason ? (
          <AppText variant="caption" color={palette.amber}>
            {check.reason}
          </AppText>
        ) : null}
        {b.level > 0 && b.condition < 100 ? (
          <Button
            variant="secondary"
            icon={Wrench}
            label={`Repair for ${repairCheck.cost} kg materials`}
            onPress={onRepair}
            disabled={!repairCheck.ok}
          />
        ) : null}
        <Pressable
          onPress={() => router.push({ pathname: '/learning/[topic]', params: { topic: def.learnTopic } })}
          accessibilityRole="link"
          hitSlop={8}
          style={{ alignSelf: 'flex-start', minHeight: 32, justifyContent: 'center' }}
        >
          <AppText variant="caption" weight="semibold" color={palette.violet}>
            How this works in real life
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}
