import React, { useState, useEffect, useRef } from "react";
import { X, Star, Phone, Loader2, Mic, Video, PhoneOff } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { checkRateLimit } from "@/utils/rateLimit";

interface TelemedicineOverlayProps {
  activeCall: boolean;
  setActiveCall: (val: boolean) => void;
  triageResult: any;
  screenResults: any;
  symptomsText: string;
  userProfile?: any;
}

export const TelemedicineOverlay: React.FC<TelemedicineOverlayProps> = React.memo(({
  activeCall,
  setActiveCall,
  triageResult,
  screenResults,
  symptomsText,
  userProfile
}) => {
  const { language, t } = useLanguage();

  const l = {
    telemedTitle: t.telemedTitle || "Saathi Telemedicine Connect",
    telemedStepDoctors: t.telemedStepDoctors || "1. Doctors List",
    telemedStepSummary: t.telemedStepSummary || "2. Doctor Summary",
    telemedStepCall: t.telemedStepCall || "3. Consultation Call",
    telemedNearbyFacilities: t.telemedNearbyFacilities || "Nearby Medical Facilities",
    telemedNearbyDesc: t.telemedNearbyDesc || "We detected the following healthcare options. For YELLOW or RED triage, the most relevant specialist or emergency service is listed first.",
    telemedDistance: t.telemedDistance || "Distance: {distance}",
    telemedAvailableNow: t.telemedAvailableNow || "Available Now",
    telemedRequestConsultation: t.telemedRequestConsultation || "Request Consultation",
    telemedClinicalIntakeSummary: t.telemedClinicalIntakeSummary || "Clinical Intake Summary",
    telemedGeneratingIntake: t.telemedGeneratingIntake || "Generating intake record using Groq Llama 3.3 to compile symptoms, triage priority, and camera screening results.",
    telemedConsultingCoordinator: t.telemedConsultingCoordinator || "Consulting AI coordinator...",
    telemedChiefComplaint: t.telemedChiefComplaint || "Chief Complaint:",
    telemedCalculatedUrgency: t.telemedCalculatedUrgency || "Calculated Urgency:",
    telemedScreeningSignals: t.telemedScreeningSignals || "Screening Signals:",
    telemedDiagnosticFocus: t.telemedDiagnosticFocus || "Primary Diagnostic Focus:",
    telemedLowBandwidth: t.telemedLowBandwidth || "Low-Bandwidth Mode",
    telemedDisableCamera: t.telemedDisableCamera || "Disable camera; run voice consultation fallback",
    telemedSendConnect: t.telemedSendConnect || "Send to Doctor & Connect",
    telemedBack: t.telemedBack || "Back",
    telemedPartner: t.telemedPartner || "Consultation Partner:",
    telemedAudioOnlyFallback: t.telemedAudioOnlyFallback || "Audio-Only Fallback Connected",
    telemedAudioOnlyDesc: t.telemedAudioOnlyDesc || "Low bandwidth connection detected. Video stream has been disabled to prioritize audio quality.",
    telemedYouWebRtc: t.telemedYouWebRtc || "You (WebRTC)",
    telemedSystemBusyOffline: t.telemedSystemBusyOffline || "### Clinical Intake Summary [System Busy - Offline Fallback]\n\n**Chief Complaint:** {complaint}\n\n**Triage Urgency:** {urgency}\n\n**Screening Results:** {screening}\n\n**Suggested Focus:** Direct physician evaluation of reported symptoms. (System busy, running local rate-limit fallback)",
    telemedClinicalOffline: t.telemedClinicalOffline || "### Clinical Intake Summary (Offline Fallback)\n\n**Chief Complaint:** {complaint}\n\n**Triage Urgency:** {urgency}\n\n**Screening Results:** {screening}\n\n**Suggested Focus:** Direct physician evaluation of reported symptoms."
  };

  const [telemedStep, setTelemedStep] = useState<"doctors" | "summary" | "call">("doctors");
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [doctorSummary, setDoctorSummary] = useState<any>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [isCallAudioOnly, setIsCallAudioOnly] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [callTimer, setCallTimer] = useState(0);
  const [webRTCStatus, setWebRTCStatus] = useState("Disconnected");

  // WebRTC Sim Loopback References
  const pc1Ref = useRef<RTCPeerConnection | null>(null);
  const pc2Ref = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);

  const startWebRTCLoopback = async () => {
    setWebRTCStatus("Accessing media devices...");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: !isCallAudioOnly,
        audio: true
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      setWebRTCStatus("Establishing peer connection...");
      const pc1 = new RTCPeerConnection();
      const pc2 = new RTCPeerConnection();

      pc1Ref.current = pc1;
      pc2Ref.current = pc2;

      stream.getTracks().forEach(track => pc1.addTrack(track, stream));

      pc1.onicecandidate = e => {
        if (e.candidate) pc2.addIceCandidate(e.candidate).catch(console.error);
      };
      pc2.onicecandidate = e => {
        if (e.candidate) pc1.addIceCandidate(e.candidate).catch(console.error);
      };

      pc2.ontrack = e => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = e.streams[0];
        }
      };

      const offer = await pc1.createOffer();
      await pc1.setLocalDescription(offer);
      await pc2.setRemoteDescription(offer);

      const answer = await pc2.createAnswer();
      await pc2.setLocalDescription(answer);
      await pc1.setRemoteDescription(answer);

      setWebRTCStatus("Connected (WebRTC Sim Loopback)");
    } catch (err) {
      console.error("WebRTC initialization failed:", err);
      setWebRTCStatus("Connected (Audio stream only)");
    }
  };

  const stopWebRTCLoopback = () => {
    if (pc1Ref.current) {
      pc1Ref.current.close();
      pc1Ref.current = null;
    }
    if (pc2Ref.current) {
      pc2Ref.current.close();
      pc2Ref.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    setWebRTCStatus("Disconnected");
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeCall && telemedStep === "call") {
      interval = setInterval(() => {
        setCallTimer(prev => prev + 1);
      }, 1000);

      startWebRTCLoopback();
    } else {
      setCallTimer(0);
      stopWebRTCLoopback();
    }
    return () => {
      clearInterval(interval);
      stopWebRTCLoopback();
    };
  }, [activeCall, telemedStep, isCallAudioOnly]);

  const getNearbyDoctors = () => {
    const defaultList = [
      {
        id: 1,
        name: language === "hi" ? "सामुदायिक स्वास्थ्य केंद्र (घटलोडिया)" : language === "gu" ? "સામુદાયિક આરોગ્ય કેન્દ્ર (ઘાટલોડિયા)" : "Community PHC (Ghatlodia)",
        type: "PHC" as const,
        specialty: language === "hi" ? "प्राथमिक स्वास्थ्य, मातृ एवं शिशु देखभाल" : language === "gu" ? "પ્રાથમિક આરોગ્ય, માતૃત્વ અને બાળ સંભાળ" : "Primary Health, Maternal & Child Care",
        distance: "1.2 km",
        available: true,
        recommendationMatch: language === "hi" ? "प्राथमिक देखभाल और बुनियादी निदान के लिए अत्यधिक अनुशंसित" : language === "gu" ? "પ્રાથમિક સંભાળ અને મૂળભૂત નિદાન માટે ખૂબ જ ભલામણ કરેલ" : "Highly Recommended for Primary Care & Basic Diagnostics"
      },
      {
        id: 2,
        name: language === "hi" ? "डॉ. संदीप मेहता" : language === "gu" ? "ડો. સંદીપ મહેતા" : "Dr. Sandeep Mehta",
        type: "Doctor" as const,
        specialty: language === "hi" ? "सामान्य चिकित्सक और संक्रामक रोग" : language === "gu" ? "સામાન્ય ચિકિત્સક અને ચેપી રોગો" : "General Physician & Infectious Diseases",
        distance: "2.4 km",
        available: true,
        recommendationMatch: language === "hi" ? "सामान्य स्वास्थ्य और तीव्र बुखार की जांच के लिए अनुशंसित" : language === "gu" ? "સામાન્ય સ્વાસ્થ્ય અને તીવ્ર તાવની તપાસ માટે ભલામણ કરેલ" : "Recommended for general wellness & acute fever checks"
      },
      {
        id: 3,
        name: language === "hi" ? "डॉ. रितु पटेल (अयान लैब्स)" : language === "gu" ? "ડો. રીતુ પટેલ (અયાન લેબ્સ)" : "Dr. Ritu Patel (Ayan Labs)",
        type: "Doctor" as const,
        specialty: language === "hi" ? "हृदय रोग विशेषज्ञ और हेमेटोलॉजिस्ट" : language === "gu" ? "કાર્ડિયોલોજિસ્ટ અને હેમેટોલોજિસ્ટ" : "Cardiologist & Hematologist",
        distance: "3.1 km",
        available: true,
        recommendationMatch: language === "hi" ? "रक्त रिपोर्ट और हृदय स्वास्थ्य के लिए अनुशंसित" : language === "gu" ? "રક્ત રિપોર્ટ અને હૃદયના સ્વાસ્થ્ય માટે ભલામણ કરેલ" : "Recommended for blood reports and cardiovascular health"
      },
      {
        id: 4,
        name: language === "hi" ? "डॉ. प्रिया शाह" : language === "gu" ? "ડો. પ્રિયા શાહ" : "Dr. Priya Shah",
        type: "Doctor" as const,
        specialty: language === "hi" ? "त्वचा रोग विशेषज्ञ" : language === "gu" ? "ત્વચારોગ વિજ્ઞાની" : "Dermatologist & Skin Specialist",
        distance: "4.0 km",
        available: true,
        recommendationMatch: language === "hi" ? "त्वचा की जलन, चकत्ते या रंग परिवर्तन के लिए अनुशंसित" : language === "gu" ? "ત્વચામાં બળતરા, ફોલ્લીઓ અથવા રંગમાં ફેરફાર માટે ભલામણ કરેલ" : "Recommended for skin irritation, rashes, or color changes"
      },
      {
        id: 5,
        name: language === "hi" ? "सोला सिविल अस्पताल और आपातकालीन देखभाल" : language === "gu" ? "સોલા સિવિલ હોસ્પિટલ અને ઇમરજન્સી કેર" : "Sola Civil Hospital & Emergency Care",
        type: "PHC" as const,
        specialty: language === "hi" ? "आघात, निदान और बहु-विशेषज्ञता देखभाल" : language === "gu" ? "ટ્રોમા, ડાયગ્નોસ્ટિક્સ અને મલ્ટી-સ્પેશિયાલિટી કેર" : "Trauma, Diagnostics & Multi-specialty care",
        distance: "4.8 km",
        available: true,
        recommendationMatch: language === "hi" ? "उच्च तात्कालिकता या आपातकालीन देखभाल के लिए अनुशंसित" : language === "gu" ? "ઉચ્ચ તાકીદ અથવા કટોકટીની સંભાળ માટે ભલામણ કરેલ" : "Recommended for high urgency or emergency care"
      }
    ];

    const isEmergency = triageResult?.triage === "RED";
    const isAnemia = screenResults?.condition === "anemia";
    const isJaundice = screenResults?.condition === "jaundice";
    const isSkin = screenResults?.condition === "skin";
    const isYellow = triageResult?.triage === "YELLOW";

    return defaultList.map(doc => {
      let score = 0;
      let reason = "";

      if (isEmergency && (doc.id === 5)) {
        score = 10;
        reason = language === "hi"
          ? "⚠️ लाल आपातकालीन ट्राइएज से मेल खाता है: 24/7 ट्रॉमा और आपातकालीन निदान"
          : language === "gu"
          ? "⚠️ લાલ કટોકટી ટ્રાયેજ સાથે મેળ ખાય છે: 24/7 ટ્રોમા અને ઇમરજન્સી નિદાન"
          : "⚠️ Matches RED Emergency Triage: 24/7 Trauma & Emergency Diagnostics";
      } else if (isAnemia && (doc.id === 3)) {
        score = 8;
        reason = language === "hi"
          ? "🩸 एनीमिया स्क्रीनिंग से मेल खाता है: विशेषज्ञ हेमेटोलॉजी"
          : language === "gu"
          ? "🩸 એનિમિયા સ્ક્રિનિંગ સાથે મેળ ખાય છે: નિષ્ણાત હિમેટોલોજી"
          : "🩸 Matches Anemia Screening: Specialist Hematology";
      } else if (isJaundice && (doc.id === 2)) {
        score = 8;
        reason = language === "hi"
          ? "🟡 पीलिया स्क्रीनिंग से मेल खाता है: संक्रामक रोग विशेषज्ञ"
          : language === "gu"
          ? "🟡 કમળાની સ્ક્રિનિંગ સાથે મેળ ખાય છે: ચેપી રોગ નિષ્ણાત"
          : "🟡 Matches Jaundice screening: Infectious diseases specialist";
      } else if (isSkin && (doc.id === 4)) {
        score = 9;
        reason = language === "hi"
          ? "🧴 त्वचा स्क्रीनिंग से मेल खाता है: विशेषज्ञ त्वचा रोग विशेषज्ञ"
          : language === "gu"
          ? "🧴 ત્વચા સ્ક્રિનિંગ સાથે મેળ ખાય છે: નિષ્ણાત ત્વચારોગ વિજ્ઞાની"
          : "🧴 Matches Skin screening: Specialist Dermatologist";
      } else if (isYellow && (doc.id === 2)) {
        score = 7;
        reason = language === "hi"
          ? "🩺 पीला ट्राइएज से मेल खाता है: त्वरित नैदानिक निदान के लिए उपलब्ध"
          : language === "gu"
          ? "🩺 પીળા ટ્રાયેજ સાથે મેળ ખાય છે: ત્વરિત ક્લિનિકલ નિદાન માટે ઉપલબ્ધ"
          : "🩺 Matches YELLOW Triage: Available for prompt clinical diagnosis";
      } else if (doc.type === "PHC") {
        score = 5;
        reason = language === "hi"
          ? "🏠 सामान्य ट्राइएज के लिए निकटतम प्राथमिक स्वास्थ्य केंद्र"
          : language === "gu"
          ? "🏠 સામાન્ય ટ્રાયેજ માટે નજીકનું પ્રાથમિક આરોગ્ય કેન્દ્ર"
          : "🏠 Nearest primary health center for general triage";
      }

      return {
        ...doc,
        recommendationScore: score,
        recommendationMatch: reason || doc.recommendationMatch
      };
    }).sort((a, b) => (b.recommendationScore || 0) - (a.recommendationScore || 0));
  };

  const handleGenerateSummary = async (doctor: any) => {
    setSelectedDoctor(doctor);
    setTelemedStep("summary");
    setIsSummaryLoading(true);
    setDoctorSummary(null);

    try {
      const { allowed } = checkRateLimit("summary", 4, 30000);
      if (!allowed) {
        throw new Error("RateLimitExceeded");
      }

      const screeningInfo = screenResults
        ? {
            condition: screenResults.condition,
            riskBand: screenResults.riskBand,
            indexVal: screenResults.indexVal,
            description: screenResults.description
          }
        : null;

      const response = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symptoms: symptomsText || "Patient requested telemedicine consultation.",
          triage: triageResult?.triage || "GREEN",
          screeningResults: screeningInfo,
          language,
          profile: userProfile
        })
      });

      const data = await response.json();
      if (data.success && data.summary) {
        setDoctorSummary(data.summary);
      } else {
        throw new Error(data.error || "Failed to generate medical summary.");
      }
    } catch (error) {
      console.error("Summary error:", error);
      const isRateLimit = error instanceof Error && error.message === "RateLimitExceeded";
      setDoctorSummary({
        chief_complaint: symptomsText || "Symptom check",
        screening_signals: screenResults ? `${screenResults.condition} (${screenResults.riskBand})` : "None recorded",
        triage_level: triageResult?.triage || "GREEN",
        suggested_focus: "General practitioner intake consultation.",
        formatted_summary: isRateLimit
          ? l.telemedSystemBusyOffline
              .replace("{complaint}", symptomsText || "General symptoms")
              .replace("{urgency}", triageResult?.triage || "GREEN")
              .replace("{screening}", screenResults ? `${screenResults.condition} - ${screenResults.riskBand} risk` : "No image screening files uploaded")
          : l.telemedClinicalOffline
              .replace("{complaint}", symptomsText || "General symptoms")
              .replace("{urgency}", triageResult?.triage || "GREEN")
              .replace("{screening}", screenResults ? `${screenResults.condition} - ${screenResults.riskBand} risk` : "No image screening files uploaded")
      });
    } finally {
      setIsSummaryLoading(false);
    }
  };

  const formatCallTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!activeCall) return null;

  return (
    <div className="absolute inset-0 bg-slate-900/98 z-50 flex flex-col p-4 text-white overflow-y-auto no-scrollbar animate-fadeIn text-left">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mt-4 shrink-0">
        <div className="flex items-center gap-2 font-sans">
          <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
          <h3 className="text-sm font-black tracking-wide uppercase text-teal-405">
            {l.telemedTitle}
          </h3>
        </div>
        <button
          onClick={() => {
            setActiveCall(false);
            setTelemedStep("doctors");
            setSelectedDoctor(null);
            setDoctorSummary(null);
          }}
          className="p-1 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors text-slate-300"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Steps Breadcrumbs */}
      <div className="flex justify-center gap-4 text-[10px] font-bold uppercase tracking-wider py-3 border-b border-slate-800/40 shrink-0 text-slate-400">
        <span className={telemedStep === "doctors" ? "text-teal-400 font-extrabold" : ""}>{l.telemedStepDoctors}</span>
        <span>&bull;</span>
        <span className={telemedStep === "summary" ? "text-teal-400 font-extrabold" : ""}>{l.telemedStepSummary}</span>
        <span>&bull;</span>
        <span className={telemedStep === "call" ? "text-teal-400 font-extrabold" : ""}>{l.telemedStepCall}</span>
      </div>

      {/* Content panel */}
      <div className="flex-1 py-4 flex flex-col justify-between">
        {/* Step 1: Doctors List */}
        {telemedStep === "doctors" && (
          <div className="space-y-4 flex-1">
            <div className="space-y-1">
              <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">{l.telemedNearbyFacilities}</h4>
              <p className="text-[10px] text-slate-500">
                {l.telemedNearbyDesc}
              </p>
            </div>

            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1 no-scrollbar animate-fadeIn">
              {getNearbyDoctors().map((doc) => {
                const isHighlyRecommended = doc.recommendationScore > 5;
                return (
                  <div
                    key={doc.id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      isHighlyRecommended
                        ? "bg-slate-800/80 border-amber-500/30 shadow-md ring-1 ring-amber-500/20"
                        : "bg-slate-850/60 border-slate-800"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md ${
                            doc.type === "PHC" ? "bg-teal-900/60 text-teal-400 border border-teal-850" : "bg-blue-900/60 text-blue-400 border border-blue-850"
                          }`}>
                            {doc.type}
                          </span>
                          <h5 className="text-xs font-bold text-slate-200">{doc.name}</h5>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 font-semibold">{doc.specialty}</p>
                        <div className="flex gap-3 text-[9px] text-slate-500 mt-2 font-bold uppercase">
                          <span>{l.telemedDistance.replace("{distance}", doc.distance)}</span>
                          <span>&bull;</span>
                          <span className="text-emerald-500 font-extrabold">{l.telemedAvailableNow}</span>
                        </div>
                      </div>

                      {isHighlyRecommended && (
                        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 p-1.5 rounded-lg shrink-0">
                          <Star className="w-4 h-4 fill-current" />
                        </div>
                      )}
                    </div>

                    {/* Recommendation match text */}
                    <div className={`mt-2.5 pt-2 border-t text-[9px] font-bold ${
                      isHighlyRecommended
                        ? "border-amber-500/10 text-amber-400 font-extrabold"
                        : "border-slate-805/40 text-slate-500"
                    }`}>
                      {doc.recommendationMatch}
                    </div>

                    <button
                      onClick={() => handleGenerateSummary(doc)}
                      className="w-full mt-3 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-[10px] py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-sm min-h-[36px]"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>{l.telemedRequestConsultation}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Doctor Summary Review */}
        {telemedStep === "summary" && (
          <div className="space-y-4 flex-1 flex flex-col justify-between animate-fadeIn">
            <div className="space-y-4 flex-1 overflow-y-auto no-scrollbar pr-1">
              <div className="space-y-1">
                <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">{l.telemedClinicalIntakeSummary}</h4>
                <p className="text-[10px] text-slate-500">
                  {l.telemedGeneratingIntake}
                </p>
              </div>

              {isSummaryLoading && (
                <div className="bg-slate-850/40 border border-slate-800 rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-4">
                  <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
                  <span className="text-xs font-bold text-slate-400">{l.telemedConsultingCoordinator}</span>
                </div>
              )}

              {!isSummaryLoading && doctorSummary && (
                <div className="space-y-3 text-left">
                  {/* Highlight summary fields */}
                  <div className="bg-slate-850 border border-slate-800 rounded-2xl p-4 space-y-3 text-xs leading-normal">
                    <div>
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500">{l.telemedChiefComplaint}</span>
                      <p className="font-semibold text-slate-200 mt-0.5">{doctorSummary.chief_complaint}</p>
                    </div>
                    <div className="border-t border-slate-800/60 pt-2">
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500">{l.telemedCalculatedUrgency}</span>
                      <p className="font-bold text-teal-400 mt-0.5">{doctorSummary.triage_level}</p>
                    </div>
                    <div className="border-t border-slate-800/60 pt-2">
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500">{l.telemedScreeningSignals}</span>
                      <p className="font-semibold text-slate-300 mt-0.5">{doctorSummary.screening_signals}</p>
                    </div>
                    <div className="border-t border-slate-800/60 pt-2">
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500">{l.telemedDiagnosticFocus}</span>
                      <p className="font-semibold text-amber-400 mt-0.5">{doctorSummary.suggested_focus}</p>
                    </div>
                  </div>

                  {/* Low bandwidth support toggle */}
                  <div className="bg-slate-850/60 border border-slate-800 rounded-2xl p-3 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-200 block">{l.telemedLowBandwidth}</span>
                      <span className="text-[9px] text-slate-400 block">{l.telemedDisableCamera}</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={isCallAudioOnly}
                      onChange={(e) => setIsCallAudioOnly(e.target.checked)}
                      className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 focus:ring-offset-slate-900 border-slate-800 bg-slate-900"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-800/50 shrink-0">
              <button
                onClick={() => setTelemedStep("call")}
                disabled={isSummaryLoading}
                className="flex-grow bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-extrabold text-xs py-3.5 rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 min-h-[44px]"
              >
                <Video className="w-4 h-4" />
                <span>{l.telemedSendConnect}</span>
              </button>
              <button
                onClick={() => {
                  setTelemedStep("doctors");
                  setSelectedDoctor(null);
                  setDoctorSummary(null);
                }}
                className="px-4 border border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-white font-bold text-xs rounded-xl transition-colors min-h-[44px]"
              >
                {l.telemedBack}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Call Screen */}
        {telemedStep === "call" && (
          <div className="flex-1 flex flex-col justify-between space-y-4 animate-scaleUp">
            {/* Connection Status Banner */}
            <div className="bg-slate-850/80 border border-slate-800 rounded-2xl p-3 flex items-center justify-between text-xs font-bold font-sans">
              <span className="text-slate-400">{l.telemedPartner}</span>
              <span className="text-teal-400">{selectedDoctor?.name || "Saathi Consultant"}</span>
            </div>

            {/* Webcam/Video Area */}
            <div className="flex-grow relative bg-slate-950 rounded-3xl overflow-hidden border border-slate-850 shadow-inner flex flex-col items-center justify-center min-h-[300px]">
              {isCallAudioOnly ? (
                /* Audio Mode UI */
                <div className="text-center space-y-4 p-6 animate-scaleUp">
                  <div className="w-20 h-20 bg-teal-500/10 rounded-full flex items-center justify-center border border-teal-500/20 mx-auto">
                    <Mic className="w-10 h-10 text-teal-400 animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-sm font-bold text-slate-200">{l.telemedAudioOnlyFallback}</h5>
                    <p className="text-[10px] text-slate-500 max-w-xs mx-auto leading-normal">
                      {l.telemedAudioOnlyDesc}
                    </p>
                  </div>
                </div>
              ) : (
                /* Video Mode UI (Real WebRTC Loopback Video box) */
                <div className="w-full h-full relative">
                  {/* Remote Video Stream (Main screen) */}
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover rounded-3xl"
                  />

                  {/* Local Webcam overlay (Bottom right corner) */}
                  <div className="absolute right-4 bottom-4 w-28 h-40 bg-slate-900 border-2 border-slate-800 rounded-2xl overflow-hidden shadow-lg z-20">
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-1 left-2 text-[8px] bg-slate-950/80 px-1.5 py-0.5 rounded text-slate-400 font-extrabold uppercase">
                      {l.telemedYouWebRtc}
                    </div>
                  </div>

                  {/* Status indicator overlay */}
                  <div className="absolute top-4 left-4 bg-slate-950/80 px-2.5 py-1.5 rounded-full text-[9px] font-bold text-teal-405 flex items-center gap-1.5 shadow-sm border border-slate-800/40 z-20">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span>{webRTCStatus}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Call Controller Bottom Bar */}
            <div className="space-y-4 mb-4">
              <div className="text-center font-mono">
                <span className="text-xs font-bold tracking-widest bg-slate-850 border border-slate-800 px-3.5 py-1.5 rounded-full shadow-sm text-slate-200">
                  {formatCallTimer(callTimer)}
                </span>
              </div>

              <div className="flex justify-center items-center gap-4">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className={`p-4 rounded-full border shadow-md transition-all active:scale-95 flex items-center justify-center w-14 h-14 ${
                    isMuted
                      ? "bg-amber-500 border-amber-600 text-white"
                      : "bg-slate-850 border-slate-800 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <Mic className="w-5 h-5" />
                </button>

                <button
                  onClick={() => {
                    setActiveCall(false);
                    setTelemedStep("doctors");
                    setSelectedDoctor(null);
                    setDoctorSummary(null);
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white p-4 rounded-full shadow-lg transition-all active:scale-95 flex items-center justify-center w-16 h-16 border border-red-700"
                >
                  <PhoneOff className="w-7 h-7" />
                </button>

                <button
                  onClick={() => setIsCallAudioOnly(!isCallAudioOnly)}
                  className={`p-4 rounded-full border shadow-md transition-all active:scale-95 flex items-center justify-center w-14 h-14 ${
                    isCallAudioOnly
                      ? "bg-teal-600 border-teal-700 text-white"
                      : "bg-slate-850 border-slate-800 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <Video className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

TelemedicineOverlay.displayName = "TelemedicineOverlay";
