import { View, Text, Image, Pressable, StyleSheet } from "react-native";
import { colors, spacing, radius } from "@/theme/colors";

// A taller, borderless image card used only on the Home screen's category
// rows — editorial/catalog style (image fills the card, no background box
// or border, clean type below) rather than the compact bordered ContentCard
// used on list screens. Presentation-only change: same data, same nav.
export function HomeMediaCard({
  image,
  title,
  subtitle,
  onPress,
}: {
  image?: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>
      {image ? (
        <Image source={{ uri: image }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]} />
      )}
      <Text style={styles.title} numberOfLines={2}>
        {title || "Untitled"}
      </Text>
      {!!subtitle && (
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.8 },
  image: { width: "100%", aspectRatio: 3 / 4, borderRadius: radius.md, backgroundColor: colors.border },
  imagePlaceholder: { alignItems: "center", justifyContent: "center" },
  title: { marginTop: spacing.sm, fontSize: 14, fontWeight: "600", color: colors.text },
  subtitle: { marginTop: 2, fontSize: 12, color: colors.textMuted },
});
