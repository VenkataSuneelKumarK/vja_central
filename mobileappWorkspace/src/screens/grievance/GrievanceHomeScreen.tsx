import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/types";
import { useCitizenAuth } from "@/hooks/useCitizenAuth";
import { PrimaryButton, SecondaryButton } from "@/components/form/Buttons";
import { MyGrievancesScreen } from "./MyGrievancesScreen";
import { colors, spacing, radius } from "@/theme/colors";

// The Grievance tab's actual component: shows an auth gate (Praja Samvad
// intro + Login/Sign up) when no citizen session exists, or the citizen's
// own grievances once logged in. Keeps the tab bar structure fixed either
// way, per §41's chosen "Grievance takes Events' old tab slot" layout.
export function GrievanceHomeScreen() {
  const { t } = useTranslation();
  const { citizen, ready, isAuthenticated } = useCitizenAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  if (!ready) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (isAuthenticated && citizen) {
    return <MyGrievancesScreen />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.title}>{t("grievance.landing.title")}</Text>
        <Text style={styles.titleTe}>{t("grievance.landing.titleTelugu")}</Text>
        <Text style={styles.subtitle}>{t("grievance.landing.subtitle")}</Text>
      </View>
      <View style={styles.actions}>
        <PrimaryButton label={t("grievance.landing.login")} onPress={() => navigation.navigate("CitizenLogin")} />
        <SecondaryButton label={t("grievance.landing.register")} onPress={() => navigation.navigate("CitizenRegister")} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.xl, justifyContent: "center", gap: spacing.xxl },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  hero: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.xl, gap: spacing.sm, borderWidth: 1, borderColor: colors.border },
  title: { fontSize: 22, fontWeight: "800", color: colors.text },
  titleTe: { fontSize: 16, fontWeight: "600", color: colors.primary },
  subtitle: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  actions: { gap: spacing.md },
});
