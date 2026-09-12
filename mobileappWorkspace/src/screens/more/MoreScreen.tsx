import { View, Text, Pressable, StyleSheet, Alert } from "react-native";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/types";
import { useCitizenAuth } from "@/hooks/useCitizenAuth";
import { citizenLogout } from "@/api/citizenAuth";
import { colors, spacing, radius } from "@/theme/colors";

const items: Array<{ key: keyof RootStackParamList; labelKey: string }> = [
  { key: "Events", labelKey: "more.events" },
  { key: "News", labelKey: "more.news" },
  { key: "Announcements", labelKey: "more.announcements" },
  { key: "Search", labelKey: "more.search" },
  { key: "Settings", labelKey: "more.settings" },
];

export function MoreScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isAuthenticated } = useCitizenAuth();

  function onLogoutPress() {
    Alert.alert(t("more.logoutConfirmTitle"), t("more.logoutConfirmMessage"), [
      { text: t("more.logoutCancel"), style: "cancel" },
      { text: t("more.logout"), style: "destructive", onPress: () => citizenLogout() },
    ]);
  }

  return (
    <View style={styles.container}>
      {items.map((item) => (
        <Pressable key={item.key} style={styles.row} onPress={() => navigation.navigate(item.key as never)}>
          <Text style={styles.rowText}>{t(item.labelKey)}</Text>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      ))}
      {isAuthenticated && (
        <Pressable style={styles.logoutButton} onPress={onLogoutPress}>
          <Text style={styles.logoutText}>{t("more.logout")}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, gap: spacing.sm },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  rowText: { fontSize: 15, color: colors.text, fontWeight: "500" },
  chevron: { fontSize: 18, color: colors.textMuted },
  logoutButton: {
    alignItems: "center",
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.text,
    borderRadius: 4,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
  },
  logoutText: { fontSize: 15, color: colors.text, fontWeight: "500" },
});
