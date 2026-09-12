import { Text } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useTranslation } from "react-i18next";
import { HomeScreen } from "@/screens/home/HomeScreen";
import { ActivitiesListScreen } from "@/screens/activities/ActivitiesListScreen";
import { GrievanceHomeScreen } from "@/screens/grievance/GrievanceHomeScreen";
import { GalleryScreen } from "@/screens/gallery/GalleryScreen";
import { MoreScreen } from "@/screens/more/MoreScreen";
import { MainTabParamList } from "./types";
import { colors } from "@/theme/colors";

const Tab = createBottomTabNavigator<MainTabParamList>();

// Bottom tabs: Home | Activities | Grievance | Gallery | More. Events moved
// into More (still fully reachable, just no longer a tab) to make room for
// the Praja Samvad public-grievance tab.
const tabIcon: Record<keyof MainTabParamList, string> = {
  HomeTab: "🏠",
  ActivitiesTab: "📋",
  GrievanceTab: "📝",
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
        name="GrievanceTab"
        component={GrievanceHomeScreen}
        options={{ title: t("tabs.grievance"), tabBarIcon: () => <Text>{tabIcon.GrievanceTab}</Text> }}
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
