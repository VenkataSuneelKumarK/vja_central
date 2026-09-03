import { View, Text, Pressable, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { setLanguage } from "@/i18n";
import { colors, spacing, radius } from "@/theme/colors";
import { SupportedLanguage } from "@/types";

export function OnboardingLanguageScreen({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation();

  async function choose(lang: SupportedLanguage) {
    await setLanguage(lang);
    onDone();
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("onboarding.chooseLanguage")}</Text>
      <View style={styles.options}>
        <Pressable style={styles.option} onPress={() => choose("en")}>
          <Text style={styles.optionText}>English</Text>
        </Pressable>
        <Pressable style={styles.option} onPress={() => choose("te")}>
          <Text style={styles.optionText}>తెలుగు</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", padding: spacing.xl, gap: spacing.xl },
  title: { color: "#fff", fontSize: 20, fontWeight: "700", textAlign: "center" },
  options: { width: "100%", gap: spacing.md },
  option: { backgroundColor: "#fff", paddingVertical: spacing.lg, borderRadius: radius.lg, alignItems: "center" },
  optionText: { fontSize: 16, fontWeight: "600", color: colors.primary },
});
