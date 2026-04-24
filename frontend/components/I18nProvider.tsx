"use client";

import { ReactNode, useEffect } from "react";
import "@/lib/i18n";
import { useTranslation } from "react-i18next";

export function I18nProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();

  useEffect(() => {
    // Load saved language preference if any
    const savedLng = localStorage.getItem("i18nextLng");
    if (savedLng && savedLng !== i18n.language) {
      i18n.changeLanguage(savedLng);
    }
  }, [i18n]);

  return <>{children}</>;
}
