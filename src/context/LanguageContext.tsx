"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { safeGetItem, safeSetItem } from "@/utils/localStorageHelper";
import { t as tMaster, TranslationKey } from "@/i18n";
import { isRTL } from "@/utils/languageHelper";

export type TranslationFunction = ((key: TranslationKey, vars?: Record<string, string>) => string) & {
  [K in TranslationKey]: string;
};

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: TranslationFunction;
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

  // Update text direction and HTML lang attributes dynamically on language change
  useEffect(() => {
    if (typeof document !== "undefined") {
      const isRtlLang = isRTL(language);
      document.documentElement.dir = isRtlLang ? "rtl" : "ltr";
      document.documentElement.lang = language;
    }
  }, [language]);

  const setLanguage = (lang: string) => {
    setLanguageState(lang);
    safeSetItem("saathi_lang", lang);
  };

  const tFunc = (key: TranslationKey, vars?: Record<string, string>): string => {
    return tMaster(key, language, vars);
  };

  // Create a Proxy for t that allows both function invocation and property access
  const tProxy = new Proxy(tFunc, {
    get(target, prop) {
      if (typeof prop === "string") {
        if (prop in target) {
          return (target as any)[prop];
        }
        return tMaster(prop as TranslationKey, language);
      }
      return Reflect.get(target, prop);
    }
  }) as any;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: tProxy }}>
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
