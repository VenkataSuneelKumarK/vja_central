import { NavigatorScreenParams } from "@react-navigation/native";

export type MainTabParamList = {
  HomeTab: undefined;
  ActivitiesTab: undefined;
  GrievanceTab: undefined;
  GalleryTab: undefined;
  MoreTab: undefined;
};

export type RootStackParamList = {
  Onboarding: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  ActivityDetail: { id: string };
  EventDetail: { id: string };
  NewsDetail: { id: string };
  AnnouncementDetail: { id: string };
  AlbumDetail: { id: string };
  PhotoViewer: { albumId: string; initialIndex: number };
  VideoDetail: { id: string };
  News: undefined;
  Events: undefined;
  Announcements: undefined;
  Search: undefined;
  Settings: undefined;
  CitizenLogin: undefined;
  CitizenRegister: undefined;
  NewGrievance: undefined;
  GrievanceSuccess: { grievanceNumber: string; grievanceId: string };
  GrievanceDetail: { id: string };
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- standard react-navigation module-augmentation pattern
    interface RootParamList extends RootStackParamList {}
  }
}
