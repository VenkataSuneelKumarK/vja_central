import { View, Text, Pressable, Linking, Platform, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { RouteProp, useRoute } from "@react-navigation/native";
import { useDetail } from "@/api/hooks/useDetail";
import { DetailScreenChrome } from "@/components/DetailScreenChrome";
import { SkeletonList, ErrorState } from "@/components/States";
import { useBilingualText } from "@/utils/bilingual";
import { EventItem } from "@/types";
import { RootStackParamList } from "@/navigation/types";
import { colors, spacing, radius } from "@/theme/colors";

function mapsUrl(lat: number, lng: number, label: string): string {
  return Platform.select({
    ios: `maps:0,0?q=${encodeURIComponent(label)}@${lat},${lng}`,
    default: `geo:${lat},${lng}?q=${lat},${lng}(${encodeURIComponent(label)})`,
  })!;
}

export function EventDetailScreen() {
  const { t } = useTranslation();
  const { params } = useRoute<RouteProp<RootStackParamList, "EventDetail">>();
  const tt = useBilingualText();
  const { data, isLoading, isError, refetch } = useDetail<EventItem>("/events", params.id);

  if (isLoading) return <SkeletonList />;
  if (isError || !data) return <ErrorState onRetry={() => refetch()} />;

  const hasGeo = data.geo?.lat != null && data.geo?.lng != null;

  return (
    <DetailScreenChrome
      image={data.media[0]?.thumbnailUrl}
      title={tt(data.title)}
      meta={`${new Date(data.date).toLocaleDateString()}${data.startTime ? ` · ${data.startTime}` : ""}${data.endTime ? ` – ${data.endTime}` : ""}`}
      shareTitle={tt(data.title)}
    >
      <Text style={styles.description}>{tt(data.description)}</Text>

      <View style={styles.locationBox}>
        <Text style={styles.sectionLabel}>Location</Text>
        <Text style={styles.bodyText}>{tt(data.location)}</Text>
        {data.address && !!tt(data.address) && <Text style={styles.bodyTextMuted}>{tt(data.address)}</Text>}
        {hasGeo && (
          <Pressable
            style={styles.mapsButton}
            onPress={() => Linking.openURL(mapsUrl(data.geo!.lat as number, data.geo!.lng as number, tt(data.location)))}
          >
            <Text style={styles.mapsButtonText}>{t("events.openInMaps")}</Text>
          </Pressable>
        )}
      </View>

      {data.registrationInfo && !!tt(data.registrationInfo) && (
        <View>
          <Text style={styles.sectionLabel}>{t("events.registration")}</Text>
          <Text style={styles.bodyText}>{tt(data.registrationInfo)}</Text>
        </View>
      )}
    </DetailScreenChrome>
  );
}

const styles = StyleSheet.create({
  description: { fontSize: 14, color: colors.text, lineHeight: 21 },
  locationBox: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, gap: 4 },
  sectionLabel: { fontSize: 12, fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", marginBottom: 4 },
  bodyText: { fontSize: 14, color: colors.text },
  bodyTextMuted: { fontSize: 13, color: colors.textMuted },
  mapsButton: { marginTop: spacing.sm, alignSelf: "flex-start", backgroundColor: colors.primary, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.md },
  mapsButtonText: { color: "#fff", fontSize: 13, fontWeight: "600" },
});
