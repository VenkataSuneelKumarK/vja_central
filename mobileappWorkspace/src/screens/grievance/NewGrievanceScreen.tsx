import { useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, Image, ActivityIndicator } from "react-native";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";
import { RootStackParamList } from "@/navigation/types";
import { useGrievanceCategories, useCreateGrievance, useUploadGrievanceAttachment } from "@/api/hooks/useGrievances";
import { GrievancePriority } from "@/types/grievance";
import { priorityEmoji, priorityLabel } from "@/utils/grievanceLabels";
import { useBilingualText } from "@/utils/bilingual";
import { FormField } from "@/components/form/FormField";
import { PrimaryButton } from "@/components/form/Buttons";
import { ErrorState, SkeletonList } from "@/components/States";
import { colors, spacing, radius } from "@/theme/colors";

const PRIORITIES: GrievancePriority[] = ["emergency", "high", "normal", "suggestion"];
const MAX_ATTACHMENTS = 5;

interface PickedAttachment {
  localUri: string;
  mimeType: string;
  fileName: string;
  uploading: boolean;
  uploadedUrl?: string;
  uploadedThumbnailUrl?: string;
  uploadedMediumUrl?: string;
  error?: boolean;
}

export function NewGrievanceScreen() {
  const { t } = useTranslation();
  const tt = useBilingualText();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { data: categories, isLoading, isError, refetch } = useGrievanceCategories();
  const createGrievance = useCreateGrievance();
  const uploadAttachment = useUploadGrievanceAttachment();

  const [heading, setHeading] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [subCategorySlug, setSubCategorySlug] = useState<string | null>(null);
  const [customCategoryNote, setCustomCategoryNote] = useState("");
  const [priority, setPriority] = useState<GrievancePriority>("normal");
  const [area, setArea] = useState("");
  const [ward, setWard] = useState("");
  const [landmark, setLandmark] = useState("");
  const [attachments, setAttachments] = useState<PickedAttachment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const selectedCategory = categories?.find((c) => c._id === categoryId) ?? null;

  async function pickImage() {
    if (attachments.length >= MAX_ATTACHMENTS) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError(t("grievance.newRequest.errorPermission"));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];
    const mimeType = asset.mimeType ?? "image/jpeg";
    const fileName = asset.fileName ?? `photo-${Date.now()}.jpg`;
    const entry: PickedAttachment = { localUri: asset.uri, mimeType, fileName, uploading: true };
    setAttachments((prev) => [...prev, entry]);

    try {
      const uploaded = await uploadAttachment.mutateAsync({ uri: asset.uri, name: fileName, mimeType });
      setAttachments((prev) =>
        prev.map((a) =>
          a.localUri === asset.uri
            ? { ...a, uploading: false, uploadedUrl: uploaded.imageUrl, uploadedThumbnailUrl: uploaded.thumbnailUrl, uploadedMediumUrl: uploaded.mediumUrl }
            : a
        )
      );
    } catch {
      setAttachments((prev) => prev.map((a) => (a.localUri === asset.uri ? { ...a, uploading: false, error: true } : a)));
    }
  }

  function removeAttachment(localUri: string) {
    setAttachments((prev) => prev.filter((a) => a.localUri !== localUri));
  }

  function validate(): string | null {
    if (heading.trim().length < 5) return t("grievance.newRequest.errorHeading");
    if (description.trim().length < 10) return t("grievance.newRequest.errorDescription");
    if (!categoryId) return t("grievance.newRequest.errorCategory");
    if (selectedCategory?.isOther) {
      if (!customCategoryNote.trim()) return t("grievance.newRequest.errorCustomNote");
    } else if (!subCategorySlug) {
      return t("grievance.newRequest.errorSubCategory");
    }
    if (attachments.some((a) => a.uploading)) return t("grievance.newRequest.errorUploading");
    return null;
  }

  async function onSubmit() {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const result = await createGrievance.mutateAsync({
        heading: heading.trim(),
        description: description.trim(),
        category: categoryId as string,
        subCategory: selectedCategory?.isOther ? undefined : subCategorySlug ?? undefined,
        customCategoryNote: selectedCategory?.isOther ? customCategoryNote.trim() : undefined,
        priority,
        area: area.trim() || undefined,
        ward: ward.trim() || undefined,
        landmark: landmark.trim() || undefined,
        attachments: attachments
          .filter((a) => a.uploadedUrl)
          .map((a) => ({
            url: a.uploadedUrl as string,
            thumbnailUrl: a.uploadedThumbnailUrl,
            mediumUrl: a.uploadedMediumUrl,
            fileName: a.fileName,
            fileType: a.mimeType,
          })),
      });
      navigation.replace("GrievanceSuccess", { grievanceNumber: result.grievanceNumber, grievanceId: result._id });
    } catch {
      setError(t("common.errorGeneric"));
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading) return <SkeletonList />;
  if (isError || !categories) return <ErrorState onRetry={() => refetch()} />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <FormField label={t("grievance.fields.heading")} value={heading} onChangeText={setHeading} maxLength={150} />
      <FormField
        label={t("grievance.fields.description")}
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
        style={styles.textarea}
        maxLength={4000}
      />

      <View style={styles.field}>
        <Text style={styles.label}>{t("grievance.fields.category")}</Text>
        <View style={styles.chipRow}>
          {categories.map((category) => (
            <Pressable
              key={category._id}
              onPress={() => {
                setCategoryId(category._id);
                setSubCategorySlug(null);
              }}
              style={[styles.chip, categoryId === category._id && styles.chipActive]}
            >
              <Text style={[styles.chipText, categoryId === category._id && styles.chipTextActive]}>{tt(category.name)}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {selectedCategory && !selectedCategory.isOther ? (
        <View style={styles.field}>
          <Text style={styles.label}>{t("grievance.fields.subCategory")}</Text>
          <View style={styles.chipRow}>
            {selectedCategory.subCategories.map((sub) => (
              <Pressable
                key={sub.slug}
                onPress={() => setSubCategorySlug(sub.slug)}
                style={[styles.chip, subCategorySlug === sub.slug && styles.chipActive]}
              >
                <Text style={[styles.chipText, subCategorySlug === sub.slug && styles.chipTextActive]}>{tt(sub.name)}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      {selectedCategory?.isOther ? (
        <FormField
          label={t("grievance.fields.customCategoryNote")}
          value={customCategoryNote}
          onChangeText={setCustomCategoryNote}
          multiline
          numberOfLines={2}
          style={styles.textarea}
        />
      ) : null}

      <View style={styles.field}>
        <Text style={styles.label}>{t("grievance.fields.priority")}</Text>
        <View style={styles.chipRow}>
          {PRIORITIES.map((p) => (
            <Pressable key={p} onPress={() => setPriority(p)} style={[styles.chip, priority === p && styles.chipActive]}>
              <Text style={[styles.chipText, priority === p && styles.chipTextActive]}>
                {priorityEmoji(p)} {priorityLabel(t, p)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <FormField label={t("grievance.fields.areaOptional")} value={area} onChangeText={setArea} />
      <FormField label={t("grievance.fields.wardOptional")} value={ward} onChangeText={setWard} />
      <FormField label={t("grievance.fields.landmarkOptional")} value={landmark} onChangeText={setLandmark} />

      <View style={styles.field}>
        <Text style={styles.label}>{t("grievance.fields.attachmentsOptional")}</Text>
        <View style={styles.chipRow}>
          {attachments.map((a) => (
            <View key={a.localUri} style={styles.thumbWrap}>
              <Image source={{ uri: a.localUri }} style={styles.thumb} />
              {a.uploading ? (
                <View style={styles.thumbOverlay}>
                  <ActivityIndicator color="#fff" size="small" />
                </View>
              ) : null}
              {a.error ? (
                <View style={[styles.thumbOverlay, styles.thumbError]}>
                  <Text style={styles.thumbErrorText}>!</Text>
                </View>
              ) : null}
              <Pressable style={styles.thumbRemove} onPress={() => removeAttachment(a.localUri)}>
                <Text style={styles.thumbRemoveText}>×</Text>
              </Pressable>
            </View>
          ))}
          {attachments.length < MAX_ATTACHMENTS ? (
            <Pressable style={styles.addPhoto} onPress={pickImage}>
              <Text style={styles.addPhotoText}>+</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton label={t("grievance.newRequest.submit")} onPress={onSubmit} loading={submitting} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, gap: spacing.lg },
  field: { gap: spacing.xs },
  label: { fontSize: 13, fontWeight: "600", color: colors.text },
  textarea: { minHeight: 80, textAlignVertical: "top" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, color: colors.text, fontWeight: "600" },
  chipTextActive: { color: "#fff" },
  error: { fontSize: 13, color: colors.danger },
  thumbWrap: { width: 64, height: 64, borderRadius: radius.md, overflow: "hidden" },
  thumb: { width: "100%", height: "100%" },
  thumbOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center" },
  thumbError: { backgroundColor: "rgba(220,38,38,0.7)" },
  thumbErrorText: { color: "#fff", fontWeight: "800" },
  thumbRemove: { position: "absolute", top: 2, right: 2, width: 18, height: 18, borderRadius: 9, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center" },
  thumbRemoveText: { color: "#fff", fontSize: 12, fontWeight: "800", lineHeight: 14 },
  addPhoto: { width: 64, height: 64, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, borderStyle: "dashed", alignItems: "center", justifyContent: "center" },
  addPhotoText: { fontSize: 24, color: colors.textMuted },
});
