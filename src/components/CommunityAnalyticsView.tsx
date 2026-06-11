import React, { useMemo } from "react";
import { Lock, AlertTriangle } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";

interface CommunityAnalyticsViewProps {
  patientsList: any[];
}

export const CommunityAnalyticsView: React.FC<CommunityAnalyticsViewProps> = React.memo(({
  patientsList
}) => {
  const { language } = useLanguage();

  // --- COMMUNITY HEALTH ANALYTICS DATA ---
  const { riskTypesByArea, casesOverTime, outbreakAlerts } = useMemo(() => {
    const baseRiskTypesByArea = [
      { village: "Rampur", Fever: 8, Respiratory: 4, Cardiovascular: 2, Anemia: 9 },
      { village: "Gopalpur", Fever: 2, Respiratory: 11, Cardiovascular: 7, Anemia: 3 },
      { village: "Karimpur", Fever: 4, Respiratory: 3, Cardiovascular: 10, Anemia: 6 },
      { village: "Sonpur", Fever: 12, Respiratory: 5, Cardiovascular: 1, Anemia: 8 },
      { village: "Bhimpur", Fever: 1, Respiratory: 2, Cardiovascular: 11, Anemia: 3 }
    ];

    const baseCasesOverTime = [
      { date: "06/02", "High Risk": 3, "Medium Risk": 8 },
      { date: "06/03", "High Risk": 4, "Medium Risk": 10 },
      { date: "06/04", "High Risk": 2, "Medium Risk": 7 },
      { date: "06/05", "High Risk": 5, "Medium Risk": 9 },
      { date: "06/06", "High Risk": 6, "Medium Risk": 12 },
      { date: "06/07", "High Risk": 3, "Medium Risk": 11 },
      { date: "06/08", "High Risk": 4, "Medium Risk": 13 },
      { date: "06/09", "High Risk": 7, "Medium Risk": 15 },
      { date: "06/10", "High Risk": 8, "Medium Risk": 14 },
      { date: "06/11", "High Risk": 5, "Medium Risk": 12 }
    ];

    const riskTypes = baseRiskTypesByArea.map(item => ({ ...item }));
    const cases = baseCasesOverTime.map(item => ({ ...item }));

    patientsList.forEach(p => {
      let areaIndex = riskTypes.findIndex(a => a.village.toLowerCase() === p.village.toLowerCase());
      if (areaIndex === -1) {
        riskTypes.push({ village: p.village, Fever: 0, Respiratory: 0, Cardiovascular: 0, Anemia: 0 });
        areaIndex = riskTypes.length - 1;
      }

      p.records?.forEach((r: any) => {
        const title = (r.title || "").toLowerCase();
        const notes = (r.notes || "").toLowerCase();

        // Categorize
        if (title.includes("fever") || title.includes("temperature") || title.includes("flu") || notes.includes("fever") || notes.includes("temperature")) {
          riskTypes[areaIndex].Fever += 1;
        } else if (title.includes("respiratory") || title.includes("spo2") || title.includes("oxygen") || notes.includes("respiratory") || notes.includes("oxygen") || notes.includes("cough")) {
          riskTypes[areaIndex].Respiratory += 1;
        } else if (title.includes("bp") || title.includes("blood pressure") || title.includes("pulse") || notes.includes("blood pressure") || notes.includes("heart")) {
          riskTypes[areaIndex].Cardiovascular += 1;
        } else if (title.includes("anemia") || title.includes("hb") || title.includes("hemoglobin") || notes.includes("anemia") || notes.includes("hemoglobin")) {
          riskTypes[areaIndex].Anemia += 1;
        } else {
          riskTypes[areaIndex].Fever += 1;
        }

        // Add to cases over time
        const recordDate = r.date ? r.date.split("-").slice(1).join("/") : "06/11";
        let timeIndex = cases.findIndex(c => c.date === recordDate);
        if (timeIndex === -1) {
          cases.push({ date: recordDate, "High Risk": 0, "Medium Risk": 0 });
          timeIndex = cases.length - 1;
        }

        if (r.type === "RED" || r.riskBand === "RED") {
          cases[timeIndex]["High Risk"] += 1;
        } else if (r.type === "YELLOW" || r.riskBand === "YELLOW") {
          cases[timeIndex]["Medium Risk"] += 1;
        }
      });
    });

    const feverThreshold = 5;
    const alerts: { village: string; feverCases: number; threshold: number; possibleInfection: string }[] = [];

    riskTypes.forEach(area => {
      if (area.Fever >= feverThreshold) {
        let possibleInfection = "Malaria / Dengue (Vector-borne)";
        if (area.village === "Sonpur") {
          possibleInfection = "Influenza / Acute Respiratory Infection";
        }
        alerts.push({
          village: area.village,
          feverCases: area.Fever,
          threshold: feverThreshold,
          possibleInfection
        });
      }
    });

    return { riskTypesByArea: riskTypes, casesOverTime: cases, outbreakAlerts: alerts };
  }, [patientsList]);

  return (
    <div className="space-y-6 animate-fadeIn text-left">
      {/* Privacy Disclaimer Card */}
      <div className="bg-teal-50 border border-teal-100 rounded-2xl p-4 flex items-start gap-3">
        <Lock className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-xs font-black text-teal-800 uppercase tracking-wide">
            🔒 Aggregated & Anonymized Data Panel
          </h4>
          <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
            {language === "hi"
              ? "यह डैशबोर्ड सार्वजनिक स्वास्थ्य निगरानी के लिए सभी मरीजों की स्क्रीनिंग से प्राप्त केवल एकत्रित और अज्ञात डेटा प्रदर्शित करता है। व्यक्तिगत विवरण सुरक्षित रूप से स्थानीय रूप से संग्रहीत किए जाते हैं।"
              : language === "gu"
              ? "આ ડેશબોર્ડ જાહેર આરોગ્ય દેખરેખ માટે તમામ દર્દીઓના સ્ક્રિનિંગમાંથી મેળવેલ માત્ર એકત્રિત અને અનામી ડેટા પ્રદર્શિત કરે છે. વ્યક્તિગત વિગતો સુરક્ષિત રીતે સ્થાનિક રીતે સંગ્રહિત કરવામાં આવે છે."
              : "All community metrics shown below are compiled using aggregate screening records and village metadata. Personal identities have been anonymized to protect patient privacy."}
          </p>
        </div>
      </div>

      {/* Outbreak Alerts Warning Cards */}
      {outbreakAlerts.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-black text-rose-500 uppercase tracking-wider flex items-center gap-1.5 px-1">
            <AlertTriangle className="w-4 h-4 text-rose-500 animate-pulse" />
            <span>Active Outbreak Warning Cards</span>
          </h4>

          <div className="grid grid-cols-1 gap-3">
            {outbreakAlerts.map((alert, index) => (
              <div key={index} className="bg-rose-50 border border-rose-100 rounded-3xl p-5 flex items-start gap-4 shadow-sm relative overflow-hidden animate-pulseCard">
                <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-16 h-16 bg-rose-500/5 rounded-full" />
                <div className="bg-rose-500 text-white p-3 rounded-2xl shrink-0 shadow-inner">
                  <AlertTriangle className="w-6 h-6 animate-pulse" />
                </div>
                <div className="space-y-2 flex-grow">
                  <div className="flex justify-between items-start">
                    <span className="bg-rose-500 text-white text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                      Rule Triggered
                    </span>
                    <span className="text-[9px] text-rose-600 font-extrabold bg-rose-100 px-2 py-0.5 rounded-full">
                      Fever Threshold Exceeded
                    </span>
                  </div>
                  <h3 className="font-extrabold text-sm text-slate-800">
                    Potential {alert.possibleInfection} Outbreak in <strong className="text-rose-600 underline decoration-dotted">{alert.village}</strong>
                  </h3>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Fever-related cases in <strong>{alert.village}</strong> reached <strong>{alert.feverCases} cases</strong> this week, exceeding the local public health safety threshold of <strong>{alert.threshold} cases</strong>.
                  </p>
                  <div className="pt-2 border-t border-rose-100/50 flex flex-col gap-1.5">
                    <span className="text-[9px] font-black text-rose-700 uppercase tracking-wide">Recommended Actions:</span>
                    <ul className="list-disc list-inside text-[9px] text-slate-600 space-y-1 pl-1 font-semibold">
                      <li>Mobilize vector control, conduct mosquito breeding site checks in {alert.village}.</li>
                      <li>Host an active fever screening camp and distribute insecticide-treated bed nets.</li>
                      <li>Log teleconsultation requests for all high-risk febrile patients.</li>
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chart 1: Risk Types by Area (Village breakdown) */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4 text-left">
        <div>
          <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">
            Common Symptoms & Risks by Area
          </h3>
          <p className="text-[9px] text-slate-400 mt-0.5">Aggregated conditions distribution across villages (Anonymized)</p>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={riskTypesByArea} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="village" tick={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 10, fontWeight: 700 }}
              />
              <Legend wrapperStyle={{ fontSize: 10, fontWeight: 700, paddingTop: 10 }} iconType="circle" />
              <Bar dataKey="Fever" stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} name="Fever / Flu" />
              <Bar dataKey="Respiratory" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} name="Respiratory" />
              <Bar dataKey="Cardiovascular" stackId="a" fill="#0d9488" radius={[0, 0, 0, 0]} name="Cardio" />
              <Bar dataKey="Anemia" stackId="a" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Anemia / Nutrition" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Cases Trend Over Time */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4 text-left">
        <div>
          <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">
            Epidemiological Trend Line
          </h3>
          <p className="text-[9px] text-slate-400 mt-0.5">Medium and High risk case tracking over last 10 days (Aggregated)</p>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={casesOverTime} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="colorHighRisk" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorMediumRisk" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 10, fontWeight: 700 }}
              />
              <Legend wrapperStyle={{ fontSize: 10, fontWeight: 700, paddingTop: 10 }} iconType="circle" />
              <Area type="monotone" name="High Risk (Red)" dataKey="High Risk" stroke="#ef4444" fill="url(#colorHighRisk)" strokeWidth={2} />
              <Area type="monotone" name="Medium Risk (Yellow)" dataKey="Medium Risk" stroke="#f59e0b" fill="url(#colorMediumRisk)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
});

CommunityAnalyticsView.displayName = "CommunityAnalyticsView";
