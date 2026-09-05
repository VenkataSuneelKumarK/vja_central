import { View, Text, Pressable, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { setLanguage } from "@/i18n";
import { spacing, radius } from "@/theme/colors";
import { SupportedLanguage } from "@/types";

// Tri-color background (~33/33/34%, blue/white/green) — swap these three
// hex values if you have exact official brand hex codes to match.
const BAND_BLUE = "#1D4ED8";
const BAND_WHITE = "#FFFFFF";
const BAND_GREEN = "#16A34A";
// Rich amber accent for the title card — a fourth vibrant color against the
// tricolor bands, rather than a flat dark overlay.
const TITLE_CARD_COLOR = "#D97706";

export function OnboardingLanguageScreen({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation();

  async function choose(lang: SupportedLanguage) {
    await setLanguage(lang);
    onDone();
  }

  return (
    <View style={styles.container}>
      <View style={styles.bands} pointerEvents="none">
        <View style={[styles.band, { backgroundColor: BAND_BLUE }]} />
        <View style={[styles.band, { backgroundColor: BAND_WHITE }]} />
        <View style={[styles.band, { flex: 1.03, backgroundColor: BAND_GREEN }]} />
      </View>

      <View style={styles.content}>
        <View style={styles.titleCard}>
          <Text style={styles.title}>{t("onboarding.chooseLanguage")}</Text>
        </View>
        <View style={styles.options}>
          <Pressable style={styles.option} onPress={() => choose("en")}>
            <Text style={styles.optionText}>English</Text>
          </Pressable>
          <Pressable style={styles.option} onPress={() => choose("te")}>
            <Text style={styles.optionText}>తెలుగు</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bands: { ...StyleSheet.absoluteFillObject, flexDirection: "column" },
  band: { flex: 1 },
  content: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl, gap: spacing.xl },
  titleCard: {
    backgroundColor: TITLE_CARD_COLOR,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  title: { color: "#fff", fontSize: 20, fontWeight: "700", textAlign: "center" },
  options: { width: "100%", gap: spacing.md },
  option: { backgroundColor: "#fff", paddingVertical: spacing.lg, borderRadius: radius.lg, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  optionText: { fontSize: 16, fontWeight: "600", color: BAND_BLUE },
});
