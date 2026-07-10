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
    const radius = 30;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset =
      circumference - (wellness.score / 100) * circumference;

    const colorClasses =
      wellness.color === "green"
        ? {
            stroke: "stroke-emerald-500",
            text: "text-emerald-600",
            badge: "bg-emerald-100 text-emerald-800",
            label: t.statusExcellent,
          }
        : wellness.color === "yellow"
        ? {
            stroke: "stroke-amber-500",
            text: "text-amber-600",
            badge: "bg-amber-100 text-amber-800",
            label: t.statusModerate,
          }
        : {
            stroke: "stroke-rose-500",
            text: "text-rose-600",
            badge: "bg-rose-100 text-rose-800",
            label: t.statusActionNeeded,
          };

    if (!hasData) {
      return (
        <aside className="hidden xl:flex flex-col w-[300px] bg-white/30 backdrop-blur-xl border-l border-white/20 h-[100dvh] sticky top-0 shrink-0 shadow-soft">
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="w-20 h-20 bg-indigo-50/50 backdrop-blur-md border border-white/30 rounded-full flex items-center justify-center shadow-inner">
              <Sparkles className="w-10 h-10 text-indigo-500 animate-pulse" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-800 leading-snug">
              {t.completeFirstScreening}
            </h3>
            <p className="text-xs text-slate-500 max-w-[200px] leading-relaxed">
              {t.firstScreeningDesc}
            </p>
          </div>
        </aside>
      );
    }

    return (
      <aside className="hidden xl:flex flex-col w-[300px] bg-white/30 backdrop-blur-xl border-l border-white/20 h-[100dvh] sticky top-0 shrink-0 overflow-y-auto no-scrollbar shadow-soft">
        <div className="p-5 space-y-5">
          {/* Header */}
          <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest">
            {t.quickSummary}
          </h2>

          {/* Health Score Ring */}
          <div className="bg-white/40 backdrop-blur-md border border-white/30 shadow-soft rounded-2xl p-4 hover:shadow-medium transition-all">
            <div className="flex items-center gap-4">
              <div className="relative w-[72px] h-[72px] shrink-0 bg-white/50 rounded-full p-1.5 shadow-inner">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="36"
                    cy="36"
                    r={radius}
                    className="stroke-slate-100/70"
                    strokeWidth="5"
                    fill="transparent"
                  />
                  <circle
                    cx="36"
                    cy="36"
                    r={radius}
                    className={`${colorClasses.stroke} transition-all duration-1000 ease-out`}
                    strokeWidth="5"
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-base font-black text-slate-800 leading-none">
                    {wellness.score}
                  </span>
                  <span className="text-[6px] font-bold text-slate-400 uppercase tracking-widest">
                    Index
                  </span>
                </div>
              </div>
              <div className="space-y-1.5">
                <span
                  className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm ${colorClasses.badge}`}
                >
                  {colorClasses.label}
                </span>
                <p className="text-xs font-bold text-slate-700">
                  {t.wellnessScore}
                </p>
              </div>
            </div>
          </div>

          {/* Latest Triage */}
          {latestScreeningRisk && (
            <div className="bg-white/40 backdrop-blur-md border border-white/30 shadow-soft rounded-2xl p-4 hover:shadow-medium transition-all">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">
                {t.latestTriage}
              </p>
              <div className="flex items-center gap-2">
                <span
                  className={`w-3 h-3 rounded-full animate-pulse shadow-sm ${
                    latestScreeningRisk === "High"
                      ? "bg-rose-500 shadow-rose-350"
                      : latestScreeningRisk === "Moderate"
                      ? "bg-amber-500 shadow-amber-350"
                      : "bg-emerald-500 shadow-emerald-350"
                  }`}
                />
                <span className="text-sm font-extrabold text-slate-700">
                  {latestScreeningRisk === "High"
                    ? t.highRisk
                    : latestScreeningRisk === "Moderate"
                    ? t.moderateRisk
                    : t.lowRisk}
                </span>
              </div>
            </div>
          )}

          {/* Latest Vitals */}
          {latestVitals && (
            <div className="grid grid-cols-2 gap-3">
              {latestVitals.heartRate && (
                <div className="bg-white/40 backdrop-blur-md border border-white/30 shadow-soft rounded-2xl p-3.5 text-center hover:shadow-medium transition-all">
                  <Heart className="w-5 h-5 text-rose-500 mx-auto mb-1.5 fill-rose-100 animate-pulse" />
                  <p className="text-lg font-black text-slate-800 leading-none mb-0.5">
                    {latestVitals.heartRate}
                  </p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                    {t.bpm}
                  </p>
                </div>
              )}
              {latestVitals.oxygen && (
                <div className="bg-white/40 backdrop-blur-md border border-white/30 shadow-soft rounded-2xl p-3.5 text-center hover:shadow-medium transition-all">
                  <Activity className="w-5 h-5 text-indigo-500 mx-auto mb-1.5" />
                  <p className="text-lg font-black text-slate-800 leading-none mb-0.5">
                    {latestVitals.oxygen}%
                  </p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                    SpO2
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Need help link */}
          <button
            onClick={() => setActiveTab("talk")}
            className="w-full flex items-center justify-between bg-indigo-500/10 hover:bg-indigo-500/25 border border-indigo-500/20 rounded-2xl px-4 py-3 text-sm font-extrabold text-indigo-600 transition-all min-h-[44px] shadow-sm active:scale-95"
          >
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-indigo-500" />
              <span>
                {t.needHelp}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-indigo-500" />
          </button>

          {/* Improve tip */}
          <div className="bg-white/40 backdrop-blur-md border border-white/30 shadow-soft rounded-2xl p-4 hover:shadow-medium transition-all">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">
              {t.improvementTip}
            </p>
            <button
              onClick={() => setActiveTab(improveTip.tab)}
              className={`flex items-center gap-1 text-xs font-extrabold text-indigo-600 hover:text-indigo-800 transition-all hover:underline`}
            >
              <span>{t[`tip${wellness.biggestFactorKey.charAt(0).toUpperCase()}${wellness.biggestFactorKey.slice(1)}` as keyof typeof t]}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>
    );
  }
);

RightPanel.displayName = "RightPanel";
