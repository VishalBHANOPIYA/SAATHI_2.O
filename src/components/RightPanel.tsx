"use client";

import React from "react";
import { Heart, Activity, Mic, ChevronRight, Sparkles } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { computeHealthScore, getImproveTip } from "@/utils/healthScore";

interface RightPanelProps {
  userProfile: any;
  recordsList: any[];
  vitalsHistory: any[];
  setActiveTab: (tab: string) => void;
}

export const RightPanel: React.FC<RightPanelProps> = React.memo(
  ({ userProfile, recordsList, vitalsHistory, setActiveTab }) => {
    const { language, t } = useLanguage();

    // Extract latest screening risk
    const latestScreening = recordsList.find(
      (r) => r.doctor === "Saathi Camera AI Screening"
    );
    let latestScreeningRisk: "Low" | "Moderate" | "High" | null = null;
    if (latestScreening) {
      const title = latestScreening.title || "";
      if (title.includes("High Risk")) latestScreeningRisk = "High";
      else if (title.includes("Moderate Risk"))
        latestScreeningRisk = "Moderate";
      else if (title.includes("Low Risk")) latestScreeningRisk = "Low";
    }

    // Extract latest vitals
    const latestVitalsEntry =
      vitalsHistory && vitalsHistory.length > 0 ? vitalsHistory[0] : null;
    const latestVitals = latestVitalsEntry
      ? {
          heartRate: latestVitalsEntry.heartRate
            ? Number(latestVitalsEntry.heartRate)
            : undefined,
          oxygen: latestVitalsEntry.oxygen
            ? Number(latestVitalsEntry.oxygen)
            : undefined,
        }
      : null;

    const conditions = userProfile?.conditions || [];

    const wellness = computeHealthScore(
      { latestScreeningRisk, latestVitals, conditions },
      language
    );
    const improveTip = getImproveTip(wellness.biggestFactorKey, language);

    const hasData =
      vitalsHistory.length > 0 || recordsList.length > 0 || userProfile;

    // SVG gauge
    const radius = 32;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset =
      circumference - (wellness.score / 100) * circumference;

    const colorClasses =
      wellness.color === "green"
        ? {
            stroke: "stroke-emerald-500",
            text: "text-emerald-700",
            badge: "bg-emerald-500/10 text-emerald-800 border border-emerald-500/20",
            glow: "shadow-soft",
            label: t.statusExcellent,
          }
        : wellness.color === "yellow"
        ? {
            stroke: "stroke-amber-500",
            text: "text-amber-700",
            badge: "bg-amber-500/10 text-amber-805 border border-amber-500/20",
            glow: "shadow-soft",
            label: t.statusModerate,
          }
        : {
            stroke: "stroke-rose-500",
            text: "text-rose-700",
            badge: "bg-rose-500/10 text-rose-800 border border-rose-500/20",
            glow: "shadow-soft",
            label: t.statusActionNeeded,
          };

    if (!hasData) {
      return (
        <aside className="hidden xl:flex flex-col w-[300px] bg-white/40 backdrop-blur-xl h-[100dvh] sticky top-0 shrink-0 border-l border-white/60">
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="w-20 h-20 bg-gradient-to-br from-violet-500/10 to-purple-500/10 rounded-3xl flex items-center justify-center shadow-soft animate-float">
              <Sparkles className="w-10 h-10 text-violet-600 animate-pulse" />
            </div>
            <h3 className="text-sm font-black text-slate-800 leading-snug">
              {t.completeFirstScreening}
            </h3>
            <p className="text-xs text-slate-500 max-w-[200px] leading-relaxed font-semibold">
              {t.firstScreeningDesc}
            </p>
          </div>
        </aside>
      );
    }

    return (
      <aside className="hidden xl:flex flex-col w-[300px] bg-white/40 backdrop-blur-xl h-[100dvh] sticky top-0 shrink-0 overflow-y-auto no-scrollbar border-l border-white/60">
        <div className="p-5 space-y-4">
          {/* Header */}
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {t.quickSummary}
          </h2>

          {/* Health Score Ring */}
          <div className={`glass-card p-5 ${colorClasses.glow}`}>
            <div className="flex items-center gap-4">
              <div className="relative w-[76px] h-[76px] shrink-0">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-slate-50 to-white shadow-soft" />
                <svg className="w-full h-full transform -rotate-90 relative z-10">
                  <circle
                     cx="38"
                     cy="38"
                     r={radius}
                     className="stroke-slate-100/80"
                     strokeWidth="5"
                     fill="transparent"
                  />
                  <circle
                     cx="38"
                     cy="38"
                     r={radius}
                     className={`${colorClasses.stroke} transition-all duration-1000 ease-out`}
                     strokeWidth="5"
                     fill="transparent"
                     strokeDasharray={circumference}
                     strokeDashoffset={strokeDashoffset}
                     strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                  <span className="text-lg font-black text-slate-800 leading-none">
                    {wellness.score}
                  </span>
                  <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">
                    Index
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <span
                  className={`text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-full ${colorClasses.badge}`}
                >
                  {colorClasses.label}
                </span>
                <p className="text-xs font-black text-slate-600">
                  {t.wellnessScore}
                </p>
              </div>
            </div>
          </div>

          {/* Latest Vitals */}
          {latestVitals && (
            <div className="grid grid-cols-2 gap-3">
              {latestVitals.heartRate && (
                <div className="glass-card p-4 text-center group hover:shadow-soft transition-all duration-300">
                  <div className="w-9 h-9 bg-rose-500/[0.04] rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                    <Heart className="w-4 h-4 text-rose-500 fill-rose-200" />
                  </div>
                  <p className="text-xl font-black text-slate-800 leading-none mb-0.5">
                    {latestVitals.heartRate}
                  </p>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                    {t.bpm}
                  </p>
                </div>
              )}
              {latestVitals.oxygen && (
                <div className="glass-card p-4 text-center group hover:shadow-soft transition-all duration-300">
                  <div className="w-9 h-9 bg-violet-500/[0.04] rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                    <Activity className="w-4 h-4 text-violet-600" />
                  </div>
                  <p className="text-xl font-black text-slate-800 leading-none mb-0.5">
                    {latestVitals.oxygen}%
                  </p>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                    SpO2
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Need help link */}
          <button
            onClick={() => setActiveTab("talk")}
            className="w-full flex items-center justify-between bg-gradient-to-r from-violet-500/[0.04] to-purple-500/[0.04] hover:from-violet-500/[0.08] hover:to-purple-500/[0.08] border border-violet-500/10 rounded-2xl px-4 py-3.5 text-xs font-black text-violet-700 transition-all min-h-[44px] group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-violet-500/10 rounded-xl flex items-center justify-center group-hover:bg-violet-500/20 transition-colors">
                <Mic className="w-4 h-4 text-violet-650" />
              </div>
              <span>{t.needHelp}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-violet-650 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* Improve tip */}
          <div className="glass-card p-4 space-y-2">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
              {t.improvementTip}
            </p>
            <button
              onClick={() => setActiveTab(improveTip.tab)}
              className="flex items-center gap-1 text-xs font-black text-violet-700 hover:text-violet-900 transition-all group text-left"
            >
              <span className="leading-snug">{t[`tip${wellness.biggestFactorKey.charAt(0).toUpperCase()}${wellness.biggestFactorKey.slice(1)}` as keyof typeof t]}</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform shrink-0" />
            </button>
          </div>
        </div>
      </aside>
    );
  }
);

RightPanel.displayName = "RightPanel";
