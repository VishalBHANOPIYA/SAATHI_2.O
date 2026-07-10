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
      <aside className="hidden md:flex flex-col w-[260px] lg:w-[280px] bg-white border-r border-slate-100 shrink-0 h-[100dvh] sticky top-0 z-40 shadow-soft text-left">
        {/* Logo + Tagline */}
        <div className="px-5 pt-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
              <Heart className="w-5 h-5 text-primary fill-primary/20 animate-pulse" />
            </div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Saathi
            </span>
          </div>
          <p className="text-[11px] text-textsecondary font-bold mt-2 uppercase tracking-wider">
            AI HEALTH COMPANION
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-1.5 no-scrollbar">
          {navItems.map(({ key, icon: Icon }) => {
            const isActive = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all min-h-[44px] ${
                  isActive
                    ? "bg-gradient-to-r from-primary to-secondary text-white shadow-soft active:scale-[0.98] hover:shadow-premium"
                    : "text-textsecondary hover:bg-slate-50 hover:text-textprimary border border-transparent"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tabLabels[key]}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom section: profile + settings */}
        <div className="px-4 py-4 border-t border-slate-100 space-y-2">
          {userProfile && (
            <button
              onClick={onOpenProfile}
              className="w-full flex items-center gap-3 p-2.5 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all text-left min-h-[44px] shadow-sm hover:shadow-soft"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-white font-extrabold text-sm shrink-0 shadow-soft">
                {userProfile.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-extrabold text-textprimary truncate">
                  {userProfile.name}
                </p>
                <p className="text-[10px] text-textsecondary font-bold">
                  {userProfile.age}y • {userProfile.gender}
                </p>
              </div>
            </button>
          )}

          <button
            onClick={onOpenSettings}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-textsecondary hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all text-xs font-bold min-h-[44px]"
          >
            <Settings className="w-4 h-4 shrink-0" />
            <span>Settings</span>
          </button>
        </div>
      </aside>
    );
  }
);

Sidebar.displayName = "Sidebar";
