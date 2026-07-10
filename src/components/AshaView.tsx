import React, { useState } from "react";
import {
  Users,
  TrendingUp,
  AlertTriangle,
  MapPin,
  FileText,
  Trash2,
  Lock,
  UserPlus,
  Search,
  X
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { useLanguage } from "@/context/LanguageContext";
import { safeGetItem, safeSetItem, safeRemoveItem } from "@/utils/localStorageHelper";
import { CommunityAnalyticsView } from "./CommunityAnalyticsView";

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
}

export const AshaView: React.FC<AshaViewProps> = React.memo(({
  patientsList,
  setPatientsList,
  activePatientId,
  setActivePatientId,
  setAshaModeActive,
  setActiveTab
}) => {
  const { language, t } = useLanguage();
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
    <div className="p-4 space-y-6 animate-fadeIn text-left">
      {/* Portal Header */}
      <div className="bg-gradient-to-r from-teal-700 to-emerald-700 rounded-3xl p-5 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-white/10 rounded-full blur-xl" />
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <span className="bg-emerald-500/30 text-emerald-300 font-extrabold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-emerald-400/20">
              Health Worker Portal
            </span>
            <h2 className="text-xl font-black tracking-tight mt-1">
              {l.portalHeader}
            </h2>
            <p className="text-xs text-teal-100 max-w-xs leading-normal">
              {l.portalDesc}
            </p>
          </div>
          <button
            onClick={() => {
              setAshaModeActive(false);
              safeSetItem("saathi_asha_mode_active", "false");
              selectActivePatientForASHA(null);
            }}
            className="bg-white/10 hover:bg-white/20 text-white border border-white/20 text-[10px] font-bold px-3 py-1.5 rounded-xl transition-all"
          >
            {l.exitMode}
          </button>
        </div>
      </div>

      {/* Sub-Tab Selector */}
      <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/50 font-sans border-slate-200">
        <button
          onClick={() => setAshaSubTab("patients")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-extrabold rounded-xl transition-all ${
            ashaSubTab === "patients"
              ? "bg-white text-teal-800 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>{l.patientDirectory}</span>
        </button>
        <button
          onClick={() => setAshaSubTab("analytics")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-extrabold rounded-xl transition-all ${
            ashaSubTab === "analytics"
              ? "bg-white text-teal-800 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
          id="analytics-tab-btn"
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>{l.healthAnalytics}</span>
        </button>
      </div>

      {ashaSubTab === "patients" ? (
        <>
          {/* Dashboard Analytics Card */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                {l.communityDashboard}
              </h3>
              
              {/* Chart type toggle tabs */}
              <div className="flex bg-slate-100 p-0.5 rounded-full border border-slate-200/50 shrink-0 border-slate-200">
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

            <div className="relative flex justify-center items-center bg-slate-50/50 rounded-2xl p-4 border border-slate-100 shadow-inner">
              {totalPatients === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <p className="text-xs font-bold">{l.noPatientData}</p>
                  <p className="text-[10px]">{l.addPatientGuide}</p>
                </div>
              ) : (
                <div className="w-full flex flex-col items-center">
                  {ashaChartType === "donut" ? (
                    <div className="relative w-full max-w-[200px] h-40">
                      <ResponsiveContainer width="100%" height="100%">
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
                            contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 10, fontWeight: 700 }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">{l.screened}</span>
                        <span className="text-lg font-black text-slate-800">{patientsList.filter(p => p.lastRiskBand).length}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-40">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={[
                            { name: l.lowRisk, value: greenCount, color: "#10b981" },
                            { name: l.mediumRisk, value: yellowCount, color: "#f59e0b" },
                            { name: l.highRisk, value: redCount, color: "#ef4444" }
                          ]}
                          margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }} axisLine={false} tickLine={false} />
                          <YAxis allowDecimals={false} tick={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }} axisLine={false} tickLine={false} />
                          <Tooltip
                            contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 10, fontWeight: 700 }}
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
              <div className="bg-emerald-50 rounded-2xl p-2.5 border border-emerald-100/50 text-center space-y-0.5 border-emerald-100">
                <span className="text-[9px] font-extrabold text-emerald-600 block uppercase tracking-wide">{l.lowRisk}</span>
                <span className="text-base font-black text-emerald-700">{greenCount}</span>
              </div>
              <div className="bg-amber-50 rounded-2xl p-2.5 border border-amber-100/50 text-center space-y-0.5 border-amber-100">
                <span className="text-[9px] font-extrabold text-amber-600 block uppercase tracking-wide">{l.mediumRisk}</span>
                <span className="text-base font-black text-amber-700">{yellowCount}</span>
              </div>
              <div className="bg-rose-50 rounded-2xl p-2.5 border border-rose-100/50 text-center space-y-0.5 border-rose-100">
                <span className="text-[9px] font-extrabold text-rose-600 block uppercase tracking-wide">{l.highRisk}</span>
                <span className="text-base font-black text-rose-700">{redCount}</span>
              </div>
            </div>
          </div>

          {/* High Risk Follow Up List */}
          {redCount > 0 && (
            <div className="bg-rose-50 border border-rose-100 rounded-3xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-rose-600">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
                <h4 className="text-xs font-black uppercase tracking-wider">
                  {l.urgentFollowup}
                </h4>
              </div>
              <p className="text-[10px] text-slate-500 leading-normal">
                {l.urgentFollowupDesc}
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
                {redPatients.map(p => (
                  <div key={p.id} className="bg-white p-3 rounded-2xl border border-rose-100 shadow-sm flex items-center justify-between">
                    <div className="space-y-0.5 text-left">
                      <span className="font-extrabold text-xs text-slate-800">{p.name}</span>
                      <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-bold">
                        <span>{p.age} y / {p.gender}</span>
                        <span>&bull;</span>
                        <span className="flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{p.village}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          selectActivePatientForASHA(p.id);
                          setActiveTab("talk");
                        }}
                        className="bg-rose-600 hover:bg-rose-700 text-white text-[9px] font-bold px-2.5 py-1.5 rounded-xl shadow-sm h-[28px]"
                      >
                        {l.consultNow}
                      </button>
                      <button
                        onClick={() => setSelectedPatientForProfile(p)}
                        className="border border-slate-200 text-slate-655 text-[9px] font-bold px-2.5 py-1.5 rounded-xl hover:bg-slate-50 border-slate-250 h-[28px]"
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
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                {l.patientDirectory}
              </h3>
              <button
                onClick={() => setShowAddPatientModal(true)}
                className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-extrabold text-[10px] py-2 px-3 rounded-xl shadow-md hover:from-teal-700 hover:to-emerald-700 transition-all flex items-center gap-1 min-h-[32px]"
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
                className="w-full pl-9 pr-4 py-2.5 border border-slate-100 rounded-2xl bg-slate-50 focus:outline-none focus:border-teal-500 font-medium text-xs text-slate-800 h-[44px] border-slate-200"
              />
            </div>

            {/* Patients directory list */}
            <div className="space-y-3">
              {filteredPatients.length === 0 ? (
                <div className="text-center py-8 text-slate-400 space-y-1">
                  <Users className="w-10 h-10 mx-auto text-slate-200" />
                  <p className="text-xs font-bold">No patients found</p>
                  <p className="text-[10px]">Add a patient or refine your search query.</p>
                </div>
              ) : (
                filteredPatients.map(p => {
                  const isActive = activePatientId === p.id;
                  return (
                    <div
                      key={p.id}
                      className={`p-4 rounded-2xl border transition-all space-y-3 text-left ${
                        isActive 
                          ? "border-teal-400 bg-teal-50/30 ring-1 ring-teal-400/50 shadow-md" 
                          : "border-slate-100 bg-white hover:border-teal-100 hover:shadow-sm"
                      }`}
                    >
                      {/* Patient Core Info */}
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-slate-800">{p.name}</span>
                            {isActive && (
                              <span className="bg-teal-600 text-white text-[7px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded animate-pulse">
                                {l.activePatient}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                            <span>{p.age} yrs / {p.gender}</span>
                            <span>&bull;</span>
                            <span className="flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{p.village}</span>
                          </div>
                        </div>
                        
                        {/* Risk Badge */}
                        {p.lastRiskBand ? (
                          <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            p.lastRiskBand === "RED" 
                              ? "bg-rose-100 text-rose-700" 
                              : p.lastRiskBand === "YELLOW" 
                              ? "bg-amber-100 text-amber-700" 
                              : "bg-emerald-100 text-emerald-700"
                          }`}>
                            {p.lastRiskBand} Risk
                          </span>
                        ) : (
                          <span className="bg-slate-100 text-slate-400 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                            {l.unscreened}
                          </span>
                        )}
                      </div>

                      {/* Meta Info */}
                      {p.lastScreeningDate && (
                        <div className="text-[9px] text-slate-500 font-bold flex justify-between bg-slate-50 p-2 rounded-xl border border-slate-100 border-slate-200">
                          <span>{l.lastCheck.replace("{date}", p.lastScreeningDate)}</span>
                          <span>{l.attachedRecords.replace("{count}", String(p.records?.length || 0))}</span>
                        </div>
                      )}

                      {/* Action Panel */}
                      <div className="flex justify-between items-center gap-2 pt-1.5 border-t border-slate-100/60">
                        <button
                          onClick={() => {
                            if (isActive) {
                              selectActivePatientForASHA(null);
                            } else {
                              selectActivePatientForASHA(p.id);
                              setActiveTab("screen");
                            }
                          }}
                          className={`text-[9px] font-extrabold py-2 px-3 rounded-xl transition-all shadow-sm min-h-[32px] ${
                            isActive 
                              ? "bg-slate-800 text-white hover:bg-slate-900" 
                              : "bg-teal-600 text-white hover:bg-teal-700"
                          }`}
                        >
                          {isActive ? l.clearSelection : l.startScreening}
                        </button>

                        <div className="flex gap-1">
                          <button
                            onClick={() => setSelectedPatientForProfile(p)}
                            className="p-2 border border-slate-100 rounded-xl hover:bg-slate-50 text-slate-655 transition-colors border-slate-200 text-slate-600"
                            title={l.history}
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeletePatient(p.id)}
                            className="p-2 border border-slate-100 hover:border-rose-100 hover:bg-rose-50 rounded-xl text-slate-450 hover:text-rose-600 transition-colors border-slate-200 text-slate-400"
                            title="Delete Patient Profile"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl max-w-sm w-full space-y-4 animate-scaleUp text-left">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">
                {l.addNewPatient}
              </h3>
              <button
                onClick={() => setShowAddPatientModal(false)}
                className="p-1 rounded-full hover:bg-slate-50 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddNewPatient} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{l.patientName}</label>
                <input
                  type="text"
                  required
                  placeholder={l.placeholderName}
                  value={newPatientData.name}
                  onChange={(e) => setNewPatientData({ ...newPatientData, name: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-teal-500 text-slate-800 font-medium h-[36px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{l.ageYears}</label>
                  <input
                    type="number"
                    required
                    placeholder={l.placeholderAge}
                    value={newPatientData.age}
                    onChange={(e) => setNewPatientData({ ...newPatientData, age: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-teal-500 text-slate-800 font-medium h-[36px]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{l.gender}</label>
                  <select
                    value={newPatientData.gender}
                    onChange={(e) => setNewPatientData({ ...newPatientData, gender: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-teal-500 text-slate-800 font-medium bg-white h-[36px]"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{l.village}</label>
                <input
                  type="text"
                  required
                  placeholder={l.placeholderVillage}
                  value={newPatientData.village}
                  onChange={(e) => setNewPatientData({ ...newPatientData, village: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-teal-500 text-slate-800 font-medium h-[36px]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-extrabold text-xs py-3.5 rounded-xl shadow-md transition-all active:scale-95 min-h-[44px]"
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl max-w-md w-full space-y-4 max-h-[85vh] overflow-y-auto no-scrollbar animate-scaleUp text-left">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div className="space-y-0.5 text-left font-sans">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">
                  {l.recordsFile}
                </h3>
                <p className="text-[11px] font-bold text-slate-500">
                  {selectedPatientForProfile.name} ({selectedPatientForProfile.age}y / {selectedPatientForProfile.gender})
                </p>
                <p className="text-[10px] font-semibold text-slate-400 flex items-center gap-0.5">
                  <MapPin className="w-3 h-3 text-slate-350" /> {selectedPatientForProfile.village}
                </p>
              </div>
              <button
                onClick={() => setSelectedPatientForProfile(null)}
                className="p-1 rounded-full hover:bg-slate-50 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Records List */}
            <div className="space-y-3 text-left">
              <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                {l.screeningHistory}
              </h4>
              
              {selectedPatientForProfile.records?.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-slate-150 rounded-2xl text-slate-400 text-xs border-slate-200">
                  {l.noScreenings}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {selectedPatientForProfile.records.map((rec, index) => (
                    <div key={index} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1 border-slate-200 text-left">
                      <div className="flex justify-between items-center font-extrabold text-slate-700">
                        <span className="text-[11px]">{rec.title}</span>
                        <span className="text-[9px] text-slate-400 font-semibold">{rec.date}</span>
                      </div>
                      <div className="text-[9px] text-slate-500 font-medium leading-relaxed bg-white/60 p-2 rounded-lg border border-slate-100 border-slate-200">
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
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-sm min-h-[44px]"
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
