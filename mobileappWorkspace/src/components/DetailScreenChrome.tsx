import { ReactNode, useEffect, useState } from "react";
import { View, Text, Image, ScrollView, Pressable, Share, StyleSheet, Dimensions } from "react-native";
import { useTranslation } from "react-i18next";
import { colors, spacing, radius } from "@/theme/colors";

const SCREEN_WIDTH = Dimensions.get("window").width;
// A fixed 220dp hero looks fine for a typical wide/landscape photo, but a
// square or portrait graphic (many admin-uploaded banners are square,
// social-media-style posts) gets aggressively cropped by resizeMode="cover"
// at that ratio — cutting off headline text or design elements and reading
// as a broken image. Sizing the hero to the image's own aspect ratio
// (clamped to a sane range) keeps "cover" crop-free for the common square
// banner case while still bounding how tall an extreme portrait image gets.
const MIN_HERO_HEIGHT = 200;
const MAX_HERO_HEIGHT = 420;
const DEFAULT_HERO_HEIGHT = 220;

// Shared visual chrome for every detail screen (Activity/Event/News/
// Announcement/Video) — hero image, title, meta line, and a Share action —
// so the "detail page" pattern is defined once (§41: consistent cards,
// spacing, buttons across the app).
export function DetailScreenChrome({
  image,
  title,
  meta,
  shareTitle,
  children,
}: {
  image?: string;
  title: string;
  meta?: string;
  shareTitle?: string;
  children?: ReactNode;
}) {
  const { t } = useTranslation();
  const [heroHeight, setHeroHeight] = useState(DEFAULT_HERO_HEIGHT);

  useEffect(() => {
    if (!image) return;
    let cancelled = false;
    Image.getSize(
      image,
      (width, height) => {
        if (cancelled || !width || !height) return;
        const naturalHeight = (SCREEN_WIDTH * height) / width;
        setHeroHeight(Math.min(MAX_HERO_HEIGHT, Math.max(MIN_HERO_HEIGHT, naturalHeight)));
      },
      () => {
        // Best-effort — keep the default height if the natural size can't be read.
      }
    );
    return () => {
      cancelled = true;
    };
  }, [image]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
      {image ? <Image source={{ uri: image }} style={[styles.hero, { height: heroHeight }]} resizeMode="cover" /> : null}
      <View style={styles.body}>
        <Text style={styles.title}>{title || "Untitled"}</Text>
        {meta && <Text style={styles.meta}>{meta}</Text>}
        {shareTitle && (
          <Pressable
            style={styles.shareButton}
            onPress={() => Share.share({ message: shareTitle }).catch(() => undefined)}
          >
            <Text style={styles.shareText}>{t("common.share")}</Text>
          </Pressable>
        )}
        {children}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hero: { width: "100%", backgroundColor: colors.border },
  body: { padding: spacing.lg, gap: spacing.md },
  title: { fontSize: 20, fontWeight: "700", color: colors.text },
  meta: { fontSize: 13, color: colors.textMuted },
  shareButton: { alignSelf: "flex-start", borderWidth: 1, borderColor: colors.border, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  shareText: { fontSize: 12, color: colors.text, fontWeight: "600" },
});
