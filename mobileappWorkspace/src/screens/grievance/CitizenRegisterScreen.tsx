import { useState } from "react";
import { Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/types";
import { citizenRegister } from "@/api/citizenAuth";
import { FormField } from "@/components/form/FormField";
import { PrimaryButton } from "@/components/form/Buttons";
import { colors, spacing } from "@/theme/colors";

const MOBILE_REGEX = /^[6-9]\d{9}$/;

export function CitizenRegisterScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [username, setUsername] = useState("");
  const [mobile, setMobile] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function validate(): string | null {
    if (username.trim().length < 3) return t("grievance.register.errorUsername");
    if (!MOBILE_REGEX.test(mobile.trim())) return t("grievance.register.errorMobile");
    if (password.length < 8) return t("grievance.register.errorPassword");
    if (password !== confirmPassword) return t("grievance.register.errorMismatch");
    return null;
  }

  async function onSubmit() {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await citizenRegister({
        username: username.trim(),
        mobile: mobile.trim(),
        password,
        confirmPassword,
        fullName: fullName.trim() || undefined,
      });
      navigation.goBack();
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 409) setError(t("grievance.register.errorDuplicate"));
      else setError(t("common.errorGeneric"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.subtitle}>{t("grievance.register.subtitle")}</Text>
      <FormField label={t("grievance.fields.username")} value={username} onChangeText={setUsername} autoCapitalize="none" />
      <FormField label={t("grievance.fields.mobile")} value={mobile} onChangeText={setMobile} keyboardType="phone-pad" maxLength={10} />
      <FormField label={t("grievance.fields.fullNameOptional")} value={fullName} onChangeText={setFullName} />
      <FormField label={t("grievance.fields.password")} value={password} onChangeText={setPassword} secureTextEntry />
      <FormField label={t("grievance.fields.confirmPassword")} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton label={t("grievance.register.submit")} onPress={onSubmit} loading={loading} />
      <Pressable onPress={() => navigation.replace("CitizenLogin")} style={styles.switchLink}>
        <Text style={styles.switchText}>{t("grievance.register.switchToLogin")}</Text>
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
