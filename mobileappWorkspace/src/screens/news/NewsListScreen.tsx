import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { InfiniteContentList } from "@/components/InfiniteContentList";
import { ContentCard } from "@/components/ContentCard";
import { useBilingualText } from "@/utils/bilingual";
import { NewsItem } from "@/types";
import { RootStackParamList } from "@/navigation/types";
import { colors } from "@/theme/colors";

export function NewsListScreen() {
  const { t } = useTranslation();
  const tt = useBilingualText();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <InfiniteContentList<NewsItem>
        path="/news"
        emptyLabel={t("news.empty")}
        renderItem={(item) => (
          <ContentCard
            image={item.coverImage}
            title={tt(item.title)}
            subtitle={tt(item.summary)}
            badge={item.category ? tt(item.category.name) : undefined}
            onPress={() => navigation.navigate("NewsDetail", { id: item._id })}
          />
        )}
      />
    </View>
  );
}
