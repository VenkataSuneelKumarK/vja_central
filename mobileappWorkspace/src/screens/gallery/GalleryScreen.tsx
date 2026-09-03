import { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { InfiniteContentList } from "@/components/InfiniteContentList";
import { ContentCard } from "@/components/ContentCard";
import { useBilingualText } from "@/utils/bilingual";
import { Album, VideoItem } from "@/types";
import { RootStackParamList } from "@/navigation/types";
import { colors, spacing, radius } from "@/theme/colors";

type Tab = "albums" | "videos";

export function GalleryScreen() {
  const { t } = useTranslation();
  const tt = useBilingualText();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [tab, setTab] = useState<Tab>("albums");

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.tabRow}>
        {(["albums", "videos"] as Tab[]).map((tKey) => (
          <Pressable key={tKey} onPress={() => setTab(tKey)} style={[styles.tab, tab === tKey && styles.tabActive]}>
            <Text style={[styles.tabText, tab === tKey && styles.tabTextActive]}>{t(`gallery.${tKey}`)}</Text>
          </Pressable>
        ))}
      </View>

      {tab === "albums" ? (
        <InfiniteContentList<Album>
          path="/albums"
          numColumns={2}
          emptyLabel={t("gallery.emptyAlbums")}
          renderItem={(item) => (
            <View style={{ flex: 1 }}>
              <ContentCard image={item.coverImage} title={tt(item.title)} onPress={() => navigation.navigate("AlbumDetail", { id: item._id })} />
            </View>
          )}
        />
      ) : (
        <InfiniteContentList<VideoItem>
          path="/videos"
          numColumns={2}
          emptyLabel={t("gallery.emptyVideos")}
          renderItem={(item) => (
            <View style={{ flex: 1 }}>
              <ContentCard image={item.thumbnailUrl} title={tt(item.title)} onPress={() => navigation.navigate("VideoDetail", { id: item._id })} />
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tabRow: { flexDirection: "row", padding: spacing.md, gap: spacing.sm },
  tab: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.full, alignItems: "center", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { fontSize: 13, fontWeight: "600", color: colors.textMuted },
  tabTextActive: { color: "#fff" },
});
