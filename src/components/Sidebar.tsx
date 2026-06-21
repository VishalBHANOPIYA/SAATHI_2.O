"use client";

import React from "react";
import {
  Heart,
  Home,
  ShieldAlert,
  Activity,
  Mic,
  FileText,
  Pill,
  Settings,
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
  { key: "screen", icon: ShieldAlert },
  { key: "vitals", icon: Activity },
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
      <aside className="hidden md:flex flex-col w-[260px] lg:w-[280px] bg-slate-900 text-white shrink-0 h-[100dvh] sticky top-0 z-40">
        {/* Logo + Tagline */}
        <div className="px-5 pt-6 pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-emerald-400 fill-emerald-400 animate-pulse" />
            <span className="font-black text-xl tracking-tight bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
              Saathi
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-1.5">
            {t.tagline}
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map(({ key, icon: Icon }) => {
            const isActive = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all min-h-[44px] ${
                  isActive
                    ? "bg-teal-600/20 text-teal-300 border border-teal-500/30 shadow-sm"
                    : "text-slate-400 hover:bg-white/5 hover:text-white border border-transparent"
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-teal-400" : ""}`} />
                <span>{tabLabels[key]}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom section: profile + settings */}
        <div className="px-4 py-4 border-t border-white/10 space-y-3">
          {userProfile && (
            <button
              onClick={onOpenProfile}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-all text-left min-h-[44px]"
            >
              <div className="w-9 h-9 rounded-lg bg-teal-600 flex items-center justify-center text-white font-black text-sm shrink-0">
                {userProfile.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">
                  {userProfile.name?.split(" ")[0]}
                </p>
                <p className="text-[10px] text-slate-400 font-medium">
                  {userProfile.age}y • {userProfile.gender}
                </p>
              </div>
            </button>
          )}

          <button
            onClick={onOpenSettings}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-all text-sm font-medium min-h-[44px]"
          >
            <Settings className="w-5 h-5 shrink-0" />
            <span>Settings</span>
          </button>
        </div>
      </aside>
    );
  }
);

Sidebar.displayName = "Sidebar";
