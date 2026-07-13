"use client";

import React from "react";
import { useLanguage } from "@/context/LanguageContext";
import { calculateBMI, getBMIAdvice } from "@/utils/bmiCalculator";
import { Info, Sparkles } from "lucide-react";

interface BMICardProps {
  bmi?: number;
  heightCm?: number;
  weightKg?: number;
  compact?: boolean;
  showAdvice?: boolean;
}

export const BMICard: React.FC<BMICardProps> = ({
  bmi,
  heightCm,
  weightKg,
  compact = false,
  showAdvice = false,
}) => {
  const { t, language } = useLanguage();

  // Determine BMI and details
  let finalBmi = 0;
  if (bmi !== undefined) {
    finalBmi = bmi;
  } else if (heightCm && weightKg) {
    const result = calculateBMI(weightKg, heightCm);
    finalBmi = result.bmi;
  }

  if (!finalBmi || isNaN(finalBmi) || finalBmi <= 0) {
    return null;
  }

  // Calculate category and advice details using utility
  // We can call calculateBMI with dummy weight/height since we have finalBmi.
  // Wait, to get precise category and advice for finalBmi, let's just calculate
  // it by setting height = 100cm (1m) and weight = finalBmi (since BMI = weight / height^2, if height = 1m, BMI = weight)
  const bmiDetails = calculateBMI(finalBmi, 100);
  if (!bmiDetails) {
    return null;
  }
  const adviceText = getBMIAdvice(bmiDetails, language);

  // Set up colors/classes based on category
  let categoryColorClass = "";
  let categoryBgClass = "";
  let categoryLabel = "";

  switch (bmiDetails.category) {
    case "severely_underweight":
      categoryColorClass = "text-blue-600";
      categoryBgClass = "bg-blue-500/10 border border-blue-500/20";
      categoryLabel = t.bmiSeverelyUnderweight || "Severely Underweight";
      break;
    case "underweight":
      categoryColorClass = "text-blue-500";
      categoryBgClass = "bg-blue-500/10 border border-blue-500/20";
      categoryLabel = t.bmiUnderweight || "Underweight";
      break;
    case "normal":
      categoryColorClass = "text-emerald-500";
      categoryBgClass = "bg-emerald-500/10 border border-emerald-500/20";
      categoryLabel = t.bmiNormal || "Healthy (Normal)";
      break;
    case "overweight":
      categoryColorClass = "text-amber-500";
      categoryBgClass = "bg-amber-500/10 border border-amber-500/20";
      categoryLabel = t.bmiOverweight || "Overweight";
      break;
    case "obese_1":
      categoryColorClass = "text-rose-500";
      categoryBgClass = "bg-rose-500/10 border border-rose-500/20";
      categoryLabel = t.bmiObese1 || "Obese (Class I)";
      break;
    case "obese_2":
      categoryColorClass = "text-rose-600";
      categoryBgClass = "bg-rose-500/10 border border-rose-500/20";
      categoryLabel = t.bmiObese2 || "Obese (Class II)";
      break;
  }

  // Calculate needle rotation angle
  // Gauge range: 10 to 40
  const minBmi = 10;
  const maxBmi = 40;
  const clampedBmi = Math.max(minBmi, Math.min(maxBmi, finalBmi));
  const pointerPercent = ((clampedBmi - minBmi) / (maxBmi - minBmi)) * 100;
  const needleAngle = -90 + (pointerPercent / 100) * 180;

  if (compact) {
    return (
      <div className="glass-card p-4 flex items-center justify-between hover:shadow-soft transition-all duration-300">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {t.bmiCompactTitle || "BMI"}
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-800">
              {finalBmi.toFixed(1)}
            </span>
            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${categoryBgClass} ${categoryColorClass}`}>
              {categoryLabel}
            </span>
          </div>
        </div>
        <div className="w-16 h-10 shrink-0">
          <svg viewBox="0 0 100 55" className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="bmiCompactGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="28%" stopColor="#3b82f6" />
                <stop offset="28.1%" stopColor="#10b981" />
                <stop offset="43%" stopColor="#10b981" />
                <stop offset="43.1%" stopColor="#f59e0b" />
                <stop offset="58%" stopColor="#f59e0b" />
                <stop offset="58.1%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#ef4444" />
              </linearGradient>
            </defs>
            <path
              d="M 10 50 A 40 40 0 0 1 90 50"
              fill="none"
              stroke="url(#bmiCompactGrad)"
              strokeWidth="7"
              strokeLinecap="round"
            />
            <g transform={`rotate(${needleAngle}, 50, 50)`}>
              <path d="M 49 50 L 50 15 L 51 50 Z" fill="#1e293b" />
              <circle cx="50" cy="50" r="2.5" fill="#475569" stroke="#ffffff" strokeWidth="0.5" />
            </g>
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-5 space-y-4 hover:shadow-soft transition-all duration-300">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-violet-600 animate-pulse" />
          {t.bmiTitle || "Body Mass Index (BMI)"}
        </h3>
        <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${categoryBgClass} ${categoryColorClass}`}>
          {categoryLabel}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        {/* Semi-circle Gauge */}
        <div className="md:col-span-5 flex flex-col items-center justify-center relative">
          <div className="w-full max-w-[160px] aspect-[1.8/1] relative">
            <svg viewBox="0 0 100 55" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="bmiFullGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="28%" stopColor="#3b82f6" />
                  <stop offset="28.1%" stopColor="#10b981" />
                  <stop offset="43%" stopColor="#10b981" />
                  <stop offset="43.1%" stopColor="#f59e0b" />
                  <stop offset="58%" stopColor="#f59e0b" />
                  <stop offset="58.1%" stopColor="#ef4444" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
              </defs>
              <path
                d="M 10 50 A 40 40 0 0 1 90 50"
                fill="none"
                stroke="url(#bmiFullGrad)"
                strokeWidth="8"
                strokeLinecap="round"
              />
              <g transform={`rotate(${needleAngle}, 50, 50)`}>
                <path d="M 48 50 L 50 12 L 52 50 Z" fill="#1e293b" />
                <circle cx="50" cy="50" r="3.5" fill="#475569" stroke="#ffffff" strokeWidth="1" />
              </g>
            </svg>
          </div>
          <div className="text-center mt-1">
            <span className="text-3xl font-black text-slate-800">
              {finalBmi.toFixed(1)}
            </span>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
              {t.bmiTitle || "BMI Value"}
            </p>
          </div>
        </div>

        {/* Custom Visual Scale Bar */}
        <div className="md:col-span-7 space-y-4">
          <div className="relative pt-6 pb-2">
            {/* The pointer */}
            <div
              className="absolute top-0 transition-all duration-500 ease-out -translate-x-1/2 flex flex-col items-center z-10"
              style={{ left: `${pointerPercent}%` }}
            >
              <span className="text-[10px] font-black bg-slate-800 text-white px-1.5 py-0.5 rounded shadow-soft">
                {finalBmi.toFixed(1)}
              </span>
              <div className="w-1.5 h-1.5 bg-slate-800 rotate-45 -mt-0.5" />
            </div>

            {/* Track */}
            <div className="h-3 rounded-full overflow-hidden flex bg-slate-100">
              <div className="h-full bg-blue-500" style={{ width: "28.33%" }} title="Underweight (<18.5)" />
              <div className="h-full bg-emerald-500" style={{ width: "15%" }} title="Normal (18.5-23)" />
              <div className="h-full bg-amber-500" style={{ width: "15%" }} title="Overweight (23-27.5)" />
              <div className="h-full bg-rose-500" style={{ width: "41.67%" }} title="Obese (>27.5)" />
            </div>

            {/* Labels under track */}
            <div className="flex justify-between text-[7px] font-black text-slate-400 uppercase tracking-wider mt-2 px-1">
              <span>{t.bmiScaleUnder || "Underweight (<18.5)"}</span>
              <span>{t.bmiScaleNormal || "Normal (18.5-23)"}</span>
              <span>{t.bmiScaleOver || "Overweight (23-27.5)"}</span>
              <span>{t.bmiScaleObese || "Obese (>27.5)"}</span>
            </div>
          </div>
        </div>
      </div>

      {showAdvice && adviceText && (
        <div className="flex gap-2.5 items-start bg-slate-50/80 border border-slate-100 rounded-2xl p-3.5 mt-2">
          <Info className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
              {t.triageAdvice || "Advice"}
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed font-semibold">
              {adviceText}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
