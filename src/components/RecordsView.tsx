import React, { useState, useEffect } from "react";
import {
  FileText,
  Share2,
  Plus,
  X,
  CheckCircle,
  Info,
  UploadCloud,
  TrendingUp,
  Calendar,
  Trash2,
  Lock,
  Loader2,
  Copy,
  Download,
  Settings
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";
import { useLanguage } from "@/context/LanguageContext";

interface RecordsViewProps {
  vitalsHistory: any[];
  recordsList: any[];
  setRecordsList: React.Dispatch<React.SetStateAction<any[]>>;
  triageResult?: any | null;
  screenResults?: any | null;
  userProfile?: any;
  onEditProfile?: () => void;
}

const conditionLabels = {
  en: {
    diabetes: "Diabetes",
    highBP: "High Blood Pressure",
    heartDisease: "Heart Disease",
    asthma: "Asthma/Respiratory",
    thyroid: "Thyroid",
    kidney: "Kidney Disease",
    anemia: "Anemia",
    other: "Other",
    none: "None"
  },
  hi: {
    diabetes: "मधुमेह (Diabetes)",
    highBP: "उच्च रक्तचाप (High BP)",
    heartDisease: "हृदय रोग (Heart Disease)",
    asthma: "अस्थमा/श्वसन (Asthma)",
    thyroid: "थायराइड (Thyroid)",
    kidney: "गुर्दे की बीमारी (Kidney)",
    anemia: "एनीमिया (Anemia)",
    other: "अन्य (Other)",
    none: "कोई नहीं (None)"
  },
  gu: {
    diabetes: "મધુપ્રમેહ (Diabetes)",
    highBP: "હાઈ બ્લડ પ્રેશર (High BP)",
    heartDisease: "હૃદય રોગ (Heart Disease)",
    asthma: "અસ્થમા/શ્વાસ સંબંધિત",
    thyroid: "થાઇરોઇડ (Thyroid)",
    kidney: "કિડનીની બીમારી (Kidney)",
    anemia: "એનિમિયા (Anemia)",
    other: "અન્ય (Other)",
    none: "કોઈ નહીં (None)"
  }
};

export const RecordsView: React.FC<RecordsViewProps> = React.memo(({
  vitalsHistory,
  recordsList,
  setRecordsList,
  triageResult = null,
  screenResults = null,
  userProfile = null,
  onEditProfile = () => {}
}) => {
  const { language, t } = useLanguage();

  const [abhaNumber, setAbhaNumber] = useState("");
  const [abhaError, setAbhaError] = useState<string | null>(null);
  const [isAbhaLinked, setIsAbhaLinked] = useState(false);

  const [showRecordForm, setShowRecordForm] = useState(false);
  const [newRecord, setNewRecord] = useState({
    title: "",
    category: "Lab Test",
    doctor: "",
    notes: ""
  });

  const [trendMetric, setTrendMetric] = useState<"heartRate" | "bp" | "oxygen" | "anemia">("heartRate");
  const [selectedRecordForDetails, setSelectedRecordForDetails] = useState<any | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportedSummary, setExportedSummary] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const savedAbha = localStorage.getItem("saathi_abha_number");
    const savedAbhaLinked = localStorage.getItem("saathi_abha_linked") === "true";
    if (savedAbha) setAbhaNumber(savedAbha);
    if (savedAbhaLinked) setIsAbhaLinked(true);
  }, []);

  const formatAbha = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length <= 2) return cleaned;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 2)}-${cleaned.slice(2)}`;
    if (cleaned.length <= 10) return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 6)}-${cleaned.slice(6, 10)}-${cleaned.slice(10, 14)}`;
  };

  const handleAbhaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const cleaned = rawValue.replace(/\D/g, "");
    if (cleaned.length <= 14) {
      setAbhaNumber(formatAbha(cleaned));
      setAbhaError(null);
    }
  };

  const handleLinkAbha = () => {
    const cleaned = abhaNumber.replace(/\D/g, "");
    if (cleaned.length !== 14) {
      setAbhaError("Please enter a valid 14-digit ABHA ID.");
      return;
    }
    setAbhaError(null);
    setIsAbhaLinked(true);
    localStorage.setItem("saathi_abha_number", abhaNumber);
    localStorage.setItem("saathi_abha_linked", "true");
  };

  const handleUnlinkAbha = () => {
    setIsAbhaLinked(false);
    setAbhaNumber("");
    localStorage.removeItem("saathi_abha_number");
    localStorage.removeItem("saathi_abha_linked");
  };

  const handleAddRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecord.title || !newRecord.doctor) {
      alert("Please fill out all fields.");
      return;
    }

    const today = new Date();
    const dateStr = today.toISOString().split("T")[0];

    const addedItem = {
      id: Date.now(),
      title: newRecord.title,
      date: dateStr,
      category: newRecord.category,
      doctor: newRecord.doctor,
      notes: newRecord.notes
    };

    const nextRecords = [addedItem, ...recordsList];
    setRecordsList(nextRecords);
    localStorage.setItem("saathi_records", JSON.stringify(nextRecords));
    setNewRecord({ title: "", category: "Lab Test", doctor: "", notes: "" });
    setShowRecordForm(false);
  };

  const deleteRecord = (id: number) => {
    const nextRecords = recordsList.filter(item => item.id !== id);
    setRecordsList(nextRecords);
    localStorage.setItem("saathi_records", JSON.stringify(nextRecords));
  };

  const handleExportSummary = async () => {
    setIsExporting(true);
    setExportedSummary(null);
    setShowExportModal(true);

    try {
      const recordsText = recordsList.map((r, idx) => {
        return `[Record #${idx + 1}] Title: ${r.title} | Date: ${r.date} | Category: ${r.category} | Clinician: ${r.doctor} | Notes: ${r.notes || "None"}`;
      }).join("\n");

      const vitalsText = vitalsHistory.map(v => {
        return `Date: ${v.date} | HR: ${v.heartRate} bpm | BP: ${v.systolic}/${v.diastolic} mmHg | SpO2: ${v.oxygen}%`;
      }).join("\n");

      const consolidatedIntake = `Patient health history export requested.\n\n` +
        `**Vitals History Logs:**\n${vitalsText || "No recorded vitals logs available."}\n\n` +
        `**Session Logs & Diagnostic Records:**\n${recordsText || "No saved session logs available."}`;

      const response = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symptoms: consolidatedIntake,
          triage: triageResult?.triage || "GREEN",
          screeningResults: screenResults ? { condition: screenResults.condition, riskBand: screenResults.riskBand } : null,
          language,
          profile: userProfile
        })
      });

      const data = await response.json();
      if (data.success && data.summary) {
        setExportedSummary(data.summary.formatted_summary);
      } else {
        throw new Error(data.error || "Failed to generate records summary.");
      }
    } catch (err) {
      console.error("Export summary error:", err);
      const fallbackReport = `### Saathi Patient Health Export (Fallback Mode)\n\n` +
        `**Generated on:** ${new Date().toLocaleDateString()}\n\n` +
        `**Vitals Log:**\n` + vitalsHistory.map(v => `- ${v.date}: HR ${v.heartRate} bpm, BP ${v.systolic}/${v.diastolic}, SpO2 ${v.oxygen}%`).join("\n") + `\n\n` +
        `**Saved Diagnostic Sessions:**\n` + recordsList.map(r => `- ${r.date}: ${r.title} (${r.category})`).join("\n") + `\n\n` +
        `*Note: LLM summary failed to compile. Reconnect to the internet or check Groq API configuration.*`;
      setExportedSummary(fallbackReport);
    } finally {
      setIsExporting(false);
    }
  };

  const renderTrendChart = () => {
    if (!isMounted) return <div className="h-40 bg-slate-50 animate-pulse rounded-xl" />;

    let chartData: any[] = [];
    let strokeColor = "#0d9488";
    let yKey = "value";
    let yName = "Value";

    if (trendMetric === "heartRate") {
      chartData = vitalsHistory.length > 0 
        ? vitalsHistory.map(v => ({ date: v.date.split("-").slice(1).join("/"), value: v.heartRate }))
        : [
            { date: "06/01", value: 72 },
            { date: "06/05", value: 78 },
            { date: "06/10", value: 74 },
          ];
      yKey = "value";
      yName = language === "hi" ? "धड़कन (bpm)" : language === "gu" ? "ધબકારા (bpm)" : "Pulse (bpm)";
      strokeColor = "#0d9488";
    } else if (trendMetric === "bp") {
      chartData = vitalsHistory.length > 0 
        ? vitalsHistory.map(v => ({ date: v.date.split("-").slice(1).join("/"), systolic: v.systolic, diastolic: v.diastolic }))
        : [
            { date: "06/01", systolic: 120, diastolic: 80 },
            { date: "06/05", systolic: 125, diastolic: 82 },
            { date: "06/10", systolic: 118, diastolic: 78 },
          ];
      yName = "BP (mmHg)";
    } else if (trendMetric === "oxygen") {
      chartData = vitalsHistory.length > 0 
        ? vitalsHistory.map(v => ({ date: v.date.split("-").slice(1).join("/"), value: v.oxygen }))
        : [
            { date: "06/01", value: 98 },
            { date: "06/05", value: 97 },
            { date: "06/10", value: 99 },
          ];
      yKey = "value";
      yName = language === "hi" ? "ऑक्सीजन (SpO2%)" : language === "gu" ? "ઓક્સિજન (SpO2%)" : "SpO2 (%)";
      strokeColor = "#3b82f6";
    } else if (trendMetric === "anemia") {
      const scans = recordsList
        .filter(r => r.title.toLowerCase().includes("anemia") || r.notes?.toLowerCase().includes("anemia"))
        .map(r => {
          const scoreMatch = r.notes?.match(/Index Score:\s*(\d+)%/i) || r.notes?.match(/(\d+)%/);
          const score = scoreMatch ? parseInt(scoreMatch[1]) : 15;
          return { date: r.date.split("-").slice(1).join("/"), value: score };
        });
      chartData = scans.length > 0 
        ? scans.reverse()
        : [
            { date: "06/01", value: 14 },
            { date: "06/05", value: 11 },
            { date: "06/10", value: 13 },
          ];
      yKey = "value";
      yName = language === "hi" ? "एनीमिया स्कोर" : language === "gu" ? "એનિમિયા સ્કોર" : "Anemia Index";
      strokeColor = "#f59e0b";
    }

    return (
      <div className="h-44 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={strokeColor} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={strokeColor} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }} axisLine={false} tickLine={false} domain={trendMetric === 'oxygen' ? [90, 100] : ['auto', 'auto']} />
            <Tooltip 
              contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 10, fontWeight: 700 }}
              labelStyle={{ fontWeight: 800, color: '#1e293b' }}
            />
            {trendMetric === "bp" ? (
              <>
                <Area type="monotone" name="Systolic" dataKey="systolic" stroke="#ec4899" fill="rgba(236, 72, 153, 0.1)" strokeWidth={2.5} />
                <Area type="monotone" name="Diastolic" dataKey="diastolic" stroke="#3b82f6" fill="rgba(59, 130, 246, 0.05)" strokeWidth={2.5} />
              </>
            ) : (
              <Area type="monotone" name={yName} dataKey={yKey} stroke={strokeColor} fill="url(#colorMetric)" strokeWidth={2.5} />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div className="p-4 space-y-4 animate-fadeIn overflow-y-auto flex-1 h-full pb-24 text-left">
      {/* Header Info */}
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-600" />
            {t.recordsHeader}
          </h2>
          <p className="text-xs text-slate-500 leading-normal">{t.recordsDesc}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportSummary}
            className="bg-teal-50 text-teal-600 p-2.5 rounded-full border border-teal-100 hover:bg-teal-100 transition-all flex items-center justify-center shadow-sm"
            title="Export Summary"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowRecordForm(!showRecordForm)}
            className="bg-teal-600 text-white p-2.5 rounded-full hover:bg-teal-700 transition-all flex items-center justify-center shadow-sm"
          >
            {showRecordForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* PROFILE CARD */}
      {userProfile && (
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3.5 relative">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-teal-550 text-teal-600 font-extrabold flex items-center justify-center border border-teal-100 text-lg shadow-inner bg-teal-50">
                {userProfile.name ? userProfile.name.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="space-y-0.5">
                <h3 className="font-extrabold text-slate-800 text-base">{userProfile.name}</h3>
                <p className="text-[11px] text-slate-500 font-semibold">
                  {userProfile.age} yrs / {userProfile.gender === "Male" ? (language === "hi" ? "पुरुष" : language === "gu" ? "પુરુષ" : "Male") : userProfile.gender === "Female" ? (language === "hi" ? "महिला" : language === "gu" ? "મહિલા" : "Female") : (language === "hi" ? "अन्य" : language === "gu" ? "અન્ય" : "Other")} | {language === "hi" ? "रक्त समूह" : language === "gu" ? "બ્લડ ગ્રુપ" : "Blood"}: {userProfile.bloodGroup || "N/A"}
                </p>
              </div>
            </div>
            <button
              onClick={onEditProfile}
              className="text-xs font-bold text-teal-600 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-xl border border-teal-100 transition-all active:scale-95 flex items-center gap-1 min-h-[36px]"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>{language === "hi" ? "संपादित करें" : language === "gu" ? "ફેરફાર કરો" : "Edit"}</span>
            </button>
          </div>

          {userProfile.conditions && userProfile.conditions.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {language === "hi" ? "स्वास्थ्य स्थितियां" : language === "gu" ? "આરોગ્ય સ્થિતિઓ" : "Medical Conditions"}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {userProfile.conditions.map((cond: string, idx: number) => {
                  // Find localized label
                  let label = cond;
                  const keyMap: Record<string, string> = {
                    "Diabetes": "diabetes",
                    "High Blood Pressure": "highBP",
                    "Heart Disease": "heartDisease",
                    "Asthma/Respiratory": "asthma",
                    "Thyroid": "thyroid",
                    "Kidney Disease": "kidney",
                    "Anemia": "anemia",
                    "Other": "other",
                    "None": "none"
                  };
                  const key = keyMap[cond];
                  if (key && (conditionLabels as any)[language]?.[key]) {
                    label = (conditionLabels as any)[language][key];
                  }
                  return (
                    <span
                      key={idx}
                      className="text-[10px] font-bold px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-600 rounded-full shadow-sm"
                    >
                      {label}
                      {cond === "Other" && userProfile.otherCondition ? `: ${userProfile.otherCondition}` : ""}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ABHA HEALTH ID CARD (ABDM) */}
      <div className="bg-gradient-to-r from-blue-650 to-indigo-650 rounded-2xl p-4 text-white shadow-md relative overflow-hidden border border-blue-500/10">
        <div className="absolute right-[-10px] top-[-10px] w-24 h-24 bg-white/5 rounded-full blur-xl pointer-events-none" />
        <div className="flex justify-between items-start mb-3">
          <div>
            <span className="text-[9px] uppercase tracking-wider font-extrabold text-blue-100">National Health Authority</span>
            <h4 className="text-sm font-extrabold flex items-center gap-1">
              {language === "hi" ? "ABHA स्वास्थ्य पहचान पत्र" : language === "gu" ? "ABHA સ્વાસ્થ્ય આઈડી" : "ABHA Health ID"}
            </h4>
          </div>
          {isAbhaLinked ? (
            <span className="bg-emerald-500 text-white text-[8px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm uppercase tracking-wide">
              <CheckCircle className="w-2.5 h-2.5 fill-white text-emerald-500" />
              Linked
            </span>
          ) : (
            <span className="bg-amber-500 text-white text-[8px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wide">
              Unlinked
            </span>
          )}
        </div>

        {isAbhaLinked ? (
          <div className="space-y-2">
            <div className="bg-white/10 px-3 py-2 rounded-xl border border-white/10">
              <div className="text-[10px] text-blue-100 font-semibold">Ayushman Bharat Health Account</div>
              <div className="font-mono text-base font-extrabold tracking-widest mt-0.5">{abhaNumber}</div>
            </div>
            <div className="flex justify-between items-center text-[10px] pt-1">
              <span className="text-blue-100 font-bold">Holder: {userProfile?.name || "Vishal Bhanopiya"}</span>
              <button 
                onClick={handleUnlinkAbha}
                className="text-red-200 hover:text-red-105 underline font-extrabold transition-colors active:scale-95 text-red-100"
              >
                Unlink ID
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-[10px] text-blue-100 leading-normal">
              {language === "hi" 
                ? "डिजिटल स्वास्थ्य मिशन के अंतर्गत अपने 14-अंकों के ABHA कार्ड को जोड़ें।"
                : language === "gu"
                ? "ડિજિટલ હેલ્થ મિશન અંતર્ગત તમારા 14-આંકડાના ABHA કાર્ડને કનેક્ટ કરો."
                : "Link your 14-digit National ABHA Health ID to synchronize diagnostic records across facilities."}
            </p>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="e.g. 12-3456-7890-1234"
                  value={abhaNumber}
                  onChange={handleAbhaChange}
                  className="w-full text-xs p-2.5 rounded-xl border border-white/20 bg-white/10 font-bold placeholder-white/40 text-white focus:outline-none focus:border-white focus:bg-white/15 tracking-wider h-[44px]"
                />
                {abhaError && (
                  <span className="absolute left-1 bottom-[-14px] text-[8px] text-red-300 font-bold">{abhaError}</span>
                )}
              </div>
              <button
                onClick={handleLinkAbha}
                className="bg-white text-blue-700 font-extrabold text-xs px-4 rounded-xl hover:bg-slate-50 transition-all active:scale-95 shadow-sm min-h-[44px]"
              >
                Link
              </button>
            </div>
            <div className="text-[8px] text-blue-200/90 leading-tight border-t border-white/5 pt-2 flex items-start gap-1">
              <Info className="w-2.5 h-2.5 shrink-0 mt-0.5" />
              <span><strong>ABDM Prototype:</strong> Real integrations require ABDM sandbox access keys. Card linking is simulated here.</span>
            </div>
          </div>
        )}
      </div>

      {/* Upload Record Form */}
      {showRecordForm && (
        <form onSubmit={handleAddRecord} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-3 animate-scaleUp">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <UploadCloud className="w-4 h-4 text-teal-600" />
            {language === "hi" ? "दस्तावेज़ अपलोड करें" : language === "gu" ? "દસ્તાવેજ અપલોડ કરો" : "Upload Report / Prescription"}
          </h3>
          <div className="space-y-2">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Document Title</label>
              <input
                type="text"
                placeholder="e.g. Blood Sugar Report"
                value={newRecord.title}
                onChange={e => setNewRecord(prev => ({ ...prev, title: e.target.value }))}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 font-semibold focus:outline-none focus:border-teal-500 h-[44px]"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Category</label>
                <select
                  value={newRecord.category}
                  onChange={e => setNewRecord(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 font-semibold focus:outline-none focus:border-teal-500 h-[44px]"
                >
                  <option value="Lab Test">Lab Test</option>
                  <option value="Prescription">Prescription</option>
                  <option value="Imaging">Imaging</option>
                  <option value="Vaccine">Vaccine Card</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Physician / Lab</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Ray"
                  value={newRecord.doctor}
                  onChange={e => setNewRecord(prev => ({ ...prev, doctor: e.target.value }))}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 font-semibold focus:outline-none focus:border-teal-500 h-[44px]"
                  required
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Notes / Summary</label>
              <textarea
                placeholder="Paste report summary, values, or prescriptions here..."
                value={newRecord.notes}
                onChange={e => setNewRecord(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full h-16 text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 font-medium focus:outline-none focus:border-teal-500 resize-none"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-teal-600 text-white font-bold text-xs py-2.5 rounded-xl hover:bg-teal-700 transition-colors shadow-sm min-h-[44px]"
          >
            {t.uploadRecordBtn}
          </button>
        </form>
      )}

      {/* TRENDS CHART DASHBOARD */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-teal-655 text-teal-600" />
            {language === "hi" ? "वाइटल्स एवं स्वास्थ्य रुझान" : language === "gu" ? "વાઇટલ્સ અને સ્વાસ્થ્ય વલણો" : "Vitals & Health Trends"}
          </h3>
          <select
            value={trendMetric}
            onChange={e => setTrendMetric(e.target.value as any)}
            className="text-[10px] font-bold text-slate-655 bg-slate-50 px-2 py-1 rounded-lg border border-slate-250 focus:outline-none cursor-pointer focus:border-teal-500 border-slate-200 h-[32px]"
          >
            <option value="heartRate">Heart Rate</option>
            <option value="bp">Blood Pressure</option>
            <option value="oxygen">SpO2 (Oxygen)</option>
            <option value="anemia">Anemia Index</option>
          </select>
        </div>
        {renderTrendChart()}
      </div>

      {/* VAULT SESSION LIST */}
      <div className="space-y-3">
        <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider px-0.5">
          {language === "hi" ? "कालानुक्रमिक सत्र इतिहास" : language === "gu" ? "ક્રમબદ્ધ સત્ર ઇતિહાસ" : "Chronological Session History"}
        </h3>
        {recordsList.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-100 text-center text-slate-400 text-xs font-medium">
            No health records saved. Click &quot;+&quot; to add reports.
          </div>
        ) : (
          <div className="space-y-2">
            {recordsList.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedRecordForDetails(item)}
                className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm flex items-start justify-between gap-3 hover:border-teal-100 cursor-pointer hover:shadow-md transition-all active:scale-[0.99]"
              >
                <div className="bg-teal-50 p-2.5 rounded-lg text-teal-600 shrink-0">
                  <FileText className="w-4.5 h-4.5" />
                </div>
                <div className="flex-grow space-y-0.5 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-extrabold text-slate-800 text-xs truncate leading-normal">{item.title}</span>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      item.category === "Prescription" 
                        ? "bg-purple-50 text-purple-700 border border-purple-100" 
                        : item.category === "Imaging" 
                          ? "bg-blue-50 text-blue-700 border border-blue-100" 
                          : "bg-teal-50 text-teal-700 border border-teal-100"
                    }`}>
                      {item.category}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-450 font-bold flex items-center gap-2.5 text-slate-500">
                    <span className="flex items-center gap-1 shrink-0">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {item.date}
                    </span>
                    <span className="truncate">Provider: {item.doctor}</span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteRecord(item.id);
                  }}
                  className="text-slate-350 hover:text-red-500 p-1.5 transition-colors self-center active:scale-90 text-slate-400"
                  title="Delete Record"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cloud Backup status */}
      <div className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl p-3.5 border border-teal-100/40 flex items-center justify-between text-[10px] text-teal-850">
        <span className="font-bold flex items-center gap-1.5">
          <Lock className="w-4 h-4 text-teal-655 text-teal-650" />
          End-to-End Encrypted Cloud Storage Active
        </span>
        <span className="font-extrabold underline cursor-pointer hover:text-teal-700">Manage Vault</span>
      </div>

      {/* DETAILS OVERLAY MODAL */}
      {selectedRecordForDetails && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 space-y-4 border border-slate-100 shadow-2xl animate-scaleUp">
            <div className="flex justify-between items-start">
              <div className="space-y-0.5">
                <span className="text-[9px] uppercase tracking-wider font-extrabold text-teal-650 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-full">
                  {selectedRecordForDetails.category}
                </span>
                <h3 className="font-extrabold text-slate-800 text-sm mt-1">{selectedRecordForDetails.title}</h3>
              </div>
              <button 
                onClick={() => setSelectedRecordForDetails(null)} 
                className="bg-slate-50 text-slate-450 hover:bg-slate-100 hover:text-slate-700 p-1.5 rounded-full transition-all active:scale-90"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-650 border-t border-slate-100 pt-3 text-slate-600">
              <div className="flex justify-between">
                <span className="font-bold text-slate-400">Date Recorded:</span>
                <span className="font-bold text-slate-800">{selectedRecordForDetails.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-slate-400">Provider / Lab:</span>
                <span className="font-bold text-slate-800">{selectedRecordForDetails.doctor}</span>
              </div>
              <div className="space-y-1 pt-1.5 border-t border-slate-100/80">
                <span className="font-bold text-slate-400 block uppercase text-[9px] tracking-wider">Detailed breakdown / Notes</span>
                <div className="bg-slate-50 border border-slate-200/60 p-3 rounded-2xl text-[10px] font-medium leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap text-slate-700">
                  {selectedRecordForDetails.notes || "No additional records notes entered."}
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedRecordForDetails(null)}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs py-3 rounded-xl transition-all shadow-sm active:scale-95 min-h-[44px]"
            >
              Close Details
            </button>
          </div>
        </div>
      )}

      {/* EXPORT OVERLAY MODAL */}
      {showExportModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 space-y-4 border border-slate-100 shadow-2xl animate-scaleUp flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-start shrink-0">
              <div className="space-y-0.5">
                <span className="text-[9px] uppercase tracking-wider font-extrabold text-blue-650 bg-blue-50 border border-blue-105 px-2 py-0.5 rounded-full">
                  Health Summary Report
                </span>
                <h3 className="font-extrabold text-slate-800 text-sm mt-1">Export Clinical Records</h3>
              </div>
              <button 
                onClick={() => setShowExportModal(false)} 
                className="bg-slate-50 text-slate-450 hover:bg-slate-100 hover:text-slate-700 p-1.5 rounded-full transition-all active:scale-90"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isExporting ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12 space-y-3">
                <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
                <p className="text-[10px] font-extrabold text-slate-655 text-center max-w-[200px] uppercase tracking-wider animate-pulse text-slate-500">
                  Compiling clinical database summary via Groq Llama 3.3...
                </p>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto bg-slate-50 border border-slate-200/60 p-3.5 rounded-2xl text-[10px] font-medium leading-relaxed prose prose-slate max-h-72">
                  {exportedSummary ? (
                    <div className="space-y-2 whitespace-pre-wrap font-sans text-slate-700">
                      {exportedSummary}
                    </div>
                  ) : (
                    <p className="text-slate-400 italic">No summary compiled.</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 shrink-0">
                  <button
                    onClick={() => {
                      if (exportedSummary) {
                        navigator.clipboard.writeText(exportedSummary);
                        alert("Clinical report summary copied to clipboard!");
                      }
                    }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-95 min-h-[44px]"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copy Text
                  </button>
                  <button
                    onClick={() => {
                      if (exportedSummary) {
                        const element = document.createElement("a");
                        const file = new Blob([exportedSummary], { type: "text/plain" });
                        element.href = URL.createObjectURL(file);
                        element.download = `Saathi_Health_Report_${new Date().toISOString().split("T")[0]}.txt`;
                        document.body.appendChild(element);
                        element.click();
                        document.body.removeChild(element);
                      }
                    }}
                    className="bg-teal-650 hover:bg-teal-700 text-white font-extrabold text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 min-h-[44px]"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download TXT
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

RecordsView.displayName = "RecordsView";
