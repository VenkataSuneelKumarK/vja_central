import { useCallback, useRef, useState } from "react";
import { View, Text, FlatList, Pressable, Image, Dimensions, ViewToken, ScrollView, StyleSheet } from "react-native";
import { RouteProp, useRoute, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useDetail } from "@/api/hooks/useDetail";
import { useAlbumPhotos } from "@/api/hooks/useMisc";
import { SkeletonList, ErrorState, EmptyState } from "@/components/States";
import { useBilingualText } from "@/utils/bilingual";
import { Album, Photo } from "@/types";
import { RootStackParamList } from "@/navigation/types";
import { colors, spacing, radius } from "@/theme/colors";

const { width } = Dimensions.get("window");
const CAROUSEL_HEIGHT = 380;

export function AlbumDetailScreen() {
  const { params } = useRoute<RouteProp<RootStackParamList, "AlbumDetail">>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const tt = useBilingualText();
  const [activeIndex, setActiveIndex] = useState(0);

  const { data: album, isLoading: albumLoading, isError: albumError, refetch: refetchAlbum } = useDetail<Album>("/albums", params.id);
  // A carousel needs the full sequence available to swipe through smoothly,
  // so (unlike the album grid this replaces) it isn't paginated further —
  // useAlbumPhotos already caps a single fetch at a generous 30 photos,
  // matching what PhotoViewerScreen loads for the same album.
  const { data: photos, isLoading: photosLoading } = useAlbumPhotos(params.id, 1);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems[0]?.index != null) setActiveIndex(viewableItems[0].index);
  }).current;
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

  const renderCarouselItem = useCallback(
    ({ item, index }: { item: Photo; index: number }) => (
      <Pressable
        style={styles.carouselItem}
        onPress={() => navigation.navigate("PhotoViewer", { albumId: params.id, initialIndex: index })}
      >
        <Image source={{ uri: item.mediumUrl }} style={styles.carouselImage} resizeMode="cover" />
      </Pressable>
    ),
    [navigation, params.id]
  );

  if (albumLoading) return <SkeletonList />;
  if (albumError || !album) return <ErrorState onRetry={() => refetchAlbum()} />;

  const items = photos?.items ?? [];
  const activeCaption = items[activeIndex] ? tt(items[activeIndex].caption) : "";

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.header}>
        <Text style={styles.title}>{tt(album.title)}</Text>
        {!!tt(album.description) && <Text style={styles.description}>{tt(album.description)}</Text>}
        {!!tt(album.location) && <Text style={styles.meta}>{tt(album.location)}</Text>}
      </View>

      {photosLoading && <SkeletonList />}
      {!photosLoading && items.length === 0 && <EmptyState title="No photos in this album yet" />}

      {items.length > 0 && (
        <>
          <FlatList
            data={items}
            keyExtractor={(p) => p._id}
            renderItem={renderCarouselItem}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
          />

          <View style={styles.dots}>
            {items.map((p, i) => (
              <View key={p._id} style={[styles.dot, i === activeIndex && styles.dotActive]} />
            ))}
          </View>

          {!!activeCaption && (
            <Text style={styles.caption}>
              {activeCaption} ({activeIndex + 1}/{items.length})
            </Text>
          )}
          {!activeCaption && (
            <Text style={styles.captionMuted}>
              {activeIndex + 1} / {items.length} · tap a photo to zoom
            </Text>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { padding: spacing.lg, gap: 4 },
  title: { fontSize: 20, fontWeight: "700", color: colors.text },
  description: { fontSize: 14, color: colors.text },
  meta: { fontSize: 12, color: colors.textMuted },
  carouselItem: { width, height: CAROUSEL_HEIGHT },
  carouselImage: { width: "100%", height: "100%", backgroundColor: colors.border },
  dots: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: spacing.sm },
  dot: { width: 6, height: 6, borderRadius: radius.full, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.primary, width: 18 },
  caption: { textAlign: "center", fontSize: 13, color: colors.text, marginTop: spacing.sm, paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
  captionMuted: { textAlign: "center", fontSize: 12, color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.lg },
});
