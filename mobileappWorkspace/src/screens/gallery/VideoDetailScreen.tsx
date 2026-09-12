import { useState } from "react";
import { View, Text, Pressable, Linking, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import { RouteProp, useRoute } from "@react-navigation/native";
import { useDetail } from "@/api/hooks/useDetail";
import { SkeletonList, ErrorState } from "@/components/States";
import { useBilingualText } from "@/utils/bilingual";
import { extractYouTubeId } from "@/utils/youtube";
import { VideoItem } from "@/types";
import { RootStackParamList } from "@/navigation/types";
import { colors, spacing, radius } from "@/theme/colors";

// A realistic mobile browser UA — some WebView default UAs get served a
// stripped-down/broken YouTube embed experience.
const MOBILE_USER_AGENT =
  "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";

// Streams through YouTube's own player or a plain HTML5 <video> tag for
// hosted files — no large video binaries are ever bundled into the app or
// stored in the database (§7 of the brief).
export function VideoDetailScreen() {
  const { params } = useRoute<RouteProp<RootStackParamList, "VideoDetail">>();
  const tt = useBilingualText();
  const { data, isLoading, isError, refetch } = useDetail<VideoItem>("/videos", params.id);
  const [playerFailed, setPlayerFailed] = useState(false);

  if (isLoading) return <SkeletonList />;
  if (isError || !data) return <ErrorState onRetry={() => refetch()} />;

  // A YouTube link pasted into the "hosted URL" field in the admin portal
  // (an easy mix-up — see docs) would otherwise render a dead <video> tag,
  // since an HTML5 video element can't play a youtube.com/youtu.be page.
  const fallbackYouTubeId = data.source === "hosted" ? extractYouTubeId(data.videoUrl) : null;
  const youtubeId = data.source === "youtube" ? data.youtubeId : fallbackYouTubeId;
  const youtubeWatchUrl = youtubeId ? `https://www.youtube.com/watch?v=${youtubeId}` : null;

  // playsinline keeps it embedded rather than jumping to a native player;
  // autoplay+mute is the one combination every mobile WebView reliably
  // allows without a prior user gesture (unmuted autoplay is blocked, and
  // silently eats the tap needed to start playback via controls afterward).
  const source = youtubeId
    ? { uri: `https://www.youtube.com/embed/${youtubeId}?playsinline=1&autoplay=1&mute=1&rel=0&modestbranding=1` }
    : {
        html: `<html><body style="margin:0;background:#000"><video src="${data.videoUrl}" controls autoplay muted playsinline style="width:100%;height:100%"></video></body></html>`,
      };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.player}>
        {playerFailed ? (
          <View style={styles.playerFallback}>
            <Text style={styles.playerFallbackText}>This video couldn't load in-app.</Text>
          </View>
        ) : (
          <WebView
            source={source}
            allowsFullscreenVideo
            javaScriptEnabled
            domStorageEnabled
            mediaPlaybackRequiresUserAction={false}
            allowsInlineMediaPlayback
            userAgent={MOBILE_USER_AGENT}
            style={{ flex: 1, backgroundColor: "#000" }}
            onError={() => setPlayerFailed(true)}
            onHttpError={() => setPlayerFailed(true)}
          />
        )}
      </View>

      {!!youtubeWatchUrl && (
        <Pressable style={styles.watchButton} onPress={() => Linking.openURL(youtubeWatchUrl)}>
          <Text style={styles.watchButtonText}>Watch on YouTube ↗</Text>
        </Pressable>
      )}

      <View style={styles.body}>
        <Text style={styles.title}>{tt(data.title)}</Text>
        {data.description && !!tt(data.description) && <Text style={styles.description}>{tt(data.description)}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  player: { width: "100%", aspectRatio: 16 / 9, backgroundColor: "#000" },
  playerFallback: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.lg },
  playerFallbackText: { color: colors.surface, fontSize: 13, textAlign: "center" },
  watchButton: { margin: spacing.lg, marginBottom: 0, backgroundColor: "#FF0000", paddingVertical: spacing.sm, borderRadius: radius.md, alignItems: "center" },
  watchButtonText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  body: { padding: spacing.lg, gap: spacing.sm },
  title: { fontSize: 18, fontWeight: "700", color: colors.text },
  description: { fontSize: 14, color: colors.text, lineHeight: 20 },
});
