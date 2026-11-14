import { Linking, Pressable, View } from 'react-native';
import { ExternalLink, RefreshCw } from 'lucide-react-native';
import { getSpaceWeather, usingDemoKey } from '@/services/nasaApi';
import { flareRank, flareStrength } from '@/services/nasaParsers';
import { useAsync } from '@/hooks/useAsync';
import { palette, toneColor, type Tone } from '@/constants/theme';
import { AppText } from '../ui/AppText';
import { Badge } from '../ui/Badge';
import { NasaError, NasaLoading, sourceLine } from './NasaStates';

const STRENGTH_TONE: Record<ReturnType<typeof flareStrength>, Tone> = {
  minor: 'neutral',
  moderate: 'caution',
  strong: 'critical',
  extreme: 'critical',
};

const when = (iso: string) => new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

function Count({ value, label }: { value: number; label: string }) {
  return (
    <View style={{ flex: 1 }} accessible accessibilityLabel={`${value} ${label}`}>
      <AppText variant="title" numeric>
        {value}
      </AppText>
      <AppText variant="micro">{label}</AppText>
    </View>
  );
}

/** Real space-weather events from NASA DONKI. Kept separate from the simulated game radiation. */
export function SpaceWeatherPanel() {
  const result = useAsync((force) => getSpaceWeather(force), []);

  return (
    <View className="rounded-panel border border-line bg-glass p-5">
      <View className="flex-row items-start justify-between" style={{ gap: 8 }}>
        <View style={{ flex: 1 }}>
          <AppText variant="heading">Real space weather</AppText>
          <AppText variant="caption">Events NASA recorded in the last 30 days</AppText>
        </View>
        <Badge label="Live NASA data" tone="science" />
      </View>

      {result.status === 'loading' ? <NasaLoading label="Contacting NASA’s DONKI database…" /> : null}
      {result.status === 'error' ? <NasaError message={result.error} onRetry={result.reload} /> : null}

      {result.status === 'success' ? (
        (() => {
          const w = result.data.data;
          const strongest = [...w.flares].sort((a, b) => flareRank(b.classType) - flareRank(a.classType))[0];
          return (
            <View className="mt-4" style={{ gap: 14 }}>
              <View className="flex-row">
                <Count value={w.flares.length} label="Solar flares" />
                <Count value={w.cmes.length} label="Mass ejections" />
                <Count value={w.particleEvents.length} label="Particle events" />
                <Count value={w.storms.length} label="Geomagnetic storms" />
              </View>

              {strongest ? (
                <AppText variant="caption" color={palette.textSoft}>
                  Strongest flare: class {strongest.classType} ({flareStrength(strongest.classType)}), peaking {when(strongest.peakTime)}.
                </AppText>
              ) : (
                <AppText variant="caption">No solar flares were recorded in this period.</AppText>
              )}

              {w.flares.slice(0, 4).map((f) => (
                <Pressable
                  key={f.id}
                  disabled={!f.link}
                  onPress={() => f.link && Linking.openURL(f.link)}
                  accessibilityRole={f.link ? 'link' : undefined}
                  accessibilityLabel={`Class ${f.classType} flare, ${when(f.peakTime)}${f.activeRegion ? `, active region ${f.activeRegion}` : ''}`}
                  className="flex-row items-center justify-between rounded-card border border-line px-4 py-3"
                >
                  <View style={{ gap: 2 }}>
                    <View className="flex-row items-center" style={{ gap: 8 }}>
                      <AppText variant="body" weight="semibold" color={palette.text} numeric>
                        {f.classType}
                      </AppText>
                      <Badge label={flareStrength(f.classType)} tone={STRENGTH_TONE[flareStrength(f.classType)]} />
                    </View>
                    <AppText variant="micro" numeric>
                      {when(f.peakTime)}
                      {f.activeRegion ? `, region ${f.activeRegion}` : ''}
                      {f.sourceLocation ? `, ${f.sourceLocation}` : ''}
                    </AppText>
                  </View>
                  {f.link ? <ExternalLink size={16} color={palette.textMuted} /> : null}
                </Pressable>
              ))}

              {w.cmes[0]?.speedKmS ? (
                <AppText variant="caption" color={palette.textSoft}>
                  Latest coronal mass ejection: {when(w.cmes[0].startTime)}, about {Math.round(w.cmes[0].speedKmS)} km/s.
                </AppText>
              ) : null}
              {w.storms.length ? (
                <AppText variant="caption" color={palette.textSoft}>
                  Strongest geomagnetic storm reached Kp {Math.max(...w.storms.map((s) => s.maxKp ?? 0)).toFixed(1)} at Earth.
                </AppText>
              ) : null}
              <AppText variant="caption">
                Solar energetic particle events are the main radiation hazard for crews on the Moon. That is why the game’s solar storm
                emergency asks you to shelter.
              </AppText>
              {w.unavailable.length ? (
                <AppText variant="micro" color={toneColor.caution.fg}>
                  Not loaded this time: {w.unavailable.join(', ')}.
                </AppText>
              ) : null}

              <View className="pt-3" style={{ borderTopWidth: 1, borderTopColor: palette.line, gap: 6 }}>
                <AppText variant="micro">{sourceLine(result.data.source, result.data.fetchedAt, result.data.fromCache)}</AppText>
                <AppText variant="micro">
                  These are real observations. LUNARA’s in-game radiation index is simulated and is not derived from them.
                </AppText>
                {usingDemoKey ? (
                  <AppText variant="micro">Using NASA’s shared demo key, which has a low hourly limit.</AppText>
                ) : null}
                <Pressable onPress={result.reload} accessibilityRole="button" hitSlop={8} className="flex-row items-center self-start" style={{ gap: 6, minHeight: 36 }}>
                  <RefreshCw size={14} color={palette.cyan} />
                  <AppText variant="caption" weight="semibold" color={palette.cyan}>
                    Refresh
                  </AppText>
                </Pressable>
              </View>
            </View>
          );
        })()
      ) : null}
    </View>
  );
}
