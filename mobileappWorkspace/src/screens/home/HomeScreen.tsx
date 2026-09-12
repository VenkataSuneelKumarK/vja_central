import { ReactNode } from "react";
import { ScrollView, View, Text, Image, FlatList, RefreshControl, Dimensions, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useHome } from "@/api/hooks/useHome";
import { useAppSettings } from "@/api/hooks/useMisc";
import { useCitizenAuth } from "@/hooks/useCitizenAuth";
import { HomeMediaCard } from "@/components/HomeMediaCard";
import { HomeVideoCard } from "@/components/HomeVideoCard";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import { SectionHeader } from "@/components/SectionHeader";
import { SkeletonList, ErrorState } from "@/components/States";
import { useBilingualText } from "@/utils/bilingual";
import { colors, spacing } from "@/theme/colors";
import { RootStackParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

// Two cards per row, with a sliver of the next one peeking at the edge —
// matches the reference catalog layout rather than the previous compact
// fixed-width scroller.
const CARD_WIDTH = Dimensions.get("window").width * 0.44;

export function HomeScreen() {
  const { t } = useTranslation();
  const tt = useBilingualText();
  const navigation = useNavigation<Nav>();
  const { data, isLoading, isError, refetch, isRefetching } = useHome();
  const { data: settings } = useAppSettings();
  const { citizen, isAuthenticated } = useCitizenAuth();

  if (isLoading) return <SkeletonList />;
  if (isError || !data) return <ErrorState onRetry={() => refetch()} />;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {settings?.profileImageUrl && <Image source={{ uri: settings.profileImageUrl }} style={styles.avatar} />}
          <Text style={styles.headerTitle}>{t("home.title")}</Text>
        </View>
        <Text style={styles.headerUser} numberOfLines={1}>
          {isAuthenticated ? citizen?.fullName || citizen?.username : t("home.guest")}
        </Text>
      </View>

      {data.activeAnnouncements.length > 0 && (
        <View style={{ gap: spacing.sm, marginBottom: spacing.lg }}>
          {data.activeAnnouncements.map((a) => (
            <AnnouncementBanner key={a._id} announcement={a} onPress={() => navigation.navigate("AnnouncementDetail", { id: a._id })} />
          ))}
        </View>
      )}

      <Section title={t("home.latestActivity")} onSeeAll={() => navigation.navigate("MainTabs", { screen: "ActivitiesTab" })}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={data.latestActivities}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ gap: spacing.md }}
          renderItem={({ item }) => (
            <View style={{ width: CARD_WIDTH }}>
              <HomeMediaCard
                image={item.coverImage}
                title={tt(item.title)}
                subtitle={tt(item.location)}
                onPress={() => navigation.navigate("ActivityDetail", { id: item._id })}
              />
            </View>
          )}
        />
      </Section>

      <Section title={t("home.upcomingEvents")} onSeeAll={() => navigation.navigate("Events")}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={data.upcomingEvents}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ gap: spacing.md }}
          renderItem={({ item }) => (
            <View style={{ width: CARD_WIDTH }}>
              <HomeMediaCard
                image={item.media[0]?.thumbnailUrl}
                title={tt(item.title)}
                subtitle={new Date(item.date).toLocaleDateString()}
                onPress={() => navigation.navigate("EventDetail", { id: item._id })}
              />
            </View>
          )}
        />
      </Section>

      <Section title={t("home.latestNews")} onSeeAll={() => navigation.navigate("News")}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={data.latestNews}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ gap: spacing.md }}
          renderItem={({ item }) => (
            <View style={{ width: CARD_WIDTH }}>
              <HomeMediaCard image={item.coverImage} title={tt(item.title)} onPress={() => navigation.navigate("NewsDetail", { id: item._id })} />
            </View>
          )}
        />
      </Section>

      <Section title={t("home.gallery")} onSeeAll={() => navigation.navigate("MainTabs", { screen: "GalleryTab" })}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={data.featuredAlbums}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ gap: spacing.md }}
          renderItem={({ item }) => (
            <View style={{ width: CARD_WIDTH }}>
              <HomeMediaCard image={item.coverImage} title={tt(item.title)} onPress={() => navigation.navigate("AlbumDetail", { id: item._id })} />
            </View>
          )}
        />
      </Section>

      <Section title={t("home.videos")} onSeeAll={() => navigation.navigate("MainTabs", { screen: "GalleryTab" })}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={data.featuredVideos}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ gap: spacing.md }}
          renderItem={({ item }) => (
            <View style={{ width: CARD_WIDTH }}>
              <HomeVideoCard
                videoUrl={item.videoUrl}
                thumbnailUrl={item.thumbnailUrl}
                source={item.source}
                title={tt(item.title)}
                onPress={() => navigation.navigate("VideoDetail", { id: item._id })}
              />
            </View>
          )}
        />
      </Section>
    </ScrollView>
  );
}

function Section({ title, onSeeAll, children }: { title: string; onSeeAll: () => void; children: ReactNode }) {
  return (
    <View style={{ marginBottom: spacing.xl }}>
      <SectionHeader title={title} onSeeAll={onSeeAll} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm, marginBottom: spacing.lg },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flexShrink: 1 },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  headerTitle: { fontSize: 20, fontWeight: "700", color: colors.text },
  headerUser: { fontSize: 13, fontWeight: "600", color: colors.primary, maxWidth: 110 },
});
