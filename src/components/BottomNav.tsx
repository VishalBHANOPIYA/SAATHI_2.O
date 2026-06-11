import React from "react";
import { Home, ShieldAlert, Activity, Mic, FileText, Pill } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = React.memo(({
  activeTab,
  setActiveTab
}) => {
  const { t } = useLanguage();

  return (
    <nav className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 py-2.5 px-3 flex justify-between items-center z-30 shadow-lg shrink-0">
      <button
        onClick={() => setActiveTab("home")}
        className={`flex flex-col items-center gap-1 flex-1 transition-colors ${
          activeTab === "home" ? "text-teal-600 font-bold" : "text-slate-400 hover:text-slate-600"
        }`}
      >
        <Home className="w-5 h-5" />
        <span className="text-[9px] font-semibold">{t.home}</span>
      </button>

      <button
        onClick={() => setActiveTab("screen")}
        className={`flex flex-col items-center gap-1 flex-1 transition-colors ${
          activeTab === "screen" ? "text-teal-600 font-bold" : "text-slate-400 hover:text-slate-600"
        }`}
      >
        <ShieldAlert className="w-5 h-5" />
        <span className="text-[9px] font-semibold">{t.screen}</span>
      </button>

      <button
        onClick={() => setActiveTab("vitals")}
        className={`flex flex-col items-center gap-1 flex-1 transition-colors ${
          activeTab === "vitals" ? "text-teal-600 font-bold" : "text-slate-400 hover:text-slate-600"
        }`}
      >
        <Activity className="w-5 h-5" />
        <span className="text-[9px] font-semibold">{t.vitals}</span>
      </button>

      <button
        onClick={() => setActiveTab("talk")}
        className={`flex flex-col items-center gap-1 flex-1 transition-colors ${
          activeTab === "talk" ? "text-teal-600 font-bold" : "text-slate-400 hover:text-slate-600"
        }`}
      >
        <Mic className="w-5 h-5" />
        <span className="text-[9px] font-semibold">{t.talk}</span>
      </button>

      <button
        onClick={() => setActiveTab("records")}
        className={`flex flex-col items-center gap-1 flex-1 transition-colors ${
          activeTab === "records" ? "text-teal-600 font-bold" : "text-slate-400 hover:text-slate-600"
        }`}
      >
        <FileText className="w-5 h-5" />
        <span className="text-[9px] font-semibold">{t.records}</span>
      </button>

      <button
        onClick={() => setActiveTab("medicines")}
        className={`flex flex-col items-center gap-1 flex-1 transition-colors ${
          activeTab === "medicines" ? "text-teal-600 font-bold" : "text-slate-400 hover:text-slate-600"
        }`}
      >
        <Pill className="w-5 h-5" />
        <span className="text-[9px] font-semibold">{t.medicinesHeader}</span>
      </button>
    </nav>
  );
});

BottomNav.displayName = "BottomNav";
