"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Info,
  Flame,
  MapPin,
  Clock,
  Play,
  Square,
  Plus,
  TrendingUp,
  AlertCircle,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import {
  StepDetector,
  StepData,
  StepCounterConfig
} from "@/utils/stepCounter";
import {
  loadTodayTracker,
  saveTodayTracker,
  getStepGoalFromBMI,
  DailyTrackerData,
  getTodayKey
} from "@/utils/dailyTracker";
import {
  stepCalorieBurn,
  getWaterGoalFromWeight
} from "@/utils/bmiCalculator";
import {
  getLast7DaysSteps,
  midnightReset,
  saveStepHistory
} from "@/utils/stepHistory";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell
} from "recharts";

interface StepCounterWidgetProps {
  userProfile: any;
}

export const StepCounterWidget: React.FC<StepCounterWidgetProps> = ({ userProfile }) => {
  const { language, t } = useLanguage();
  const [mounted, setMounted] = useState(false);

  // States
  const [isRunning, setIsRunning] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [hasPermission, setHasPermission] = useState(true);
  const [showLimitations, setShowLimitations] = useState(true);
  const [manualStepsInput, setManualStepsInput] = useState("");
  const [historyData, setHistoryData] = useState<any[]>([]);

  // User details
  const weightKg = Number(userProfile?.weightKg) || 70;
  const heightCm = Number(userProfile?.heightCm) || 170;
  const gender = userProfile?.gender || "Male";
  const bmiCategory = userProfile?.bmiCategory || "normal";
  const activityLevel = userProfile?.activityLevel || "light";

  // Step goal
  const stepGoal = useMemo(() => {
    return getStepGoalFromBMI(bmiCategory);
  }, [bmiCategory]);

  // Load tracker
  const [tracker, setTracker] = useState<DailyTrackerData>(() => {
    return loadTodayTracker({
      stepGoal,
      calorieGoal: 2000,
      waterGoalGlasses: 8,
      waterGoalLiters: 2,
    });
  });

  // Step Detector Ref
  const detectorRef = useRef<StepDetector | null>(null);

  // Save interval Ref
  const saveIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize
  useEffect(() => {
    setMounted(true);
    setHistoryData(getLast7DaysSteps());

    // Check motion support
    if (typeof window !== "undefined") {
      const isMotionSupported = "DeviceMotionEvent" in window;
      setIsSupported(isMotionSupported);
    }
  }, []);

  // Set up Step Detector config updates
  useEffect(() => {
    if (!mounted) return;

    const config: StepCounterConfig = {
      weightKg,
      heightCm,
      gender,
      sensitivity: "medium",
    };

    // If detector exists, we update it
    detectorRef.current = new StepDetector(config, (data: StepData) => {
      setTracker(prev => {
        const updated = {
          ...prev,
          steps: data.steps,
          caloriesBurned: data.caloriesBurned,
          activeMinutes: data.activeMinutes,
          distanceKm: data.distanceKm,
        };
        saveTodayTracker(updated);
        return updated;
      });
    });

    return () => {
      if (detectorRef.current) {
        detectorRef.current.stop();
      }
    };
  }, [mounted, weightKg, heightCm, gender]);

  // Midnight Check Loop
  useEffect(() => {
    if (!mounted) return;

    const checkMidnight = () => {
      const todayStr = getTodayKey();
      if (tracker.date !== todayStr) {
        // Save history of yesterday
        midnightReset(
          tracker.steps,
          tracker.caloriesBurned,
          tracker.distanceKm,
          tracker.stepGoal
        );

        // Reset detector if active
        if (detectorRef.current) {
          detectorRef.current.reset();
        }

        // Reload fresh tracker
        const fresh = loadTodayTracker({
          stepGoal,
          calorieGoal: 2000,
          waterGoalGlasses: 8,
          waterGoalLiters: 2,
        });
        setTracker(fresh);
        setHistoryData(getLast7DaysSteps());
      }
    };

    // Check day change every 5 seconds
    const interval = setInterval(checkMidnight, 5000);
    return () => clearInterval(interval);
  }, [mounted, tracker, stepGoal]);

  // Periodic Save (every 10 seconds when running)
  useEffect(() => {
    if (isRunning) {
      saveIntervalRef.current = setInterval(() => {
        saveTodayTracker(tracker);
      }, 10000);
    } else {
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
        saveIntervalRef.current = null;
      }
    }

    return () => {
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
      }
    };
  }, [isRunning, tracker]);

  // Start counting
  const handleStart = async () => {
    if (!detectorRef.current) return;
    const success = await detectorRef.current.start();
    if (success) {
      setIsRunning(true);
      setHasPermission(true);
    } else {
      setIsRunning(false);
      setHasPermission(false);
    }
  };

  // Stop counting
  const handleStop = () => {
    if (detectorRef.current) {
      detectorRef.current.stop();
      // Update with final detector data
      const finalData = detectorRef.current.getData();
      setTracker(prev => {
        const updated = {
          ...prev,
          steps: finalData.steps,
          caloriesBurned: finalData.caloriesBurned,
          activeMinutes: finalData.activeMinutes,
          distanceKm: finalData.distanceKm,
        };
        saveTodayTracker(updated);
        return updated;
      });
    }
    setIsRunning(false);
  };

  // Manual Add
  const handleAddManual = (amount: number) => {
    if (detectorRef.current) {
      detectorRef.current.addStepsManually(amount);
    } else {
      // Fallback update tracker directly if detector not instantiated
      setTracker(prev => {
        const steps = prev.steps + amount;
        const caloriesBurned = stepCalorieBurn(steps, weightKg);
        // Stride calculation
        const factor = gender === "Female" ? 0.413 : 0.415;
        const strideM = (heightCm * factor) / 100;
        const distanceKm = Math.round(steps * strideM) / 1000;
        const activeMinutes = Math.round(steps / 100); // 100 steps per min avg

        const updated = {
          ...prev,
          steps,
          caloriesBurned,
          distanceKm,
          activeMinutes: prev.activeMinutes + Math.round(amount / 100),
        };
        saveTodayTracker(updated);
        return updated;
      });
    }
  };

  // Manual Entry Form
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(manualStepsInput, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setTracker(prev => {
        const steps = parsed; // Sets directly
        const caloriesBurned = stepCalorieBurn(steps, weightKg);
        const factor = gender === "Female" ? 0.413 : 0.415;
        const strideM = (heightCm * factor) / 100;
        const distanceKm = Math.round(steps * strideM) / 1000;

        const updated = {
          ...prev,
          steps,
          caloriesBurned,
          distanceKm,
          activeMinutes: Math.round(steps / 100),
        };
        saveTodayTracker(updated);
        return updated;
      });
      setManualStepsInput("");
    }
  };

  // Reset steps
  const handleReset = () => {
    if (window.confirm(t("stepsReset") || "Are you sure you want to reset today's steps?")) {
      if (detectorRef.current) {
        detectorRef.current.reset();
      }
      setTracker(prev => {
        const updated = {
          ...prev,
          steps: 0,
          caloriesBurned: 0,
          distanceKm: 0,
          activeMinutes: 0,
        };
        saveTodayTracker(updated);
        return updated;
      });
    }
  };

  // SVG Progress Ring calculations
  const progressPercent = Math.min(100, (tracker.steps / tracker.stepGoal) * 100);
  const radius = 60;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  // Remaining Calories to Goal
  const remainingSteps = Math.max(0, tracker.stepGoal - tracker.steps);
  const remainingCal = stepCalorieBurn(remainingSteps, weightKg);

  // Formatted chart data
  const chartData = useMemo(() => {
    return historyData.map(item => {
      const dateObj = new Date(item.date);
      const label = dateObj.toLocaleDateString(
        language === "hi" ? "hi-IN" : language === "gu" ? "gu-IN" : "en-US",
        { weekday: "short" }
      );
      return {
        name: label,
        steps: item.steps,
        isToday: item.date === getTodayKey()
      };
    });
  }, [historyData, language]);

  return (
    <div className="bg-white border border-gray-150 rounded-3xl p-5 space-y-6 shadow-sm text-left">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
          {t("stepsTitle") || "Today's Steps"}
        </h3>
        {isRunning && (
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-600"></span>
          </span>
        )}
      </div>

      {/* Progress Circle & Stats */}
      <div className="flex flex-col items-center justify-center py-4 relative">
        <div className="relative w-40 h-40 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              className="stroke-purple-100"
              fill="transparent"
              strokeWidth={stroke}
              r={normalizedRadius}
              cx={radius + stroke * 2}
              cy={radius + stroke * 2}
            />
            <circle
              className="stroke-purple-600 transition-all duration-300 ease-out"
              fill="transparent"
              strokeWidth={stroke}
              strokeDasharray={circumference + " " + circumference}
              style={{ strokeDashoffset }}
              strokeLinecap="round"
              r={normalizedRadius}
              cx={radius + stroke * 2}
              cy={radius + stroke * 2}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-black text-slate-800 leading-none">
              {tracker.steps.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">
              / {tracker.stepGoal.toLocaleString()} {language === "hi" ? "कदम" : language === "gu" ? "પગલાં" : "steps"}
            </span>
          </div>
        </div>

        {/* Small Details Grid */}
        <div className="grid grid-cols-3 gap-6 w-full mt-6 text-center border-t border-b border-slate-100 py-3.5">
          <div className="space-y-0.5">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-purple-600" />
              {language === "hi" ? "किमी" : language === "gu" ? "કિમી" : "Distance"}
            </span>
            <h5 className="text-base font-black text-slate-700">
              {tracker.distanceKm.toFixed(2)} km
            </h5>
          </div>
          <div className="space-y-0.5">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1">
              <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500/10" />
              {language === "hi" ? "कैलोरी" : language === "gu" ? "કેલરી" : "Calories"}
            </span>
            <h5 className="text-base font-black text-slate-700">
              {tracker.caloriesBurned} kcal
            </h5>
          </div>
          <div className="space-y-0.5">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              {language === "hi" ? "समय" : language === "gu" ? "સમય" : "Active"}
            </span>
            <h5 className="text-base font-black text-slate-700">
              {tracker.activeMinutes} min
            </h5>
          </div>
        </div>
      </div>

      {/* Calories remaining helper */}
      {remainingSteps > 0 ? (
        <p className="text-[10px] font-bold text-slate-500 text-center bg-purple-50/50 p-2.5 rounded-xl border border-purple-100/50">
          🔥 {tracker.caloriesBurned} kcal burned • <span className="text-purple-700">{remainingCal} kcal remaining to goal</span>
        </p>
      ) : (
        <p className="text-[10px] font-bold text-emerald-600 text-center bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
          🎉 Daily steps goal achieved! Fantastic job!
        </p>
      )}

      {/* Start/Stop & Manual Add Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        {isSupported ? (
          isRunning ? (
            <button
              onClick={handleStop}
              className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs py-3 rounded-2xl transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
            >
              <Square className="w-3.5 h-3.5 fill-white text-white" />
              <span>{t("stepsStop") || "Stop"}</span>
            </button>
          ) : (
            <button
              onClick={handleStart}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs py-3 rounded-2xl transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-white text-purple-600" />
              <span>{t("stepsStart") || "▶ Start Counting"}</span>
            </button>
          )
        ) : (
          <div className="flex-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-100 p-3 rounded-2xl leading-normal text-center">
            {t("stepsNotSupported") || "Step counting works on mobile phones with motion sensors."}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => handleAddManual(100)}
            className="px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs py-3 rounded-2xl transition-all shadow-sm active:scale-95"
          >
            +100 Test
          </button>
          <button
            onClick={handleReset}
            className="px-4 bg-slate-100 hover:bg-red-50 hover:text-rose-600 text-slate-500 font-bold text-xs py-3 rounded-2xl transition-all active:scale-95"
          >
            {t("stepsReset") || "Reset"}
          </button>
        </div>
      </div>

      {/* Manual Entry Fallback / Desktop Mode */}
      {!isSupported && (
        <form onSubmit={handleManualSubmit} className="space-y-3 pt-2 border-t border-slate-100">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
            {t("stepsManualEntry") || "Log steps manually"}
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={manualStepsInput}
              onChange={(e) => setManualStepsInput(e.target.value)}
              placeholder="e.g. 5000"
              className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-purple-500"
            />
            <button
              type="submit"
              className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition-all shadow-sm active:scale-95"
            >
              {language === "hi" ? "दर्ज करें" : language === "gu" ? "દાખલ કરો" : "Submit"}
            </button>
          </div>
        </form>
      )}

      {/* 7-Day History Chart */}
      {mounted && chartData.length > 0 && (
        <div className="space-y-2 border-t border-slate-100 pt-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-purple-600" />
              {t("stepsHistory") || "Last 7 Days"}
            </span>
            <span className="text-[9px] font-bold text-slate-500">
              {t("stepsWeeklyAvg")?.replace("{steps}", Math.round(historyData.reduce((acc, h) => acc + h.steps, 0) / 7).toLocaleString()) ||
                `Weekly avg: ${Math.round(historyData.reduce((acc, h) => acc + h.steps, 0) / 7).toLocaleString()}`}
            </span>
          </div>
          <div className="h-32 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 9, fontWeight: 700, fill: "#94A3B8" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 9, fontWeight: 700, fill: "#94A3B8" }}
                />
                <Tooltip
                  cursor={{ fill: "#F8FAFC" }}
                  contentStyle={{
                    fontSize: "10px",
                    fontWeight: 700,
                    borderRadius: "12px",
                    border: "1px solid #E2E8F0",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
                  }}
                />
                <ReferenceLine
                  y={stepGoal}
                  stroke="#A855F7"
                  strokeDasharray="3 3"
                  strokeWidth={1}
                />
                <Bar dataKey="steps" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.isToday ? "#9333EA" : "#E9D5FF"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Part 11: Limitations Collapsible UI Banner */}
      {showLimitations && (
        <div className="bg-blue-50 border border-blue-100 text-blue-700 p-4 rounded-2xl relative transition-all duration-300">
          <div className="flex items-start gap-2.5">
            <Info className="w-4 h-4 mt-0.5 text-blue-500 shrink-0" />
            <div className="space-y-1">
              <h5 className="text-xs font-black leading-none uppercase tracking-wide">
                {language === "hi" ? "कदम गणना कैसे काम करती है:" : language === "gu" ? "પગલાં ગણતરી કેવી રીતે કાર્ય કરે છે:" : "How step counting works:"}
              </h5>
              <ul className="text-[10px] font-semibold space-y-1 pt-1 leading-relaxed opacity-90">
                <li>• {language === "hi" ? "आपके फोन के मोशन सेंसर का उपयोग करता है" : language === "gu" ? "તમારા ફોનના મોશન સેન્સરનો ઉપયોગ કરે છે" : "Uses your phone's motion sensor"}</li>
                <li>• {language === "hi" ? "कदमों की गिनती के लिए ऐप खुला रहना चाहिए" : language === "gu" ? "પગલાં ગણવા માટે એપ્લિકેશન ખુલ્લી હોવી જોઈએ" : "App must stay OPEN to count steps"}</li>
                <li>• {language === "hi" ? "सटीकता: ±15-20% (चिकित्सीय नहीं)" : language === "gu" ? "ચોકસાઈ: ±૧૫-૨૦% (તબીબી નથી)" : "Accuracy: ±15-20% (not medical)"}</li>
                <li>• {language === "hi" ? "सटीक ट्रैकिंग के लिए, एक समर्पित फिटनेस ट्रैकर का उपयोग करें" : language === "gu" ? "ચોક્કસ ટ્રેકિંગ માટે, એક સમર્પિત ફિટનેસ ટ્રેકર વાપરો" : "For precise tracking, use a dedicated fitness tracker"}</li>
              </ul>
            </div>
          </div>
          <button
            onClick={() => setShowLimitations(false)}
            className="absolute top-2 right-2 text-blue-400 hover:text-blue-600 transition-colors p-1"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {!showLimitations && (
        <button
          onClick={() => setShowLimitations(true)}
          className="w-full flex items-center justify-center gap-1 text-[10px] font-black text-blue-500 hover:text-blue-700 transition-colors"
        >
          <span>Show Limitations Info</span>
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
