import { Text, Linking, StyleSheet } from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";
import { useDetail } from "@/api/hooks/useDetail";
import { DetailScreenChrome } from "@/components/DetailScreenChrome";
import { SkeletonList, ErrorState } from "@/components/States";
import { useBilingualText } from "@/utils/bilingual";
import { NewsItem } from "@/types";
import { RootStackParamList } from "@/navigation/types";
import { colors } from "@/theme/colors";

export function NewsDetailScreen() {
  const { params } = useRoute<RouteProp<RootStackParamList, "NewsDetail">>();
  const tt = useBilingualText();
  const { data, isLoading, isError, refetch } = useDetail<NewsItem>("/news", params.id);

  if (isLoading) return <SkeletonList />;
  if (isError || !data) return <ErrorState onRetry={() => refetch()} />;

  return (
    <DetailScreenChrome
      image={data.coverImage}
      title={tt(data.title)}
      meta={[data.author, new Date(data.publishAt ?? data.createdAt).toLocaleDateString()].filter(Boolean).join(" · ")}
      shareTitle={tt(data.title)}
    >
      <Text style={styles.content}>{tt(data.content)}</Text>
      {data.sourceUrl ? (
        <Text style={styles.link} onPress={() => Linking.openURL(data.sourceUrl!)}>
          {data.sourceUrl}
        </Text>
      ) : null}
    </DetailScreenChrome>
  );
}

const styles = StyleSheet.create({
  content: { fontSize: 14, color: colors.text, lineHeight: 22 },
  link: { fontSize: 13, color: colors.primary },
});
