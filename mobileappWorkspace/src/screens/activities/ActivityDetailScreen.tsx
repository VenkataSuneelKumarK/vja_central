import { View, Text, Image, ScrollView, Linking, StyleSheet } from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";
import { useDetail } from "@/api/hooks/useDetail";
import { DetailScreenChrome } from "@/components/DetailScreenChrome";
import { SkeletonList, ErrorState } from "@/components/States";
import { useBilingualText } from "@/utils/bilingual";
import { Activity } from "@/types";
import { RootStackParamList } from "@/navigation/types";
import { colors, spacing, radius } from "@/theme/colors";

export function ActivityDetailScreen() {
  const { params } = useRoute<RouteProp<RootStackParamList, "ActivityDetail">>();
  const tt = useBilingualText();
  const { data, isLoading, isError, refetch } = useDetail<Activity>("/activities", params.id);

  if (isLoading) return <SkeletonList />;
  if (isError || !data) return <ErrorState onRetry={() => refetch()} />;

  return (
    <DetailScreenChrome
      image={data.coverImage}
      title={tt(data.title)}
      meta={`${new Date(data.date).toLocaleDateString()}${data.time ? ` · ${data.time}` : ""} · ${tt(data.location)}`}
      shareTitle={tt(data.title)}
    >
      <Text style={styles.description}>{tt(data.description)}</Text>

      {data.media.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: spacing.sm }}>
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            {data.media.map((m, i) => (
              <Image key={i} source={{ uri: m.thumbnailUrl ?? m.url }} style={styles.mediaThumb} />
            ))}
          </View>
        </ScrollView>
      )}

      {data.peopleInvolved.length > 0 && (
        <View>
          <Text style={styles.sectionLabel}>People / Organizations Involved</Text>
          <Text style={styles.bodyText}>{data.peopleInvolved.join(", ")}</Text>
        </View>
      )}

      {data.externalLinks.length > 0 && (
        <View style={{ gap: spacing.xs }}>
          <Text style={styles.sectionLabel}>Related Links</Text>
          {data.externalLinks.map((link) => (
            <Text key={link} style={styles.link} onPress={() => Linking.openURL(link)}>
              {link}
            </Text>
          ))}
        </View>
      )}
    </DetailScreenChrome>
  );
}

const styles = StyleSheet.create({
  description: { fontSize: 14, color: colors.text, lineHeight: 21 },
  mediaThumb: { width: 100, height: 100, borderRadius: radius.md, backgroundColor: colors.border },
  sectionLabel: { fontSize: 12, fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", marginBottom: 4 },
  bodyText: { fontSize: 14, color: colors.text },
  link: { fontSize: 13, color: colors.primary },
});
