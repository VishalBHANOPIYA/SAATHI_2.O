import React, { useState } from "react";
import {
  Heart,
  ChevronRight,
  ShieldAlert,
  Activity,
  Mic,
  Video,
  FileText,
  Pill,
  Sparkles,
  Phone,
  Bell,
  Calendar,
  Plus,
  MoreHorizontal,
  Info,
  Droplet,
  Moon,
  Award,
  TrendingUp,
  AlertTriangle,
  Flame,
  CheckCircle,
  Stethoscope
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
        <div className="flex items-center gap-3">
          <div 
            onClick={onEditProfile}
            className="w-11 h-11 rounded-2xl bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-white font-extrabold text-sm cursor-pointer shadow-soft hover:shadow-premium active:scale-95 transition-all"
          >
            {displayUserName.charAt(0).toUpperCase()}
          </div>
          <div>
            <span className="text-[10px] text-textsecondary font-bold uppercase tracking-wider">{getGreeting()}</span>
            <h2 className="text-base font-black text-textprimary leading-tight">
              {displayUserName} 👋
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={onEditProfile}
            className="w-9 h-9 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-textsecondary shadow-soft hover:bg-slate-50 active:scale-95 transition-all"
          >
            <Calendar className="w-4 h-4 text-primary" />
          </button>
          <div className="relative">
            <button className="w-9 h-9 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-textsecondary shadow-soft hover:bg-slate-50 active:scale-95 transition-all">
              <Bell className="w-4 h-4 text-primary" />
            </button>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>
          </div>
        </div>
      </div>

      {/* 2. CALENDAR DAY PICKER ROW */}
      <div className="flex items-center justify-between py-1 bg-white border border-slate-100/80 shadow-soft rounded-2xl px-2.5">
        <div className="flex-1 flex justify-between items-center text-center text-xs font-bold text-textsecondary">
          <span className="px-2 py-2 hover:text-textprimary transition-colors cursor-pointer">09</span>
          <span className="px-2 py-2 hover:text-textprimary transition-colors cursor-pointer">10</span>
          <span className="px-2 py-2 hover:text-textprimary transition-colors cursor-pointer">11</span>
          <span className="bg-gradient-to-r from-primary to-secondary text-white shadow-soft rounded-xl px-3.5 py-1.5 text-[10px] font-black tracking-wider uppercase">
            Today, 12 Jun
          </span>
          <span className="px-2 py-2 hover:text-textprimary transition-colors cursor-pointer">13</span>
          <span className="px-2 py-2 hover:text-textprimary transition-colors cursor-pointer">14</span>
          <span className="px-2 py-2 hover:text-textprimary transition-colors cursor-pointer">15</span>
        </div>
      </div>

      {/* 3. HERO DASHBOARD ROW (Health Score & Active Screening) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Health Score Card */}
        <div className="bg-white border border-slate-100/80 rounded-[32px] p-5 shadow-soft flex items-center justify-between relative overflow-hidden">
          <div className="space-y-1.5 z-10">
            <div className="flex items-center gap-1.5">
              <Award className="w-4.5 h-4.5 text-primary" />
              <span className="text-[10px] font-bold text-textsecondary uppercase tracking-wider">Health Score</span>
            </div>
            <h3 className="text-2xl font-black text-textprimary">85<span className="text-xs text-textsecondary font-bold">/100</span></h3>
            <span className="inline-block bg-primary/10 text-primary text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-full">
              Excellent
            </span>
            <p className="text-[9px] text-textsecondary font-semibold max-w-[140px] leading-relaxed pt-1">
              Your health metrics are optimal today. Keep it up!
            </p>
          </div>
          <div className="relative w-24 h-24 flex items-center justify-center z-10">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="38"
                className="stroke-slate-50"
                strokeWidth="7"
                fill="transparent"
              />
              <circle
                cx="48"
                cy="48"
                r="38"
                className="stroke-primary transition-all duration-1000 ease-out"
                strokeWidth="7"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 38}
                strokeDashoffset={2 * Math.PI * 38 * 0.15} // 85% progress
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-sm font-black text-textprimary">85%</span>
              <span className="text-[7px] font-extrabold uppercase text-textsecondary tracking-wider">Score</span>
            </div>
          </div>
        </div>

        {/* Last Screening Result */}
        <div className="bg-white border border-slate-100/80 rounded-[32px] p-5 shadow-soft flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-accent">
              <Stethoscope className="w-4.5 h-4.5 text-primary" />
              <span className="text-[10px] font-bold text-textsecondary uppercase tracking-wider">Last Screening</span>
            </div>
            {latestScreening ? (
              <div className="space-y-1">
                <p className="text-xs font-extrabold text-textprimary">{latestScreening.title}</p>
                <div className="flex items-center gap-1.5 pt-1">
                  <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    latestScreeningRisk === "High" 
                      ? "bg-rose-100 text-rose-700" 
                      : latestScreeningRisk === "Moderate" 
                      ? "bg-amber-100 text-amber-700" 
                      : "bg-emerald-100 text-emerald-700"
                  }`}>
                    {latestScreeningRisk || "Low"} Risk
                  </span>
                  <span className="text-[9px] text-textsecondary font-semibold">{latestScreening.date}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-xs font-bold text-textprimary">No Screenings Recorded</p>
                <p className="text-[9px] text-textsecondary font-semibold leading-relaxed">
                  Run a camera-based AI screening for anemia & jaundice.
                </p>
              </div>
            )}
          </div>
          <button 
            onClick={() => setActiveTab("screen")}
            className="w-full mt-4 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-[10px] py-2 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1"
          >
            <span>Perform New Scan</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 4. VITALS SUMMARY GRID */}
      <div className="grid grid-cols-2 gap-4">
        {/* Oxygen Card */}
        <div className="bg-white border border-slate-100/80 rounded-[32px] p-4 shadow-soft flex flex-col justify-between min-h-[120px] hover:shadow-premium transition-all">
          <div className="flex justify-between items-start">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 font-extrabold text-[10px] flex items-center justify-center shadow-inner">
              O2
            </div>
            <span className="bg-blue-100 text-blue-800 text-[8px] font-extrabold px-1.5 py-0.5 rounded-full">
              Optimal
            </span>
          </div>
          <div className="space-y-0.5 pt-4">
            <span className="text-[10px] font-bold text-textsecondary uppercase tracking-wide">Oxygen Level</span>
            <h4 className="text-lg font-black text-textprimary leading-none">
              {currentOxygen}%
            </h4>
          </div>
        </div>

        {/* Heart Rate Card */}
        <div className="bg-white border border-slate-100/80 rounded-[32px] p-4 shadow-soft flex flex-col justify-between min-h-[120px] hover:shadow-premium transition-all">
          <div className="flex justify-between items-start">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shadow-inner">
              <Heart className="w-4 h-4 fill-rose-500/20 text-rose-500 animate-pulse" />
            </div>
            <span className="bg-rose-100 text-rose-800 text-[8px] font-extrabold px-1.5 py-0.5 rounded-full">
              Steady
            </span>
          </div>
          <div className="space-y-0.5 pt-4">
            <span className="text-[10px] font-bold text-textsecondary uppercase tracking-wide">Heart Rate</span>
            <h4 className="text-lg font-black text-textprimary leading-none">
              {currentHeartRate} bpm
            </h4>
          </div>
        </div>
      </div>

      {/* 5. INTERACTIVE WATER & SLEEP SUMMARY GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Water Intake Widget */}
        <div className="bg-white border border-slate-100/80 rounded-[32px] p-5 shadow-soft space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Droplet className="w-4.5 h-4.5 text-blue-500 fill-blue-500/10" />
              <span className="text-[10px] font-bold text-textsecondary uppercase tracking-wider">Water Intake</span>
            </div>
            <button 
              onClick={addWater}
              className="bg-blue-50 hover:bg-blue-100 text-blue-600 w-7 h-7 rounded-xl flex items-center justify-center shadow-sm active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black text-textprimary">{waterIntake.toFixed(2)}</span>
            <span className="text-xs text-textsecondary font-bold">L / 3.0 L</span>
          </div>
          <div className="w-full h-2.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100/60">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, (waterIntake / 3.0) * 100)}%` }}
            />
          </div>
        </div>

        {/* Sleep Summary Card */}
        <div className="bg-white border border-slate-100/80 rounded-[32px] p-5 shadow-soft space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Moon className="w-4.5 h-4.5 text-indigo-500 fill-indigo-500/10" />
              <span className="text-[10px] font-bold text-textsecondary uppercase tracking-wider">Sleep Summary</span>
            </div>
            <span className="bg-indigo-50 text-indigo-700 text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-full">
              Restful
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black text-textprimary">7h 45m</span>
            <span className="text-xs text-textsecondary font-semibold">Last Night</span>
          </div>
          <p className="text-[9px] text-textsecondary font-semibold">
            Deep Sleep: <span className="text-textprimary font-extrabold">3h 10m</span> • Light Sleep: 4h 35m
          </p>
        </div>
      </div>

      {/* 6. AI INSIGHTS CARD */}
      <div className="bg-gradient-to-br from-primary to-secondary rounded-[32px] p-6 text-white shadow-soft relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
        <div className="absolute -left-8 -top-8 w-16 h-16 bg-white/10 rounded-full blur-lg pointer-events-none" />

        <div className="flex items-start gap-3 relative z-10">
          <div className="bg-white/20 p-2 rounded-xl border border-white/10 shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="space-y-1">
            <span className="text-[9px] bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full font-extrabold uppercase tracking-widest border border-white/10 inline-block">
              AI Health Insight
            </span>
            <p className="text-xs font-bold leading-normal pt-1.5">
              "Your heart rate is steady, and your O2 level is exceptional today. Consider adding a brief 10-minute stretch routine post-lunch to maintain metabolic flow."
            </p>
          </div>
        </div>
      </div>

      {/* 7. UPCOMING REMINDERS */}
      <div className="bg-white border border-slate-100/80 rounded-[32px] p-5 shadow-soft space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-textprimary uppercase tracking-wider">Today's Reminders</h3>
          <span className="text-[9px] text-textsecondary font-bold">
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
                  ? "bg-slate-50 border-slate-100 opacity-60" 
                  : "bg-white border-slate-100 hover:border-primary/20 shadow-sm"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                  rem.done 
                    ? "bg-primary border-primary text-white" 
                    : "border-slate-300 bg-white"
                }`}>
                  {rem.done && <CheckCircle className="w-3.5 h-3.5 fill-white text-primary" />}
                </div>
                <span className={`text-xs font-bold ${rem.done ? "line-through text-textsecondary" : "text-textprimary"}`}>
                  {rem.text}
                </span>
              </div>
              <span className="text-[9px] font-bold text-textsecondary bg-slate-100 px-2 py-0.5 rounded-md">
                {rem.time}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 8. DAILY GOALS */}
      <div className="bg-white border border-slate-100/80 rounded-[32px] p-5 shadow-soft space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-textprimary uppercase tracking-wider">Daily Goal Tracker</h3>
          <TrendingUp className="w-4 h-4 text-primary" />
        </div>

        <div className="space-y-3.5">
          {/* Calorie Burn */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-textsecondary flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500/10" /> Calorie Burn
              </span>
              <span className="text-textprimary">380 / 500 kcal</span>
            </div>
            <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-100/60">
              <div className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full" style={{ width: "76%" }} />
            </div>
          </div>

          {/* Active Minutes */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-textsecondary flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-primary" /> Active Time
              </span>
              <span className="text-textprimary">45 / 60 mins</span>
            </div>
            <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-100/60">
              <div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full" style={{ width: "75%" }} />
            </div>
          </div>
        </div>
      </div>

      {/* 9. EMERGENCY CONTACT */}
      <div className="bg-rose-50 border border-rose-100 rounded-[32px] p-5 shadow-soft flex items-center justify-between">
        <div className="space-y-1">
          <h4 className="text-xs font-black text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 animate-pulse" /> Emergency Contact
          </h4>
          <p className="text-[10px] text-rose-700/80 font-bold leading-normal">
            Need urgent medical help or consultation?
          </p>
        </div>
        <button
          onClick={() => setActiveCall(true)}
          className="bg-rose-600 hover:bg-rose-750 text-white font-extrabold text-xs px-4 py-2.5 rounded-2xl shadow-soft active:scale-95 transition-all flex items-center gap-1.5"
        >
          <Phone className="w-3.5 h-3.5" />
          <span>Consult Now</span>
        </button>
      </div>

      {/* 10. LANGUAGE SELECTOR */}
      <div className="bg-white/80 backdrop-blur-md rounded-[32px] p-5 border border-slate-100/80 shadow-soft text-left">
        <h4 className="text-[10px] font-bold text-textsecondary mb-3.5 uppercase tracking-wider">
          {t.selectLanguage} / भाषा बदलें / ભાષા બદલો
        </h4>
        <div className="grid grid-cols-3 gap-2">
          {["en", "hi", "gu"].map((langCode) => (
            <button
              key={langCode}
              onClick={() => setLanguage(langCode as any)}
              className={`py-2.5 px-1 text-[11px] font-extrabold rounded-2xl border text-center transition-all shadow-sm active:scale-95 ${
                language === langCode
                  ? "bg-gradient-to-r from-primary to-secondary text-white border-transparent"
                  : "bg-slate-50 text-textsecondary border-slate-200 hover:bg-slate-100"
              }`}
            >
              {langCode === "en" ? "🇺🇸 English" : langCode === "hi" ? "🇮🇳 हिंदी" : "🇮🇳 ગુજરાતી"}
            </button>
          ))}
        </div>
      </div>

      {/* 11. QUICK HEALTH TIP */}
      <div className="bg-primary/5 border border-primary/10 rounded-[32px] p-5 flex gap-3 text-left">
        <div className="text-primary shrink-0">
          <Sparkles className="w-5 h-5 fill-primary/10 text-primary animate-pulse" />
        </div>
        <div className="space-y-1">
          <span className="text-xs font-bold text-primary">{t.quickHealthTip}</span>
          <p className="text-[11px] text-textsecondary leading-relaxed font-semibold">
            {t.healthTipText}
          </p>
        </div>
      </div>

      <ClinicalDisclaimer />
    </div>
  );
});

HomeView.displayName = "HomeView";
