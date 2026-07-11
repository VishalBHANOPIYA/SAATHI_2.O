"use client";

import React from "react";
import {
  Heart,
  Home,
  Stethoscope,
  Mic,
  FileText,
  Pill,
  Settings,
  Sparkles,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userProfile: any;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
}

const navItems = [
  { key: "home", icon: Home },
  { key: "screen", icon: Stethoscope },
  { key: "vitals", icon: Heart },
  { key: "talk", icon: Mic },
  { key: "records", icon: FileText },
  { key: "medicines", icon: Pill },
] as const;

export const Sidebar: React.FC<SidebarProps> = React.memo(
  ({ activeTab, setActiveTab, userProfile, onOpenSettings, onOpenProfile }) => {
    const { t } = useLanguage();

    const tabLabels: Record<string, string> = {
      home: t.home,
      screen: t.screen,
      vitals: t.vitals,
      talk: t.talk,
      records: t.records,
      medicines: t.medicinesHeader,
    };

    return (
      <aside className="hidden md:flex flex-col w-[260px] lg:w-[280px] bg-[#1E1B4B] shrink-0 h-[100dvh] sticky top-0 z-40 text-left border-r border-white/10">
        {/* Logo + Tagline */}
        <div className="px-5 pt-6 pb-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-violet-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Heart className="w-5 h-5 text-white fill-white/20 animate-pulse" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-white block leading-tight">
                Saathi
              </span>
              <p className="text-[9px] text-purple-300 font-extrabold uppercase tracking-widest mt-0.5">
                AI Health Companion
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-1.5 no-scrollbar">
          {navItems.map(({ key, icon: Icon }) => {
            const isActive = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 relative ${
                  isActive
                    ? "bg-purple-600 text-white font-black shadow-md scale-[1.02] pl-6 before:absolute before:left-1.5 before:top-2.5 before:bottom-2.5 before:w-1 before:bg-purple-400 before:rounded-full"
                    : "text-purple-200 hover:text-white hover:bg-white/5 font-semibold"
                }`}
              >
                <Icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? "text-white" : "text-purple-300"}`} />
                <span className="text-[13px]">{tabLabels[key]}</span>
                {isActive && (
                  <Sparkles className="w-3.5 h-3.5 ml-auto opacity-80 animate-pulse text-purple-200" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom section: profile + settings */}
        <div className="px-3 py-4 border-t border-white/10 space-y-2">
          {userProfile && (
            <button
              onClick={onOpenProfile}
              className="w-full flex items-center gap-3 p-2.5 rounded-2xl hover:bg-white/5 transition-all text-left min-h-[44px] group"
            >
              <div className="w-10 h-10 rounded-2xl bg-purple-600 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-md">
                {userProfile.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-black text-white truncate">
                  {userProfile.name}
                </p>
                <p className="text-[11px] text-purple-300 font-semibold">
                  {userProfile.age}y • {userProfile.gender}
                </p>
              </div>
            </button>
          )}

          <button
            onClick={onOpenSettings}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-purple-300 hover:text-white hover:bg-white/5 transition-all text-[13px] font-bold min-h-[44px]"
          >
            <Settings className="w-[18px] h-[18px] shrink-0 text-purple-400" />
            <span>Settings</span>
          </button>
        </div>
      </aside>
    );
  }
);

Sidebar.displayName = "Sidebar";
