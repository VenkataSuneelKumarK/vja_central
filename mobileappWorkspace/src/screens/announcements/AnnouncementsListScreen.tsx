import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { InfiniteContentList } from "@/components/InfiniteContentList";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import { Announcement } from "@/types";
import { RootStackParamList } from "@/navigation/types";
import { colors } from "@/theme/colors";

export function AnnouncementsListScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <InfiniteContentList<Announcement>
        path="/announcements"
        emptyLabel={t("announcements.empty")}
        renderItem={(item) => <AnnouncementBanner announcement={item} onPress={() => navigation.navigate("AnnouncementDetail", { id: item._id })} />}
      />
    </View>
  );
}
