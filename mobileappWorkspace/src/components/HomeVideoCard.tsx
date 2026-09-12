import { useState } from "react";
import { View, Text, Image, Pressable, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import { extractYouTubeId } from "@/utils/youtube";
import { colors, spacing, radius } from "@/theme/colors";

// Home's Videos row previews uploaded ("hosted") videos inline — muted,
// looping, no controls — the same way a social feed auto-plays a clip as
// you scroll past it, rather than showing a static thumbnail like every
// other Home card. YouTube-sourced videos keep the static thumbnail: an
// autoplaying iframe per card doesn't reliably start without a gesture and
// is heavy to run several of at once, so there's nothing to gain over the
// thumbnail YouTube already gives us for free.
export function HomeVideoCard({
  videoUrl,
  thumbnailUrl,
  source,
  title,
  onPress,
}: {
  videoUrl?: string;
  thumbnailUrl?: string;
  source: "youtube" | "hosted";
  title: string;
  onPress: () => void;
}) {
  const [previewFailed, setPreviewFailed] = useState(false);
  const canPreview = source === "hosted" && !!videoUrl && !extractYouTubeId(videoUrl) && !previewFailed;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>
      <View style={styles.image}>
        {canPreview ? (
          <WebView
            source={{
              html: `<html><body style="margin:0;background:#000"><video src="${videoUrl}" muted autoplay loop playsinline webkit-playsinline="true" style="width:100%;height:100%;object-fit:cover"></video></body></html>`,
            }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
            scrollEnabled={false}
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled
            onError={() => setPreviewFailed(true)}
            onHttpError={() => setPreviewFailed(true)}
          />
        ) : thumbnailUrl ? (
          <Image source={{ uri: thumbnailUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <View style={StyleSheet.absoluteFill} />
        )}
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {title || "Untitled"}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.8 },
  image: { width: "100%", aspectRatio: 3 / 4, borderRadius: radius.md, backgroundColor: colors.border, overflow: "hidden" },
  title: { marginTop: spacing.sm, fontSize: 14, fontWeight: "600", color: colors.text },
});
