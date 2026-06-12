export interface TriageResult {
  triage: "RED" | "YELLOW" | "GREEN";
  confidence: "HIGH" | "MEDIUM" | "LOW";
  reason: string;
  advice: string;
  possible_concerns: string[];
  see_doctor: boolean;
  isOffline?: boolean;
}

const RED_KEYWORDS = [
  // English
  "chest pain", "shortness of breath", "breathing difficulty", "difficulty breathing",
  "unconscious", "heavy bleeding", "stroke", "seizure", "heart attack", "choking", "head injury",
  "severe bleeding", "unresponsive", "paralysis", "sudden weakness", "numbness",
  // Hindi
  "seene me dard", "saans lene me taklif", "saas lene me taklif", "behosh", "unconscious",
  "khoon", "bleeding", "lakwa", "seizure", "mirgi", "dora", "heart attack",
  "सीने में दर्द", "सांस लेने में तकलीफ", "बेहोश", "खून", "लकवा", "दौरा", "मिर्गी", "हार्ट अटैक",
  // Gujarati
  "chhatima dukhavo", "shvas levanma taklif", "behosh", "lohi", "doro", "khench",
  "છાતીમાં દુખાવો", "શ્વાસ લેવામાં તકલીફ", "બેહોશ", "લોહી", "ખેંચ", "દોરો", "લકવો", "હાર્ટ એટેક"
];

const YELLOW_KEYWORDS = [
  // English
  "fever", "vomiting", "headache", "dehydration", "persistent vomiting", "severe headache",
  "high fever", "stomach pain", "diarrhea", "dizziness", "moderate pain",
  // Hindi
  "bukhar", "ulti", "sir dard", "pain", "pet dard", "vomiting", "dehydration", "fever", "pani ki kami", "dast",
  "बुखार", "उल्टी", "सिर दर्द", "पेट दर्द", "डीहाइड्रेशन", "पानी की कमी", "दस्त", "चक्कर",
  // Gujarati
  "tav", "ulti", "mathano dukhavo", "petno dukhavo", "dehydration", "pani ni kami",
  "તાવ", "ઊલટી", "માથાનો દુખાવો", "પેટનો દુખાવો", "પાણીની કમી", "ડિહાઇડ્રેશન", "ઝાડા", "ચક્કર"
];

