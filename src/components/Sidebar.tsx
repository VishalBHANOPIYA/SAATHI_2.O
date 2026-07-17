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
import ProfileAvatar from "./ProfileAvatar";

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
      <aside className="hidden md:flex flex-col w-[260px] lg:w-[280px] bg-white shrink-0 h-[100dvh] sticky top-0 z-40 text-left border-r border-gray-200">
        {/* Logo + Tagline */}
        <div className="px-4 py-5 border-b border-gray-200 overflow-hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-violet-600 rounded-2xl flex items-center justify-center shadow-lg shrink-0">
              <Heart className="w-5 h-5 text-white fill-white/20 animate-pulse" />
            </div>
            <div className="min-w-0">
              <span className="font-extrabold text-xl tracking-tight text-gray-900 block leading-tight truncate">
                Saathi
              </span>
              <p className="text-[9px] text-purple-600 font-extrabold uppercase tracking-widest mt-0.5 truncate">
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
                className={`w-full flex items-center gap-3 px-4 py-3 min-h-[44px] rounded-2xl transition-all duration-300 relative ${
                  isActive
                    ? "bg-violet-100 text-violet-750 font-black shadow-sm scale-[1.02] pl-6 border-l-4 border-violet-600"
                    : "text-gray-600 hover:text-violet-700 hover:bg-violet-50 font-semibold"
                }`}
              >
                <Icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? "text-violet-600" : "text-gray-400"}`} />
                <span className="text-[13px]">{tabLabels[key]}</span>
                {isActive && (
                  <Sparkles className="w-3.5 h-3.5 ml-auto opacity-80 animate-pulse text-violet-500" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom section: profile + settings */}
        <div className="sticky bottom-0 bg-white z-10 px-3 py-4 border-t border-gray-150 space-y-2">
          {userProfile && (
            <button
              onClick={onOpenProfile}
              className="w-full flex items-center gap-3 p-2.5 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-violet-50 transition-all text-left min-h-[44px] group"
            >
              <ProfileAvatar
                userProfile={userProfile}
                size={40}
                editable={false}
              />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-black text-gray-800 truncate">
                  {userProfile.name}
                </p>
                <p className="text-[11px] text-gray-500 font-semibold truncate">
                  {userProfile.age}y • {userProfile.gender}
                </p>
              </div>
            </button>
          )}

          <button
            onClick={onOpenSettings}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-gray-600 hover:text-violet-700 hover:bg-violet-50 transition-all text-[13px] font-bold min-h-[44px]"
          >
            <Settings className="w-[18px] h-[18px] shrink-0 text-gray-400 hover:text-violet-650" />
            <span>Settings</span>
          </button>
        </div>
      </aside>
    );
  }
);

Sidebar.displayName = "Sidebar";
