// ─── TYPES ───────────────────────────────

export type ActivityLevel =
  | 'sedentary'      // desk job, no exercise
  | 'light'          // light exercise 1-3/week
  | 'moderate'       // moderate 3-5/week
  | 'active'         // hard exercise 6-7/week
  | 'very_active';   // athlete/physical job

export type WeightGoal =
  | 'lose_fast'      // -750 kcal/day (obese)
  | 'lose'           // -500 kcal/day
  | 'lose_slow'      // -250 kcal/day
  | 'maintain'       // TDEE
  | 'gain_slow'      // +300 kcal/day
  | 'gain';          // +500 kcal/day

export interface MacroBreakdown {
  protein: number;    // grams
  carbs: number;      // grams
  fats: number;       // grams
  proteinKcal: number;
  carbsKcal: number;
  fatsKcal: number;
}

export interface ExercisePlan {
  cardioType: string;
  cardioDuration: number;    // minutes
  cardioFrequency: number;   // days per week
  strengthType: string;
  strengthDuration: number;
  strengthFrequency: number;
  weeklyMinutes: number;
  caloriesBurnedPerWeek: number;
  startingTip: string;
  weeklyPlan: {
    day: string;
    activity: string;
    duration: number;
    intensity: 'rest'|'light'|
              'moderate'|'high';
  }[];
}

export interface SleepPlan {
  recommendedHours: number;
  minHours: number;
  maxHours: number;
  suggestedBedtime: string;
  suggestedWakeTime: string;
  sleepTips: string[];
}

export interface WeightPlan {
  currentWeight: number;
  targetWeight: number;
  weeklyChange: number;   // kg per week
  totalToChange: number;  // kg
  weeksToGoal: number;
  monthsToGoal: number;
  targetDate: string;     // formatted date
  dailyCalorieAdjustment: number;
  strategy: string;       // description
  milestones: {
    week: number;
    expectedWeight: number;
  }[];
  indianFoodTips: string[];
}

export interface WaterPlan {
  dailyLiters: number;
  dailyMl: number;
  glassesPerDay: number;  // 250ml glasses
  schedule: {
    time: string;
    amount: string;
    tip: string;
  }[];
}

export interface HealthPlan {
  // Core inputs
  age: number;
  gender: string;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  bmi: number;
  bmiCategory: string;

  // Calculated values
  bmr: number;              // Base metabolic rate
  tdee: number;             // Total daily energy expenditure
  targetCalories: number;   // With goal adjustment
  macros: MacroBreakdown;
  water: WaterPlan;
  sleep: SleepPlan;
  exercise: ExercisePlan;
  weightPlan: WeightPlan;
  weightGoal: WeightGoal;

  // Summary
  topPriority: string;
  motivationalMessage: string;
}

// ─── MAIN CALCULATOR ─────────────────────

