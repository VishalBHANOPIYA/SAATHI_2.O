export type BMICategory =
  | 'severely_underweight'
  | 'underweight'
  | 'normal'
  | 'overweight'
  | 'obese_1'
  | 'obese_2';

export interface BMIResult {
  bmi: number;           // rounded to 1 decimal
  category: BMICategory;
  label: string;         // "Normal", "Overweight" etc
  color: string;         // Tailwind color name
  colorHex: string;      // #hex for charts/SVG
  emoji: string;
  idealWeightMin: number; // ideal weight range
  idealWeightMax: number;
  weightToLose: number;   // 0 if normal/under
  weightToGain: number;   // 0 if normal/over
  riskLevel: 'low' | 'moderate' | 'high';
}

export function calculateBMI(
  weightKg: number,
  heightCm: number
): BMIResult | null {
  if (!weightKg || !heightCm ||
      weightKg <= 0 || heightCm <= 0)
    return null;

  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  const bmiRounded = Math.round(bmi * 10) / 10;

  // Indian BMI thresholds (WHO Asia-Pacific)
  let category: BMICategory;
  if (bmiRounded < 16) 
    category = 'severely_underweight';
  else if (bmiRounded < 18.5)
    category = 'underweight';
  else if (bmiRounded < 23)
    category = 'normal';
  else if (bmiRounded < 27.5)
    category = 'overweight';
  else if (bmiRounded < 32.5)
    category = 'obese_1';
  else
    category = 'obese_2';

  // Ideal weight: BMI 18.5-23 for Indians
  const idealMin =
    Math.round(18.5 * heightM * heightM * 10)
    / 10;
  const idealMax =
    Math.round(23 * heightM * heightM * 10)
    / 10;

  const weightToLose =
    bmiRounded > 23
    ? Math.round((weightKg - idealMax) * 10) / 10
    : 0;
  const weightToGain =
    bmiRounded < 18.5
    ? Math.round((idealMin - weightKg) * 10) / 10
    : 0;

  const categoryData = {
    severely_underweight: {
      label: 'Severely Underweight',
      color: 'red',
      colorHex: '#EF4444',
      emoji: '⚠️',
      riskLevel: 'high' as const
    },
    underweight: {
      label: 'Underweight',
      color: 'amber',
      colorHex: '#F59E0B',
      emoji: '🟡',
      riskLevel: 'moderate' as const
    },
    normal: {
      label: 'Normal',
      color: 'emerald',
      colorHex: '#059669',
      emoji: '✅',
      riskLevel: 'low' as const
    },
    overweight: {
      label: 'Overweight',
      color: 'amber',
      colorHex: '#F59E0B',
      emoji: '🟡',
      riskLevel: 'moderate' as const
    },
    obese_1: {
      label: 'Obese (Class I)',
      color: 'orange',
      colorHex: '#EA580C',
      emoji: '🔴',
      riskLevel: 'high' as const
    },
    obese_2: {
      label: 'Obese (Class II)',
      color: 'red',
      colorHex: '#DC2626',
      emoji: '🔴',
      riskLevel: 'high' as const
    },
  };

  return {
    bmi: bmiRounded,
    ...categoryData[category],
    category,
    idealWeightMin: idealMin,
    idealWeightMax: idealMax,
    weightToLose,
    weightToGain,
  };
}

// BMI-based advice
export function getBMIAdvice(
  result: BMIResult,
  language: string
): string {
  const advice: Record<BMICategory,
    Record<string, string>> = {
    severely_underweight: {
      en: "Your BMI indicates severe underweight. Please consult a doctor immediately. Focus on nutritious foods: dal, rice, milk, eggs, nuts, and fruits.",
      hi: "आपका BMI गंभीर रूप से कम वजन दर्शाता है। तुरंत डॉक्टर से मिलें। दाल, चावल, दूध, अंडे, मेवे और फल खाएं।",
      gu: "તમારું BMI ગંભીર ઓછા વજનનું સૂચક છે। તરત ડૉક્ટરને મળો।"
    },
    underweight: {
      en: "You are slightly underweight. Eat more protein-rich foods like dal, paneer, eggs. Add healthy fats like ghee, nuts, avocado. Exercise regularly.",
      hi: "आप थोड़े कम वजन के हैं। दाल, पनीर, अंडे जैसे प्रोटीन युक्त खाद्य पदार्थ खाएं। घी, मेवे जोड़ें।",
      gu: "તમે થોડા ઓછા વજનના છો। વધુ પ્રોટીન ખાઓ: દાળ, પનીર, ઇંડા।"
    },
    normal: {
      en: "Great! Your BMI is in the healthy range. Maintain it with balanced diet and 30 min daily exercise. Keep drinking water!",
      hi: "बहुत अच्छा! आपका BMI स्वस्थ सीमा में है। संतुलित आहार और रोज 30 मिनट व्यायाम जारी रखें।",
      gu: "સરસ! તમારું BMI સ્વસ્થ સ્તરે છે। સંતુલિત આહાર જાળવો।"
    },
    overweight: {
      en: "You are slightly overweight. Reduce sugar, fried foods, and refined carbs. Walk 45 min daily. Eat more vegetables and fruits.",
      hi: "आप थोड़े अधिक वजन के हैं। चीनी, तली चीजें कम करें। रोज 45 मिनट पैदल चलें। सब्जियां और फल बढ़ाएं।",
      gu: "તમે થોડા વધારે વજના છો। ખાંડ, તળેલું ઓછું કરો। રોજ 45 મિનિટ ચાલો।"
    },
    obese_1: {
      en: "Your BMI indicates obesity. Please consult a doctor. Avoid sugary drinks, reduce portions. Start with daily 30-min walks.",
      hi: "आपका BMI मोटापा दर्शाता है। कृपया डॉक्टर से मिलें। मीठे पेय से बचें, हिस्सा कम करें।",
      gu: "તમારું BMI સ્થૂળતા સૂચવે છે। ડૉક્ટરની સલાહ લો।"
    },
    obese_2: {
      en: "Your BMI indicates severe obesity. Please see a doctor urgently. Medical supervision needed for safe weight loss.",
      hi: "आपका BMI गंभीर मोटापा दर्शाता है। तुरंत डॉक्टर से मिलें। सुरक्षित वजन घटाने के लिए चिकित्सा पर्यवेक्षण जरूरी है।",
      gu: "ગંભીર સ્થૂળતા. તરત ડૉક્ટરને મળો।"
    },
  };

  const langAdvice = advice[result.category];
  return langAdvice[language]
    || langAdvice['en'];
}

// For Nuskhe engine matching
export function getBMINuskheKeywords(
  category: BMICategory
): string[] {
  if (category === 'underweight' ||
      category === 'severely_underweight')
    return ['kamzori', 'weakness',
      'underweight', 'weight gain',
      'vajan badana', 'khoon ki kami'];
  if (category === 'overweight' ||
      category === 'obese_1' ||
      category === 'obese_2')
    return ['weight loss', 'vajan kam',
      'motapa', 'obesity', 'pet phool',
      'digestion', 'acidity'];
  return [];
}
