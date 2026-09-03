import { View, Text, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import { RouteProp, useRoute } from "@react-navigation/native";
import { useDetail } from "@/api/hooks/useDetail";
import { SkeletonList, ErrorState } from "@/components/States";
import { useBilingualText } from "@/utils/bilingual";
import { VideoItem } from "@/types";
import { RootStackParamList } from "@/navigation/types";
import { colors, spacing } from "@/theme/colors";

// Streams through YouTube's own player or a plain HTML5 <video> tag for
// hosted files — no large video binaries are ever bundled into the app or
// stored in the database (§7 of the brief).
export function VideoDetailScreen() {
  const { params } = useRoute<RouteProp<RootStackParamList, "VideoDetail">>();
  const tt = useBilingualText();
  const { data, isLoading, isError, refetch } = useDetail<VideoItem>("/videos", params.id);

  if (isLoading) return <SkeletonList />;
  if (isError || !data) return <ErrorState onRetry={() => refetch()} />;

  const source =
    data.source === "youtube"
      ? { uri: `https://www.youtube.com/embed/${data.youtubeId}?playsinline=1` }
      : {
          html: `<html><body style="margin:0;background:#000"><video src="${data.videoUrl}" controls autoplay style="width:100%;height:100%"></video></body></html>`,
        };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.player}>
        <WebView source={source} allowsFullscreenVideo javaScriptEnabled style={{ flex: 1, backgroundColor: "#000" }} />
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>{tt(data.title)}</Text>
        {data.description && !!tt(data.description) && <Text style={styles.description}>{tt(data.description)}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  player: { width: "100%", aspectRatio: 16 / 9, backgroundColor: "#000" },
  body: { padding: spacing.lg, gap: spacing.sm },
  title: { fontSize: 18, fontWeight: "700", color: colors.text },
  description: { fontSize: 14, color: colors.text, lineHeight: 20 },
});
