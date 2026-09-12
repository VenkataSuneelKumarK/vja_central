import { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/types";
import { InfiniteContentList } from "@/components/InfiniteContentList";
import { GrievanceListItem } from "./GrievanceListItem";
import { Grievance } from "@/types/grievance";
import { MyGrievancesFilter } from "@/api/hooks/useGrievances";
import { colors, spacing, radius } from "@/theme/colors";

type Segment = "newRequest" | MyGrievancesFilter;

const FILTER_SEGMENTS: Segment[] = ["newRequest", "pending", "completed", "all"];

export function MyGrievancesScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [activeFilter, setActiveFilter] = useState<MyGrievancesFilter>("all");

  function onSegmentPress(segment: Segment) {
    if (segment === "newRequest") {
      navigation.navigate("NewGrievance");
      return;
    }
    setActiveFilter(segment);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("grievance.myGrievances.title")}</Text>
      <View style={styles.segments}>
        {FILTER_SEGMENTS.map((segment) => {
          const isNew = segment === "newRequest";
          const isActive = !isNew && segment === activeFilter;
          return (
            <Pressable
              key={segment}
              onPress={() => onSegmentPress(segment)}
              style={[styles.segment, isNew ? styles.segmentNew : isActive && styles.segmentActive]}
            >
              <Text style={[styles.segmentText, isNew ? styles.segmentNewText : isActive && styles.segmentTextActive]} numberOfLines={1}>
                {isNew ? "+ " : ""}
                {t(`grievance.myGrievances.segment.${segment}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={{ flex: 1 }}>
        <InfiniteContentList<Grievance>
          key={activeFilter}
          path="/grievances/my"
          params={{ filter: activeFilter }}
          queryKey={["my-grievances", activeFilter]}
          emptyLabel={t("grievance.myGrievances.empty")}
          renderItem={(item) => <GrievanceListItem grievance={item} onPress={() => navigation.navigate("GrievanceDetail", { id: item._id })} />}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  title: { fontSize: 20, fontWeight: "800", color: colors.text, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  segments: { flexDirection: "row", gap: spacing.xs, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  segment: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  segmentActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  segmentNew: { backgroundColor: colors.surface, borderColor: colors.primary, borderWidth: 1.5 },
  segmentText: { fontSize: 12, fontWeight: "600", color: colors.text },
  segmentTextActive: { color: "#fff" },
  segmentNewText: { color: colors.primary, fontWeight: "700" },
});
