import { useState } from "react";
import { View, Text, ScrollView, StyleSheet, Image } from "react-native";
import { useTranslation } from "react-i18next";
import { useRoute, RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "@/navigation/types";
import { useGrievanceDetail, useGrievanceTimeline, useVerifyGrievance, useSubmitGrievanceFeedback } from "@/api/hooks/useGrievances";
import { useBilingualText } from "@/utils/bilingual";
import { priorityEmoji, priorityLabel, slaColor, slaLabel, statusColor, statusLabel } from "@/utils/grievanceLabels";
import { ErrorState, SkeletonList } from "@/components/States";
import { FormField } from "@/components/form/FormField";
import { PrimaryButton, SecondaryButton } from "@/components/form/Buttons";
import { GrievanceProgressTracker } from "./GrievanceProgressTracker";
import { colors, spacing, radius } from "@/theme/colors";

export function GrievanceDetailScreen() {
  const { t } = useTranslation();
  const tt = useBilingualText();
  const route = useRoute<RouteProp<RootStackParamList, "GrievanceDetail">>();
  const { id } = route.params;

  const { data: grievance, isLoading, isError, refetch } = useGrievanceDetail(id);
  const { data: timeline } = useGrievanceTimeline(id);
  const verify = useVerifyGrievance(id);
  const feedback = useSubmitGrievanceFeedback(id);

  const [reopenReason, setReopenReason] = useState("");
  const [showReopenForm, setShowReopenForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState("");

  if (isLoading) return <SkeletonList />;
  if (isError || !grievance) return <ErrorState onRetry={() => refetch()} />;

  const categoryName = typeof grievance.category === "object" ? tt(grievance.category.name) : "";
  const departmentName = grievance.department && typeof grievance.department === "object" ? tt(grievance.department.name) : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Text style={styles.id}>{grievance.grievanceNumber}</Text>
        <View style={[styles.statusPill, { backgroundColor: statusColor(grievance.status) }]}>
          <Text style={styles.statusPillText}>{statusLabel(t, grievance.status)}</Text>
        </View>
      </View>

      <GrievanceProgressTracker status={grievance.status} />

      <View style={styles.section}>
        <Text style={styles.heading}>{grievance.heading}</Text>
        <Text style={styles.description}>{grievance.description}</Text>
      </View>

      <View style={styles.metaGrid}>
        <MetaRow label={t("grievance.fields.category")} value={`${categoryName}${grievance.subCategory ? ` · ${grievance.subCategory}` : ""}`} />
        <MetaRow label={t("grievance.fields.priority")} value={`${priorityEmoji(grievance.priority)} ${priorityLabel(t, grievance.priority)}`} />
        {grievance.area ? <MetaRow label={t("grievance.fields.areaOptional")} value={grievance.area} /> : null}
        {grievance.ward ? <MetaRow label={t("grievance.fields.wardOptional")} value={grievance.ward} /> : null}
        {grievance.landmark ? <MetaRow label={t("grievance.fields.landmarkOptional")} value={grievance.landmark} /> : null}
        {departmentName ? <MetaRow label={t("grievance.fields.department")} value={departmentName} /> : null}
        {grievance.assignedOfficerName ? <MetaRow label={t("grievance.fields.officer")} value={grievance.assignedOfficerName} /> : null}
        {grievance.dueDate ? (
          <MetaRow
            label={t("grievance.fields.dueDate")}
            value={new Date(grievance.dueDate).toLocaleDateString()}
            valueColor={slaColor(grievance.slaState)}
            suffix={slaLabel(t, grievance.slaState) ?? undefined}
          />
        ) : null}
        <MetaRow label={t("grievance.fields.submitted")} value={new Date(grievance.createdAt).toLocaleDateString()} />
      </View>

      {grievance.attachments.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("grievance.fields.attachmentsOptional")}</Text>
          <View style={styles.thumbRow}>
            {grievance.attachments.map((a) => (
              <Image key={a.url} source={{ uri: a.thumbnailUrl ?? a.url }} style={styles.thumb} />
            ))}
          </View>
        </View>
      ) : null}

      {grievance.resolutionDescription ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("grievance.fields.resolution")}</Text>
          <Text style={styles.description}>{grievance.resolutionDescription}</Text>
        </View>
      ) : null}

      {timeline && timeline.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("grievance.detail.timeline")}</Text>
          {timeline.map((entry) => (
            <View key={entry._id} style={styles.timelineRow}>
              <View style={styles.timelineDot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.timelineMessage}>{entry.message}</Text>
                <Text style={styles.timelineDate}>{new Date(entry.createdAt).toLocaleString()}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {grievance.status === "resolved" ? (
        <View style={styles.actionCard}>
          <Text style={styles.sectionTitle}>{t("grievance.detail.verifyPrompt")}</Text>
          {!showReopenForm ? (
            <View style={{ gap: spacing.sm }}>
              <PrimaryButton label={t("grievance.detail.confirmClose")} onPress={() => verify.mutate({ resolved: true })} loading={verify.isPending} />
              <SecondaryButton label={t("grievance.detail.stillNotResolved")} onPress={() => setShowReopenForm(true)} />
            </View>
          ) : (
            <View style={{ gap: spacing.sm }}>
              <FormField
                label={t("grievance.detail.reopenReasonLabel")}
                value={reopenReason}
                onChangeText={setReopenReason}
                multiline
                numberOfLines={3}
                style={{ minHeight: 70, textAlignVertical: "top" }}
              />
              <PrimaryButton
                label={t("grievance.detail.submitReopen")}
                onPress={() => verify.mutate({ resolved: false, reopenReason })}
                loading={verify.isPending}
                disabled={!reopenReason.trim()}
              />
            </View>
          )}
        </View>
      ) : null}

      {grievance.status === "closed" && !grievance.citizenRating ? (
        <View style={styles.actionCard}>
          <Text style={styles.sectionTitle}>{t("grievance.detail.feedbackPrompt")}</Text>
          <View style={styles.starRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Text key={star} onPress={() => setRating(star)} style={[styles.star, star <= rating && styles.starActive]}>
                ★
              </Text>
            ))}
          </View>
          <FormField
            label={t("grievance.detail.feedbackCommentOptional")}
            value={feedbackComment}
            onChangeText={setFeedbackComment}
            multiline
            numberOfLines={2}
          />
          <PrimaryButton
            label={t("grievance.detail.submitFeedback")}
            onPress={() => feedback.mutate({ rating, comment: feedbackComment.trim() || undefined })}
            loading={feedback.isPending}
            disabled={rating === 0}
          />
        </View>
      ) : null}

      {grievance.citizenRating ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("grievance.detail.yourFeedback")}</Text>
          <Text style={styles.description}>
            {"★".repeat(grievance.citizenRating)}
            {"☆".repeat(5 - grievance.citizenRating)}
            {grievance.citizenFeedback ? ` — ${grievance.citizenFeedback}` : ""}
          </Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

function MetaRow({ label, value, valueColor, suffix }: { label: string; value: string; valueColor?: string; suffix?: string }) {
  return (
    <View style={styles.metaRow}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={[styles.metaValue, valueColor ? { color: valueColor } : null]}>
        {value}
        {suffix ? ` · ${suffix}` : ""}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  id: { fontSize: 14, fontWeight: "700", color: colors.textMuted },
  statusPill: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.full },
  statusPillText: { fontSize: 12, fontWeight: "700", color: "#fff" },
  section: { gap: spacing.xs },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: colors.text, marginBottom: spacing.xs },
  heading: { fontSize: 18, fontWeight: "800", color: colors.text },
  description: { fontSize: 14, color: colors.text, lineHeight: 20 },
  metaGrid: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: spacing.sm },
  metaRow: { flexDirection: "row", justifyContent: "space-between" },
  metaLabel: { fontSize: 12, color: colors.textMuted },
  metaValue: { fontSize: 13, fontWeight: "600", color: colors.text, flexShrink: 1, textAlign: "right" },
  thumbRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  thumb: { width: 72, height: 72, borderRadius: radius.md },
  timelineRow: { flexDirection: "row", gap: spacing.sm, paddingVertical: spacing.xs },
  timelineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 6 },
  timelineMessage: { fontSize: 13, color: colors.text },
  timelineDate: { fontSize: 11, color: colors.textMuted },
  actionCard: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, gap: spacing.sm },
  starRow: { flexDirection: "row", gap: spacing.xs },
  star: { fontSize: 28, color: colors.border },
  starActive: { color: colors.warning },
});
