import { View, Text, Image, Pressable, StyleSheet } from "react-native";
import { colors, spacing, radius } from "@/theme/colors";

// One card layout reused across Activities, Events, News and Video list
// screens (image + title + subtitle + optional badge) — kept as a single
// component so visual language stays consistent app-wide (§41 of the brief:
// "consistent cards, typography, spacing").
export function ContentCard({
  image,
  title,
  subtitle,
  badge,
  onPress,
}: {
  image?: string;
  title: string;
  subtitle?: string;
  badge?: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      {image ? (
        <Image source={{ uri: image }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]} />
      )}
      <View style={styles.body}>
        {badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
        <Text style={styles.title} numberOfLines={2}>
          {title || "Untitled"}
        </Text>
        {subtitle && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, overflow: "hidden", borderWidth: 1, borderColor: colors.border },
  pressed: { opacity: 0.85 },
  image: { width: "100%", height: 140 },
  imagePlaceholder: { backgroundColor: colors.border },
  body: { padding: spacing.md, gap: 4 },
  badge: { alignSelf: "flex-start", backgroundColor: "#EFF6FF", paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full, marginBottom: 2 },
  badgeText: { fontSize: 10, color: colors.primary, fontWeight: "600" },
  title: { fontSize: 15, fontWeight: "600", color: colors.text },
  subtitle: { fontSize: 12, color: colors.textMuted },
});
