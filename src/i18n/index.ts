import { en } from "./translations/en";
import { hi } from "./translations/hi";
import { gu } from "./translations/gu";
import { bn } from "./translations/bn";
import { ta } from "./translations/ta";
import { te } from "./translations/te";
import { mr } from "./translations/mr";
import { pa } from "./translations/pa";
import { ur } from "./translations/ur";
import { ar } from "./translations/ar";
import { fr } from "./translations/fr";
import { es } from "./translations/es";
import { de } from "./translations/de";
import { zh } from "./translations/zh";
import { pt } from "./translations/pt";
import { ru } from "./translations/ru";
import { sw } from "./translations/sw";
import { fallback } from "./translations/fallback";

export const translations: Record<string, Record<string, string>> = {
  en,
  hi,
  gu,
  bn,
  ta,
  te,
  mr,
  pa,
  ur,
  ar,
  fr,
  es,
  de,
  zh,
  pt,
  ru,
  sw,
  fallback,
};

export type SupportedLanguage = string;
export type TranslationKey = keyof typeof en;

export function t(
  key: TranslationKey,
  lang: string,
  vars?: Record<string, string>
): string {
  // 1. Try exact language match
  let translationSet = translations[lang];

  // 2. Try language family (e.g. 'zh-TW' -> 'zh')
  if (!translationSet && lang) {
    const mainLang = lang.split("-")[0];
    translationSet = translations[mainLang];
  }

  // 3. Fallback to English (or if lang doesn't exist, check fallback.ts)
  if (!translationSet) {
    // If it's a known language code not explicitly configured or other languages:
    // we use fallback which is English UI but allows translation at runtime
    translationSet = translations.fallback || translations.en;
  }

  let text = translationSet[key] || translations.en[key] || String(key);

  // 4. Replace {var} placeholders
  if (vars) {
    Object.keys(vars).forEach((varName) => {
      text = text.replace(new RegExp(`{${varName}}`, "g"), vars[varName]);
    });
  }

  return text;
}
