import React, { useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const disclaimerTranslations: Record<
  string,
  { title: string; shortText: string; fullText: string }
> = {
  en: {
    title: "Clinical Disclaimer & Warning",
    shortText: "Saathi is a prototype for screening only. Tap to read full disclaimer.",
    fullText: "Saathi is an AI-powered health companion prototype for screening, demonstration, and awareness only. It is NOT a substitute for professional medical advice, diagnosis, or treatment. All vital sign estimations, camera screenings, and AI responses are experimental. Always consult a qualified healthcare professional/doctor for clinical care or medical decisions."
  },
  hi: {
    title: "नैदानिक अस्वीकरण और चेतावनी",
    shortText: "साथी केवल स्क्रीनिंग के लिए एक प्रोटोटाइप है। पूरा अस्वीकरण पढ़ने के लिए टैप करें।",
    fullText: "साथी केवल स्क्रीनिंग, प्रदर्शन और जागरूकता के लिए एक एआई-संचालित स्वास्थ्य साथी प्रोटोटाइप है। यह पेशेवर चिकित्सा सलाह, निदान या उपचार का विकल्प नहीं है। सभी वाइटल्स अनुमान, कैमरा स्क्रीनिंग और एआई प्रतिक्रियाएं प्रयोगात्मक हैं। नैदानिक देखभाल या चिकित्सा निर्णयों के लिए हमेशा किसी योग्य स्वास्थ्य सेवा पेशेवर/डॉक्टर से परामर्श लें।"
  },
  gu: {
    title: "ક્લિનિકલ ડિસ્ક્લેમર અને ચેતવણી",
    shortText: "સાથી માત્ર સ્ક્રીનીંગ માટેનો પ્રોટોટાઇપ છે. સંપૂર્ણ ડિસ્ક્લેમર વાંચવા માટે ટેપ કરો.",
    fullText: "સાથી એ માત્ર સ્ક્રીનીંગ, પ્રદર્શન અને જાગૃતિ માટેનો AI-સંચાલિત હેલ્થ સાથી પ્રોટોટાઇપ છે. તે વ્યાવસાયિક તબીબી સલાહ, નિદાન અથવા સારવારનો વિકલ્પ નથી. તમામ વાઇટલ્સ અંદાજ, કેમેરા સ્ક્રીનીંગ અને AI જવાબો પ્રાયોગિક છે. ક્લિનિકલ સંભાળ અથવા તબીબી નિર્ણયો માટે હંમેશા લાયક ડૉક્ટરની સલાહ લો."
  }
};

export const ClinicalDisclaimer: React.FC = () => {
  const { language } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);

  // Fallback to English if the current language doesn't have explicit translations
  const t = disclaimerTranslations[language] || disclaimerTranslations.en;

  return (
    <div className="mt-4 bg-slate-50 border border-slate-200/60 rounded-xl overflow-hidden transition-all duration-300">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 text-left focus:outline-none hover:bg-slate-100/50 transition-colors"
      >
        <div className="flex items-center gap-2 text-slate-700">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span className="text-[10px] font-black uppercase tracking-wider">
            {t.title}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        )}
      </button>

      <div
        className={`transition-all duration-300 ease-in-out px-3 pb-3 ${
          isExpanded ? "max-h-40 opacity-100" : "max-h-0 opacity-0 pointer-events-none overflow-hidden pb-0"
        }`}
      >
        <p className="text-[9px] text-slate-500 leading-relaxed font-semibold">
          {t.fullText}
        </p>
      </div>

      {!isExpanded && (
        <div className="px-3 pb-2.5 -mt-1">
          <p className="text-[9px] text-slate-450 leading-relaxed truncate font-medium text-slate-400">
            {t.shortText}
          </p>
        </div>
      )}
    </div>
  );
};
