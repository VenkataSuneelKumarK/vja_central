import { useState } from "react";
import { View, Text, FlatList, Pressable, Image, ActivityIndicator, StyleSheet } from "react-native";
import { RouteProp, useRoute, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useDetail } from "@/api/hooks/useDetail";
import { useAlbumPhotos } from "@/api/hooks/useMisc";
import { SkeletonList, ErrorState } from "@/components/States";
import { useBilingualText } from "@/utils/bilingual";
import { Album } from "@/types";
import { RootStackParamList } from "@/navigation/types";
import { colors, spacing } from "@/theme/colors";

const COLUMN_COUNT = 3;

export function AlbumDetailScreen() {
  const { params } = useRoute<RouteProp<RootStackParamList, "AlbumDetail">>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const tt = useBilingualText();
  const [page, setPage] = useState(1);

  const { data: album, isLoading: albumLoading, isError: albumError, refetch: refetchAlbum } = useDetail<Album>("/albums", params.id);
  // Photos are paginated independently of the album itself (§6/§19 of the
  // brief) — a large album is never downloaded in one request.
  const { data: photos, isLoading: photosLoading } = useAlbumPhotos(params.id, page);

  if (albumLoading) return <SkeletonList />;
  if (albumError || !album) return <ErrorState onRetry={() => refetchAlbum()} />;

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: colors.background }}
      data={photos?.items ?? []}
      keyExtractor={(p) => p._id}
      numColumns={COLUMN_COUNT}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.title}>{tt(album.title)}</Text>
          {!!tt(album.description) && <Text style={styles.description}>{tt(album.description)}</Text>}
          {!!tt(album.location) && <Text style={styles.meta}>{tt(album.location)}</Text>}
        </View>
      }
      renderItem={({ item, index }) => (
        <Pressable
          style={styles.thumbWrap}
          onPress={() => navigation.navigate("PhotoViewer", { albumId: params.id, initialIndex: (page - 1) * 30 + index })}
        >
          <Image source={{ uri: item.thumbnailUrl }} style={styles.thumb} />
        </Pressable>
      )}
      onEndReachedThreshold={0.5}
      onEndReached={() => {
        if (photos?.hasMore) setPage((p) => p + 1);
      }}
      ListFooterComponent={photosLoading ? <ActivityIndicator style={{ margin: spacing.lg }} /> : null}
    />
  );
}

const styles = StyleSheet.create({
  header: { padding: spacing.lg, gap: 4 },
  title: { fontSize: 20, fontWeight: "700", color: colors.text },
  description: { fontSize: 14, color: colors.text },
  meta: { fontSize: 12, color: colors.textMuted },
  thumbWrap: { flex: 1 / COLUMN_COUNT, aspectRatio: 1, padding: 2 },
  thumb: { flex: 1, backgroundColor: colors.border },
});
