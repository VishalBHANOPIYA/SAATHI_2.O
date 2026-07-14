"use client";

import React, { useState } from "react";
import {
  Heart,
  ChevronRight,
  Activity,
  Mic,
  Sparkles,
  Phone,
  Bell,
  Calendar,
  Plus,
  Minus,
  Award,
  TrendingUp,
  AlertTriangle,
  Flame,
  CheckCircle,
  Stethoscope,
  Droplet,
  Moon,
  Apple,
  Dumbbell,
  Target,
  Clock
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { ClinicalDisclaimer } from "./ClinicalDisclaimer";
import { computeHealthScore, getImproveTip } from "@/utils/healthScore";
import { BMICard } from "./BMICard";
import { calculateHealthPlan } from "@/utils/healthPlanCalculator";
import { stepCalorieBurn, getWaterGoalFromWeight } from "@/utils/bmiCalculator";
import { loadTodayTracker, saveTodayTracker, getStepGoalFromBMI, DailyTrackerData } from "@/utils/dailyTracker";

interface HomeViewProps {
  setActiveTab: (tab: string) => void;
  setActiveCall: (active: boolean) => void;
  userProfile: any;
  onEditProfile: () => void;
  recordsList: any[];
  vitalsHistory: any[];
  language?: string;
}

export const HomeView: React.FC<HomeViewProps> = React.memo(({
  setActiveTab,
  setActiveCall,
  userProfile,
  onEditProfile,
  recordsList = [],
  vitalsHistory = [],
  language: languageProp
}) => {
  const { language, setLanguage, t } = useLanguage();

  const [currentDate, setCurrentDate] = useState<Date | null>(null);

  React.useEffect(() => {
    setCurrentDate(new Date());
  }, []);

  // Extract latest screening risk
  const latestScreening = recordsList.find(r => r.doctor === "Saathi Camera AI Screening");
  let latestScreeningRisk: "Low" | "Moderate" | "High" | null = null;
  if (latestScreening) {
    const title = latestScreening.title || "";
    if (title.includes("High Risk")) {
      latestScreeningRisk = "High";
    } else if (title.includes("Moderate Risk")) {
      latestScreeningRisk = "Moderate";
    } else if (title.includes("Low Risk")) {
      latestScreeningRisk = "Low";
    }
  }

  // Extract latest vitals
  const latestVitalsEntry = vitalsHistory && vitalsHistory.length > 0 ? vitalsHistory[0] : null;
  const currentHeartRate = latestVitalsEntry?.heartRate ? Number(latestVitalsEntry.heartRate) : 78;
  const currentOxygen = latestVitalsEntry?.oxygen ? Number(latestVitalsEntry.oxygen) : 96.3;

  const computedScoreResult = React.useMemo(() => {
    const latestVitals = latestVitalsEntry
      ? {
          heartRate: latestVitalsEntry.heartRate ? Number(latestVitalsEntry.heartRate) : undefined,
          oxygen: latestVitalsEntry.oxygen ? Number(latestVitalsEntry.oxygen) : undefined,
        }
      : null;
    return computeHealthScore({
      latestScreeningRisk,
      latestVitals,
      conditions: userProfile?.conditions || []
    }, language);
  }, [latestScreeningRisk, latestVitalsEntry, userProfile, language]);

  const improveTip = React.useMemo(() => {
    return getImproveTip(computedScoreResult.biggestFactorKey, language);
  }, [computedScoreResult.biggestFactorKey, language]);

  const scoreColors = React.useMemo(() => {
    if (computedScoreResult.score >= 80) {
      return {
        text: "text-emerald-600",
        badge: "bg-emerald-100 text-emerald-750 border-emerald-200",
        stroke: "stroke-emerald-500",
      };
    } else if (computedScoreResult.score >= 50) {
      return {
        text: "text-amber-600",
        badge: "bg-amber-100 text-amber-750 border-amber-200",
        stroke: "stroke-amber-500",
      };
    } else {
      return {
        text: "text-rose-600",
        badge: "bg-rose-100 text-rose-750 border-rose-200",
        stroke: "stroke-rose-500",
      };
    }
  }, [computedScoreResult.score]);

  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (computedScoreResult.score / 100) * circumference;

  const displayUserName = userProfile?.name?.split(" ")[0] || "Vishal";

  const calendarDays = React.useMemo(() => {
    if (!currentDate) return [];
    const today = currentDate;
    const days = [];
    for (let i = -3; i <= 3; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      days.push({
        dayNum: String(d.getDate()).padStart(2, "0"),
        isToday: i === 0,
        formatted: d.toLocaleDateString(language === "hi" ? "hi-IN" : language === "gu" ? "gu-IN" : "en-US", { day: "numeric", month: "short" })
      });
    }
    return days;
  }, [currentDate, language]);

  const formattedToday = React.useMemo(() => {
    if (!currentDate) return "";
    const today = currentDate;
    const weekdayStr = today.toLocaleDateString(
      language === "hi" ? "hi-IN" : language === "gu" ? "gu-IN" : "en-US",
      { weekday: "long" }
    );
    const dateStr = today.toLocaleDateString(
      language === "hi" ? "hi-IN" : language === "gu" ? "gu-IN" : "en-US",
      { day: "numeric", month: "short" }
    );
    return `${weekdayStr}, ${dateStr}`;
  }, [currentDate, language]);

  // Time-based Greeting
  const getGreeting = () => {
    if (!currentDate) return language === "hi" ? "नमस्ते" : language === "gu" ? "નમસ્તે" : "Hello";
    const hour = currentDate.getHours();
    if (language === "hi") {
      if (hour < 12) return "शुभ प्रभात";
      if (hour < 17) return "शुभ दोपहर";
      return "शुभ संध्या";
    } else if (language === "gu") {
      if (hour < 12) return "શુભ સવાર";
      if (hour < 17) return "શુભ બપોર";
      return "શુભ સાંજ";
    } else {
      if (hour < 12) return "Good Morning";
      if (hour < 17) return "Good Afternoon";
      return "Good Evening";
    }
  };

  // Personal Health Plan calculation
  const healthPlan = React.useMemo(() => {
    if (
      userProfile?.age &&
      userProfile?.gender &&
      userProfile?.heightCm &&
      userProfile?.weightKg
    ) {
      return calculateHealthPlan(
        Number(userProfile.age),
        userProfile.gender,
        Number(userProfile.heightCm),
        Number(userProfile.weightKg),
        (userProfile.activityLevel || "sedentary") as any,
        userProfile.bmiCategory || "normal",
        language || "en"
      );
    }
    return null;
  }, [userProfile, language]);

  const dailyWaterGoal = healthPlan ? healthPlan.water.dailyLiters : 3.0;

  const [activePlanTab, setActivePlanTab] = useState<"nutrition" | "water_sleep" | "workout" | "weight">("nutrition");

  // Water Intake Interactive State (Auto-goal from BMI based on weight & activity)
  const weightKg = Number(userProfile?.weightKg) || 70;
  const activityLevel = userProfile?.activityLevel || "light";
  const waterGoalLiters = React.useMemo(() => {
    return getWaterGoalFromWeight(weightKg, activityLevel) / 1000;
  }, [weightKg, activityLevel]);
  const waterGoalGlasses = React.useMemo(() => {
    return Math.round(waterGoalLiters / 0.25);
  }, [waterGoalLiters]);

  const [tracker, setTracker] = useState<DailyTrackerData>(() => {
    return loadTodayTracker({
      stepGoal: getStepGoalFromBMI(userProfile?.bmiCategory || 'normal'),
      calorieGoal: userProfile?.calorieGoal || 2000,
      waterGoalGlasses,
      waterGoalLiters,
    });
  });

  React.useEffect(() => {
    const loaded = loadTodayTracker({
      stepGoal: getStepGoalFromBMI(userProfile?.bmiCategory || 'normal'),
      calorieGoal: userProfile?.calorieGoal || 2000,
      waterGoalGlasses,
      waterGoalLiters,
    });
    setTracker(loaded);
  }, [userProfile, waterGoalGlasses, waterGoalLiters]);

  const addWater = () => {
    setTracker(prev => {
      const updated = {
        ...prev,
        waterGlasses: prev.waterGlasses + 1,
        waterGoalGlasses,
        waterGoalLiters,
      };
      saveTodayTracker(updated);
      return updated;
    });
  };

  const removeWater = () => {
    setTracker(prev => {
      const updated = {
        ...prev,
        waterGlasses: Math.max(0, prev.waterGlasses - 1),
        waterGoalGlasses,
        waterGoalLiters,
      };
      saveTodayTracker(updated);
      return updated;
    });
  };

  // States for manual logs
  const [showCalorieInput, setShowCalorieInput] = useState(false);
  const [calorieInputVal, setCalorieInputVal] = useState("");
  const [showSleepInput, setShowSleepInput] = useState(false);
  const [sleepInputVal, setSleepInputVal] = useState("");

  const handleLogCalories = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(calorieInputVal, 10);
    if (!isNaN(val) && val > 0) {
      setTracker(prev => {
        const updated = {
          ...prev,
          caloriesConsumed: prev.caloriesConsumed + val,
        };
        saveTodayTracker(updated);
        return updated;
      });
      setCalorieInputVal("");
      setShowCalorieInput(false);
    }
  };

  const handleLogSleep = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(sleepInputVal);
    if (!isNaN(val) && val > 0) {
      setTracker(prev => {
        const updated = {
          ...prev,
          sleepHours: val,
        };
        saveTodayTracker(updated);
        return updated;
      });
      setSleepInputVal("");
      setShowSleepInput(false);
    }
  };

  // Reminder completion state
  const [reminders, setReminders] = useState([
    { id: 1, text: "Morning Meds (Multi-vitamin)", time: "09:00 AM", done: true, type: "med" },
    { id: 2, text: "Vitals Check (O2 & BP)", time: "12:00 PM", done: false, type: "check" },
    { id: 3, text: "Water Hydration Break", time: "03:00 PM", done: false, type: "water" },
    { id: 4, text: "Evening Meds (Iron Supp.)", time: "08:00 PM", done: false, type: "med" },
  ]);

  const toggleReminder = (id: number) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, done: !r.done } : r));
  };

  return (
    <div className="p-4 space-y-6 animate-fadeIn pb-24 text-left">
      
      {/* 1. HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div 
            onClick={onEditProfile}
            className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-650 flex items-center justify-center text-white font-black text-base cursor-pointer shadow-md hover:scale-105 active:scale-95 transition-all"
          >
            {displayUserName.charAt(0).toUpperCase()}
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{getGreeting()}</span>
            <h2 className="text-lg font-black text-slate-800 leading-tight">
              {displayUserName} 👋
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={onEditProfile}
            className="w-10 h-10 rounded-2xl bg-white border border-gray-150 flex items-center justify-center shadow-sm hover:bg-slate-50 active:scale-95 transition-all"
          >
            <Calendar className="w-[18px] h-[18px] text-violet-650" />
          </button>
          <div className="relative">
            <button className="w-10 h-10 rounded-2xl bg-white border border-gray-150 flex items-center justify-center shadow-sm hover:bg-slate-50 active:scale-95 transition-all">
              <Bell className="w-[18px] h-[18px] text-violet-650" />
            </button>
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>
          </div>
        </div>
      </div>

      {/* 2. CALENDAR DAY PICKER ROW */}
      <div className="bg-white border border-gray-150 rounded-2xl p-2 shadow-sm min-h-[46px] flex items-center justify-center">
        {currentDate ? (
          <div className="flex justify-between items-center text-center text-xs font-bold text-slate-400 px-1 w-full animate-fadeIn">
            {calendarDays.map((day, idx) => (
              day.isToday ? (
                <span key={idx} className="bg-gradient-to-r from-violet-600 to-purple-650 text-white shadow-md rounded-xl px-3 sm:px-4 py-2 text-[10px] font-black tracking-wider uppercase">
                  {formattedToday}
                </span>
              ) : (
                <span key={idx} className="w-8 py-2.5 hover:text-violet-600 transition-colors cursor-pointer hover:bg-violet-50/50 rounded-xl">
                  {day.dayNum}
                </span>
              )
            ))}
          </div>
        ) : (
          <div className="h-6 w-40 bg-slate-100 animate-pulse rounded-lg"></div>
        )}
      </div>

      {/* 3. HERO DASHBOARD ROW (Health Score & Active Screening) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Health Score Card */}
        <div className="bg-white border border-gray-150 rounded-3xl p-5 flex items-center justify-between relative shadow-sm">
          <div className="space-y-2 z-10">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-lg bg-violet-50 flex items-center justify-center">
                <Award className="w-3.5 h-3.5 text-violet-600" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.homeWellnessScore}</span>
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-800 leading-none">{computedScoreResult.score}<span className="text-xs text-slate-400 font-bold">/100</span></h3>
            </div>
            <span className={`inline-flex border text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full ${scoreColors.badge}`}>
              {computedScoreResult.label}
            </span>
            <p className="text-[10px] text-slate-400 font-medium max-w-[140px] leading-relaxed pt-1">
              {improveTip.text}
            </p>
          </div>
          <div className="relative w-24 h-24 flex items-center justify-center z-10">
            <div className="absolute inset-1.5 rounded-full bg-gradient-to-br from-slate-50 to-white shadow-inner" />
            <svg className="w-full h-full transform -rotate-90 relative z-10">
              <circle
                cx="48"
                cy="48"
                r="36"
                className="stroke-slate-100"
                strokeWidth="6"
                fill="transparent"
              />
              <circle
                cx="48"
                cy="48"
                r="36"
                className={`${scoreColors.stroke} transition-all duration-1000 ease-out`}
                strokeWidth="6"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-20">
              <span className="text-base font-black text-slate-800">{computedScoreResult.score}%</span>
              <span className="text-[7px] font-bold uppercase text-slate-400 tracking-wider">Score</span>
            </div>
          </div>
        </div>

        {/* Last Screening Result */}
        <div className="bg-white border border-gray-150 rounded-3xl p-5 flex flex-col justify-between shadow-sm">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-lg bg-violet-50 flex items-center justify-center">
                <Stethoscope className="w-3.5 h-3.5 text-violet-600" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.homeLastScreening}</span>
            </div>
            {latestScreening ? (
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-700 leading-normal">{latestScreening.title}</p>
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                    latestScreeningRisk === "High" 
                      ? "bg-rose-50 text-rose-600 border-rose-100" 
                      : latestScreeningRisk === "Moderate" 
                      ? "bg-amber-50 text-amber-600 border-amber-100" 
                      : "bg-emerald-50 text-emerald-600 border-emerald-100"
                  }`}>
                    {latestScreeningRisk === "High" ? t.screenHighRisk : latestScreeningRisk === "Moderate" ? t.screenModerateRisk : t.screenLowRisk}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">{latestScreening.date}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-700">{t.homeNoScreenings}</p>
                <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                  {t.homeNoScreeningsDesc}
                </p>
              </div>
            )}
          </div>
          <button 
            onClick={() => setActiveTab("screen")}
            className="w-full mt-4 bg-violet-600 hover:bg-violet-700 text-white font-bold text-[11px] py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm"
          >
            <span>{t.homePerformNewScan}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* BMI Card */}
      {userProfile?.bmi && (
        <div className="animate-fadeIn">
          <BMICard bmi={userProfile.bmi} compact={true} />
        </div>
      )}

      {/* 4. VITALS SUMMARY GRID */}
      <div className="grid grid-cols-2 gap-4">
        {/* Oxygen Card */}
        <div className="bg-white border border-gray-150 rounded-3xl p-4 flex flex-col justify-between h-[120px] relative overflow-hidden shadow-sm">
          <div className="flex justify-between items-center">
            <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-750 font-black text-[10px] flex items-center justify-center shadow-sm shrink-0">
              O2
            </div>
            <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 text-[8px] font-black uppercase px-2 py-0.5 rounded-full truncate max-w-[60px] text-center">
              {t.homeOptimal}
            </span>
          </div>
          <div className="space-y-0.5 mt-auto">
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">{t.homeOxygenLevel}</span>
            <h4 className="text-xl sm:text-2xl font-black text-slate-800 leading-none">
              {currentOxygen}%
            </h4>
          </div>
        </div>

        {/* Heart Rate Card */}
        <div className="bg-white border border-gray-150 rounded-3xl p-4 flex flex-col justify-between h-[120px] relative overflow-hidden shadow-sm">
          <div className="flex justify-between items-center">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shadow-sm shrink-0">
              <Heart className="w-4 h-4 fill-rose-500/20 text-rose-500 animate-pulse" />
            </div>
            <span className="bg-rose-50 text-rose-600 border border-rose-100 text-[8px] font-black uppercase px-2 py-0.5 rounded-full truncate max-w-[60px] text-center">
              {language === "hi" ? "स्थिर" : language === "gu" ? "સ્થિર" : "Steady"}
            </span>
          </div>
          <div className="space-y-0.5 mt-auto">
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">{t.homeHeartRate}</span>
            <h4 className="text-xl sm:text-2xl font-black text-slate-800 leading-none">
              {currentHeartRate} <span className="text-[9px] sm:text-xs text-slate-400 font-semibold">{t.vitalsBPM}</span>
            </h4>
          </div>
        </div>
      </div>

      {/* 5. INTERACTIVE WATER & SLEEP SUMMARY GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Water Widget */}
        <div className="bg-white border border-gray-150 rounded-3xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-violet-50 rounded-xl flex items-center justify-center">
                <Droplet className="w-4 h-4 text-violet-600 fill-violet-600/10" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.homeWaterIntake}</span>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={removeWater}
                className="bg-slate-150 hover:bg-slate-200 text-slate-700 w-8 h-8 rounded-xl flex items-center justify-center shadow-sm active:scale-95 transition-all"
                title="Decrease Water"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button 
                onClick={addWater}
                className="bg-violet-600 hover:bg-violet-700 text-white w-8 h-8 rounded-xl flex items-center justify-center shadow-sm active:scale-95 transition-all"
                title="Increase Water"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-slate-800">{(tracker.waterGlasses * 0.25).toFixed(2)}</span>
            <span className="text-xs text-slate-400 font-bold">{t.homeLiters} / {waterGoalLiters.toFixed(1)} {t.homeLiters}</span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200/20">
            <div 
              className="h-full bg-gradient-to-r from-violet-600 to-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, ((tracker.waterGlasses * 0.25) / waterGoalLiters) * 100)}%` }}
            />
          </div>
        </div>

        {/* Sleep Summary Card */}
        <div className="bg-white border border-gray-150 rounded-3xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-violet-50 rounded-xl flex items-center justify-center">
                <Moon className="w-4 h-4 text-violet-600 fill-violet-600/10" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.homeSleepSummary}</span>
            </div>
            <span className="bg-violet-100 text-violet-700 border border-violet-200 text-[8px] font-black uppercase px-2 py-0.5 rounded-full">
              {t.homeSleepRestful}
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-slate-800">{language === "hi" ? "7घंटे 45मिनट" : language === "gu" ? "7કલાક 45મિનિટ" : "7h 45m"}</span>
            <span className="text-xs text-slate-400 font-semibold">{t.homeSleepLastNight}</span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium">
            {t.homeSleepDeep}: <span className="text-slate-700 font-bold">3h 10m</span> • {t.homeSleepLight}: 4h 35m
          </p>
        </div>
      </div>

      {/* 6. AI INSIGHTS CARD */}
      <div className="bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100 rounded-3xl p-5 shadow-sm">
        <div className="flex items-start gap-3.5">
          <div className="bg-gradient-to-br from-violet-600 to-purple-600 p-2.5 rounded-xl text-white shadow-md shrink-0">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div className="space-y-1">
            <span className="text-[9px] bg-violet-100 text-violet-750 border border-violet-200 px-2.5 py-0.5 rounded-full font-black uppercase tracking-widest inline-block">
              {language === "hi" ? "एआई स्वास्थ्य अंतर्दृष्टि" : language === "gu" ? "AI આરોગ્ય આંતરદૃષ્ટિ" : "AI Health Insight"}
            </span>
            <p className="text-xs font-bold leading-normal text-violet-950 pt-1">
              {language === "hi" 
                ? '"आपकी हृदय गति स्थिर है, और आज आपका ऑक्सीजन स्तर असाधारण है। चयापचय प्रवाह को बनाए रखने के लिए दोपहर के भोजन के बाद 10 मिनट के खिंचाव (stretch) व्यायाम पर विचार करें।"' 
                : language === "gu" 
                ? '"આજે તમારા હૃદયના ધબકારા સ્થિર છે અને ઓક્સિજનનું સ્તર અસાધારણ છે. ચયાપચય જાળવી રાખવા માટે બપોરના ભોજન પછી ૧૦ મિનિટ હળવી કસરત કરવાનું વિચારો."' 
                : '"Your heart rate is steady, and your O2 level is exceptional today. Consider adding a brief 10-minute stretch routine post-lunch to maintain metabolic flow."'}
            </p>
          </div>
        </div>
      </div>

      {/* PERSONAL HEALTH PLAN */}
      <div className="bg-white border border-gray-150 rounded-3xl p-5 space-y-4 shadow-sm text-left">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-violet-50 rounded-xl flex items-center justify-center">
              <Award className="w-4 h-4 text-violet-600 fill-violet-600/10" />
            </div>
            <span className="text-[12px] font-black text-slate-700 uppercase tracking-wider">
              {t.healthPlanTitle || "Personal Health Plan"}
            </span>
          </div>
          {healthPlan && (
            <span className="text-[9px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
              {healthPlan.topPriority}
            </span>
          )}
        </div>

        {!healthPlan ? (
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-center space-y-3">
            <p className="text-xs font-semibold text-slate-500">
              {t.healthPlanNoProfile || "Complete your profile (age, gender, height, weight, activity level) to generate your personalized health plan!"}
            </p>
            <button
              onClick={onEditProfile}
              className="bg-violet-600 hover:bg-violet-700 text-white font-bold text-[10px] px-4 py-2 rounded-xl transition-all shadow-sm active:scale-95"
            >
              Configure Profile
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Tab Buttons */}
            <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-200/50">
              {[
                { id: "nutrition", label: t.healthPlanCalories || "Nutrition", icon: Apple },
                { id: "water_sleep", label: t.healthPlanSleep || "Water & Sleep", icon: Droplet },
                { id: "workout", label: t.healthPlanExercise || "Workout", icon: Dumbbell },
                { id: "weight", label: t.healthPlanWeight || "Weight", icon: Target },
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activePlanTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActivePlanTab(tab.id as any)}
                    className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all gap-1 ${
                      isActive 
                        ? "bg-white text-violet-600 shadow-soft font-bold border border-slate-100" 
                        : "text-slate-400 hover:text-slate-600 font-semibold"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="text-[8px] uppercase tracking-wide truncate max-w-full">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Contents */}
            <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 animate-fadeIn space-y-3.5">
              
              {/* NUTRITION & CALORIES TAB */}
              {activePlanTab === "nutrition" && (
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                        {t.healthPlanTarget || "Your Daily Target"}
                      </span>
                      <h4 className="text-2xl font-black text-slate-800">
                        {healthPlan.targetCalories} <span className="text-xs text-slate-400 font-bold">kcal / day</span>
                      </h4>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                        {t.healthPlanTDEE || "Calorie Burn"}
                      </span>
                      <span className="text-xs font-extrabold text-slate-600">
                        {healthPlan.tdee} kcal
                      </span>
                    </div>
                  </div>

                  {/* Macros breakdown */}
                  <div className="space-y-2 pt-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                      {t.healthPlanMacros || "Macro Breakdown"}
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-white p-2.5 rounded-xl border border-slate-100 text-center shadow-sm">
                        <span className="text-[8px] text-slate-400 font-bold block">{t.healthPlanProtein || "Protein"}</span>
                        <span className="text-xs font-black text-slate-700">{healthPlan.macros.protein}g</span>
                        <span className="text-[8px] text-slate-400 font-medium block mt-0.5">{healthPlan.macros.proteinKcal} kcal</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-slate-100 text-center shadow-sm">
                        <span className="text-[8px] text-slate-400 font-bold block">{t.healthPlanCarbs || "Carbs"}</span>
                        <span className="text-xs font-black text-slate-700">{healthPlan.macros.carbs}g</span>
                        <span className="text-[8px] text-slate-400 font-medium block mt-0.5">{healthPlan.macros.carbsKcal} kcal</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-slate-100 text-center shadow-sm">
                        <span className="text-[8px] text-slate-400 font-bold block">{t.healthPlanFats || "Fats"}</span>
                        <span className="text-xs font-black text-slate-700">{healthPlan.macros.fats}g</span>
                        <span className="text-[8px] text-slate-400 font-medium block mt-0.5">{healthPlan.macros.fatsKcal} kcal</span>
                      </div>
                    </div>
                  </div>

                  {/* Indian Diet Tips */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                      {language === "hi" ? "आहार सुझाव" : language === "gu" ? "આહાર સૂચનો" : "Indian Dietary Tips"}
                    </span>
                    <ul className="space-y-1.5">
                      {healthPlan.weightPlan.indianFoodTips.map((tip, idx) => (
                        <li key={idx} className="text-[10px] font-semibold text-slate-600 flex items-start gap-1.5 leading-relaxed">
                          <span className="text-violet-600 mt-1 shrink-0">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* WATER & SLEEP TAB */}
              {activePlanTab === "water_sleep" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white p-3 rounded-2xl border border-slate-150 shadow-sm flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <span className="text-[8px] text-slate-400 font-black uppercase tracking-wider">{t.healthPlanWater || "Water"}</span>
                        <Droplet className="w-3.5 h-3.5 text-blue-500 fill-blue-500/10" />
                      </div>
                      <div className="mt-2">
                        <h5 className="text-lg font-black text-slate-800 leading-none">{waterGoalLiters.toFixed(2)}L</h5>
                        <span className="text-[9px] text-slate-400 font-bold">{waterGoalGlasses} glasses</span>
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-2xl border border-slate-150 shadow-sm flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <span className="text-[8px] text-slate-400 font-black uppercase tracking-wider">{t.healthPlanSleep || "Sleep"}</span>
                        <Moon className="w-3.5 h-3.5 text-violet-600 fill-violet-600/10" />
                      </div>
                      <div className="mt-2">
                        <h5 className="text-lg font-black text-slate-800 leading-none">{healthPlan.sleep.recommendedHours} hrs</h5>
                        <span className="text-[9px] text-slate-400 font-bold">
                          {healthPlan.sleep.suggestedBedtime} - {healthPlan.sleep.suggestedWakeTime}
                        </span>
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-2xl border border-slate-150 shadow-sm flex flex-col justify-between col-span-2 text-[10px] text-slate-500 leading-normal space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-slate-700">
                        <Info className="w-3.5 h-3.5 text-blue-500" />
                        <span>{language === "hi" ? "जल लक्ष्य गणना (BMI आधारित)" : language === "gu" ? "પાણીના લક્ષ્યની ગણતરી (BMI આધારિત)" : "Water Goal Formula (BMI-based)"}</span>
                      </div>
                      <p className="opacity-90">
                        {language === "hi" 
                          ? `वजन के आधार पर: ${weightKg}kg * 35 = ${(weightKg * 35).toLocaleString()}ml + गतिविधि स्तर संशोधक (${
                              activityLevel === "sedentary" ? "0" : activityLevel === "light" ? "300" : activityLevel === "moderate" ? "500" : activityLevel === "active" ? "700" : "900"
                            }ml) + 300ml (जलवायु समायोजन), 1500ml और 4000ml के बीच सीमित।`
                          : language === "gu"
                          ? `વજનના આધારે: ${weightKg}kg * 35 = ${(weightKg * 35).toLocaleString()}ml + પ્રવૃત્તિ સ્તર મોડિફાયર (${
                              activityLevel === "sedentary" ? "0" : activityLevel === "light" ? "300" : activityLevel === "moderate" ? "500" : activityLevel === "active" ? "700" : "900"
                            }ml) + 300ml (હવામાન ગોઠવણ), 1500ml અને 4000ml વચ્ચે મર્યાદિત.`
                          : `Based on weight: ${weightKg}kg * 35 = ${(weightKg * 35).toLocaleString()}ml + activity level modifier (${
                              activityLevel === "sedentary" ? "0" : activityLevel === "light" ? "300" : activityLevel === "moderate" ? "500" : activityLevel === "active" ? "700" : "900"
                            }ml) + 300ml (climate adjustment), capped between 1500ml and 4000ml.`}
                      </p>
                    </div>
                  </div>

                  {/* Sleep tips list */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                      {language === "hi" ? "स्वस्थ नींद की आदतें" : language === "gu" ? "સ્વસ્થ ઊંઘની ટેવો" : "Sleep Hygiene Tips"}
                    </span>
                    <ul className="space-y-1.5">
                      {healthPlan.sleep.sleepTips.map((tip, idx) => (
                        <li key={idx} className="text-[10px] font-semibold text-slate-600 flex items-start gap-1.5 leading-relaxed">
                          <span className="text-violet-600 mt-1 shrink-0">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* WORKOUT TAB */}
              {activePlanTab === "workout" && (
                <div className="space-y-3">
                  <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-extrabold text-slate-700">{healthPlan.exercise.cardioType}</span>
                      <span className="text-[9px] font-bold text-slate-400">{healthPlan.exercise.cardioDuration} min • {healthPlan.exercise.cardioFrequency} days/wk</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-slate-100 pt-1.5">
                      <span className="text-xs font-extrabold text-slate-700">{healthPlan.exercise.strengthType}</span>
                      <span className="text-[9px] font-bold text-slate-400">{healthPlan.exercise.strengthDuration} min • {healthPlan.exercise.strengthFrequency} days/wk</span>
                    </div>
                  </div>

                  {/* Steps progress block in workout tab */}
                  <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <span>{language === "hi" ? "दैनिक कदम प्रगति" : language === "gu" ? "દૈનિક પગલાં પ્રગતિ" : "Daily Step Progress"}</span>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                        tracker.steps >= tracker.stepGoal
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                          : tracker.steps >= tracker.stepGoal * 0.5
                          ? "bg-amber-50 text-amber-600 border border-amber-100"
                          : "bg-slate-100 text-slate-400"
                      }`}>
                        {tracker.steps >= tracker.stepGoal
                          ? (language === "hi" ? "पूर्ण" : language === "gu" ? "પૂર્ણ" : "Completed")
                          : tracker.steps >= tracker.stepGoal * 0.5
                          ? (language === "hi" ? "ट्रैक पर" : language === "gu" ? "ટ્રેક પર" : "On Track")
                          : (language === "hi" ? "कम सक्रिय" : language === "gu" ? "ઓછી પ્રવૃત્તિ" : "Need Activity")}
                      </span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <h5 className="text-sm font-black text-slate-700">
                        {tracker.steps.toLocaleString()} / {tracker.stepGoal.toLocaleString()}
                      </h5>
                      <span className="text-[9px] text-slate-400 font-bold">
                        {Math.round((tracker.steps / tracker.stepGoal) * 100)}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/20">
                      <div
                        className="h-full bg-purple-600 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (tracker.steps / tracker.stepGoal) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                      {t.healthPlanWeeklyPlan || "Weekly Schedule"}
                    </span>
                    <div className="max-h-40 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
                      {healthPlan.exercise.weeklyPlan.map((dayPlan, idx) => (
                        <div key={idx} className="flex justify-between items-center py-1.5 px-2 bg-white rounded-lg border border-slate-100/80 text-[10px] font-semibold text-slate-600 shadow-sm">
                          <span className="font-extrabold text-slate-700 min-w-[60px]">{dayPlan.day}</span>
                          <span className="flex-1 truncate text-left px-2">{dayPlan.activity}</span>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                            dayPlan.intensity === 'rest' 
                              ? 'bg-slate-100 text-slate-400' 
                              : dayPlan.intensity === 'light' 
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                              : dayPlan.intensity === 'moderate'
                              ? 'bg-violet-50 text-violet-600 border border-violet-100'
                              : 'bg-rose-50 text-rose-600 border border-rose-100'
                          }`}>
                            {dayPlan.intensity === 'rest' ? 'Rest' : dayPlan.duration + ' min'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* WEIGHT GOAL TAB */}
              {activePlanTab === "weight" && (
                <div className="space-y-3">
                  <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-400">{t.healthPlanCurrentWeight || "Current"}</span>
                      <span className="text-slate-800 font-extrabold">{healthPlan.weightKg} kg</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold border-t border-slate-100 pt-1.5">
                      <span className="text-slate-400">{t.healthPlanTargetWeight || "Target"}</span>
                      <span className="text-slate-800 font-extrabold">{healthPlan.weightPlan.targetWeight} kg</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold border-t border-slate-100 pt-1.5">
                      <span className="text-slate-400">{t.healthPlanTimeline || "Timeline"}</span>
                      <span className="text-slate-800 font-extrabold">{healthPlan.weightPlan.weeksToGoal > 0 ? `${healthPlan.weightPlan.weeksToGoal} weeks (${healthPlan.weightPlan.targetDate})` : "Maintained"}</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-500 italic leading-relaxed text-center font-medium bg-white p-2 rounded-xl border border-slate-100">
                    "{healthPlan.motivationalMessage}"
                  </p>

                  {healthPlan.weightPlan.milestones.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                        Milestones Forecast
                      </span>
                      <div className="grid grid-cols-2 gap-1.5">
                        {healthPlan.weightPlan.milestones.map((m, idx) => (
                          <div key={idx} className="bg-white p-2 rounded-xl border border-slate-100 flex justify-between items-center text-[10px] font-semibold text-slate-600 shadow-sm">
                            <span className="text-slate-400">Week {m.week}</span>
                            <span className="font-extrabold text-slate-700">{m.expectedWeight} kg</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        )}
      </div>

      {/* 7. UPCOMING REMINDERS */}
      <div className="bg-white border border-gray-150 rounded-3xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">{t.homeTodayReminders}</h3>
          <span className="text-[10px] text-violet-600 font-bold">
            {reminders.filter(r => !r.done).length} {t.homePending}
          </span>
        </div>

        <div className="space-y-2.5">
          {reminders.map(rem => (
            <div 
              key={rem.id}
              onClick={() => toggleReminder(rem.id)}
              className={`p-3 rounded-2xl border transition-all flex items-center justify-between cursor-pointer active:scale-[0.99] ${
                rem.done 
                  ? "bg-slate-50/50 border-slate-100 opacity-60" 
                  : "bg-white border-slate-100 hover:border-violet-300 hover:bg-violet-50/30 shadow-sm"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                  rem.done 
                    ? "bg-violet-600 border-violet-600 text-white" 
                    : "border-slate-350 bg-white"
                }`}>
                  {rem.done && <CheckCircle className="w-3.5 h-3.5 fill-white text-violet-600" />}
                </div>
                <span className={`text-xs font-bold ${rem.done ? "line-through text-slate-400 font-medium" : "text-slate-700"}`}>
                  {rem.id === 1 
                    ? (language === "hi" ? "सुबह की दवाएं (मल्टी-विटामिन)" : language === "gu" ? "સવારની દવાઓ (મલ્ટી-વિટામિન)" : "Morning Meds (Multi-vitamin)")
                    : rem.id === 2
                    ? (language === "hi" ? "वाइटल्स जांच (O2 और बीपी)" : language === "gu" ? "વાઇટલ્સ તપાસ (O2 અને BP)" : "Vitals Check (O2 & BP)")
                    : rem.id === 3
                    ? (language === "hi" ? "पानी पीने का अंतराल" : language === "gu" ? "પાણી પીવાનો વિરામ" : "Water Hydration Break")
                    : rem.id === 4
                    ? (language === "hi" ? "शाम की दवाएं (आयरन सप्लीमेंट)" : language === "gu" ? "સાંજ की दवाएं (आयरन सप्लीमेंट)" : "Evening Meds (Iron Supp.)")
                    : rem.text}
                </span>
              </div>
              <span className="text-[9px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                {rem.time.replace("AM", language === "hi" ? "पूर्वाह्न" : language === "gu" ? "સવારે" : "AM").replace("PM", language === "hi" ? "अपराह्न" : language === "gu" ? "સાંજે" : "PM")}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 8. DAILY GOALS */}
      <div className="bg-white border border-gray-150 rounded-3xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
            {language === "hi" ? "दैनिक लक्ष्य ट्रैकर" : language === "gu" ? "દૈનિક લક્ષ્ય ટ્રેકર" : "Daily Goal Tracker"}
          </h3>
          <TrendingUp className="w-4 h-4 text-violet-600" />
        </div>

        <div className="space-y-4">
          {/* 1. Steps Progress */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-purple-600" /> {language === "hi" ? "दैनिक कदम" : language === "gu" ? "દૈનિક પગલાં" : "Steps"}
              </span>
              <span className="text-slate-700">
                {tracker.steps.toLocaleString()} / {tracker.stepGoal.toLocaleString()} ({Math.round(Math.min(100, (tracker.steps / tracker.stepGoal) * 100))}%)
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/20">
              <div
                className="h-full bg-gradient-to-r from-purple-600 to-violet-505 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (tracker.steps / tracker.stepGoal) * 100)}%` }}
              />
            </div>
            <span className="text-[9px] text-purple-650 font-bold block pt-0.5">
              🔥 {stepCalorieBurn(tracker.steps, weightKg)} kcal burned from steps
            </span>
          </div>

          {/* 2. Water Intake Progress */}
          <div className="space-y-1.5 border-t border-slate-50 pt-2.5">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Droplet className="w-3.5 h-3.5 text-blue-500 fill-blue-500/10" /> {language === "hi" ? "पानी का सेवन" : language === "gu" ? "પાણીનો વપરાશ" : "Water Intake"}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-slate-700">
                  {(tracker.waterGlasses * 0.25).toFixed(2)}L / {waterGoalLiters.toFixed(1)}L ({tracker.waterGlasses} / {waterGoalGlasses} gl)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={removeWater}
                    className="bg-slate-50 hover:bg-slate-100 text-slate-600 font-extrabold text-[9px] px-2 py-1 rounded-xl transition-all shadow-sm active:scale-95 border border-slate-200/50"
                  >
                    {t("waterGlassRemove") || "- Glass (250ml)"}
                  </button>
                  <button
                    onClick={addWater}
                    className="bg-blue-50 hover:bg-blue-100 text-blue-600 font-extrabold text-[9px] px-2 py-1 rounded-xl transition-all shadow-sm active:scale-95 border border-blue-200/50"
                  >
                    {t("waterGlassAdd") || "+ Glass (250ml)"}
                  </button>
                </div>
              </div>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/20">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-sky-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (tracker.waterGlasses / waterGoalGlasses) * 100)}%` }}
              />
            </div>
          </div>

          {/* 3. Calories Consumed Progress */}
          <div className="space-y-1.5 border-t border-slate-50 pt-2.5">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500/10" /> {language === "hi" ? "कैलोरी सेवन" : language === "gu" ? "કેલરી વપરાશ" : "Calories"}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-slate-700">
                  {tracker.caloriesConsumed} / {tracker.calorieGoal} kcal
                </span>
                <button
                  onClick={() => setShowCalorieInput(!showCalorieInput)}
                  className="bg-orange-50 hover:bg-orange-100 text-orange-600 font-extrabold text-[10px] w-5 h-5 rounded-full flex items-center justify-center transition-all active:scale-95 border border-orange-200/30"
                >
                  +
                </button>
              </div>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/20">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (tracker.caloriesConsumed / tracker.calorieGoal) * 100)}%` }}
              />
            </div>
            {showCalorieInput && (
              <form onSubmit={handleLogCalories} className="flex gap-2 pt-1 animate-fadeIn">
                <input
                  type="number"
                  placeholder="Add kcal"
                  value={calorieInputVal}
                  onChange={(e) => setCalorieInputVal(e.target.value)}
                  className="flex-1 border border-slate-200 rounded-xl px-2 py-1 text-[11px] focus:outline-none focus:border-orange-500"
                />
                <button
                  type="submit"
                  className="bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-[9px] px-3 py-1 rounded-xl shadow-sm"
                >
                  Log
                </button>
              </form>
            )}
          </div>

          {/* 4. Active Minutes Progress */}
          <div className="space-y-1.5 border-t border-slate-50 pt-2.5">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-600" /> {language === "hi" ? "सक्रिय समय" : language === "gu" ? "સક્રિય સમય" : "Active Time"}
              </span>
              <span className="text-slate-700">
                {tracker.activeMinutes} / {tracker.activeMinuteGoal} {language === "hi" ? "मिनट" : language === "gu" ? "મિનિટ" : "mins"}
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/20">
              <div
                className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (tracker.activeMinutes / tracker.activeMinuteGoal) * 100)}%` }}
              />
            </div>
          </div>

          {/* 5. Sleep Hours Progress */}
          <div className="space-y-1.5 border-t border-slate-50 pt-2.5">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Moon className="w-3.5 h-3.5 text-violet-600 fill-violet-600/10" /> {language === "hi" ? "नींद" : language === "gu" ? "ઊંઘ" : "Sleep"}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-slate-750 font-bold">
                  {tracker.sleepHours} / {tracker.sleepGoal} hrs
                </span>
                <button
                  onClick={() => setShowSleepInput(!showSleepInput)}
                  className="bg-violet-50 hover:bg-violet-100 text-violet-650 font-extrabold text-[10px] w-5 h-5 rounded-full flex items-center justify-center transition-all active:scale-95 border border-violet-250/35"
                >
                  +
                </button>
              </div>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/20">
              <div
                className="h-full bg-gradient-to-r from-violet-600 to-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (tracker.sleepHours / tracker.sleepGoal) * 100)}%` }}
              />
            </div>
            {showSleepInput && (
              <form onSubmit={handleLogSleep} className="flex gap-2 pt-1 animate-fadeIn">
                <input
                  type="number"
                  step="0.5"
                  placeholder="Hours slept last night"
                  value={sleepInputVal}
                  onChange={(e) => setSleepInputVal(e.target.value)}
                  className="flex-1 border border-slate-200 rounded-xl px-2 py-1 text-[11px] focus:outline-none focus:border-violet-500"
                />
                <button
                  type="submit"
                  className="bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-[9px] px-3 py-1 rounded-xl shadow-sm"
                >
                  Log
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* 9. EMERGENCY CONTACT */}
      <div className="bg-rose-50/50 border border-rose-100 rounded-3xl p-5 flex items-center justify-between flex-wrap gap-4 shadow-sm">
        <div className="space-y-1">
          <h4 className="text-xs font-black text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-rose-500 animate-pulse" /> {language === "hi" ? "आपातकालीन संपर्क" : language === "gu" ? "આપાતકાલીન સંપર્ક" : "Emergency Contact"}
          </h4>
          <p className="text-[10px] text-rose-600 font-bold leading-normal">
            {language === "hi" ? "त्वरित चिकित्सा सहायता या परामर्श की आवश्यकता है?" : language === "gu" ? "તાત્કાલિક તબીબી મદદ અથવા સલાહની જરૂર છે?" : "Need urgent medical help or consultation?"}
          </p>
        </div>
        <button
          onClick={() => setActiveCall(true)}
          className="bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-2xl shadow-sm active:scale-95 transition-all flex items-center gap-1.5"
        >
          <Phone className="w-3.5 h-3.5" />
          <span>{language === "hi" ? "परामर्श करें" : language === "gu" ? "સલાહ લો" : "Consult Now"}</span>
        </button>
      </div>

      {/* 10. LANGUAGE SELECTOR */}
      <div className="bg-white border border-gray-150 rounded-3xl p-5 text-left shadow-sm">
        <h4 className="text-[10px] font-bold text-slate-400 mb-3.5 uppercase tracking-wider">
          {t.selectLanguage} / भाषा बदलें / ભાષા બદલો
        </h4>
        <div className="grid grid-cols-3 gap-2">
          {["en", "hi", "gu"].map((langCode) => (
            <button
              key={langCode}
              onClick={() => setLanguage(langCode as any)}
              className={`py-2.5 px-1 text-[11px] font-extrabold rounded-2xl border text-center transition-all shadow-sm active:scale-95 ${
                language === langCode
                  ? "bg-gradient-to-r from-violet-600 to-purple-650 text-white border-transparent shadow-md"
                  : "bg-white text-slate-500 border-slate-200 hover:bg-violet-50/50 hover:text-violet-750"
              }`}
            >
              {langCode === "en" ? "🇮🇳 English" : langCode === "hi" ? "🇮🇳 हिंदी" : "🇮🇳 ગુજરાતી"}
            </button>
          ))}
        </div>
      </div>

      {/* 11. QUICK HEALTH TIP */}
      <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 flex gap-3 text-left shadow-sm">
        <div className="text-amber-650 shrink-0">
          <Sparkles className="w-5 h-5 fill-amber-600/10 text-amber-650 animate-pulse" />
        </div>
        <div className="space-y-1">
          <span className="text-xs font-bold text-amber-900">{t.quickHealthTip}</span>
          <p className="text-[11px] text-amber-800 leading-relaxed font-semibold">
            {t.healthTipText}
          </p>
        </div>
      </div>

      <ClinicalDisclaimer />
    </div>
  );
});

HomeView.displayName = "HomeView";
