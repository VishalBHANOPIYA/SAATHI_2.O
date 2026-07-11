export function getLanguageName(code: string): string {
  const names: Record<string, string> = {
    en: "English",
    hi: "Hindi",
    gu: "Gujarati",
    bn: "Bengali",
    ta: "Tamil",
    te: "Telugu",
    mr: "Marathi",
    pa: "Punjabi",
    ur: "Urdu",
    ar: "Arabic",
    fr: "French",
    es: "Spanish",
    de: "German",
    zh: "Chinese",
    pt: "Portuguese",
    ru: "Russian",
    sw: "Swahili",
    kn: "Kannada",
    ml: "Malayalam",
    or: "Oriya",
    vi: "Vietnamese",
    he: "Hebrew",
    fa: "Persian",
    ja: "Japanese",
    ko: "Korean",
    it: "Italian",
    tr: "Turkish",
    nl: "Dutch",
    pl: "Polish",
    th: "Thai",
    id: "Indonesian",
  };
  return names[code] || code;
}

export function isRTL(code: string): boolean {
  const rtlLanguages = ["ar", "ur", "he", "fa"];
  return rtlLanguages.includes(code.toLowerCase().split("-")[0]);
}
