import { Text } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useTranslation } from "react-i18next";
import { HomeScreen } from "@/screens/home/HomeScreen";
import { ActivitiesListScreen } from "@/screens/activities/ActivitiesListScreen";
import { EventsListScreen } from "@/screens/events/EventsListScreen";
import { GalleryScreen } from "@/screens/gallery/GalleryScreen";
import { MoreScreen } from "@/screens/more/MoreScreen";
import { MainTabParamList } from "./types";
import { colors } from "@/theme/colors";

const Tab = createBottomTabNavigator<MainTabParamList>();

// Bottom tabs: Home | Activities | Events | Gallery | More (§41 of the brief).
const tabIcon: Record<keyof MainTabParamList, string> = {
  HomeTab: "🏠",
  ActivitiesTab: "📋",
  EventsTab: "📅",
  GalleryTab: "🖼️",
  MoreTab: "☰",
};

export function MainTabs() {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{ title: t("tabs.home"), tabBarIcon: () => <Text>{tabIcon.HomeTab}</Text> }}
      />
      <Tab.Screen
        name="ActivitiesTab"
        component={ActivitiesListScreen}
        options={{ title: t("tabs.activities"), tabBarIcon: () => <Text>{tabIcon.ActivitiesTab}</Text> }}
      />
      <Tab.Screen
        name="EventsTab"
        component={EventsListScreen}
        options={{ title: t("tabs.events"), tabBarIcon: () => <Text>{tabIcon.EventsTab}</Text> }}
      />
      <Tab.Screen
        name="GalleryTab"
        component={GalleryScreen}
        options={{ title: t("tabs.gallery"), tabBarIcon: () => <Text>{tabIcon.GalleryTab}</Text> }}
      />
      <Tab.Screen
        name="MoreTab"
        component={MoreScreen}
        options={{ title: t("tabs.more"), tabBarIcon: () => <Text>{tabIcon.MoreTab}</Text> }}
      />
    </Tab.Navigator>
  );
}
