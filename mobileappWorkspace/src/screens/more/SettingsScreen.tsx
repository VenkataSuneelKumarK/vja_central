import { ReactNode, useState } from "react";
import { View, Text, Pressable, Switch, Linking, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { setLanguage } from "@/i18n";
import { useAppSettings } from "@/api/hooks/useMisc";
import { SupportedLanguage } from "@/types";
import { colors, spacing, radius } from "@/theme/colors";

export function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const { data: appSettings } = useAppSettings();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  return (
    <View style={styles.container}>
      <Section title={t("settings.language")}>
        <View style={styles.row}>
          {(["en", "te"] as SupportedLanguage[]).map((lang) => (
            <Pressable
              key={lang}
              onPress={() => setLanguage(lang)}
              style={[styles.langOption, i18n.language === lang && styles.langOptionActive]}
            >
              <Text style={[styles.langText, i18n.language === lang && styles.langTextActive]}>
                {lang === "en" ? "English" : "తెలుగు"}
              </Text>
            </Pressable>
          ))}
        </View>
      </Section>

      <Section title={t("settings.notifications")}>
        <View style={[styles.row, { justifyContent: "space-between" }]}>
          <Text style={styles.bodyText}>{t("settings.notifications")}</Text>
          <Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} />
        </View>
      </Section>

      <Section title={t("settings.about")}>
        {appSettings?.privacyPolicyUrl && (
          <Pressable onPress={() => Linking.openURL(appSettings.privacyPolicyUrl!)}>
            <Text style={styles.link}>{t("more.privacy")}</Text>
          </Pressable>
        )}
        {appSettings?.termsUrl && (
          <Pressable onPress={() => Linking.openURL(appSettings.termsUrl!)}>
            <Text style={styles.link}>{t("more.terms")}</Text>
          </Pressable>
        )}
        {appSettings?.contactPhone && <Text style={styles.bodyText}>{appSettings.contactPhone}</Text>}
        {appSettings?.contactEmail && <Text style={styles.bodyText}>{appSettings.contactEmail}</Text>}
        {appSettings?.contactAddress && <Text style={styles.bodyText}>{appSettings.contactAddress}</Text>}
      </Section>
    </View>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, gap: spacing.lg },
  section: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, gap: spacing.sm },
  sectionTitle: { fontSize: 12, fontWeight: "700", color: colors.textMuted, textTransform: "uppercase" },
  row: { flexDirection: "row", gap: spacing.sm, alignItems: "center" },
  langOption: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border },
  langOptionActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  langText: { fontSize: 13, color: colors.text, fontWeight: "600" },
  langTextActive: { color: "#fff" },
  bodyText: { fontSize: 14, color: colors.text },
  link: { fontSize: 14, color: colors.primary, fontWeight: "600" },
});
