import { useState } from 'react';
import { Modal, Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import type { NasaImage } from '@/types/nasa';
import { mediumImageUrl, searchNasaImages } from '@/services/nasaApi';
import { useAsync } from '@/hooks/useAsync';
import { palette } from '@/constants/theme';
import { AppText } from '../ui/AppText';
import { NasaError, NasaLoading, sourceLine } from './NasaStates';

const QUERIES = [
  { label: 'Apollo surface', query: 'Apollo lunar surface' },
  { label: 'South pole', query: 'lunar south pole' },
  { label: 'Earthrise', query: 'Earthrise' },
  { label: 'Artemis', query: 'Artemis moon' },
];

function ImageDetail({ image, onClose }: { image: NasaImage; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const [failed, setFailed] = useState(false);
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(2,4,10,0.94)', paddingTop: insets.top + 8, paddingBottom: insets.bottom + 8 }}>
        <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close image" hitSlop={10} style={{ alignSelf: 'flex-end', padding: 16 }}>
          <X size={24} color={palette.text} />
        </Pressable>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingBottom: 24 }}>
          <Image
            source={{ uri: failed ? image.thumbUrl : mediumImageUrl(image.thumbUrl) }}
            onError={() => setFailed(true)}
            contentFit="contain"
            style={{ width: '100%', aspectRatio: 1, borderRadius: 16, backgroundColor: palette.abyss }}
            accessibilityLabel={image.title}
            transition={200}
          />
          <AppText variant="heading">{image.title}</AppText>
          <AppText variant="caption" numeric>
            {[image.dateCreated ? new Date(image.dateCreated).toLocaleDateString(undefined, { dateStyle: 'long' }) : null, image.center ? `NASA ${image.center}` : null]
              .filter(Boolean)
              .join(', ')}
          </AppText>
          {image.description ? (
            <AppText variant="body" numberOfLines={12}>
              {image.description}
            </AppText>
          ) : null}
          <AppText variant="micro">Image credit: NASA. NASA ID {image.nasaId}.</AppText>
        </ScrollView>
      </View>
    </Modal>
  );
}

/** Real photographs from the NASA Image and Video Library. */
export function NasaImageGallery() {
  const [query, setQuery] = useState(QUERIES[0].query);
  const [open, setOpen] = useState<NasaImage | null>(null);
  const { width } = useWindowDimensions();
  const result = useAsync((force) => searchNasaImages(query, force), [query]);
  const tile = Math.min(300, (Math.min(width, 680) - 40 - 12) / 2);

  return (
    <View className="rounded-panel border border-line bg-glass p-5">
      <AppText variant="heading">From the NASA archive</AppText>
      <AppText variant="caption">Real photographs from the NASA Image and Video Library</AppText>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-4" contentContainerStyle={{ gap: 8 }}>
        {QUERIES.map((q) => {
          const active = q.query === query;
          return (
            <Pressable
              key={q.query}
              onPress={() => setQuery(q.query)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              className="rounded-chip px-4"
              style={{
                minHeight: 38,
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: active ? palette.violet : palette.line,
                backgroundColor: active ? palette.violetDim : 'transparent',
              }}
            >
              <AppText variant="caption" weight="semibold" color={active ? palette.violet : palette.textSoft}>
                {q.label}
              </AppText>
            </Pressable>
          );
        })}
      </ScrollView>

      {result.status === 'loading' ? <NasaLoading label="Searching the NASA image library…" /> : null}
      {result.status === 'error' ? <NasaError message={result.error} onRetry={result.reload} /> : null}
      {result.status === 'success' && result.data.data.length === 0 ? (
        <AppText variant="caption" className="mt-4">
          NASA returned no photographs for this search. Try another topic above.
        </AppText>
      ) : null}
      {result.status === 'success' && result.data.data.length > 0 ? (
        <>
          <View className="mt-4 flex-row flex-wrap" style={{ gap: 12 }}>
            {result.data.data.slice(0, 12).map((img) => (
              <Pressable
                key={img.nasaId}
                onPress={() => setOpen(img)}
                accessibilityRole="imagebutton"
                accessibilityLabel={`${img.title}. Opens a larger view.`}
                style={({ pressed }) => ({ width: tile, opacity: pressed ? 0.8 : 1 })}
              >
                <Image
                  source={{ uri: img.thumbUrl }}
                  contentFit="cover"
                  transition={200}
                  style={{ width: tile, height: tile * 0.75, borderRadius: 14, backgroundColor: palette.abyss }}
                />
                <AppText variant="micro" numberOfLines={2} className="mt-1.5">
                  {img.title}
                </AppText>
              </Pressable>
            ))}
          </View>
          <AppText variant="micro" className="mt-4">
            {sourceLine(result.data.source, result.data.fetchedAt, result.data.fromCache)}
          </AppText>
        </>
      ) : null}
      {open ? <ImageDetail image={open} onClose={() => setOpen(null)} /> : null}
    </View>
  );
}
