import { View, Text, Pressable, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { Grievance } from "@/types/grievance";
import { priorityEmoji, priorityLabel, slaColor, slaLabel, statusColor, statusLabel } from "@/utils/grievanceLabels";
import { colors, spacing, radius } from "@/theme/colors";

export function GrievanceListItem({ grievance, onPress }: { grievance: Grievance; onPress: () => void }) {
  const { t } = useTranslation();
  const categoryName = typeof grievance.category === "object" ? grievance.category.name.en : "";

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.headerRow}>
        <Text style={styles.id}>{grievance.grievanceNumber}</Text>
        <View style={[styles.statusPill, { backgroundColor: statusColor(grievance.status) }]}>
          <Text style={styles.statusPillText}>{statusLabel(t, grievance.status)}</Text>
        </View>
      </View>
      <Text style={styles.heading} numberOfLines={2}>
        {grievance.heading}
      </Text>
      <Text style={styles.category}>
        {categoryName}
        {grievance.subCategory ? ` · ${grievance.subCategory}` : ""}
      </Text>
      <View style={styles.footerRow}>
        <Text style={styles.priority}>
          {priorityEmoji(grievance.priority)} {priorityLabel(t, grievance.priority)}
        </Text>
        {grievance.slaState ? (
          <Text style={[styles.sla, { color: slaColor(grievance.slaState) }]}>{slaLabel(t, grievance.slaState)}</Text>
        ) : null}
      </View>
      <Text style={styles.date}>{new Date(grievance.createdAt).toLocaleDateString()}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  id: { fontSize: 12, fontWeight: "700", color: colors.textMuted },
  statusPill: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full },
  statusPillText: { fontSize: 11, fontWeight: "700", color: "#fff" },
  heading: { fontSize: 15, fontWeight: "700", color: colors.text },
  category: { fontSize: 12, color: colors.textMuted },
  footerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: spacing.xs },
  priority: { fontSize: 12, fontWeight: "600", color: colors.text },
  sla: { fontSize: 12, fontWeight: "700" },
  date: { fontSize: 11, color: colors.textMuted },
});
