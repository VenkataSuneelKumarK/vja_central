import { useTranslation } from "react-i18next";
import { Bilingual } from "@/types";

// Falls back to English whenever a Telugu translation hasn't been entered
// yet (admins can save a draft before translating — see docs/ERD.md), so
// the mobile UI never renders blank text.
export function useBilingualText() {
  const { i18n } = useTranslation();
  return (value: Bilingual | undefined | null): string => {
    if (!value) return "";
    const lang = i18n.language as "en" | "te";
    return (lang === "te" && value.te ? value.te : value.en) ?? "";
  };
}
