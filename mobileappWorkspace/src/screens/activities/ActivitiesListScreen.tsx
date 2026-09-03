import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { InfiniteContentList } from "@/components/InfiniteContentList";
import { ContentCard } from "@/components/ContentCard";
import { useBilingualText } from "@/utils/bilingual";
import { Activity } from "@/types";
import { RootStackParamList } from "@/navigation/types";
import { colors } from "@/theme/colors";

export function ActivitiesListScreen() {
  const { t } = useTranslation();
  const tt = useBilingualText();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <InfiniteContentList<Activity>
        path="/activities"
        emptyLabel={t("activities.empty")}
        renderItem={(item) => (
          <ContentCard
            image={item.coverImage}
            title={tt(item.title)}
            subtitle={`${new Date(item.date).toLocaleDateString()} · ${tt(item.location)}`}
            badge={item.category ? tt(item.category.name) : undefined}
            onPress={() => navigation.navigate("ActivityDetail", { id: item._id })}
          />
        )}
      />
    </View>
  );
}
