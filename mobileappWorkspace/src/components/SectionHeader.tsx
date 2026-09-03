import { View, Text, Pressable, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { colors, spacing } from "@/theme/colors";

export function SectionHeader({ title, onSeeAll }: { title: string; onSeeAll?: () => void }) {
  const { t } = useTranslation();
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {onSeeAll && (
        <Pressable onPress={onSeeAll}>
          <Text style={styles.seeAll}>{t("home.seeAll")}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
  title: { fontSize: 16, fontWeight: "700", color: colors.text },
  seeAll: { fontSize: 13, color: colors.primary, fontWeight: "600" },
});
