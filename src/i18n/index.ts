import en from "../../locales/en.json";
import hi from "../../locales/hi.json";
import gu from "../../locales/gu.json";
import bn from "../../locales/bn.json";
import ta from "../../locales/ta.json";
import te from "../../locales/te.json";
import mr from "../../locales/mr.json";
import pa from "../../locales/pa.json";
import ur from "../../locales/ur.json";
import ar from "../../locales/ar.json";
import fr from "../../locales/fr.json";
import es from "../../locales/es.json";
import de from "../../locales/de.json";
import zh from "../../locales/zh.json";
import pt from "../../locales/pt.json";
import ru from "../../locales/ru.json";
import sw from "../../locales/sw.json";
import ja from "../../locales/ja.json";
import ko from "../../locales/ko.json";
import it from "../../locales/it.json";
import tr from "../../locales/tr.json";
import nl from "../../locales/nl.json";
import pl from "../../locales/pl.json";
import th from "../../locales/th.json";
import vi from "../../locales/vi.json";
import id from "../../locales/id.json";
import kn from "../../locales/kn.json";
import ml from "../../locales/ml.json";
import or from "../../locales/or.json";

export const translations: Record<string, Record<string, string>> = {
  en: en as any,
  hi: hi as any,
  gu: gu as any,
  bn: bn as any,
  ta: ta as any,
  te: te as any,
  mr: mr as any,
  pa: pa as any,
  ur: ur as any,
  ar: ar as any,
  fr: fr as any,
  es: es as any,
  de: de as any,
  zh: zh as any,
  pt: pt as any,
  ru: ru as any,
  sw: sw as any,
  ja: ja as any,
  ko: ko as any,
  it: it as any,
  tr: tr as any,
  nl: nl as any,
  pl: pl as any,
  th: th as any,
  vi: vi as any,
  id: id as any,
  kn: kn as any,
  ml: ml as any,
  or: or as any,
  fallback: en as any,
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

  // 3. Fallback to English
  if (!translationSet) {
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
