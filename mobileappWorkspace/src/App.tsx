import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { initI18n, hasChosenLanguage } from "@/i18n";
import { queryClient, asyncStoragePersister } from "@/api/queryClient";
import { registerForPushNotificationsAsync } from "@/notifications";
import { hydrateCitizenSession } from "@/api/citizenAuth";
import { RootNavigator } from "@/navigation/RootNavigator";
import { OnboardingLanguageScreen } from "@/screens/onboarding/OnboardingLanguageScreen";
import { OfflineBanner } from "@/components/OfflineBanner";
import { colors } from "@/theme/colors";

SplashScreen.preventAutoHideAsync().catch(() => undefined);

// The branded splash screen should be visible for 2-3 seconds on launch
// regardless of how quickly startup work finishes, rather than flashing
// briefly if the device/network is fast.
const MIN_SPLASH_DURATION_MS = 2500;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    (async () => {
      const minDelay = wait(MIN_SPLASH_DURATION_MS);

      await initI18n();
      setNeedsOnboarding(!(await hasChosenLanguage()));
      await hydrateCitizenSession();
      await registerForPushNotificationsAsync();

      await minDelay;
      setReady(true);
      await SplashScreen.hideAsync();
    })();
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.primary }}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister: asyncStoragePersister }}>
      <StatusBar style="dark" />
      {needsOnboarding ? (
        <OnboardingLanguageScreen onDone={() => setNeedsOnboarding(false)} />
      ) : (
        <NavigationContainer>
          <OfflineBanner />
          <RootNavigator />
        </NavigationContainer>
      )}
    </PersistQueryClientProvider>
  );
}
