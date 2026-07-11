"use client";

import React from "react";
import { Home, Stethoscope, Heart, Mic, FileText, Pill } from "lucide-react";
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

  const items = [
    { key: "home", icon: Home, label: t.home },
    { key: "screen", icon: Stethoscope, label: t.screen },
    { key: "vitals", icon: Heart, label: t.vitals },
    { key: "talk", icon: Mic, label: t.talk },
    { key: "records", icon: FileText, label: t.records },
    { key: "medicines", icon: Pill, label: t.medicinesHeader },
  ];

  return (
    <nav 
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100 px-1 flex justify-between items-center shadow-lg"
      style={{
        paddingBottom: "max(env(safe-area-inset-bottom), 8px)",
        height: "calc(56px + max(env(safe-area-inset-bottom), 8px))"
      }}
    >
      {items.map(({ key, icon: Icon, label }) => {
        const isActive = activeTab === key;
        return (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className="flex flex-col items-center justify-center flex-1 min-w-[44px] min-h-[44px] transition-all duration-300 relative"
          >
            <Icon className={`w-5 h-5 transition-colors duration-300 ${isActive ? "text-purple-600 animate-scaleUp" : "text-gray-400"}`} />
            <span
              className={`hidden sm:block text-[9px] font-bold mt-0.5 tracking-tight transition-colors duration-300 ${
                isActive ? "text-purple-600 font-extrabold" : "text-gray-450"
              }`}
            >
              {label}
            </span>
            {isActive && (
              <div className="w-1 h-1 bg-purple-600 rounded-full mt-0.5" />
            )}
          </button>
        );
      })}
    </nav>
  );
});

BottomNav.displayName = "BottomNav";
