import { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { InfiniteContentList } from "@/components/InfiniteContentList";
import { ContentCard } from "@/components/ContentCard";
import { useBilingualText } from "@/utils/bilingual";
import { EventItem } from "@/types";
import { RootStackParamList } from "@/navigation/types";
import { colors, spacing, radius } from "@/theme/colors";

type When = "upcoming" | "today" | "past";

export function EventsListScreen() {
  const { t } = useTranslation();
  const tt = useBilingualText();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [when, setWhen] = useState<When>("upcoming");

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.segmentRow}>
        {(["upcoming", "today", "past"] as When[]).map((w) => (
          <Pressable key={w} onPress={() => setWhen(w)} style={[styles.segment, when === w && styles.segmentActive]}>
            <Text style={[styles.segmentText, when === w && styles.segmentTextActive]}>{t(`events.${w}`)}</Text>
          </Pressable>
        ))}
      </View>

      <InfiniteContentList<EventItem>
        path="/events"
        params={{ when }}
        queryKey={["/events", when]}
        emptyLabel={t("events.empty")}
        renderItem={(item) => (
          <ContentCard
            image={item.media[0]?.thumbnailUrl}
            title={tt(item.title)}
            subtitle={`${new Date(item.date).toLocaleDateString()}${item.startTime ? ` · ${item.startTime}` : ""} · ${tt(item.location)}`}
            onPress={() => navigation.navigate("EventDetail", { id: item._id })}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  segmentRow: { flexDirection: "row", padding: spacing.md, gap: spacing.sm },
  segment: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.full, alignItems: "center", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  segmentActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  segmentText: { fontSize: 13, fontWeight: "600", color: colors.textMuted },
  segmentTextActive: { color: "#fff" },
});
