import { useRef } from "react";
import { View, Image, ScrollView, FlatList, Dimensions, Text, StyleSheet } from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";
import { useAlbumPhotos } from "@/api/hooks/useMisc";
import { SkeletonList, ErrorState } from "@/components/States";
import { useBilingualText } from "@/utils/bilingual";
import { RootStackParamList } from "@/navigation/types";
import { colors, spacing } from "@/theme/colors";

const { width } = Dimensions.get("window");

// Swipe between photos via a horizontal paging FlatList; pinch-to-zoom via
// each page's own ScrollView (native zoom support on iOS; Android still
// gets swipe navigation without zoom) — §6 of the brief.
export function PhotoViewerScreen() {
  const { params } = useRoute<RouteProp<RootStackParamList, "PhotoViewer">>();
  const tt = useBilingualText();
  const listRef = useRef<FlatList>(null);

  const { data, isLoading, isError, refetch } = useAlbumPhotos(params.albumId, 1);

  if (isLoading) return <SkeletonList />;
  if (isError || !data) return <ErrorState onRetry={() => refetch()} />;

  return (
    <FlatList
      ref={listRef}
      data={data.items}
      keyExtractor={(p) => p._id}
      horizontal
      pagingEnabled
      initialScrollIndex={Math.min(params.initialIndex, data.items.length - 1)}
      getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
      showsHorizontalScrollIndicator={false}
      style={{ backgroundColor: "#000" }}
      renderItem={({ item }) => (
        <View style={{ width, flex: 1, justifyContent: "center" }}>
          <ScrollView maximumZoomScale={3} minimumZoomScale={1} centerContent contentContainerStyle={styles.zoomContent}>
            <Image source={{ uri: item.mediumUrl }} style={styles.image} resizeMode="contain" />
          </ScrollView>
          {!!tt(item.caption) && (
            <View style={styles.captionBar}>
              <Text style={styles.captionText}>{tt(item.caption)}</Text>
            </View>
          )}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  zoomContent: { width, height: "100%", justifyContent: "center", alignItems: "center" },
  image: { width, height: "100%" },
  captionBar: { position: "absolute", bottom: 0, left: 0, right: 0, padding: spacing.md, backgroundColor: "rgba(0,0,0,0.6)" },
  captionText: { color: colors.surface, fontSize: 13, textAlign: "center" },
});
