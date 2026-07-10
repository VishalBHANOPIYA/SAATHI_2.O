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
    return {
      triage: "RED",
      confidence: "MEDIUM",
      reason: "triageRedReason",
      advice: "triageRedAdvice",
      possible_concerns: ["concernEmergency", "concernCardiopulmonary", "concernRespiratory"],
      see_doctor: true,
      isOffline: true
    };
  }

  // Check YELLOW keywords
  const matchedYellow = YELLOW_KEYWORDS.some(kw => normalizedText.includes(kw.toLowerCase()));
  if (matchedYellow) {
    return {
      triage: "YELLOW",
      confidence: "MEDIUM",
      reason: "triageYellowReason",
      advice: "triageYellowAdvice",
      possible_concerns: ["concernInfection", "concernDehydration", "concernGastric"],
      see_doctor: true,
      isOffline: true
    };
  }

  // Default GREEN
  return {
    triage: "GREEN",
    confidence: "MEDIUM",
    reason: "triageGreenReason",
    advice: "triageGreenAdvice",
    possible_concerns: ["concernMalaise", "concernFatigue"],
    see_doctor: false,
    isOffline: true
  };
}
