import { View, Text, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { GrievanceStatus } from "@/types/grievance";
import { GRIEVANCE_PROGRESS_STEPS, progressIndex, statusLabel } from "@/utils/grievanceLabels";
import { colors, spacing } from "@/theme/colors";

// The spec's example detail screen shows a linear tracker — Submitted✓
// Assigned✓ In Progress✓ Resolved○ Verified○ Closed○ — with Rejected and
// Reopened called out separately since they branch off the main line
// rather than sitting on it (see progressIndex's comment).
export function GrievanceProgressTracker({ status }: { status: GrievanceStatus }) {
  const { t } = useTranslation();
  const currentIndex = progressIndex(status);

  if (status === "rejected") {
    return (
      <View style={styles.banner}>
        <Text style={styles.bannerText}>{statusLabel(t, "rejected")}</Text>
      </View>
    );
  }

  return (
    <View>
      {status === "reopened" ? (
        <View style={[styles.banner, styles.bannerWarning]}>
          <Text style={styles.bannerText}>{statusLabel(t, "reopened")}</Text>
        </View>
      ) : null}
      <View style={styles.row}>
        {GRIEVANCE_PROGRESS_STEPS.map((step, index) => {
          const done = index <= currentIndex;
          return (
            <View key={step} style={styles.step}>
              <View style={[styles.dot, done && styles.dotDone]}>
                <Text style={[styles.dotText, done && styles.dotTextDone]}>{done ? "✓" : ""}</Text>
              </View>
              <Text style={[styles.stepLabel, done && styles.stepLabelDone]} numberOfLines={2}>
                {statusLabel(t, step)}
              </Text>
              {index < GRIEVANCE_PROGRESS_STEPS.length - 1 ? <View style={[styles.connector, done && styles.connectorDone]} /> : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-start" },
  step: { flex: 1, alignItems: "center" },
  dot: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.border, alignItems: "center", justifyContent: "center" },
  dotDone: { backgroundColor: colors.success },
  dotText: { fontSize: 12, fontWeight: "800", color: "transparent" },
  dotTextDone: { color: "#fff" },
  stepLabel: { fontSize: 9, color: colors.textMuted, textAlign: "center", marginTop: 4, paddingHorizontal: 2 },
  stepLabelDone: { color: colors.text, fontWeight: "700" },
  connector: { position: "absolute", top: 10, left: "50%", width: "100%", height: 2, backgroundColor: colors.border, zIndex: -1 },
  connectorDone: { backgroundColor: colors.success },
  banner: { backgroundColor: colors.danger, borderRadius: 8, padding: spacing.sm, marginBottom: spacing.md, alignItems: "center" },
  bannerWarning: { backgroundColor: colors.warning },
  bannerText: { color: "#fff", fontWeight: "700", fontSize: 13 },
});
