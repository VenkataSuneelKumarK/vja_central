import { Text, Pressable, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { Announcement } from "@/types";
import { useBilingualText } from "@/utils/bilingual";
import { colors, spacing, radius } from "@/theme/colors";

const priorityColor: Record<string, string> = { urgent: colors.urgent, important: colors.important, normal: colors.textMuted };

// Urgent/important announcements get a visually distinct home-screen card
// (§10 of the brief) rather than blending into the regular content feed.
export function AnnouncementBanner({ announcement, onPress }: { announcement: Announcement; onPress: () => void }) {
  const t = useBilingualText();
  const { t: translate } = useTranslation();

  if (announcement.priority === "normal") {
    return (
      <Pressable onPress={onPress} style={styles.normalCard}>
        <Text style={styles.normalTitle} numberOfLines={2}>
          {t(announcement.title)}
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={onPress} style={[styles.card, { borderLeftColor: priorityColor[announcement.priority] }]}>
      <Text style={[styles.label, { color: priorityColor[announcement.priority] }]}>
        {announcement.priority === "urgent" ? translate("announcements.urgent") : translate("announcements.important")}
      </Text>
      <Text style={styles.title} numberOfLines={2}>
        {t(announcement.title)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#FEF2F2", borderLeftWidth: 4, borderRadius: radius.md, padding: spacing.md, gap: 4 },
  label: { fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  title: { fontSize: 14, fontWeight: "600", color: colors.text },
  normalCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md },
  normalTitle: { fontSize: 14, color: colors.text },
});