export function performOfflineTriage(text: string, language: string): TriageResult {
  const normalizedText = text.toLowerCase().trim();

  // Check RED keywords
  const matchedRed = RED_KEYWORDS.some(kw => normalizedText.includes(kw.toLowerCase()));
  if (matchedRed) {
    if (language === "hi") {
      return {
        triage: "RED",
        confidence: "MEDIUM",
        reason: "गंभीर लक्षण (जैसे सांस लेने में कठिनाई, सीने में दर्द, या अत्यधिक रक्तस्राव) पाए गए हैं जो तुरंत ध्यान देने की मांग करते हैं।",
        advice: "कृपया तुरंत नजदीकी अस्पताल के आपातकालीन विभाग में जाएं या डॉक्टर से तत्काल संपर्क करें।",
        possible_concerns: ["आपातकालीन स्थिति", "हृदय संबंधी जटिलता", "श्वसन संबंधी समस्या"],
        see_doctor: true,
        isOffline: true
      };
    } else if (language === "gu") {
      return {
        triage: "RED",
        confidence: "MEDIUM",
        reason: "ગંભીર લક્ષણો (જેવા કે શ્વાસ લેવામાં તકલીફ, છાતીમાં દુખાવો, અથવા ભારે રક્તસ્રાવ) જોવા મળ્યા છે જે તાત્કાલિક સારવારની જરૂર દર્શાવે છે.",
        advice: "કૃપા કરીને તરત જ નજીકની હોસ્પિટલના ઇમરજન્સી વિભાગનો સંપર્ક કરો અથવા ડૉક્ટરને તાત્કાલિક બોલાવો.",
        possible_concerns: ["કટોકટીની સ્થિતિ", "હૃદયની ગંભીર સમસ્યા", "શ્વસનની તકલીફ"],
        see_doctor: true,
        isOffline: true
      };
    } else {
      return {
        triage: "RED",
        confidence: "MEDIUM",
        reason: "Critical symptoms detected (such as breathing difficulty, chest pain, or severe bleeding) that require immediate medical attention.",
        advice: "Please seek emergency medical care or visit the nearest hospital emergency room immediately.",
        possible_concerns: ["Emergency Condition", "Cardiopulmonary Stress", "Acute Respiratory Distress"],
        see_doctor: true,
        isOffline: true
      };
    }
  }

  // Check YELLOW keywords
  const matchedYellow = YELLOW_KEYWORDS.some(kw => normalizedText.includes(kw.toLowerCase()));
  if (matchedYellow) {
    if (language === "hi") {
      return {
        triage: "YELLOW",
        confidence: "MEDIUM",
        reason: "मध्यम लक्षण (जैसे बुखार, लगातार उल्टी, या गंभीर सिरदर्द) पाए गए हैं जिनका शीघ्र इलाज आवश्यक है।",
        advice: "डॉक्टर से परामर्श लें। पर्याप्त आराम करें, ओआरएस (ORS) या तरल पदार्थ लें, और लक्षणों पर नज़र रखें।",
        possible_concerns: ["संक्रमण / फ्लू", "निर्जलीकरण (Dehydration)", "गैस्ट्रिक समस्या"],
        see_doctor: true,
        isOffline: true
      };
    } else if (language === "gu") {
      return {
        triage: "YELLOW",
        confidence: "MEDIUM",
        reason: "મધ્યમ લક્ષણો (જેવા કે તાવ, સતત ઊલટી, અથવા ગંભીર માથાનો દુખાવો) જોવા મળ્યા છે જેને જલ્દી સારવારની જરૂર પડી શકે છે.",
        advice: "ડૉક્ટરનો સંપર્ક કરો. પૂરતો આરામ કરો, ઓઆરએસ (ORS) અથવા પ્રવાહી લો, અને લક્ષણો પર નજર રાખો.",
        possible_concerns: ["ચેપ / તાવ", "ડિહાઇડ્રેશન (પાણીની અછત)", "પેટની તકલીફ"],
        see_doctor: true,
        isOffline: true
      };
    } else {
      return {
        triage: "YELLOW",
        confidence: "MEDIUM",
        reason: "Moderate symptoms detected (such as persistent fever, vomiting, or severe headache) that should be evaluated by a healthcare professional.",
        advice: "Schedule a doctor consultation. Rest, stay hydrated with ORS/fluids, and monitor your symptoms closely.",
        possible_concerns: ["Infection / Inflammatory response", "Dehydration", "Gastrointestinal distress"],
        see_doctor: true,
        isOffline: true
      };
    }
  }

  // Default GREEN
  if (language === "hi") {
    return {
      triage: "GREEN",
      confidence: "MEDIUM",
      reason: "कोई गंभीर या मध्यम खतरे के लक्षण नहीं पाए गए हैं। सामान्य स्वास्थ्य समस्याएं प्रतीत होती हैं।",
      advice: "घर पर आराम करें, स्वस्थ भोजन करें और पर्याप्त मात्रा में पानी पीएं। यदि स्थिति बिगड़ती है, तो डॉक्टर से परामर्श करें।",
      possible_concerns: ["सामान्य अस्वस्थता", "हल्की थकान"],
      see_doctor: false,
      isOffline: true
    };
  } else if (language === "gu") {
    return {
      triage: "GREEN",
      confidence: "MEDIUM",
      reason: "કોઈ ગંભીર અથવા મધ્યમ જોખમના લક્ષણો જોવા મળ્યા નથી. સામાન્ય સ્વાસ્થ્ય સમસ્યા હોઈ શકે છે.",
      advice: "ઘરે આરામ કરો, પૌષ્ટિક આહાર લો અને પુષ્કળ પાણી પીવો. જો સ્થિતિ બગડે તો જ ડૉક્ટરનો સંપર્ક કરો.",
      possible_concerns: ["સામાન્ય નબળાઈ", "હળવો થાક"],
      see_doctor: false,
      isOffline: true
    };
  } else {
    return {
      triage: "GREEN",
      confidence: "MEDIUM",
      reason: "No red flags or urgent symptoms detected. Condition appears stable.",
      advice: "Rest at home, monitor symptoms, eat healthy meals, and stay well hydrated. Consult a clinic if symptoms persist.",
      possible_concerns: ["Minor malaise", "General fatigue"],
      see_doctor: false,
      isOffline: true
    };
  }
}
