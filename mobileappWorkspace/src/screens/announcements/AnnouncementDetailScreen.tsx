import { View, Text, StyleSheet } from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useDetail } from "@/api/hooks/useDetail";
import { SkeletonList, ErrorState } from "@/components/States";
import { useBilingualText } from "@/utils/bilingual";
import { Announcement } from "@/types";
import { RootStackParamList } from "@/navigation/types";
import { colors, spacing, radius } from "@/theme/colors";

const priorityColor: Record<string, string> = { urgent: colors.urgent, important: colors.important, normal: colors.textMuted };

export function AnnouncementDetailScreen() {
  const { t } = useTranslation();
  const { params } = useRoute<RouteProp<RootStackParamList, "AnnouncementDetail">>();
  const tt = useBilingualText();
  const { data, isLoading, isError, refetch } = useDetail<Announcement>("/announcements", params.id);

  if (isLoading) return <SkeletonList />;
  if (isError || !data) return <ErrorState onRetry={() => refetch()} />;

  return (
    <View style={styles.container}>
      {data.priority !== "normal" && (
        <Text style={[styles.badge, { color: priorityColor[data.priority] }]}>
          {data.priority === "urgent" ? t("announcements.urgent") : t("announcements.important")}
        </Text>
      )}
      <Text style={styles.title}>{tt(data.title)}</Text>
      <Text style={styles.meta}>{new Date(data.publishAt ?? data.createdAt).toLocaleDateString()}</Text>
      <Text style={styles.content}>{tt(data.content)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, gap: spacing.sm },
  badge: { fontSize: 12, fontWeight: "700", textTransform: "uppercase" },
  title: { fontSize: 20, fontWeight: "700", color: colors.text },
  meta: { fontSize: 12, color: colors.textMuted },
  content: { fontSize: 15, color: colors.text, lineHeight: 22, marginTop: spacing.sm, backgroundColor: colors.surface, padding: spacing.md, borderRadius: radius.md },
});
