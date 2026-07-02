interface ComputeScoreParams {
  latestScreeningRisk: "Low" | "Moderate" | "High" | null;
  latestVitals: {
    heartRate?: number;
    oxygen?: number;
  } | null;
  conditions: string[];
}

interface HealthScoreResult {
  score: number;
  label: string;
  color: "green" | "yellow" | "red";
  biggestFactorKey: string;
  biggestFactor: string;
}

export function computeHealthScore(params: ComputeScoreParams, lang: string): HealthScoreResult {
  let score = 100;
  let biggestFactorKey = "none";
  let screeningDeduction = 0;
  let vitalsDeduction = 0;
  let conditionsDeduction = 0;

  // 1. Screening Risk deduction
  if (params.latestScreeningRisk === "High") {
    screeningDeduction = 25;
  } else if (params.latestScreeningRisk === "Moderate") {
    screeningDeduction = 15;
  } else if (params.latestScreeningRisk === "Low") {
    screeningDeduction = 5;
  }

  // 2. Vitals deduction
  if (params.latestVitals) {
    const { heartRate, oxygen } = params.latestVitals;
    // O2 Saturation
    if (oxygen !== undefined) {
      if (oxygen < 90) {
        vitalsDeduction += 30;
      } else if (oxygen < 95) {
        vitalsDeduction += 15;
      }
    }
    // Heart Rate
    if (heartRate !== undefined) {
      if (heartRate > 120 || heartRate < 50) {
        vitalsDeduction += 20;
      } else if (heartRate > 100 || heartRate < 60) {
        vitalsDeduction += 10;
      }
    }
  }

  // 3. Conditions deduction
  if (params.conditions && params.conditions.length > 0) {
    conditionsDeduction = Math.min(30, params.conditions.length * 10);
  }

  // Deduct from total score
  score = Math.max(10, score - screeningDeduction - vitalsDeduction - conditionsDeduction);

  // Determine biggest factor key
  const maxDeduction = Math.max(screeningDeduction, vitalsDeduction, conditionsDeduction);
  if (maxDeduction > 0) {
    if (maxDeduction === screeningDeduction) {
      biggestFactorKey = "screening";
    } else if (maxDeduction === vitalsDeduction) {
      biggestFactorKey = "vitals";
    } else {
      biggestFactorKey = "conditions";
    }
  }

  // Map biggestFactorKey to translated string
  let biggestFactor = "";
  if (biggestFactorKey === "screening") {
    biggestFactor = lang === "hi" ? "स्क्रीनिंग परिणाम" : lang === "gu" ? "સ્ક્રિનિંગ પરિણામો" : "Screening findings";
  } else if (biggestFactorKey === "vitals") {
    biggestFactor = lang === "hi" ? "हाल के वाइटल्स" : lang === "gu" ? "તાજેતરના વાઇટલ્સ" : "Recent vital signs";
  } else if (biggestFactorKey === "conditions") {
    biggestFactor = lang === "hi" ? "पुरानी बीमारियाँ" : lang === "gu" ? "લાંબા ગાળાની બીમારીઓ" : "Chronic conditions";
  } else {
    biggestFactor = lang === "hi" ? "कोई नहीं" : lang === "gu" ? "કોઈ નહીં" : "None";
  }

  // Label and color
  let label = "";
  let color: "green" | "yellow" | "red" = "green";

  if (score >= 80) {
    color = "green";
    label = lang === "hi" ? "उत्कृष्ट" : lang === "gu" ? "ઉત્કૃષ્ટ" : "Excellent";
  } else if (score >= 50) {
    color = "yellow";
    label = lang === "hi" ? "मध्यम" : lang === "gu" ? "મધ્યમ" : "Fair";
  } else {
    color = "red";
    label = lang === "hi" ? "ध्यान दें" : lang === "gu" ? "ધ્યાન આપો" : "Action Needed";
  }

  return {
    score,
    label,
    color,
    biggestFactorKey,
    biggestFactor
  };
}

export function getImproveTip(biggestFactorKey: string, lang: string): { text: string; tab: string } {
  if (biggestFactorKey === "screening") {
    return {
      text: lang === "hi"
        ? "स्क्रीनिंग परिणामों के अनुसार डॉक्टर से परामर्श लें।"
        : lang === "gu"
        ? "સ્ક્રીનીંગ પરિણામો અનુસાર ડૉક્ટરની સલાહ લો."
        : "Schedule a clinician follow-up to address recent screening findings.",
      tab: "screen"
    };
  }
  if (biggestFactorKey === "vitals") {
    return {
      text: lang === "hi"
        ? "नियमित रूप से वाइटल्स की जांच करें और थोड़ा विश्राम करें।"
        : lang === "gu"
        ? "નિયમિત રીતે વાઇટલ્સ તપાસો અને આરામ કરો."
        : "Monitor your vitals daily and keep hydrated. Avoid heavy physical strain.",
      tab: "vitals"
    };
  }
  if (biggestFactorKey === "conditions") {
    return {
      text: lang === "hi"
        ? "अपनी स्वास्थ्य स्थितियों के लिए निर्धारित दवाएं समय पर लें।"
        : lang === "gu"
        ? "તમારી સ્વાસ્થ્ય સ્થિતિઓ માટે સૂચવેલ દવાઓ સમયસર લો."
        : "Stay consistent with your active care plans and daily medications.",
      tab: "medicines"
    };
  }
  return {
    text: lang === "hi"
      ? "अच्छा काम! संतुलित आहार लें और नियमित रूप से टहलें।"
      : lang === "gu"
      ? "સરસ! સંતુલિત આહાર લો અને નિયમિત ચાલવાનું રાખો."
      : "Maintain your healthy routines: balanced nutrition and daily light walks.",
    tab: "home"
  };
}
