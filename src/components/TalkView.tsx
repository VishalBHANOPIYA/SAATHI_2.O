import React, { useState, useRef, useEffect } from "react";
import {
  Mic,
  Send,
  X,
  AlertTriangle,
  Loader2,
  Info,
  Sparkles,
  Video,
  RefreshCw,
  Heart,
  ShieldAlert
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { trimSilence } from "../utils/audioTrimmer";

interface TriageResult {
  triage: "GREEN" | "YELLOW" | "RED";
  possible_concerns: string[];
  reason: string;
  advice: string;
  see_doctor: boolean;
  confidence?: "LOW" | "MEDIUM" | "HIGH";
}

const talkLabels = {
  en: {
    header: "AI Voice Symptom Checker",
    desc: "Speak your symptoms in your language and get an instant, intelligent health screening.",
    tapRecord: "Tap to record symptoms",
    recording: "Recording symptoms...",
    processing: "Transcribing your voice...",
    triaging: "Analyzing symptoms...",
    editingTitle: "Verify & Edit Symptoms",
    editingDesc: "Please check the transcript below. You can edit it to add or correct details.",
    btnAnalyze: "Analyze Symptoms",
    btnRecordAgain: "Record Again",
    textPlaceholder: "Or type your symptoms here manually...",
    btnSubmitText: "Submit Symptoms",
    recordingError: "Recording Error",
    microphoneNeeded: "Microphone access is required to use voice check.",
    stop: "Stop",
    cancel: "Cancel",
    secRemaining: "seconds recorded",
    speakLangNotice: "Speak in Hindi, Gujarati, or English. Ensure your microphone is clear."
  },
  hi: {
    header: "एआई आवाज लक्षण जांच",
    desc: "अपनी भाषा में अपने लक्षण बोलें और तुरंत एआई लक्षण जांच का लाभ उठाएं।",
    tapRecord: "लक्षणों को रिकॉर्ड करने के लिए टैप करें",
    recording: "लक्षण रिकॉर्ड किए जा रहे हैं...",
    processing: "आवाज को शब्दों में बदला जा रहा है...",
    triaging: "लक्षणों का विश्लेषण किया जा रहा है...",
    editingTitle: "लक्षणों को सत्यापित और संपादित करें",
    editingDesc: "कृपया नीचे दिए गए शब्दों की जांच करें। आप विवरण जोड़ने या सही करने के लिए इसे संपादित कर सकते हैं।",
    btnAnalyze: "लक्षणों का विश्लेषण करें",
    btnRecordAgain: "फिर से रिकॉर्ड करें",
    textPlaceholder: "या अपने लक्षणों को यहाँ मैन्युअल रूप से टाइप करें...",
    btnSubmitText: "लक्षण जमा करें",
    recordingError: "रिकॉर्डिंग त्रुटि",
    microphoneNeeded: "वॉयस चेक का उपयोग करने के लिए माइक्रोफोन अनुमति आवश्यक है।",
    stop: "रोकें",
    cancel: "रद्द करें",
    secRemaining: "सेकंड रिकॉर्ड किए गए",
    speakLangNotice: "हिंदी, गुजराती या अंग्रेजी में बोलें। सुनिश्चित करें कि आपका माइक्रोफ़ोन साफ़ है।"
  },
  gu: {
    header: "AI વોઇસ લક્ષણ તપાસ",
    desc: "તમારી ભાષામાં તમારા લક્ષણો બોલો અને ત્વરિત AI લક્ષણ તપાસનો લાભ મેળવો.",
    tapRecord: "લક્ષણો રેકોર્ડ કરવા માટે ટેપ કરો",
    recording: "લક્ષણો રેકોર્ડ થઈ રહ્યા છે...",
    processing: "અવાજ ટ્રાન્સક્રાઇબ થઈ રહ્યો છે...",
    triaging: "લક્ષણોનું વિશ્લેષણ થઈ રહ્યું છે...",
    editingTitle: "લક્ષણો ચકાસો અને સંપાદિત કરો",
    editingDesc: "કૃપા કરીને નીચે આપેલા લખાણની તપાસ કરો. તમે સુધારા કરવા માટે તેને સંપાદિત કરી શકો છો.",
    btnAnalyze: "લક્ષણોનું વિશ્લેષણ કરો",
    btnRecordAgain: "ફરીથી રેકોર્ડ કરો",
    textPlaceholder: "અથવા તમારા લક્ષણો અહીં મેન્યુઅલી ટાઇપ કરો...",
    btnSubmitText: "લક્ષણો સબમિટ કરો",
    recordingError: "રેકોર્ડિંગ ભૂલ",
    microphoneNeeded: "વોઇસ ચેકનો ઉપયોગ કરવા માટે માઇક્રોફોનની પરવાનગી જરૂરી છે.",
    stop: "બંધ કરો",
    cancel: "રદ કરો",
    secRemaining: "સેકંડ રેકોર્ડ થઈ",
    speakLangNotice: "હિન્દી, ગુજરાતી અથવા અંગ્રેજીમાં બોલો. ખાતરી કરો કે તમારો માઇક્રોફોન સાફ છે."
  }
};

const cardLabels = {
  en: {
    emergency: "🔴 Emergency / Urgent Care Needed",
    yellow: "🟡 See a Doctor Soon",
    green: "🟢 Home Care / Self-Care",
    concerns: "Possible Concerns",
    reason: "Reasoning",
    advice: "Recommended Advice",
    connect: "Connect to a Doctor",
    checkAgain: "Check New Symptoms",
    disclaimerTitle: "Medical Disclaimer",
    disclaimerText: "This AI symptom triage is a prototype designed for screening and informational purposes only. It is not a clinical diagnosis. If you are experiencing a severe medical event, please contact emergency services immediately."
  },
  hi: {
    emergency: "🔴 आपातकालीन सहायता / तुरंत अस्पताल जाएं",
    yellow: "🟡 डॉक्टर से जल्द संपर्क करें",
    green: "🟢 घरेलू उपचार / होम केयर",
    concerns: "संभावित समस्याएं (Concerns)",
    reason: "कारण (Reasoning)",
    advice: "अनुशंसित सलाह (Advice)",
    connect: "डॉक्टर से संपर्क करें",
    checkAgain: "नए लक्षण जांचें",
    disclaimerTitle: "चिकित्सा अस्वीकरण",
    disclaimerText: "यह एआई लक्षण ट्राइएज केवल स्क्रीनिंग और जानकारी के लिए एक प्रोटोटाइप है। यह कोई नैदानिक निदान नहीं है। यदि आप गंभीर समस्या महसूस कर रहे हैं, तो तुरंत आपातकालीन सेवाओं से संपर्क करें।"
  },
  gu: {
    emergency: "🔴 કટોકટી / તાત્કાલિક હોસ્પિટલ જાવ",
    yellow: "🟡 ટૂંક સમયમાં ડૉક્ટરને મળો",
    green: "🟢 ઘરેલું સારવાર / હોમ કેર",
    concerns: "સંભવિત ચિંતાઓ",
    reason: "કારણ",
    advice: "ભલામણ કરેલ સલાહ",
    connect: "ડૉક્ટર સાથે જોડાઓ",
    checkAgain: "નવા લક્ષણો તપાસો",
    disclaimerTitle: "તબીબી ડિસ્ક્લેમર",
    disclaimerText: "આ AI લક્ષણ ટ્રાયેજ માત્ર સ્ક્રીનીંગ અને માહિતીના હેતુઓ માટે એક પ્રોટોટાઇપ છે. આ કોઈ તબીબી નિદાન નથી. જો તમને ગંભીર તકલીફ હોય, તો તાત્કાલિક કટોકટી સેવાઓનો સંપર્ક કરો."
  }
};

function TriageResultCard({
  result,
  language,
  onConnectDoctor,
  onReset
}: {
  result: TriageResult;
  language: string;
  onConnectDoctor?: () => void;
  onReset?: () => void;
}) {
  const isRed = result.triage === "RED";
  const isYellow = result.triage === "YELLOW";

  const tLabels = cardLabels[language as "en" | "hi" | "gu"] || cardLabels.en;

  let bgClass = "bg-emerald-50/70 border-emerald-200 text-emerald-800";
  let badgeClass = "bg-emerald-600 text-white";
  let titleText = tLabels.green;

  if (isRed) {
    bgClass = "bg-rose-50/70 border-rose-200 text-rose-800";
    badgeClass = "bg-red-600 text-white animate-pulse";
    titleText = tLabels.emergency;
  } else if (isYellow) {
    bgClass = "bg-amber-50/70 border-amber-250 text-amber-905 text-amber-900";
    badgeClass = "bg-amber-500 text-white";
    titleText = tLabels.yellow;
  }

  return (
    <div className="space-y-4 animate-scaleUp text-left">
      <div className={`p-4 rounded-2xl border ${bgClass} shadow-sm space-y-3`}>
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1.5">
            <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full tracking-wider ${badgeClass} self-start shadow-sm`}>
              Triage Level: {result.triage}
            </span>
            {result.confidence && (
              <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full tracking-wide self-start ${
                result.confidence === "HIGH"
                  ? "bg-emerald-100/90 text-emerald-800 border border-emerald-200/50"
                  : result.confidence === "MEDIUM"
                    ? "bg-amber-100/90 text-amber-800 border border-amber-200/50"
                    : "bg-red-100/90 text-red-800 border border-red-200/50"
              }`}>
                AI Confidence: {result.confidence}
              </span>
            )}
          </div>
          <span className="text-xs font-bold flex items-center gap-1 text-slate-700">
            <Heart className="w-3.5 h-3.5 fill-current text-rose-500 animate-pulse" />
            Saathi Triage
          </span>
        </div>

        <h3 className="text-sm font-black leading-snug">{titleText}</h3>
        
        <div className="space-y-2 border-t border-slate-200/50 pt-2 text-xs">
          <div>
            <strong className="block text-[10px] uppercase tracking-wider text-slate-500 font-extrabold">{tLabels.reason}:</strong>
            <p className="mt-0.5 leading-relaxed font-semibold text-slate-700">{result.reason}</p>
          </div>
          <div className="border-t border-slate-200/20 pt-2">
            <strong className="block text-[10px] uppercase tracking-wider text-slate-500 font-extrabold">{tLabels.advice}:</strong>
            <p className="mt-0.5 leading-relaxed font-semibold text-slate-700">{result.advice}</p>
          </div>
        </div>
      </div>

      {result.possible_concerns && result.possible_concerns.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-2">
          <h4 className="text-xs font-bold text-slate-750 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-teal-650" />
            {tLabels.concerns}
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {result.possible_concerns.map((concern, idx) => (
              <span key={idx} className="bg-teal-50 text-teal-700 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-teal-100">
                {concern}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-3 flex gap-2 text-slate-500 leading-normal">
        <AlertTriangle className="w-4.5 h-4.5 text-slate-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <h5 className="text-[9px] font-extrabold uppercase tracking-wider text-slate-650">{tLabels.disclaimerTitle}</h5>
          <p className="text-[10px] font-medium leading-relaxed">{tLabels.disclaimerText}</p>
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        {result.see_doctor && onConnectDoctor && (
          <button
            onClick={onConnectDoctor}
            className="flex-1 bg-gradient-to-r from-teal-650 to-emerald-650 text-white font-extrabold text-xs py-3 rounded-xl hover:from-teal-700 hover:to-emerald-700 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 min-h-[44px]"
          >
            <Video className="w-4 h-4" />
            <span>{tLabels.connect}</span>
          </button>
        )}
        {onReset && (
          <button
            onClick={onReset}
            className={`py-3 px-4 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 min-h-[44px] ${
              result.see_doctor 
                ? "border border-slate-200 text-slate-600 hover:bg-slate-50"
                : "w-full bg-teal-650 text-white hover:bg-teal-700 shadow-md"
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5 animate-spin-hover" />
            <span>{tLabels.checkAgain}</span>
          </button>
        )}
      </div>
    </div>
  );
}

interface TalkViewProps {
  recordsList: any[];
  setRecordsList: React.Dispatch<React.SetStateAction<any[]>>;
  attachRecordToActivePatient: (record: any, riskBand?: "GREEN" | "YELLOW" | "RED") => void;
  setActiveCall: React.Dispatch<React.SetStateAction<boolean>>;
}

export const TalkView: React.FC<TalkViewProps> = React.memo(({
  recordsList,
  setRecordsList,
  attachRecordToActivePatient,
  setActiveCall
}) => {
  const { language } = useLanguage();
  const l = talkLabels[language as "en" | "hi" | "gu"] || talkLabels.en;

  const [isTriaging, setIsTriaging] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcriptText, setTranscriptText] = useState("");
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null);
  const [talkError, setTalkError] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [triageHistory, setTriageHistory] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [chatInput, setChatInput] = useState("");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const startRecording = async () => {
    setTalkError(null);
    setAudioBlob(null);
    setTranscriptText("");
    setTriageResult(null);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      let options = { mimeType: "audio/webm" };
      if (!MediaRecorder.isTypeSupported("audio/webm")) {
        options = { mimeType: "audio/ogg" };
      }
      if (!MediaRecorder.isTypeSupported("audio/ogg")) {
        options = { mimeType: "" }; // default
      }

      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" });
        setAudioBlob(blob);
        
        // Stop all tracks to release mic
        stream.getTracks().forEach((track) => track.stop());
        
        // Auto transcribe
        handleTranscribe(blob);
      };

      recorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Microphone access error:", err);
      setTalkError(
        language === "hi" 
          ? "माइक्रोफोन एक्सेस करने में असमर्थ। कृपया सेटिंग में अनुमति जांचें।" 
          : language === "gu" 
          ? "માઇક્રોફોન એક્સેસ કરવામાં અસમર્થ. કૃપા કરીને સેટિંગ્સમાં પરવાનગી તપાસો." 
          : "Unable to access microphone. Please check permissions."
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      audioChunksRef.current = [];
      setAudioBlob(null);
    }
  };

  const handleTranscribe = async (blob: Blob) => {
    setIsTranscribing(true);
    setTalkError(null);

    try {
      // Trim audio silence client-side
      const trimmedBlob = await trimSilence(blob);

      const formData = new FormData();
      formData.append("file", trimmedBlob, trimmedBlob.type === "audio/wav" ? "recording.wav" : "recording.webm");
      formData.append("language", language);

      const res = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        if (triageHistory.length > 0) {
          setChatInput(data.text);
        } else {
          setTranscriptText(data.text);
        }
      } else {
        throw new Error(data.error || "Failed to transcribe audio.");
      }
    } catch (err) {
      console.error("Transcription error:", err);
      setTalkError(
        language === "hi"
          ? "ट्रांसक्रिप्शन विफल रहा। कृपया फिर से प्रयास करें या मैन्युअल रूप से टाइप करें।"
          : language === "gu"
          ? "ટ્રાન્સક્રિપ્શન નિષ્ફળ ગયું. કૃપા કરીને ફરી પ્રયાસ કરો અથવા મેન્યુઅલી ટાઇપ કરો."
          : "Transcription failed. Please try again or type manually."
      );
    } finally {
      setIsTranscribing(false);
    }
  };

  const submitFollowUpAnswer = async (answerText: string) => {
    if (!answerText.trim()) return;
    setChatInput("");
    setIsTriaging(true);
    setTalkError(null);

    const updatedHistory = [
      ...triageHistory,
      { role: "user" as const, content: answerText }
    ];
    setTriageHistory(updatedHistory);

    try {
      const res = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: transcriptText,
          history: updatedHistory,
          language
        })
      });

      const data = await res.json();
      if (data.success) {
        if (data.follow_up_question) {
          setTriageHistory([
            ...updatedHistory,
            { role: "assistant" as const, content: data.follow_up_question }
          ]);
        } else if (data.triageResult) {
          setTriageResult(data.triageResult);
          
          // Save case to health records if Yellow or Red
          const severityEmoji = data.triageResult.triage === "RED" ? "🚨 RED" : data.triageResult.triage === "YELLOW" ? "⚠️ YELLOW" : "🟢 GREEN";
          const concern = data.triageResult.possible_concerns.join(", ") || "Symptom Check";
          const dateStr = new Date().toISOString().split("T")[0];
          
          const addedItem = {
            id: Date.now(),
            title: `Triage: ${severityEmoji} - ${concern}`,
            date: dateStr,
            category: "Prescription" as const,
            doctor: "Saathi AI Triage",
            notes: `Urgency: ${data.triageResult.triage} | Reason: ${data.triageResult.reason} | Advice: ${data.triageResult.advice}`
          };

          if (data.triageResult.triage === "YELLOW" || data.triageResult.triage === "RED") {
            const nextRecords = [addedItem, ...recordsList];
            setRecordsList(nextRecords);
            localStorage.setItem("saathi_records", JSON.stringify(nextRecords));
          }

          attachRecordToActivePatient(addedItem, data.triageResult.triage);
        } else {
          throw new Error("Invalid response format from triage service.");
        }
      } else {
        throw new Error(data.error || "Failed to analyze symptoms.");
      }
    } catch (err) {
      console.error("Follow-up error:", err);
      setTalkError(
        language === "hi"
          ? "ट्राइएज विश्लेषण विफल रहा। कृपया पुनः प्रयास करें।"
          : language === "gu"
          ? "ટ્રાયેજ વિશ્લેષણ નિષ્ફળ ગયું. કૃપા કરીને ફરી પ્રયાસ કરો."
          : "Triage analysis failed. Please try again."
      );
    } finally {
      setIsTriaging(false);
    }
  };

  const handleTriage = async () => {
    if (!transcriptText.trim()) return;
    setIsTriaging(true);
    setTalkError(null);

    const initialHistory = [{ role: "user" as const, content: transcriptText }];
    setTriageHistory(initialHistory);

    try {
      const res = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: transcriptText,
          history: initialHistory,
          language
        })
      });

      const data = await res.json();
      if (data.success) {
        if (data.follow_up_question) {
          setTriageHistory([
            ...initialHistory,
            { role: "assistant" as const, content: data.follow_up_question }
          ]);
        } else if (data.triageResult) {
          setTriageResult(data.triageResult);
          
          // Save case to health records if Yellow or Red
          const severityEmoji = data.triageResult.triage === "RED" ? "🚨 RED" : data.triageResult.triage === "YELLOW" ? "⚠️ YELLOW" : "🟢 GREEN";
          const concern = data.triageResult.possible_concerns.join(", ") || "Symptom Check";
          const dateStr = new Date().toISOString().split("T")[0];
          
          const addedItem = {
            id: Date.now(),
            title: `Triage: ${severityEmoji} - ${concern}`,
            date: dateStr,
            category: "Prescription" as const,
            doctor: "Saathi AI Triage",
            notes: `Urgency: ${data.triageResult.triage} | Reason: ${data.triageResult.reason} | Advice: ${data.triageResult.advice}`
          };

          if (data.triageResult.triage === "YELLOW" || data.triageResult.triage === "RED") {
            const nextRecords = [addedItem, ...recordsList];
            setRecordsList(nextRecords);
            localStorage.setItem("saathi_records", JSON.stringify(nextRecords));
          }

          attachRecordToActivePatient(addedItem, data.triageResult.triage);
        } else {
          throw new Error("Invalid response format from triage service.");
        }
      } else {
        throw new Error(data.error || "Failed to get triage analysis.");
      }
    } catch (err) {
      console.error("Triage error:", err);
      setTalkError(
        language === "hi"
          ? "ट्राइएज विश्लेषण विफल रहा। कृपया पुनः प्रयास करें।"
          : language === "gu"
          ? "ટ્રાયેજ વિશ્લેષણ નિષ્ફળ ગયું. કૃપા કરીને ફરી પ્રયાસ કરો."
          : "Triage analysis failed. Please try again."
      );
    } finally {
      setIsTriaging(false);
    }
  };

  const resetTriageFlow = () => {
    setAudioBlob(null);
    setTranscriptText("");
    setTriageResult(null);
    setTalkError(null);
    setIsRecording(false);
    setIsTranscribing(false);
    setIsTriaging(false);
    setTriageHistory([]);
  };

  return (
    <div className="p-4 space-y-4 animate-fadeIn text-left">
      <div className="space-y-1">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Mic className="w-5 h-5 text-teal-600" />
          {l.header}
        </h2>
        <p className="text-xs text-slate-500 leading-normal">{l.desc}</p>
      </div>

      {talkError && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-3 flex gap-2 animate-scaleUp">
          <AlertTriangle className="w-4.5 h-4.5 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-grow space-y-1">
            <span className="text-xs font-bold block">{l.recordingError}</span>
            <p className="text-[10px] font-medium leading-normal">{talkError}</p>
          </div>
          <button onClick={() => setTalkError(null)} className="text-slate-400 hover:text-slate-600 self-start">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {triageResult && (
        <TriageResultCard
          result={triageResult}
          language={language}
          onConnectDoctor={() => setActiveCall(true)}
          onReset={resetTriageFlow}
        />
      )}

      {!triageResult && isTriaging && (
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex flex-col items-center justify-center min-h-[300px] text-center space-y-4 animate-fadeIn">
          <div className="relative">
            <div className="absolute inset-0 bg-teal-500/10 rounded-full animate-ping scale-150 duration-1000" />
            <div className="bg-teal-50 border border-teal-100 p-5 rounded-full relative z-10 text-teal-600">
              <Loader2 className="w-10 h-10 animate-spin" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">{l.triaging}</h3>
            <p className="text-[10px] text-slate-400 max-w-xs leading-normal">
              {language === "hi"
                ? "साथी एआई लक्षणों का विश्लेषण कर रहा है और सुरक्षित कदम सुझा रहा है..."
                : language === "gu"
                ? "સાથી AI લક્ષણોનું વિશ્લેષણ કરી રહ્યું છે અને યોગ્ય સૂચનો મેળવી રહ્યું છે..."
                : "Saathi AI is evaluating your symptoms and checking guidelines..."}
            </p>
          </div>
        </div>
      )}

      {!triageResult && !isTriaging && isTranscribing && (
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex flex-col items-center justify-center min-h-[300px] text-center space-y-4 animate-fadeIn">
          <div className="bg-teal-50 border border-teal-100 p-5 rounded-full text-teal-600 animate-bounce">
            <Mic className="w-10 h-10 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">{l.processing}</h3>
            <p className="text-[10px] text-slate-400 max-w-xs leading-normal">
              {language === "hi"
                ? "ग्रॉक व्हिस्पर एआई आपकी आवाज को पाठ में बदल रहा है..."
                : language === "gu"
                ? "ગ્રોક વ્હીસ્પર AI તમારા અવાજને લખાણમાં રૂપાંતરિત કરી રહ્યું છે..."
                : "Groq Whisper AI is converting your voice into editable text..."}
            </p>
          </div>
        </div>
      )}

      {!triageResult && !isTriaging && !isTranscribing && isRecording && (
        <div className="bg-white rounded-3xl p-6 border border-red-100 shadow-sm flex flex-col items-center justify-center min-h-[300px] text-center space-y-5 animate-fadeIn">
          <div className="relative">
            <div className="absolute inset-0 bg-red-500/10 rounded-full animate-ping scale-150 duration-700" />
            <div className="bg-red-50 border border-red-100 p-6 rounded-full relative z-10 text-red-500">
              <Mic className="w-12 h-12 animate-pulse" />
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-extrabold text-red-500 uppercase tracking-widest">{l.recording}</span>
            <div className="text-3xl font-black text-slate-800 tracking-wider font-mono">
              {formatDuration(recordingDuration)}
            </div>
          </div>

          <div className="flex justify-center items-center gap-1.5 h-10 w-full px-4 my-2">
            <span className="w-1 h-4 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }} />
            <span className="w-1 h-7 bg-red-600 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
            <span className="w-1 h-9 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
            <span className="w-1 h-6 bg-red-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
            <span className="w-1 h-3 bg-red-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
          </div>

          <div className="flex gap-2 w-full max-w-xs pt-2">
            <button
              onClick={stopRecording}
              className="flex-grow bg-emerald-605 hover:bg-emerald-700 text-white font-extrabold text-xs py-3 rounded-xl shadow-sm transition-all active:scale-95 flex items-center justify-center gap-1.5 min-h-[44px]"
            >
              <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
              <span>{l.stop}</span>
            </button>
            <button
              onClick={cancelRecording}
              className="px-5 border border-slate-200 text-slate-500 font-extrabold text-xs rounded-xl hover:bg-slate-55 transition-colors min-h-[44px]"
            >
              {l.cancel}
            </button>
          </div>
        </div>
      )}

      {!triageResult && !isTriaging && !isTranscribing && !isRecording && transcriptText && (
        triageHistory.length > 1 ? (
          /* Follow-up question chat-style flow */
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4 animate-fadeIn">
            <div className="space-y-3 max-h-[300px] overflow-y-auto p-1.5 scrollbar-thin flex flex-col gap-2">
              {triageHistory.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === "assistant" ? "justify-start" : "justify-end"} animate-scaleUp`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs font-semibold leading-relaxed shadow-sm ${
                      msg.role === "assistant"
                        ? "bg-slate-100 text-slate-700 rounded-tl-none border border-slate-200"
                        : "bg-teal-605 text-white rounded-tr-none font-bold"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>

            {/* Answer input for follow-up */}
            <div className="space-y-3 border-t border-slate-150 pt-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={language === "hi" ? "अपना उत्तर लिखें..." : language === "gu" ? "તમારો જવાબ લખો..." : "Type your answer..."}
                  className="flex-grow px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl text-xs font-semibold focus:outline-none focus:border-teal-505 text-slate-755 h-[44px]"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && chatInput.trim()) {
                      submitFollowUpAnswer(chatInput.trim());
                    }
                  }}
                />
                <button
                  onClick={() => {
                    if (chatInput.trim()) {
                      submitFollowUpAnswer(chatInput.trim());
                    }
                  }}
                  className="bg-teal-605 text-white p-3 rounded-xl hover:bg-teal-700 active:scale-95 transition-all shadow-sm min-w-[44px] h-[44px] flex items-center justify-center"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              
              {/* Voice button for follow-up answer */}
              <div className="flex justify-center gap-2">
                <button
                  onClick={startRecording}
                  className="bg-slate-50 hover:bg-slate-100 text-teal-600 border border-slate-200 font-extrabold text-[10px] py-2 px-3 rounded-lg flex items-center gap-1.5 active:scale-95 transition-all shadow-sm min-h-[36px]"
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>{language === "hi" ? "बोलकर उत्तर दें" : language === "gu" ? "બોલીને જવાબ આપો" : "Speak your answer"}</span>
                </button>
                <button
                  onClick={resetTriageFlow}
                  className="bg-slate-55 hover:bg-slate-100 text-slate-500 border border-slate-200 font-extrabold text-[10px] py-2 px-3 rounded-lg flex items-center gap-1.5 active:scale-95 transition-all shadow-sm min-h-[36px]"
                >
                  <span>{language === "hi" ? "रद्द करें" : language === "gu" ? "રદ કરો" : "Reset"}</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Initial draft drafting screen */
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4 animate-fadeIn">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Info className="w-4.5 h-4.5 text-teal-600" />
                {l.editingTitle}
              </h3>
              <p className="text-[10px] text-slate-500 leading-normal">{l.editingDesc}</p>
            </div>

            <textarea
              value={transcriptText}
              onChange={(e) => setTranscriptText(e.target.value)}
              className="w-full h-32 p-3 border border-slate-200 bg-slate-50 rounded-2xl text-xs font-semibold focus:outline-none focus:border-teal-500 text-slate-700 leading-relaxed resize-none shadow-inner"
            />

            <div className="flex gap-2">
              <button
                onClick={handleTriage}
                className="flex-grow bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs py-3 rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 min-h-[44px]"
              >
                <span>{l.btnAnalyze}</span>
                <Sparkles className="w-4 h-4" />
              </button>
              <button
                onClick={resetTriageFlow}
                className="px-4 border border-slate-200 text-slate-650 font-bold text-xs rounded-xl hover:bg-slate-55 transition-colors min-h-[44px]"
              >
                {l.btnRecordAgain}
              </button>
            </div>
          </div>
        )
      )}

      {!triageResult && !isTriaging && !isTranscribing && !isRecording && !transcriptText && (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-teal-600 to-emerald-600 rounded-3xl p-6 text-white shadow-md flex flex-col items-center text-center space-y-5 relative overflow-hidden">
            <div className="absolute -right-8 -bottom-8 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
            <div className="absolute -left-8 -top-8 w-20 h-20 bg-white/10 rounded-full blur-lg pointer-events-none" />

            <div className="space-y-1 relative z-10">
              <span className="bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-widest border border-white/10">
                Multilingual AI Screening
              </span>
              <p className="text-[11px] text-teal-100 font-medium leading-relaxed max-w-[90%] mx-auto pt-1">
                {l.speakLangNotice}
              </p>
            </div>

            <button
              onClick={startRecording}
              className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 border-4 border-teal-500/20 group relative z-10"
            >
              <Mic className="w-10 h-10 text-teal-600 group-hover:scale-110 transition-transform" />
            </button>

            <span className="text-xs font-black tracking-wide text-white/90 relative z-10">
              {l.tapRecord}
            </span>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-3">
            <div className="flex items-center gap-1.5 px-0.5">
              <Info className="w-4 h-4 text-teal-600" />
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Or type your symptoms</span>
            </div>
            <textarea
              placeholder={l.textPlaceholder}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="w-full h-24 p-3 border border-slate-200 bg-slate-50 rounded-2xl text-xs font-semibold focus:outline-none focus:border-teal-500 text-slate-700 leading-normal resize-none shadow-inner"
            />
            <button
              onClick={() => {
                if (chatInput.trim()) {
                  setTranscriptText(chatInput.trim());
                  setChatInput("");
                }
              }}
              disabled={!chatInput.trim()}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs py-2.5 rounded-xl transition-all disabled:opacity-50 active:scale-95 flex items-center justify-center gap-1.5 shadow-sm min-h-[44px]"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{l.btnSubmitText}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

TalkView.displayName = "TalkView";