export function calculateHealthPlan(
  age: number,
  gender: string,
  heightCm: number,
  weightKg: number,
  activityLevel: ActivityLevel,
  bmiCategory: string,
  language: string = 'en'
): HealthPlan {

  // 1. BMR (Harris-Benedict Revised)
  let bmr: number;
  if (gender === 'Male') {
    bmr = 88.362
      + (13.397 * weightKg)
      + (4.799 * heightCm)
      - (5.677 * age);
  } else {
    bmr = 447.593
      + (9.247 * weightKg)
      + (3.098 * heightCm)
      - (4.330 * age);
  }
  bmr = Math.round(bmr);

  // 2. TDEE (Total Daily Energy Expenditure)
  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };
  const tdee = Math.round(
    bmr * activityMultipliers[activityLevel]
  );

  // 3. Weight Goal + Target Calories
  let weightGoal: WeightGoal;
  let calorieAdjustment: number;
  let weeklyChangeRate: number; // kg per week

  const bmi = weightKg /
    ((heightCm / 100) ** 2);

  if (bmiCategory === 'obese_2') {
    weightGoal = 'lose_fast';
    calorieAdjustment = -750;
    weeklyChangeRate = -0.75;
  } else if (bmiCategory === 'obese_1'
    || bmiCategory === 'overweight') {
    weightGoal = 'lose';
    calorieAdjustment = -500;
    weeklyChangeRate = -0.5;
  } else if (bmiCategory === 'normal') {
    weightGoal = 'maintain';
    calorieAdjustment = 0;
    weeklyChangeRate = 0;
  } else if (bmiCategory === 'underweight') {
    weightGoal = 'gain_slow';
    calorieAdjustment = +300;
    weeklyChangeRate = 0.25;
  } else { // severely_underweight
    weightGoal = 'gain';
    calorieAdjustment = +500;
    weeklyChangeRate = 0.4;
  }

  const targetCalories = Math.max(
    1200,  // never go below 1200
    Math.min(4000, tdee + calorieAdjustment)
  );

  // 4. MACROS
  // Protein: 1.6g/kg for active, 1.2g/kg others
  const proteinMultiplier =
    activityLevel === 'active' ||
    activityLevel === 'very_active'
    ? 1.6 : 1.2;
  const proteinG = Math.round(
    weightKg * proteinMultiplier
  );
  const proteinKcal = proteinG * 4;

  // Fats: 25-30% of calories
  const fatKcal = Math.round(
    targetCalories * 0.28
  );
  const fatG = Math.round(fatKcal / 9);

  // Carbs: remaining calories
  const carbKcal = Math.round(
    targetCalories - proteinKcal - fatKcal
  );
  const carbG = Math.round(carbKcal / 4);

  const macros: MacroBreakdown = {
    protein: proteinG,
    carbs: carbG,
    fats: fatG,
    proteinKcal,
    carbsKcal: carbKcal,
    fatsKcal: fatKcal,
  };

  // 5. WATER PLAN
  const baseWaterMl = Math.round(
    weightKg * 35
  );
  const exerciseWaterMl =
    activityLevel === 'sedentary' ? 0
    : activityLevel === 'light' ? 300
    : activityLevel === 'moderate' ? 500
    : 700;
  const climateWaterMl = 300; // India hot climate
  const totalWaterMl = Math.min(
    4000,
    baseWaterMl + exerciseWaterMl
      + climateWaterMl
  );
  const totalWaterL =
    Math.round(totalWaterMl / 100) / 10;
  const glasses = Math.round(totalWaterMl / 250);

  const water: WaterPlan = {
    dailyMl: totalWaterMl,
    dailyLiters: totalWaterL,
    glassesPerDay: glasses,
    schedule: [
      {
        time: '6:00 AM',
        amount: '500ml (2 glasses)',
        tip: language === 'hi' ? 'गुनगुने पानी से शुरू करें — मेटाबॉलिज्म बढ़ाता है' : language === 'gu' ? 'હૂંફાળા પાણીથી શરૂ કરો — ચયાપચય વધારે છે' : 'Start with warm water — boosts metabolism'
      },
      {
        time: '8:00 AM',
        amount: '250ml (1 glass)',
        tip: language === 'hi' ? 'नाश्ते से 30 मिनट पहले' : language === 'gu' ? 'નાસ્તાના ૩૦ મિનિટ પહેલાં' : '30 min before breakfast'
      },
      {
        time: '11:00 AM',
        amount: '500ml (2 glasses)',
        tip: language === 'hi' ? 'दोपहर के भोजन से पहले हाइड्रेशन' : language === 'gu' ? 'બપોર પહેલાંનું હાઇડ્રેશન' : 'Mid-morning hydration'
      },
      {
        time: '1:00 PM',
        amount: '250ml (1 glass)',
        tip: language === 'hi' ? 'दोपहर के भोजन से 30 मिनट पहले' : language === 'gu' ? 'બપોરના ભોજનના ૩૦ મિનિટ પહેલાં' : '30 min before lunch'
      },
      {
        time: '4:00 PM',
        amount: '500ml (2 glasses)',
        tip: language === 'hi' ? 'शाम का हाइड्रेशन' : language === 'gu' ? 'સાંજનું હાઇડ્રેશન' : 'Evening hydration'
      },
      {
        time: '6:00 PM',
        amount: '250ml (1 glass)',
        tip: language === 'hi' ? 'व्यायाम के बाद या टहलने से पहले' : language === 'gu' ? 'કસરત પછી અથવા ચાલતા પહેલાં' : 'Post-exercise or before walk'
      },
      {
        time: '8:00 PM',
        amount: '250ml (1 glass)',
        tip: language === 'hi' ? 'रात के खाने से 1 घंटा पहले' : language === 'gu' ? 'રાત્રિભોજનના ૧ કલાક પહેલાં' : '1 hour before dinner'
      },
      {
        time: '9:30 PM',
        amount: '250ml (1 glass)',
        tip: language === 'hi' ? 'सोने से पहले हल्का गुनगुना पानी' : language === 'gu' ? 'સૂતા પહેલાં હૂંફાળું પાણી' : 'Light warm water before sleep'
      },
    ].slice(0, Math.ceil(glasses / 1.5)),
  };

  // 6. SLEEP PLAN
  let sleepHours: number;
  let bedtime: string;
  let wakeTime: string;

  if (age < 18) {
    sleepHours = 9;
    bedtime = '9:30 PM';
    wakeTime = '6:30 AM';
  } else if (age <= 25) {
    sleepHours = 8;
    bedtime = '10:30 PM';
    wakeTime = '6:30 AM';
  } else if (age <= 50) {
    sleepHours = 7;
    bedtime = '10:30 PM';
    wakeTime = '5:30 AM';
  } else {
    sleepHours = 7;
    bedtime = '10:00 PM';
    wakeTime = '5:00 AM';
  }

  const sleep: SleepPlan = {
    recommendedHours: sleepHours,
    minHours: sleepHours - 1,
    maxHours: sleepHours + 1,
    suggestedBedtime: bedtime,
    suggestedWakeTime: wakeTime,
    sleepTips: language === 'hi' ? [
      'सोने से 1 घंटा पहले फोन से बचें',
      'बेडरूम को अंधेरा और ठंडा रखें (18-22°C)',
      'सोने से 2 घंटे पहले भारी भोजन न करें',
      'रोजाना सोने और जागने का समय एक ही रखें',
      'रात को हल्दी वाला गुनगुना दूध पिएं',
    ] : language === 'gu' ? [
      'સૂતા પહેલાં ૧ કલાક મોબાઈલથી દૂર રહો',
      'બેડરૂમ ઠંડુ અને અંધારું રાખો (18-22°C)',
      'સૂવાના ૨ કલાક પહેલાં ભારે ભોજન ન લેવું',
      'રોજ સૂવાનો અને જાગવાનો સમય સમાન રાખો',
      'રાત્રે હળદરવાળું દૂધ પીવાનો પ્રયત્ન કરો',
    ] : [
      'Avoid phone 1 hour before bed',
      'Keep bedroom dark and cool (18-22°C)',
      'No heavy meal 2 hours before sleep',
      'Same sleep & wake time daily',
      'Try warm milk with turmeric at night',
    ],
  };

  // 7. EXERCISE PLAN (BMI-based)
  let exercise: ExercisePlan;

  if (bmiCategory === 'severely_underweight'
    || bmiCategory === 'underweight') {
    exercise = {
      cardioType: language === 'hi' ? 'हल्का टहलना' : language === 'gu' ? 'હળવું ચાલવું' : 'Light walking',
      cardioDuration: 20,
      cardioFrequency: 3,
      strengthType: language === 'hi' ? 'बॉडीवेट व्यायाम (पुश-अप्स, स्क्वाट्स)' : language === 'gu' ? 'બોડીવેઇટ કસરતો (પુશ-અપ્સ, સ્ક્વોટ્સ)' : 'Bodyweight exercises (push-ups, squats)',
      strengthDuration: 20,
      strengthFrequency: 3,
      weeklyMinutes: 120,
      caloriesBurnedPerWeek: 400,
      startingTip: language === 'hi' ? 'ताकत पर ध्यान दें, कार्डियो पर नहीं। लक्ष्य मांसपेशियां बढ़ाना है।' : language === 'gu' ? 'શક્તિ પર ધ્યાન કેન્દ્રિત કરો, કાર્ડિયો પર નહીં. લક્ષ્ય સ્નાયુ વધારવાનું છે.' : 'Focus on strength, not cardio. Goal is muscle gain.',
      weeklyPlan: [
        { day: language === 'hi' ? 'सोमवार' : language === 'gu' ? 'સોમવાર' : 'Monday',
          activity: language === 'hi' ? 'हल्का टहलना + योग' : language === 'gu' ? 'હળવું ચાલવું + યોગ' : 'Light walk + Yoga',
          duration: 30, intensity: 'light' },
        { day: language === 'hi' ? 'मंगलवार' : language === 'gu' ? 'મંગળવાર' : 'Tuesday',
          activity: language === 'hi' ? 'बॉडीवेट स्ट्रेंथ' : language === 'gu' ? 'બોડીવેઇટ સ્ટ્રેન્થ' : 'Bodyweight strength',
          duration: 25, intensity: 'moderate' },
        { day: language === 'hi' ? 'बुधवार' : language === 'gu' ? 'બુધવાર' : 'Wednesday',
          activity: language === 'hi' ? 'आराम / स्ट्रेचिंग' : language === 'gu' ? 'આરામ / ખેંચાણ' : 'Rest / Stretching',
          duration: 15, intensity: 'rest' },
        { day: language === 'hi' ? 'गुरुवार' : language === 'gu' ? 'ગુરૂવાર' : 'Thursday',
          activity: language === 'hi' ? 'हल्का टहलना' : language === 'gu' ? 'હળવું ચાલવું' : 'Light walk',
          duration: 20, intensity: 'light' },
        { day: language === 'hi' ? 'शुक्रवार' : language === 'gu' ? 'શુક્રવાર' : 'Friday',
          activity: language === 'hi' ? 'बॉडीवेट स्ट्रेंथ' : language === 'gu' ? 'બોડીવેઇટ સ્ટ્રેન્થ' : 'Bodyweight strength',
          duration: 25, intensity: 'moderate' },
        { day: language === 'hi' ? 'शनिवार' : language === 'gu' ? 'શનિવાર' : 'Saturday',
          activity: language === 'hi' ? 'योग / लचीलापन' : language === 'gu' ? 'યોગ / ફ્લેક્સિબિલિટી' : 'Yoga / Flexibility',
          duration: 30, intensity: 'light' },
        { day: language === 'hi' ? 'रविवार' : language === 'gu' ? 'રવિવાર' : 'Sunday',
          activity: language === 'hi' ? 'आराम' : language === 'gu' ? 'આરામ' : 'Rest',
          duration: 0, intensity: 'rest' },
      ],
    };
  } else if (bmiCategory === 'normal') {
    exercise = {
      cardioType: language === 'hi' ? 'तेज टहलना / जॉगिंग' : language === 'gu' ? 'ઝડપી ચાલવું / જોગિંગ' : 'Brisk walking / jogging',
      cardioDuration: 30,
      cardioFrequency: 5,
      strengthType: language === 'hi' ? 'मिश्रित शक्ति प्रशिक्षण' : language === 'gu' ? 'મિશ્રિત સ્ટ્રેન્થ ટ્રેનિંગ' : 'Mixed strength training',
      strengthDuration: 20,
      strengthFrequency: 3,
      weeklyMinutes: 210,
      caloriesBurnedPerWeek: 1000,
      startingTip: language === 'hi' ? 'विविधता के साथ बनाए रखें — कार्डियो और स्ट्रेंथ को मिलाएं।' : language === 'gu' ? 'વિવિધતા સાથે જાળવો — કાર્ડિયો અને સ્ટ્રેન્થ મિક્સ કરો.' : 'Maintain with variety — mix cardio and strength.',
      weeklyPlan: [
        { day: language === 'hi' ? 'सोमवार' : language === 'gu' ? 'સોમવાર' : 'Monday',
          activity: language === 'hi' ? 'तेज टहलना / दौड़ना' : language === 'gu' ? 'ઝડપી ચાલવું / દોડવું' : 'Brisk walk / Run',
          duration: 35, intensity: 'moderate' },
        { day: language === 'hi' ? 'मंगलवार' : language === 'gu' ? 'મંગળવાર' : 'Tuesday',
          activity: language === 'hi' ? 'स्ट्रेंथ ट्रेनिंग' : language === 'gu' ? 'સ્ટ્રેન્થ ટ્રેનિંગ' : 'Strength training',
          duration: 30, intensity: 'high' },
        { day: language === 'hi' ? 'बुधवार' : language === 'gu' ? 'બુધવાર' : 'Wednesday',
          activity: language === 'hi' ? 'योग / तैरना' : language === 'gu' ? 'યોગ / સ્વિમિંગ' : 'Yoga / Swim',
          duration: 30, intensity: 'light' },
        { day: language === 'hi' ? 'गुरुवार' : language === 'gu' ? 'ગુરૂવાર' : 'Thursday',
          activity: language === 'hi' ? 'तेज टहलना' : language === 'gu' ? 'ઝડપી ચાલવું' : 'Brisk walk',
          duration: 35, intensity: 'moderate' },
        { day: language === 'hi' ? 'शुक्रवार' : language === 'gu' ? 'શુક્રવાર' : 'Friday',
          activity: language === 'hi' ? 'स्ट्रेंथ ट्रेनिंग' : language === 'gu' ? 'સ્ટ્રેન્થ ટ્રેનિંગ' : 'Strength training',
          duration: 30, intensity: 'high' },
        { day: language === 'hi' ? 'शनिवार' : language === 'gu' ? 'શનિવાર' : 'Saturday',
          activity: language === 'hi' ? 'बाहरी गतिविधि' : language === 'gu' ? 'આઉટડોર પ્રવૃત્તિ' : 'Outdoor activity',
          duration: 45, intensity: 'moderate' },
        { day: language === 'hi' ? 'रविवार' : language === 'gu' ? 'રવિવાર' : 'Sunday',
          activity: language === 'hi' ? 'आराम / हल्का टहलना' : language === 'gu' ? 'આરામ / હળવું ચાલવું' : 'Rest / Light walk',
          duration: 20, intensity: 'rest' },
      ],
    };
  } else if (bmiCategory === 'overweight') {
    exercise = {
      cardioType: language === 'hi' ? 'तेज टहलना' : language === 'gu' ? 'ઝડપી ચાલવું' : 'Brisk walking',
      cardioDuration: 45,
      cardioFrequency: 5,
      strengthType: language === 'hi' ? 'हल्का शक्ति प्रशिक्षण' : language === 'gu' ? 'હળવું સ્ટ્રેન્થ ટ્રેનિંગ' : 'Light strength training',
      strengthDuration: 20,
      strengthFrequency: 3,
      weeklyMinutes: 285,
      caloriesBurnedPerWeek: 1500,
      startingTip: language === 'hi' ? 'तीव्रता से अधिक निरंतरता जरूरी है। पहले रोज टहलें।' : language === 'gu' ? 'તીવ્રતા કરતા સાતત્ય વધુ મહત્વનું છે. પહેલા રોજ ચાલવાનું શરૂ કરો.' : 'Consistency > Intensity. Walk every day first.',
      weeklyPlan: [
        { day: language === 'hi' ? 'सोमवार' : language === 'gu' ? 'સોમવાર' : 'Monday',
          activity: language === 'hi' ? 'तेज टहलना 45 मिनट' : language === 'gu' ? 'ઝડપી ચાલવું ૪૫ મિનિટ' : 'Brisk walk 45 min',
          duration: 45, intensity: 'moderate' },
        { day: language === 'hi' ? 'मंगलवार' : language === 'gu' ? 'મંગળવાર' : 'Tuesday',
          activity: language === 'hi' ? 'स्ट्रेंथ + 20 मिनट टहलना' : language === 'gu' ? 'સ્ટ્રેન્થ + ૨૦ મિનિટ ચાલવું' : 'Strength + 20 min walk',
          duration: 50, intensity: 'moderate' },
        { day: language === 'hi' ? 'बुधवार' : language === 'gu' ? 'બુધવાર' : 'Wednesday',
          activity: language === 'hi' ? 'तेज टहलना 45 मिनट' : language === 'gu' ? 'ઝડપી ચાલવું ૪૫ મિનિટ' : 'Brisk walk 45 min',
          duration: 45, intensity: 'moderate' },
        { day: language === 'hi' ? 'गुरुवार' : language === 'gu' ? 'ગુરૂવાર' : 'Thursday',
          activity: language === 'hi' ? 'योग / तैरना' : language === 'gu' ? 'યોગ / સ્વિમિંગ' : 'Yoga / Swim',
          duration: 40, intensity: 'light' },
        { day: language === 'hi' ? 'शुक्रवार' : language === 'gu' ? 'શુક્રવાર' : 'Friday',
          activity: language === 'hi' ? 'स्ट्रेंथ + 20 मिनट टहलना' : language === 'gu' ? 'સ્ટ્રેન્થ + ૨૦ મિનિટ ચાલવું' : 'Strength + 20 min walk',
          duration: 50, intensity: 'moderate' },
        { day: language === 'hi' ? 'शनिवार' : language === 'gu' ? 'શનિવાર' : 'Saturday',
          activity: language === 'hi' ? 'लंबी सैर / साइकिल चलाना' : language === 'gu' ? 'લાંબી સવારી / સાયકલિંગ' : 'Long walk / Cycling',
          duration: 60, intensity: 'moderate' },
        { day: language === 'hi' ? 'रविवार' : language === 'gu' ? 'રવિવાર' : 'Sunday',
          activity: language === 'hi' ? 'आराम / हल्का स्ट्रेच' : language === 'gu' ? 'આરામ / હળવું ખેંચાણ' : 'Rest / Light stretch',
          duration: 15, intensity: 'rest' },
      ],
    };
  } else {
    // obese_1 or obese_2
    exercise = {
      cardioType: language === 'hi' ? 'सौम्य टहलना (जोड़ों के लिए सुरक्षित)' : language === 'gu' ? 'હળવું ચાલવું (સાંધા માટે સુરક્ષિત)' : 'Gentle walking (joint-safe)',
      cardioDuration: 20,
      cardioFrequency: 5,
      strengthType: language === 'hi' ? 'कुर्सी पर व्यायाम / पूल में टहलना' : language === 'gu' ? 'ખુરશી પર કસરત / પૂલમાં ચાલવું' : 'Chair exercises / Pool walking',
      strengthDuration: 15,
      strengthFrequency: 3,
      weeklyMinutes: 145,
      caloriesBurnedPerWeek: 700,
      startingTip: language === 'hi' ? 'जोड़ों की सुरक्षा के लिए धीमे शुरू करें। हर हफ्ते 5 मिनट बढ़ाएं।' : language === 'gu' ? 'સાંધાની સુરક્ષા માટે ધીમેથી શરૂ કરો. દર અઠવાડિયે ૫ મિનિટ વધારો.' : 'Start SLOW to protect joints. Increase by 5 min/week.',
      weeklyPlan: [
        { day: language === 'hi' ? 'सोमवार' : language === 'gu' ? 'સોમવાર' : 'Monday',
          activity: language === 'hi' ? 'सौम्य टहलना 20 मिनट' : language === 'gu' ? 'હળવું ચાલવું ૨૦ મિનિટ' : 'Gentle walk 20 min',
          duration: 20, intensity: 'light' },
        { day: language === 'hi' ? 'मंगलवार' : language === 'gu' ? 'મંગળવાર' : 'Tuesday',
          activity: language === 'hi' ? 'कुर्सी पर व्यायाम' : language === 'gu' ? 'ખુરશી પર કસરતો' : 'Chair exercises',
          duration: 20, intensity: 'light' },
        { day: language === 'hi' ? 'बुधवार' : language === 'gu' ? 'બુધવાર' : 'Wednesday',
          activity: language === 'hi' ? 'सौम्य टहलना 20 मिनट' : language === 'gu' ? 'હળવું ચાલવું ૨૦ મિનિટ' : 'Gentle walk 20 min',
          duration: 20, intensity: 'light' },
        { day: language === 'hi' ? 'गुरुवार' : language === 'gu' ? 'ગુરૂવાર' : 'Thursday',
          activity: language === 'hi' ? 'आराम / हल्का स्ट्रेच' : language === 'gu' ? 'આરામ / હળવું ખેંચાણ' : 'Rest / Gentle stretch',
          duration: 10, intensity: 'rest' },
        { day: language === 'hi' ? 'शुक्रवार' : language === 'gu' ? 'શુક્રવાર' : 'Friday',
          activity: language === 'hi' ? 'सौम्य टहलना 25 मिनट' : language === 'gu' ? 'હળવું ચાલવું ૨૫ મિનિટ' : 'Gentle walk 25 min',
          duration: 25, intensity: 'light' },
        { day: language === 'hi' ? 'शनिवार' : language === 'gu' ? 'શનિવાર' : 'Saturday',
          activity: language === 'hi' ? 'कुर्सी पर व्यायाम + सैर' : language === 'gu' ? 'ખુરશી પર કસરતો + ચાલવું' : 'Chair exercises + walk',
          duration: 30, intensity: 'light' },
        { day: language === 'hi' ? 'रविवार' : language === 'gu' ? 'રવિવાર' : 'Sunday',
          activity: language === 'hi' ? 'आराम' : language === 'gu' ? 'આરામ' : 'Rest',
          duration: 0, intensity: 'rest' },
      ],
    };
  }

  // 8. WEIGHT PLAN
  const heightM = heightCm / 100;

  // Target BMI: 21 (middle of Indian normal)
  const targetBMI = bmiCategory === 'normal'
    ? bmi  // maintain current
    : 21;
  const targetWeight = Math.round(
    targetBMI * heightM * heightM * 10
  ) / 10;

  const totalToChange = Math.abs(
    weightKg - targetWeight
  );
  const weeksToGoal = weeklyChangeRate !== 0
    ? Math.ceil(
        totalToChange / Math.abs(weeklyChangeRate)
      )
    : 0;
  const monthsToGoal =
    Math.ceil(weeksToGoal / 4.33);

  // Target date
  const targetDate = new Date();
  targetDate.setDate(
    targetDate.getDate() + weeksToGoal * 7
  );
  const targetDateStr = targetDate
    .toLocaleDateString(language === 'hi' ? 'hi-IN' : language === 'gu' ? 'gu-IN' : 'en-IN', {
      month: 'long', year: 'numeric'
    });

  // Milestones (every 4 weeks)
  const milestones = [];
  for (let w = 4;
    w <= Math.min(weeksToGoal, 24);
    w += 4) {
    milestones.push({
      week: w,
      expectedWeight: Math.round(
        (weightKg + weeklyChangeRate * w)
        * 10) / 10,
    });
  }

  // Indian food tips based on goal
  let indianFoodTips: string[] = [];
  if (language === 'hi') {
    indianFoodTips = weightGoal === 'maintain'
      ? [
          'सही हिस्से में दाल-चावल खाएं',
          'दैनिक रूप से मौसमी सब्जियां शामिल करें',
          'तली हुई चीजों के बजाय फल खाएं',
          'चीनी सीमित करें — गुड़ का उपयोग करें',
        ]
      : weightGoal === 'lose' ||
        weightGoal === 'lose_fast'
      ? [
          'सफेद चावल की जगह भूरा चावल (ब्राउन राइस) या बाजरा, ज्वार खाएं',
          'दाल और सब्जी बढ़ाएं — रोटी कम करें',
          'मैदा से बचें: समोसा, पूरी, बिस्कुट न खाएं',
          'मीठी लस्सी के बजाय नमकीन छाछ पिएं',
          'रात का भोजन 8 बजे से पहले करें',
          'चाय में चीनी न लें — तुलसी चाय पिएं',
          'नाश्ता: चिप्स के बजाय भुना चना, मखाना खाएं',
        ]
      : [
          'रोजाना दाल और रोटी में घी शामिल करें',
          '3 बार पूरा भोजन + 2 बार नाश्ता (केला, मेवा, दूध) लें',
          'रात को हल्दी वाला गुनगुना दूध पिएं',
          'प्रोटीन के लिए रोजाना अंडे या पनीर खाएं',
          'सूखे मेवे: हर सुबह 10 बादाम, 5 खजूर खाएं',
          'भोजन छोड़ना बंद करें',
        ];
  } else if (language === 'gu') {
    indianFoodTips = weightGoal === 'maintain'
      ? [
          'યોગ્ય માત્રામાં દાળ-ભાત લો',
          'દરેક ભોજનમાં મોસમી શાકભાજી ઉમેરો',
          'તળેલા નાસ્તાને બદલે ફળો ખાઓ',
          'ખાંડ મર્યાદિત કરો — ગોળ વાપરો',
        ]
      : weightGoal === 'lose' ||
        weightGoal === 'lose_fast'
      ? [
          'સફેદ ચોખાને બદલે બ્રાઉન રાઈસ અથવા બાજરી, જુવાર લો',
          'દાળ અને શાકભાજીનું પ્રમાણ વધારો — રોટલી અડધી કરો',
          'મેંદાથી બચો: સમોસા, પૂરી, બિસ્કિટ ન ખાઓ',
          'મીઠી લસ્સીને બદલે મોળી છાશ પીવો',
          'રાત્રિભોજન ૮ વાગ્યા પહેલાં કરો',
          'ચામાં ખાંડ બંધ કરો — તુલસી વાળી ચા લો',
          'નાસ્તો: ચિપ્સના બદલે શેકેલા ચણા, મખાના લો',
        ]
      : [
          'રોજ દાળ અને રોટલી પર ઘી લગાવો',
          '૩ આખું ભોજન + ૨ વાર નાસ્તો (કેળા, ડ્રાયફ્રૂટ્સ, દૂધ) લો',
          'રાત્રે હળદરવાળું ગરમ દૂધ પીવો',
          'પ્રોટીન માટે રોજ ઇંડા અથવા પનીર લો',
          'ડ્રાયફ્રૂટ્સ: રોજ સવારે ૧૦ બદામ, ૫ ખજૂર ખાઓ',
          'ભોજન ક્યારેય ન છોડો',
        ];
  } else {
    indianFoodTips = weightGoal === 'maintain'
      ? [
          'Dal-chawal in right portions',
          'Include seasonal vegetables daily',
          'Fruits as snacks instead of fried items',
          'Limit sugar — use jaggery instead',
        ]
      : weightGoal === 'lose' ||
        weightGoal === 'lose_fast'
      ? [
          'Replace white rice with brown rice or millets (bajra, jowar)',
          'Dal and sabzi — double the dal, half the roti',
          'Avoid maida: no samosa, puri, biscuits',
          'Buttermilk / chaas instead of lassi with sugar',
          'Eat dinner before 8 PM',
          'No sugar in chai — try tulsi chai',
          'Snack: roasted chana, makhana, not chips',
        ]
      : [
          'Add ghee to dal and roti daily',
          'Eat 3 full meals + 2 snacks (banana, nuts, milk)',
          'Drink full-fat milk with turmeric',
          'Include eggs or paneer daily for protein',
          'Dry fruits: 10 almonds, 5 dates every morning',
          'Avoid skipping meals',
        ];
  }

  const weightPlan: WeightPlan = {
    currentWeight: weightKg,
    targetWeight,
    weeklyChange: weeklyChangeRate,
    totalToChange: Math.round(
      totalToChange * 10) / 10,
    weeksToGoal,
    monthsToGoal,
    targetDate: targetDateStr,
    dailyCalorieAdjustment: calorieAdjustment,
    strategy: weightGoal === 'maintain'
      ? (language === 'hi' ? 'स्वस्थ वर्तमान वजन बनाए रखें' : language === 'gu' ? 'સ્વસ્થ વર્તમાન વજન જાળવો' : 'Maintain current healthy weight')
      : weightGoal.startsWith('lose')
      ? (language === 'hi' ? `प्रति सप्ताह ${Math.abs(weeklyChangeRate)} किलोग्राम सुरक्षित और क्रमिक रूप से घटाएं` : language === 'gu' ? `દર અઠવાડિયે ${Math.abs(weeklyChangeRate)} કિલોગ્રામ સુરક્ષિત અને ક્રમશઃ ઘટાડો` : `Lose ${Math.abs(weeklyChangeRate)}kg/week — safe, gradual`)
      : (language === 'hi' ? `प्रति सप्ताह ${weeklyChangeRate} किलोग्राम धीरे-धीरे और स्वस्थ रूप से बढ़ाएं` : language === 'gu' ? `દર અઠવાડિયે ${weeklyChangeRate} કિલોગ્રામ ધીમે ધીમે અને સ્વસ્થ રીતે વધારો` : `Gain ${weeklyChangeRate}kg/week — slow, healthy`),
    milestones,
    indianFoodTips,
  };

  // 9. MOTIVATIONAL MESSAGE
  const messages = {
    normal: language === 'hi' ? 'आप बहुत बढ़िया आकार में हैं! इसे बनाए रखें! 💪' : language === 'gu' ? 'તમે સરસ આકારમાં છો! આ જાળવી રાખો! 💪' : 'You are in great shape! Keep it up! 💪',
    overweight: language === 'hi' ? `${targetDateStr} तक ${totalToChange} किलोग्राम वजन कम करें — आप यह कर सकते हैं!` : language === 'gu' ? `${targetDateStr} સુધીમાં ${totalToChange} કિલોગ્રામ વજન ઘટાડો — તમે આ કરી શકો છો!` : `Lose ${totalToChange}kg by ${targetDateStr} — you can do it!`,
    obese_1: language === 'hi' ? 'हर कदम मायने रखता है। छोटे से शुरुआत करें, निरंतर रहें 🌟' : language === 'gu' ? 'દરેક પગલું મહત્વનું છે. નાની શરૂઆત કરો, સુસંગત રહો 🌟' : 'Every step counts. Start small, stay consistent 🌟',
    obese_2: language === 'hi' ? 'आपकी स्वास्थ्य यात्रा आज से शुरू हो रही है। डॉक्टर से भी सलाह लें।' : language === 'gu' ? 'તમારી સ્વાસ્થ્ય યાત્રા આજથી શરૂ થાય છે. ડૉક્ટરની સલાહ પણ લો.' : 'Your health journey starts today. Consult a doctor too.',
    underweight: language === 'hi' ? `${targetDateStr} तक ${totalToChange} किलोग्राम वजन बढ़ाएं — अच्छा खाएं! 🥗` : language === 'gu' ? `${targetDateStr} સુધીમાં ${totalToChange} કિલોગ્રામ વજન વધારો — સરસ ખાઓ! 🥗` : `Gain ${totalToChange}kg by ${targetDateStr} — eat well! 🥗`,
    severely_underweight: language === 'hi' ? 'कृपया डॉक्टर से मिलें। पोषण ही प्राथमिकता है।' : language === 'gu' ? 'કૃપા કરીને ડૉક્ટરને મળો. પોષણ જ પ્રાથમિકતા છે.' : 'Please see a doctor. Nutrition is priority #1.',
  };

  return {
    age, gender, heightCm, weightKg,
    activityLevel, bmi: bmi,
    bmiCategory,
    bmr, tdee, targetCalories, macros,
    water, sleep, exercise, weightPlan,
    weightGoal,
    topPriority:
      bmiCategory === 'normal'
      ? (language === 'hi' ? 'अपनी स्वस्थ जीवनशैली बनाए रखें' : language === 'gu' ? 'તમારી સ્વસ્થ જીવનશૈલી જાળવી રાખો' : 'Maintain your healthy lifestyle')
      : bmiCategory.includes('over')
        || bmiCategory.includes('obese')
      ? (language === 'hi' ? 'दैनिक 30 मिनट टहलें + चीनी कम करें' : language === 'gu' ? 'દરરોજ ૩૦ મિનિટ ચાલો + ખાંડ ઓછી કરો' : 'Daily 30-min walk + reduce sugar')
      : (language === 'hi' ? 'अधिक प्रोटीन खाएं + स्ट्रेंथ ट्रेनिंग करें' : language === 'gu' ? 'વધુ પ્રોટીન ખાઓ + સ્ટ્રેન્થ ટ્રેનિંગ કરો' : 'Eat more protein + strength training'),
    motivationalMessage:
      messages[bmiCategory as keyof typeof messages]
      || 'Stay healthy! 🌿',
  };
}
