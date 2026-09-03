import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import en from "./en.json";
import te from "./te.json";
import { SupportedLanguage } from "@/types";

const LANGUAGE_STORAGE_KEY = "vja_language";

export async function initI18n(): Promise<void> {
  const stored = (await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)) as SupportedLanguage | null;

  await i18n.use(initReactI18next).init({
    resources: { en: { translation: en }, te: { translation: te } },
    lng: stored ?? "en",
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    compatibilityJSON: "v3",
  });
}

export async function setLanguage(lang: SupportedLanguage): Promise<void> {
  await i18n.changeLanguage(lang);
  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
}

export async function hasChosenLanguage(): Promise<boolean> {
  return (await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)) !== null;
}

export default i18n;
