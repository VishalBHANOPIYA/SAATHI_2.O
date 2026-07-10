"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { safeGetItem, safeSetItem } from "@/utils/localStorageHelper";
import { t as tMaster, TranslationKey } from "@/i18n";

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: TranslationKey, vars?: Record<string, string>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<string>("en");

  // Load language from localStorage if available
  useEffect(() => {
    const saved = safeGetItem("saathi_lang");
    if (saved) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: string) => {
    setLanguageState(lang);
    safeSetItem("saathi_lang", lang);
  };

  const t = (key: TranslationKey, vars?: Record<string, string>): string => {
    return tMaster(key, language, vars);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
