import { View, Text, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { useNavigation, useRoute, RouteProp, CommonActions } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/types";
import { PrimaryButton, SecondaryButton } from "@/components/form/Buttons";
import { colors, spacing, radius } from "@/theme/colors";

export function GrievanceSuccessScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "GrievanceSuccess">>();
  const { grievanceNumber, grievanceId } = route.params;

  function goToMyGrievances() {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "MainTabs", params: { screen: "GrievanceTab" } }],
      })
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.check}>✓</Text>
        <Text style={styles.title}>{t("grievance.success.title")}</Text>
        <Text style={styles.subtitle}>{t("grievance.success.subtitle")}</Text>
        <View style={styles.idBox}>
          <Text style={styles.idLabel}>{t("grievance.fields.grievanceId")}</Text>
          <Text style={styles.idValue}>{grievanceNumber}</Text>
        </View>
        <Text style={styles.note}>{t("grievance.success.note")}</Text>
      </View>
      <View style={styles.actions}>
        <PrimaryButton
          label={t("grievance.success.viewDetail")}
          onPress={() => navigation.replace("GrievanceDetail", { id: grievanceId })}
        />
        <SecondaryButton label={t("grievance.success.backToList")} onPress={goToMyGrievances} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.xl, justifyContent: "center", gap: spacing.xxl },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.xl, alignItems: "center", gap: spacing.sm },
  check: { fontSize: 40, color: colors.success, fontWeight: "900" },
  title: { fontSize: 20, fontWeight: "800", color: colors.text, textAlign: "center" },
  subtitle: { fontSize: 14, color: colors.textMuted, textAlign: "center" },
  idBox: { marginTop: spacing.md, alignItems: "center", gap: 2 },
  idLabel: { fontSize: 12, color: colors.textMuted },
  idValue: { fontSize: 22, fontWeight: "800", color: colors.primary, letterSpacing: 1 },
  note: { marginTop: spacing.md, fontSize: 12, color: colors.textMuted, textAlign: "center" },
  actions: { gap: spacing.md },
});
