import { useState } from "react";
import { Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/types";
import { citizenLogin } from "@/api/citizenAuth";
import { FormField } from "@/components/form/FormField";
import { PrimaryButton } from "@/components/form/Buttons";
import { colors, spacing } from "@/theme/colors";

export function CitizenLoginScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    if (!identifier.trim() || !password) {
      setError(t("grievance.login.errorRequired"));
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await citizenLogin({ identifier: identifier.trim(), password });
      navigation.goBack();
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      setError(status === 401 ? t("grievance.login.errorInvalid") : t("common.errorGeneric"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.subtitle}>{t("grievance.login.subtitle")}</Text>
      <FormField label={t("grievance.fields.usernameOrMobile")} value={identifier} onChangeText={setIdentifier} autoCapitalize="none" />
      <FormField label={t("grievance.fields.password")} value={password} onChangeText={setPassword} secureTextEntry />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton label={t("grievance.login.submit")} onPress={onSubmit} loading={loading} />
      <Pressable onPress={() => navigation.replace("CitizenRegister")} style={styles.switchLink}>
        <Text style={styles.switchText}>{t("grievance.login.switchToRegister")}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, gap: spacing.lg },
  subtitle: { fontSize: 14, color: colors.textMuted },
  error: { fontSize: 13, color: colors.danger },
  switchLink: { alignItems: "center", paddingVertical: spacing.sm },
  switchText: { color: colors.primary, fontSize: 14, fontWeight: "600" },
});
