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
  Award,
  TrendingUp,
  AlertTriangle,
  Flame,
  CheckCircle,
  Stethoscope,
  Droplet,
  Moon
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { ClinicalDisclaimer } from "./ClinicalDisclaimer";

interface HomeViewProps {
  setActiveTab: (tab: string) => void;
  setActiveCall: (active: boolean) => void;
  userProfile: any;
  onEditProfile: () => void;
  recordsList: any[];
  vitalsHistory: any[];
}

export const HomeView: React.FC<HomeViewProps> = React.memo(({
  setActiveTab,
  setActiveCall,
  userProfile,
  onEditProfile,
  recordsList = [],
  vitalsHistory = []
}) => {
  const { language, setLanguage, t } = useLanguage();

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

  const displayUserName = userProfile?.name?.split(" ")[0] || "Vishal";

  // Time-based Greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
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

  // Water Intake Interactive State
  const [waterIntake, setWaterIntake] = useState(() => {
    if (typeof window !== "undefined") {
      return Number(localStorage.getItem("saathi_water_intake") || "1.2");
    }
    return 1.2;
  });

  const addWater = () => {
    const nextWater = Math.min(4.0, Number((waterIntake + 0.25).toFixed(2)));
    setWaterIntake(nextWater);
    if (typeof window !== "undefined") {
      localStorage.setItem("saathi_water_intake", String(nextWater));
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
      <div className="bg-white border border-gray-150 rounded-2xl p-2 shadow-sm">
        <div className="flex justify-between items-center text-center text-xs font-bold text-slate-400 px-1">
          <span className="w-8 py-2.5 hover:text-violet-600 transition-colors cursor-pointer hover:bg-violet-50/50 rounded-xl">09</span>
          <span className="w-8 py-2.5 hover:text-violet-600 transition-colors cursor-pointer hover:bg-violet-50/50 rounded-xl">10</span>
          <span className="w-8 py-2.5 hover:text-violet-600 transition-colors cursor-pointer hover:bg-violet-50/50 rounded-xl">11</span>
          <span className="bg-gradient-to-r from-violet-600 to-purple-650 text-white shadow-md rounded-xl px-4 py-2 text-[10px] font-black tracking-wider uppercase">
            Today, 12 Jun
          </span>
          <span className="w-8 py-2.5 hover:text-violet-600 transition-colors cursor-pointer hover:bg-violet-50/50 rounded-xl">13</span>
          <span className="w-8 py-2.5 hover:text-violet-600 transition-colors cursor-pointer hover:bg-violet-50/50 rounded-xl">14</span>
          <span className="w-8 py-2.5 hover:text-violet-600 transition-colors cursor-pointer hover:bg-violet-50/50 rounded-xl">15</span>
        </div>
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
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Health Score</span>
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-800 leading-none">85<span className="text-xs text-slate-400 font-bold">/100</span></h3>
            </div>
            <span className="inline-flex bg-violet-100 text-violet-750 border border-violet-200 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full">
              Excellent
            </span>
            <p className="text-[10px] text-slate-400 font-medium max-w-[140px] leading-relaxed pt-1">
              Your health metrics are optimal today. Keep it up!
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
                className="stroke-violet-600 transition-all duration-1000 ease-out"
                strokeWidth="6"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 36}
                strokeDashoffset={2 * Math.PI * 36 * 0.15} // 85% progress
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-20">
              <span className="text-base font-black text-slate-800">85%</span>
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
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Last Screening</span>
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
                    {latestScreeningRisk || "Low"} Risk
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">{latestScreening.date}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-700">No Screenings Recorded</p>
                <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                  Run a camera-based AI screening for anemia & jaundice.
                </p>
              </div>
            )}
          </div>
          <button 
            onClick={() => setActiveTab("screen")}
            className="w-full mt-4 bg-violet-600 hover:bg-violet-700 text-white font-bold text-[11px] py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm"
          >
            <span>Perform New Scan</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 4. VITALS SUMMARY GRID */}
      <div className="grid grid-cols-2 gap-4">
        {/* Oxygen Card */}
        <div className="bg-white border border-gray-150 rounded-3xl p-4.5 flex flex-col justify-between min-h-[120px] shadow-sm">
          <div className="flex justify-between items-start">
            <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-750 font-black text-xs flex items-center justify-center shadow-sm">
              O2
            </div>
            <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 text-[8px] font-black uppercase px-2 py-0.5 rounded-full">
              Optimal
            </span>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Oxygen Level</span>
            <h4 className="text-xl font-black text-slate-800 leading-none">
              {currentOxygen}%
            </h4>
          </div>
        </div>

        {/* Heart Rate Card */}
        <div className="bg-white border border-gray-150 rounded-3xl p-4.5 flex flex-col justify-between min-h-[120px] shadow-sm">
          <div className="flex justify-between items-start">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shadow-sm">
              <Heart className="w-4 h-4 fill-rose-500/20 text-rose-500 animate-pulse" />
            </div>
            <span className="bg-rose-50 text-rose-600 border border-rose-100 text-[8px] font-black uppercase px-2 py-0.5 rounded-full">
              Steady
            </span>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Heart Rate</span>
            <h4 className="text-xl font-black text-slate-800 leading-none">
              {currentHeartRate} <span className="text-xs text-slate-400 font-semibold">bpm</span>
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
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Water Intake</span>
            </div>
            <button 
              onClick={addWater}
              className="bg-violet-600 hover:bg-violet-700 text-white w-8 h-8 rounded-xl flex items-center justify-center shadow-sm active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-slate-800">{waterIntake.toFixed(2)}</span>
            <span className="text-xs text-slate-400 font-bold">L / 3.0 L</span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200/20">
            <div 
              className="h-full bg-gradient-to-r from-violet-600 to-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (waterIntake / 3.0) * 100)}%` }}
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
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sleep Summary</span>
            </div>
            <span className="bg-violet-100 text-violet-700 border border-violet-200 text-[8px] font-black uppercase px-2 py-0.5 rounded-full">
              Restful
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-slate-800">7h 45m</span>
            <span className="text-xs text-slate-400 font-semibold">Last Night</span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium">
            Deep Sleep: <span className="text-slate-700 font-bold">3h 10m</span> • Light Sleep: 4h 35m
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
              AI Health Insight
            </span>
            <p className="text-xs font-bold leading-normal text-violet-950 pt-1">
              "Your heart rate is steady, and your O2 level is exceptional today. Consider adding a brief 10-minute stretch routine post-lunch to maintain metabolic flow."
            </p>
          </div>
        </div>
      </div>

      {/* 7. UPCOMING REMINDERS */}
      <div className="bg-white border border-gray-150 rounded-3xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Today's Reminders</h3>
          <span className="text-[10px] text-violet-600 font-bold">
            {reminders.filter(r => !r.done).length} Pending
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
                  {rem.text}
                </span>
              </div>
              <span className="text-[9px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                {rem.time}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 8. DAILY GOALS */}
      <div className="bg-white border border-gray-150 rounded-3xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Daily Goal Tracker</h3>
          <TrendingUp className="w-4 h-4 text-violet-600" />
        </div>

        <div className="space-y-4">
          {/* Calorie Burn */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500/10" /> Calorie Burn
              </span>
              <span className="text-slate-700">380 / 500 kcal</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/20">
              <div className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-500" style={{ width: "76%" }} />
            </div>
          </div>

          {/* Active Minutes */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-violet-600" /> Active Time
              </span>
              <span className="text-slate-700">45 / 60 mins</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/20">
              <div className="h-full bg-gradient-to-r from-violet-600 to-purple-600 rounded-full transition-all duration-500" style={{ width: "75%" }} />
            </div>
          </div>
        </div>
      </div>

      {/* 9. EMERGENCY CONTACT */}
      <div className="bg-rose-50/50 border border-rose-100 rounded-3xl p-5 flex items-center justify-between flex-wrap gap-4 shadow-sm">
        <div className="space-y-1">
          <h4 className="text-xs font-black text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-rose-500 animate-pulse" /> Emergency Contact
          </h4>
          <p className="text-[10px] text-rose-600 font-bold leading-normal">
            Need urgent medical help or consultation?
          </p>
        </div>
        <button
          onClick={() => setActiveCall(true)}
          className="bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-2xl shadow-sm active:scale-95 transition-all flex items-center gap-1.5"
        >
          <Phone className="w-3.5 h-3.5" />
          <span>Consult Now</span>
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
              {langCode === "en" ? "🇺🇸 English" : langCode === "hi" ? "🇮🇳 हिंदी" : "🇮🇳 ગુજરાતી"}
            </button>
          ))}
        </div>
      </div>

      {/* 11. QUICK HEALTH TIP */}
      <div className="bg-violet-50/30 border border-violet-100 rounded-3xl p-5 flex gap-3 text-left shadow-sm">
        <div className="text-violet-600 shrink-0">
          <Sparkles className="w-5 h-5 fill-violet-600/10 text-violet-600 animate-pulse" />
        </div>
        <div className="space-y-1">
          <span className="text-xs font-bold text-violet-750">{t.quickHealthTip}</span>
          <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
            {t.healthTipText}
          </p>
        </div>
      </div>

      <ClinicalDisclaimer />
    </div>
  );
});

HomeView.displayName = "HomeView";
