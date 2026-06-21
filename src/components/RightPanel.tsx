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
    const { language } = useLanguage();

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
            label:
              language === "hi"
                ? "उत्कृष्ट"
                : language === "gu"
                ? "ઉત્તમ"
                : "Excellent",
          }
        : wellness.color === "yellow"
        ? {
            stroke: "stroke-amber-500",
            text: "text-amber-600",
            badge: "bg-amber-100 text-amber-800",
            label:
              language === "hi"
                ? "मध्यम"
                : language === "gu"
                ? "મધ્યમ"
                : "Moderate",
          }
        : {
            stroke: "stroke-rose-500",
            text: "text-rose-600",
            badge: "bg-rose-100 text-rose-800",
            label:
              language === "hi"
                ? "ध्यान दें"
                : language === "gu"
                ? "ધ્યાન આપો"
                : "Action Needed",
          };

    if (!hasData) {
      return (
        <aside className="hidden xl:flex flex-col w-[300px] bg-slate-50 border-l border-slate-200 h-[100dvh] sticky top-0 shrink-0">
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-teal-300" />
            </div>
            <h3 className="text-sm font-bold text-slate-600">
              {language === "hi"
                ? "अपनी पहली जांच पूरी करें"
                : language === "gu"
                ? "તમારી પ્રથમ તપાસ પૂર્ણ કરો"
                : "Complete your first screening"}
            </h3>
            <p className="text-xs text-slate-400 max-w-[200px]">
              {language === "hi"
                ? "यहाँ आपका स्वास्थ्य सारांश दिखाई देगा।"
                : language === "gu"
                ? "અહીં તમારું આરોગ્ય સારાંશ દેખાશે."
                : "Your health summary will appear here."}
            </p>
          </div>
        </aside>
      );
    }

    return (
      <aside className="hidden xl:flex flex-col w-[300px] bg-slate-50 border-l border-slate-200 h-[100dvh] sticky top-0 shrink-0 overflow-y-auto no-scrollbar">
        <div className="p-5 space-y-5">
          {/* Header */}
          <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest">
            {language === "hi"
              ? "त्वरित सारांश"
              : language === "gu"
              ? "ત્વરિત સારાંશ"
              : "Quick Summary"}
          </h2>

          {/* Health Score Ring */}
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="relative w-[72px] h-[72px] shrink-0">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="36"
                    cy="36"
                    r={radius}
                    className="stroke-slate-100"
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
                  className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${colorClasses.badge}`}
                >
                  {colorClasses.label}
                </span>
                <p className="text-xs font-bold text-slate-700">
                  {language === "hi"
                    ? "वेलनेस स्कोर"
                    : language === "gu"
                    ? "વેલનેસ સ્કોર"
                    : "Wellness Score"}
                </p>
              </div>
            </div>
          </div>

          {/* Latest Triage */}
          {latestScreeningRisk && (
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">
                {language === "hi"
                  ? "नवीनतम ट्राइएज"
                  : language === "gu"
                  ? "તાજેતરની ટ્રાયેજ"
                  : "Latest Triage"}
              </p>
              <div className="flex items-center gap-2">
                <span
                  className={`w-3 h-3 rounded-full ${
                    latestScreeningRisk === "High"
                      ? "bg-red-500"
                      : latestScreeningRisk === "Moderate"
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                  }`}
                />
                <span className="text-sm font-bold text-slate-700">
                  {latestScreeningRisk === "High"
                    ? language === "hi"
                      ? "उच्च जोखिम"
                      : language === "gu"
                      ? "ઉચ્ચ જોખમ"
                      : "High Risk"
                    : latestScreeningRisk === "Moderate"
                    ? language === "hi"
                      ? "मध्यम जोखिम"
                      : language === "gu"
                      ? "મધ્યમ જોખમ"
                      : "Moderate Risk"
                    : language === "hi"
                    ? "कम जोखिम"
                    : language === "gu"
                    ? "ઓછું જોખમ"
                    : "Low Risk"}
                </span>
              </div>
            </div>
          )}

          {/* Latest Vitals */}
          {latestVitals && (
            <div className="grid grid-cols-2 gap-3">
              {latestVitals.heartRate && (
                <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm text-center">
                  <Heart className="w-5 h-5 text-rose-500 mx-auto mb-1.5 fill-rose-100" />
                  <p className="text-lg font-black text-slate-800">
                    {latestVitals.heartRate}
                  </p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                    {language === "hi" ? "बीपीएम" : "BPM"}
                  </p>
                </div>
              )}
              {latestVitals.oxygen && (
                <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm text-center">
                  <Activity className="w-5 h-5 text-blue-500 mx-auto mb-1.5" />
                  <p className="text-lg font-black text-slate-800">
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
            className="w-full flex items-center justify-between bg-teal-50 border border-teal-100 rounded-xl px-4 py-3 text-sm font-bold text-teal-700 hover:bg-teal-100 transition-all min-h-[44px]"
          >
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4" />
              <span>
                {language === "hi"
                  ? "मदद चाहिए?"
                  : language === "gu"
                  ? "મદદ જોઈએ?"
                  : "Need help?"}
              </span>
            </div>
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Improve tip */}
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">
              {language === "hi"
                ? "सुधार सुझाव"
                : language === "gu"
                ? "સુધાર ટિપ"
                : "Improvement Tip"}
            </p>
            <button
              onClick={() => setActiveTab(improveTip.tab)}
              className={`flex items-center gap-1 text-xs font-bold ${colorClasses.text} hover:underline`}
            >
              <span>{improveTip.text}</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </aside>
    );
  }
);

RightPanel.displayName = "RightPanel";
