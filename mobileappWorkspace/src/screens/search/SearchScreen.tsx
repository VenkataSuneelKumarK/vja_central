import { useState } from "react";
import { View, TextInput, Text, SectionList, ActivityIndicator, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSearch } from "@/api/hooks/useMisc";
import { ContentCard } from "@/components/ContentCard";
import { EmptyState } from "@/components/States";
import { useBilingualText } from "@/utils/bilingual";
import { RootStackParamList } from "@/navigation/types";
import { colors, spacing, radius } from "@/theme/colors";
import { Bilingual } from "@/types";

interface SearchableItem {
  _id: string;
  title: Bilingual;
  coverImage?: string;
  thumbnailUrl?: string;
}

const detailRouteFor: Record<string, keyof RootStackParamList> = {
  activity: "ActivityDetail",
  event: "EventDetail",
  news: "NewsDetail",
  announcement: "AnnouncementDetail",
  photo: "AlbumDetail",
  video: "VideoDetail",
};

export function SearchScreen() {
  const { t } = useTranslation();
  const tt = useBilingualText();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [query, setQuery] = useState("");
  const { data, isLoading } = useSearch(query);

  const sections = (data ?? [])
    .filter((group) => group.items.length > 0)
    .map((group) => ({ title: group.type, data: group.items as SearchableItem[] }));

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.searchBar}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t("search.placeholder")}
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          autoFocus
        />
      </View>

      {isLoading && <ActivityIndicator style={{ marginTop: spacing.xl }} />}
      {!isLoading && query.trim().length > 1 && sections.length === 0 && <EmptyState title={t("search.noResults")} />}

      <SectionList
        sections={sections}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}
        renderSectionHeader={({ section }) => <Text style={styles.sectionTitle}>{section.title}</Text>}
        renderItem={({ item, section }) => (
          <View style={{ marginBottom: spacing.sm }}>
            <ContentCard
              image={item.coverImage ?? item.thumbnailUrl}
              title={tt(item.title)}
              onPress={() => {
                const route = detailRouteFor[section.title];
                // Dynamic route lookup by search-result type — the concrete
                // union member isn't statically known here, but every entry
                // in detailRouteFor points to a screen that takes { id }.
                if (route) (navigation.navigate as (name: string, params: { id: string }) => void)(route, { id: item._id });
              }}
            />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  searchBar: { padding: spacing.lg },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: 14, color: colors.text },
  sectionTitle: { fontSize: 12, fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", marginTop: spacing.md, marginBottom: spacing.xs },
});
