"use client";

import React, { useState } from "react";
import {
  Users,
  TrendingUp,
  AlertTriangle,
  MapPin,
  FileText,
  Trash2,
  UserPlus,
  Search,
  X,
  Sparkles,
  ArrowRight
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  PieChart,
  Pie
} from "recharts";
import { useLanguage } from "@/context/LanguageContext";
import { safeSetItem, safeRemoveItem } from "@/utils/localStorageHelper";
import { CommunityAnalyticsView } from "./CommunityAnalyticsView";
import { useChartHeight } from "@/hooks/useChartHeight";

export interface PatientRecord {
  title: string;
  date: string;
  type?: string;
  riskBand?: "GREEN" | "YELLOW" | "RED";
  notes?: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  village: string;
  lastScreeningDate?: string;
  lastRiskBand?: "GREEN" | "YELLOW" | "RED";
  records: PatientRecord[];
}

interface AshaViewProps {
  patientsList: Patient[];
  setPatientsList: React.Dispatch<React.SetStateAction<Patient[]>>;
  activePatientId: string | null;
  setActivePatientId: (id: string | null) => void;
  setAshaModeActive: (active: boolean) => void;
  setActiveTab: (tab: string) => void;
  language?: string;
}

export const AshaView: React.FC<AshaViewProps> = React.memo(({
  patientsList,
  setPatientsList,
  activePatientId,
  setActivePatientId,
  setAshaModeActive,
  setActiveTab,
  language: languageProp
}) => {
  const { language, t } = useLanguage();
  const chartHeight = useChartHeight();
  const l = {
    portalHeader: t.ashaPortalHeader || "ASHA Worker Portal",
    portalDesc: t.ashaPortalDesc || "Manage patient screenings, track community risk thresholds, and check referral flags.",
    patientDirectory: t.ashaPatientDirectory || "Patient Directory",
    healthAnalytics: t.ashaHealthAnalytics || "Health Analytics",
    communityDashboard: t.ashaCommunityDashboard || "Community Health Dashboard",
    urgentFollowup: t.ashaUrgentFollowup || "Urgent Follow-up Required",
    urgentFollowupDesc: t.ashaUrgentFollowupDesc || "The following patients have triggered red screening flags and require immediate doctor consultations.",
    searchPlaceholder: t.ashaSearchPlaceholder || "Search by name or village...",
    exitMode: t.ashaExitMode || "Exit Mode",
    noPatientData: t.ashaNoPatientData || "No patient data available",
    addPatientGuide: t.ashaAddPatientGuide || "Add a patient and start screening to view the dashboard.",
    lowRisk: t.ashaLowRisk || "Low Risk",
    mediumRisk: t.ashaMediumRisk || "Medium Risk",
    highRisk: t.ashaHighRisk || "High Risk",
    screened: t.ashaScreened || "Screened",
    consultNow: t.ashaConsultNow || "Consult Now",
    history: t.ashaHistory || "History",
    addPatient: t.ashaAddPatient || "Add Patient",
    activePatient: t.ashaActivePatient || "Active Patient",
    unscreened: t.ashaUnscreened || "Unscreened",
    clearSelection: t.ashaClearSelection || "Clear Selection",
    startScreening: t.ashaStartScreening || "Start Screening",
    addNewPatient: t.ashaAddNewPatient || "Add New Patient",
    patientName: t.ashaPatientName || "Patient Name",
    ageYears: t.ashaAgeYears || "Age (Years)",
    gender: t.ashaGender || "Gender",
    village: t.ashaVillage || "Village / Habitation",
    createProfile: t.ashaCreateProfile || "Create Patient Profile",
    recordsFile: t.ashaRecordsFile || "Patient Records File",
    screeningHistory: t.ashaScreeningHistory || "Screening History",
    noScreenings: t.ashaNoScreenings || "No screenings recorded yet. Select this patient and run screening, vitals, or voice triage.",
    selectForNew: t.ashaSelectForNew || "Select Patient for New Screening",
    placeholderName: t.ashaPlaceholderName || "e.g. Ramesh Singh",
    placeholderAge: t.ashaPlaceholderAge || "e.g. 34",
    placeholderVillage: t.ashaPlaceholderVillage || "e.g. Rampur village",
    lastCheck: t.ashaLastCheck || "Last Check: {date}",
    attachedRecords: t.ashaAttachedRecords || "Records: {count}"
  };

  const [ashaSearchQuery, setAshaSearchQuery] = useState("");
  const [ashaChartType, setAshaChartType] = useState<"donut" | "bar">("donut");
  const [ashaSubTab, setAshaSubTab] = useState<"patients" | "analytics">("patients");

  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [newPatientData, setNewPatientData] = useState({
    name: "",
    age: "",
    gender: "Male",
    village: ""
  });
  const [selectedPatientForProfile, setSelectedPatientForProfile] = useState<Patient | null>(null);

  const selectActivePatientForASHA = (id: string | null) => {
    setActivePatientId(id);
    if (id) {
      safeSetItem("saathi_asha_active_patient_id", id);
    } else {
      safeRemoveItem("saathi_asha_active_patient_id");
    }
  };

  const totalPatients = patientsList.length;
  const redPatients = patientsList.filter(p => p.lastRiskBand === "RED");
  const yellowPatients = patientsList.filter(p => p.lastRiskBand === "YELLOW");
  const greenPatients = patientsList.filter(p => p.lastRiskBand === "GREEN");

  const redCount = redPatients.length;
  const yellowCount = yellowPatients.length;
  const greenCount = greenPatients.length;

  const filteredPatients = patientsList.filter(p => {
    const q = ashaSearchQuery.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.village.toLowerCase().includes(q);
  });

  const handleAddNewPatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientData.name.trim() || !newPatientData.age || !newPatientData.village.trim()) {
      alert("Please fill in all patient fields.");
      return;
    }
    const newP: Patient = {
      id: "p_" + Date.now(),
      name: newPatientData.name,
      age: parseInt(newPatientData.age),
      gender: newPatientData.gender,
      village: newPatientData.village,
      records: []
    };
    const updated = [newP, ...patientsList];
    setPatientsList(updated);
    safeSetItem("saathi_asha_patients", JSON.stringify(updated));
    setShowAddPatientModal(false);
    setNewPatientData({ name: "", age: "", gender: "Male", village: "" });
  };

  const handleDeletePatient = (id: string) => {
    if (confirm("Are you sure you want to delete this patient profile?")) {
      const updated = patientsList.filter(p => p.id !== id);
      setPatientsList(updated);
      safeSetItem("saathi_asha_patients", JSON.stringify(updated));
      if (activePatientId === id) {
        selectActivePatientForASHA(null);
      }
    }
  };

  return (
    <div className="p-4 space-y-6 animate-fadeIn text-left overflow-y-auto flex-1 h-full pb-24">
      {/* Portal Header */}
      <div className="bg-gradient-to-r from-violet-600 to-purple-650 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden border border-violet-500/10 animate-float">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-24 h-24 bg-white/5 rounded-full blur-lg pointer-events-none" />
        
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border border-white/10">
              <Sparkles className="w-3 h-3 text-white" />
              <span>Health Worker Portal</span>
            </div>
            <h2 className="text-xl font-black tracking-tight leading-snug">
              {l.portalHeader}
            </h2>
            <p className="text-xs text-violet-100 max-w-sm leading-relaxed font-medium">
              {l.portalDesc}
            </p>
          </div>
          <button
            onClick={() => {
              setAshaModeActive(false);
              safeSetItem("saathi_asha_mode_active", "false");
              selectActivePatientForASHA(null);
            }}
            className="bg-white text-violet-700 hover:bg-slate-50 border border-white/25 text-[10px] font-black px-4 py-2 rounded-xl transition-all shadow-md shrink-0 active:scale-95"
          >
            {l.exitMode}
          </button>
        </div>
      </div>

      {/* Sub-Tab Selector */}
      <div className="flex bg-slate-100/80 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/60 font-sans shadow-soft">
        <button
          onClick={() => setAshaSubTab("patients")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-[11px] font-black rounded-xl transition-all ${
            ashaSubTab === "patients"
              ? "bg-white text-violet-850 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Users className="w-4 h-4 text-violet-600" />
          <span>{l.patientDirectory}</span>
        </button>
        <button
          onClick={() => setAshaSubTab("analytics")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-[11px] font-black rounded-xl transition-all ${
            ashaSubTab === "analytics"
              ? "bg-white text-violet-850 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
          id="analytics-tab-btn"
        >
          <TrendingUp className="w-4 h-4 text-purple-600" />
          <span>{l.healthAnalytics}</span>
        </button>
      </div>

      {ashaSubTab === "patients" ? (
        <>
          {/* Dashboard Analytics Card */}
          <div className="glass-card p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                {l.communityDashboard}
              </h3>
              
              {/* Chart type toggle tabs */}
              <div className="flex bg-slate-100 p-0.5 rounded-full border border-slate-200/50 shrink-0">
                <button
                  onClick={() => setAshaChartType("donut")}
                  className={`text-[9px] font-extrabold px-3 py-1 rounded-full transition-all ${
                    ashaChartType === "donut" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Donut
                </button>
                <button
                  onClick={() => setAshaChartType("bar")}
                  className={`text-[9px] font-extrabold px-3 py-1 rounded-full transition-all ${
                    ashaChartType === "bar" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Bar
                </button>
              </div>
            </div>

            <div className="relative flex justify-center items-center bg-slate-50/40 rounded-2xl p-4 border border-slate-100 shadow-inner">
              {totalPatients === 0 ? (
                <div className="text-center py-8 text-slate-400 space-y-1">
                  <p className="text-xs font-black">{l.noPatientData}</p>
                  <p className="text-[10px] font-semibold">{l.addPatientGuide}</p>
                </div>
              ) : (
                <div className="w-full flex flex-col items-center">
                  {ashaChartType === "donut" ? (
                    <div className="relative w-full max-w-[200px]">
                      <ResponsiveContainer width="100%" height={chartHeight}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: l.lowRisk, value: greenCount, color: "#10b981" },
                              { name: l.mediumRisk, value: yellowCount, color: "#f59e0b" },
                              { name: l.highRisk, value: redCount, color: "#ef4444" }
                            ].filter(d => d.value > 0)}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={65}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {[
                              { name: l.lowRisk, value: greenCount, color: "#10b981" },
                              { name: l.mediumRisk, value: yellowCount, color: "#f59e0b" },
                              { name: l.highRisk, value: redCount, color: "#ef4444" }
                            ].filter(d => d.value > 0).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.5)', borderRadius: 16, fontSize: 10, fontWeight: 700 }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-wider">{l.screened}</span>
                        <span className="text-xl font-black text-slate-800">{patientsList.filter(p => p.lastRiskBand).length}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full text-[9px]">
                      <ResponsiveContainer width="100%" height={chartHeight}>
                        <BarChart
                          data={[
                            { name: l.lowRisk, value: greenCount, color: "#10b981" },
                            { name: l.mediumRisk, value: yellowCount, color: "#f59e0b" },
                            { name: l.highRisk, value: redCount, color: "#ef4444" }
                          ]}
                          margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0/40" />
                          <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }} axisLine={false} tickLine={false} />
                          <YAxis allowDecimals={false} tick={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }} axisLine={false} tickLine={false} />
                          <Tooltip
                            contentStyle={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.5)', borderRadius: 16, fontSize: 10, fontWeight: 700 }}
                          />
                          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                            {[
                              { name: l.lowRisk, value: greenCount, color: "#10b981" },
                              { name: l.mediumRisk, value: yellowCount, color: "#f59e0b" },
                              { name: l.highRisk, value: redCount, color: "#ef4444" }
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Legend grid */}
            <div className="grid grid-cols-3 gap-2.5 pt-1">
              <div className="bg-emerald-500/[0.04] rounded-2xl p-2.5 border border-emerald-500/10 text-center space-y-0.5">
                <span className="text-[9px] font-extrabold text-emerald-600 block uppercase tracking-wider">{l.lowRisk}</span>
                <span className="text-base font-black text-emerald-700">{greenCount}</span>
              </div>
              <div className="bg-amber-500/[0.04] rounded-2xl p-2.5 border border-amber-500/10 text-center space-y-0.5">
                <span className="text-[9px] font-extrabold text-amber-600 block uppercase tracking-wider">{l.mediumRisk}</span>
                <span className="text-base font-black text-amber-700">{yellowCount}</span>
              </div>
              <div className="bg-rose-500/[0.04] rounded-2xl p-2.5 border border-rose-500/10 text-center space-y-0.5">
                <span className="text-[9px] font-extrabold text-rose-600 block uppercase tracking-wider">{l.highRisk}</span>
                <span className="text-base font-black text-rose-700">{redCount}</span>
              </div>
            </div>
          </div>

          {/* High Risk Follow Up List */}
          {redCount > 0 && (
            <div className="bg-rose-500/[0.03] border border-rose-500/10 rounded-3xl p-5 space-y-3 shadow-soft">
              <div className="flex items-center gap-2 text-rose-600">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
                <h4 className="text-xs font-black uppercase tracking-wider">
                  {l.urgentFollowup}
                </h4>
              </div>
              <p className="text-[10px] text-slate-500 leading-normal font-semibold">
                {l.urgentFollowupDesc}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto no-scrollbar">
                {redPatients.map(p => (
                  <div key={p.id} className="bg-white/90 backdrop-blur-md p-3 rounded-2xl border border-rose-500/10 shadow-soft flex items-center justify-between gap-3">
                    <div className="space-y-0.5 text-left">
                      <span className="font-black text-xs text-slate-800 block">{p.name}</span>
                      <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-bold">
                        <span>{p.age} y / {p.gender}</span>
                        <span>&bull;</span>
                        <span className="flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{p.village}</span>
                      </div>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        onClick={() => {
                          selectActivePatientForASHA(p.id);
                          setActiveTab("talk");
                        }}
                        className="bg-rose-600 hover:bg-rose-750 text-white text-[9px] font-black px-3 py-1.5 rounded-xl shadow-sm h-[28px] transition-all active:scale-95"
                      >
                        {l.consultNow}
                      </button>
                      <button
                        onClick={() => setSelectedPatientForProfile(p)}
                        className="border border-slate-205 text-slate-655 text-[9px] font-black px-3 py-1.5 rounded-xl hover:bg-slate-55 transition-all h-[28px] active:scale-95"
                      >
                        {l.history}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Patient Directory */}
          <div className="glass-card p-5 space-y-4">
            <div className="flex justify-between items-center gap-2">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                {l.patientDirectory}
              </h3>
              <button
                onClick={() => setShowAddPatientModal(true)}
                className="bg-gradient-to-r from-violet-600 to-purple-650 text-white font-extrabold text-[10px] py-2 px-3 rounded-full shadow-md hover:from-violet-750 hover:to-purple-750 transition-all flex items-center gap-1 min-h-[32px] active:scale-95"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{l.addPatient}</span>
              </button>
            </div>

            {/* Search bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="text"
                placeholder={l.searchPlaceholder}
                value={ashaSearchQuery}
                onChange={(e) => setAshaSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 bg-slate-50/40 rounded-full focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 focus:bg-white font-semibold text-xs text-slate-800 h-[44px] transition-all"
              />
            </div>

            {/* Patients directory list */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPatients.length === 0 ? (
                <div className="text-center py-8 text-slate-400 space-y-1">
                  <Users className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="text-xs font-black">No patients found</p>
                  <p className="text-[10px] font-semibold">Add a patient or refine your search query.</p>
                </div>
              ) : (
                filteredPatients.map(p => {
                  const isActive = activePatientId === p.id;
                  return (
                    <div
                      key={p.id}
                      className={`p-4 rounded-2xl border transition-all space-y-3.5 text-left ${
                        isActive 
                          ? "border-violet-400 bg-violet-500/[0.03] ring-1 ring-violet-400/30 shadow-md" 
                          : "border-slate-100 bg-white/60 hover:border-violet-100 hover:shadow-sm"
                      }`}
                    >
                      {/* Patient Core Info */}
                      <div className="flex justify-between items-start gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-sm text-slate-855">{p.name}</span>
                            {isActive && (
                              <span className="bg-violet-600 text-white text-[7px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full animate-pulse shadow-sm">
                                {l.activePatient}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                            <span>{p.age} yrs / {p.gender}</span>
                            <span>&bull;</span>
                            <span className="flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5 text-slate-350" />{p.village}</span>
                          </div>
                        </div>
                        
                        {/* Risk Badge */}
                        {p.lastRiskBand ? (
                          <span className={`text-[8px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm shrink-0 ${
                            p.lastRiskBand === "RED" 
                              ? "bg-rose-100 text-rose-700" 
                              : p.lastRiskBand === "YELLOW" 
                              ? "bg-amber-100 text-amber-700" 
                              : "bg-emerald-100 text-emerald-700"
                          }`}>
                            {p.lastRiskBand} Risk
                          </span>
                        ) : (
                          <span className="bg-slate-100 text-slate-400 text-[8px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shrink-0">
                            {l.unscreened}
                          </span>
                        )}
                      </div>

                      {/* Meta Info */}
                      {p.lastScreeningDate && (
                        <div className="text-[9px] text-slate-500 font-bold flex justify-between bg-slate-50/50 p-2.5 rounded-xl border border-slate-200/50">
                          <span>{l.lastCheck.replace("{date}", p.lastScreeningDate)}</span>
                          <span>{l.attachedRecords.replace("{count}", String(p.records?.length || 0))}</span>
                        </div>
                      )}

                      {/* Action Panel */}
                      <div className="flex justify-between items-center gap-2 pt-2.5 border-t border-slate-100/60">
                        <button
                          onClick={() => {
                            if (isActive) {
                              selectActivePatientForASHA(null);
                            } else {
                              selectActivePatientForASHA(p.id);
                              setActiveTab("screen");
                            }
                          }}
                          className={`text-[9px] font-black py-2 px-3.5 rounded-full transition-all shadow-sm min-h-[32px] active:scale-95 flex items-center gap-1 ${
                            isActive 
                              ? "bg-gray-100 text-gray-850 hover:bg-gray-200 border border-gray-200" 
                              : "bg-gradient-to-r from-violet-600 to-purple-650 text-white hover:from-violet-700 hover:to-purple-700 shadow-md"
                          }`}
                        >
                          <span>{isActive ? l.clearSelection : l.startScreening}</span>
                          {!isActive && <ArrowRight className="w-3 h-3 text-white/90" />}
                        </button>

                        <div className="flex gap-1.5">
                          <button
                            onClick={() => setSelectedPatientForProfile(p)}
                            className="p-2 border border-slate-205 rounded-xl hover:bg-slate-55 text-slate-600 transition-all active:scale-90"
                            title={l.history}
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePatient(p.id)}
                            className="p-2 border border-slate-205 hover:border-rose-200 hover:bg-rose-50 rounded-xl text-slate-400 hover:text-rose-600 transition-all active:scale-90"
                            title="Delete Patient Profile"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      ) : (
        <CommunityAnalyticsView patientsList={patientsList} />
      )}

      {/* Modal: Add Patient */}
      {showAddPatientModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4 animate-fadeIn">
          <div className="bg-white rounded-t-3xl md:rounded-3xl p-6 border-t md:border border-slate-150 shadow-xl max-w-full md:max-w-sm w-full space-y-4 animate-slideUp md:animate-scaleUp text-left pb-[calc(1.5rem+env(safe-area-inset-bottom))] md:pb-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-855 uppercase tracking-wide">
                {l.addNewPatient}
              </h3>
              <button
                onClick={() => setShowAddPatientModal(false)}
                className="p-1 rounded-full hover:bg-slate-50 text-slate-400 hover:text-slate-650 transition-colors"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleAddNewPatient} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wider">{l.patientName}</label>
                <input
                  type="text"
                  required
                  placeholder={l.placeholderName}
                  value={newPatientData.name}
                  onChange={(e) => setNewPatientData({ ...newPatientData, name: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 text-slate-800 font-semibold bg-slate-50/40 focus:bg-white h-[40px] transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wider">{l.ageYears}</label>
                  <input
                    type="number"
                    required
                    placeholder={l.placeholderAge}
                    value={newPatientData.age}
                    onChange={(e) => setNewPatientData({ ...newPatientData, age: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 text-slate-800 font-semibold bg-slate-50/40 focus:bg-white h-[40px] transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wider">{l.gender}</label>
                  <select
                    value={newPatientData.gender}
                    onChange={(e) => setNewPatientData({ ...newPatientData, gender: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 text-slate-800 font-semibold bg-white h-[40px] transition-all"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wider">{l.village}</label>
                <input
                  type="text"
                  required
                  placeholder={l.placeholderVillage}
                  value={newPatientData.village}
                  onChange={(e) => setNewPatientData({ ...newPatientData, village: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 text-slate-800 font-semibold bg-slate-50/40 focus:bg-white h-[40px] transition-all"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-violet-600 to-purple-650 text-white font-extrabold text-xs py-3.5 rounded-full shadow-md hover:from-violet-700 hover:to-purple-700 transition-all active:scale-95 min-h-[44px]"
                >
                  {l.createProfile}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Patient Screening Records Profile */}
      {selectedPatientForProfile && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4 animate-fadeIn">
          <div className="bg-white rounded-t-3xl md:rounded-3xl p-6 border-t md:border border-slate-150 shadow-xl max-w-full md:max-w-md w-full space-y-4 max-h-[85vh] overflow-y-auto no-scrollbar animate-slideUp md:animate-scaleUp text-left pb-[calc(1.5rem+env(safe-area-inset-bottom))] md:pb-6">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div className="space-y-1 text-left font-sans">
                <h3 className="text-sm font-black text-slate-855 uppercase tracking-wider">
                  {l.recordsFile}
                </h3>
                <p className="text-xs font-black text-slate-700">
                  {selectedPatientForProfile.name} ({selectedPatientForProfile.age}y / {selectedPatientForProfile.gender})
                </p>
                <p className="text-[10px] font-bold text-slate-400 flex items-center gap-0.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-350" /> {selectedPatientForProfile.village}
                </p>
              </div>
              <button
                onClick={() => setSelectedPatientForProfile(null)}
                className="p-1 rounded-full hover:bg-slate-50 text-slate-400 hover:text-slate-650 transition-colors"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Records List */}
            <div className="space-y-3 text-left">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                {l.screeningHistory}
              </h4>
              
              {selectedPatientForProfile.records?.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-slate-205 rounded-2xl text-slate-400 text-xs font-semibold">
                  {l.noScreenings}
                </div>
              ) : (
                <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
                  {selectedPatientForProfile.records.map((rec, index) => (
                    <div key={index} className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-200/60 text-xs space-y-1.5 text-left shadow-soft">
                      <div className="flex justify-between items-center font-black text-slate-700 gap-2">
                        <span className="text-[11px]">{rec.title}</span>
                        <span className="text-[9px] text-slate-450 font-semibold shrink-0">{rec.date}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-semibold leading-relaxed bg-white/70 p-2.5 rounded-xl border border-slate-200/50">
                        {rec.notes || "No details provided"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  selectActivePatientForASHA(selectedPatientForProfile.id);
                  setSelectedPatientForProfile(null);
                  setActiveTab("screen");
                }}
                className="w-full bg-gradient-to-r from-violet-600 to-purple-650 text-white font-extrabold text-xs py-3.5 rounded-full hover:from-violet-700 hover:to-purple-700 transition-all shadow-md active:scale-95 min-h-[44px]"
              >
                {l.selectForNew}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

AshaView.displayName = "AshaView";
