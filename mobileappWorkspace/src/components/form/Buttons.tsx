import { Pressable, Text, StyleSheet, ActivityIndicator } from "react-native";
import { colors, spacing, radius } from "@/theme/colors";

interface ButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export function PrimaryButton({ label, onPress, loading, disabled }: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable onPress={onPress} disabled={isDisabled} style={[styles.primary, isDisabled && styles.disabled]}>
      {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>{label}</Text>}
    </Pressable>
  );
}

export function SecondaryButton({ label, onPress, loading, disabled }: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable onPress={onPress} disabled={isDisabled} style={[styles.secondary, isDisabled && styles.disabled]}>
      {loading ? <ActivityIndicator color={colors.primary} /> : <Text style={styles.secondaryText}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  primary: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryText: { color: colors.primary, fontSize: 15, fontWeight: "700" },
  disabled: { opacity: 0.5 },
});
