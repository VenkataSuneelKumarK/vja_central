import { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { useTranslation } from "react-i18next";
import { colors, spacing } from "@/theme/colors";

// A persistent banner rather than a blank screen or silent failure (§20/§34
// of the brief) — the app should always tell the user why content looks
// stale instead of pretending everything is fine.
export function OfflineBanner() {
  const { t } = useTranslation();
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(state.isConnected === false);
    });
    return unsubscribe;
  }, []);

  if (!isOffline) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>{t("common.offline")}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { backgroundColor: colors.warning, paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  text: { color: "#fff", fontSize: 12, textAlign: "center" },
});
