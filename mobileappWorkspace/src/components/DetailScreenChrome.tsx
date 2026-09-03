import { ReactNode } from "react";
import { View, Text, Image, ScrollView, Pressable, Share, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { colors, spacing, radius } from "@/theme/colors";

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

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
      {image ? <Image source={{ uri: image }} style={styles.hero} resizeMode="cover" /> : null}
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
  hero: { width: "100%", height: 220, backgroundColor: colors.border },
  body: { padding: spacing.lg, gap: spacing.md },
  title: { fontSize: 20, fontWeight: "700", color: colors.text },
  meta: { fontSize: 13, color: colors.textMuted },
  shareButton: { alignSelf: "flex-start", borderWidth: 1, borderColor: colors.border, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  shareText: { fontSize: 12, color: colors.text, fontWeight: "600" },
});
