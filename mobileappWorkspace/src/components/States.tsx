import { View, Text, StyleSheet, Pressable } from "react-native";
import { useTranslation } from "react-i18next";
import { colors, spacing, radius } from "@/theme/colors";

export function EmptyState({ title }: { title: string }) {
  return (
    <View style={styles.center}>
      <Text style={styles.emptyText}>{title}</Text>
    </View>
  );
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <View style={styles.center}>
      <Text style={styles.errorText}>{t("common.errorGeneric")}</Text>
      <Pressable onPress={onRetry} style={styles.retryButton}>
        <Text style={styles.retryText}>{t("common.retry")}</Text>
      </Pressable>
    </View>
  );
}

export function SkeletonList() {
  return (
    <View style={{ padding: spacing.lg, gap: spacing.md }}>
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={styles.skeletonCard} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xxl, gap: spacing.md },
  emptyText: { color: colors.textMuted, fontSize: 14 },
  errorText: { color: colors.textMuted, fontSize: 14, textAlign: "center" },
  retryButton: { backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.md },
  retryText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  skeletonCard: { height: 120, borderRadius: radius.lg, backgroundColor: colors.border },
});
