import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { MainTabs } from "./MainTabs";
import { RootStackParamList } from "./types";
import { ActivityDetailScreen } from "@/screens/activities/ActivityDetailScreen";
import { EventDetailScreen } from "@/screens/events/EventDetailScreen";
import { NewsListScreen } from "@/screens/news/NewsListScreen";
import { NewsDetailScreen } from "@/screens/news/NewsDetailScreen";
import { AnnouncementsListScreen } from "@/screens/announcements/AnnouncementsListScreen";
import { AnnouncementDetailScreen } from "@/screens/announcements/AnnouncementDetailScreen";
import { AlbumDetailScreen } from "@/screens/gallery/AlbumDetailScreen";
import { PhotoViewerScreen } from "@/screens/gallery/PhotoViewerScreen";
import { VideoDetailScreen } from "@/screens/gallery/VideoDetailScreen";
import { SearchScreen } from "@/screens/search/SearchScreen";
import { SettingsScreen } from "@/screens/more/SettingsScreen";
import { colors } from "@/theme/colors";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { t } = useTranslation();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: "700" },
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen name="ActivityDetail" component={ActivityDetailScreen} options={{ title: t("activities.title") }} />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} options={{ title: t("events.title") }} />
      <Stack.Screen name="News" component={NewsListScreen} options={{ title: t("news.title") }} />
      <Stack.Screen name="NewsDetail" component={NewsDetailScreen} options={{ title: t("news.title") }} />
      <Stack.Screen name="Announcements" component={AnnouncementsListScreen} options={{ title: t("announcements.title") }} />
      <Stack.Screen name="AnnouncementDetail" component={AnnouncementDetailScreen} options={{ title: t("announcements.title") }} />
      <Stack.Screen name="AlbumDetail" component={AlbumDetailScreen} options={{ title: t("gallery.albums") }} />
      <Stack.Screen name="PhotoViewer" component={PhotoViewerScreen} options={{ headerShown: false }} />
      <Stack.Screen name="VideoDetail" component={VideoDetailScreen} options={{ title: t("gallery.videos") }} />
      <Stack.Screen name="Search" component={SearchScreen} options={{ title: t("search.title") }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: t("settings.title") }} />
    </Stack.Navigator>
  );
}
