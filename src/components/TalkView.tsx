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
  ShieldAlert,
  Volume2,
  VolumeX,
  Phone,
  MessageSquare,
  Share2
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { safeGetItem, safeSetItem } from "@/utils/localStorageHelper";
import { trimSilence } from "../utils/audioTrimmer";
import { speakText, stopSpeaking, isSpeechSupported } from "../utils/textToSpeech";
import { shareHealthReport } from "@/utils/shareHelper";
import { performOfflineTriage } from "../utils/offlineTriage";
import { checkRateLimit } from "@/utils/rateLimit";

interface TriageResult {
  triage: "GREEN" | "YELLOW" | "RED";
  possible_concerns: string[];
  reason: string;
  advice: string;
  see_doctor: boolean;
  confidence?: "LOW" | "MEDIUM" | "HIGH";
  isOffline?: boolean;
  latencySec?: number;
  resolvedVia?: string;
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
  userProfile,
  onConnectDoctor,
  onReset
}: {
  result: TriageResult;
  language: string;
  userProfile?: any;
  onConnectDoctor?: () => void;
  onReset?: () => void;
}) {
  const { t } = useLanguage();
  const isRed = result.triage === "RED";
  const isYellow = result.triage === "YELLOW";

  const patientName = userProfile?.name || "Patient";
  const emergencyName = userProfile?.emergencyContact?.name;
  const emergencyPhone = userProfile?.emergencyContact?.phone;
  const hasEmergencyContact = !!(emergencyPhone && emergencyName);

  const smsText = (t.smsTextTemplate || "EMERGENCY: {name} needs medical help. Sent via Saathi.")
    .replace("{name}", patientName);

  let bgClass = "bg-emerald-50/70 border-emerald-200 text-emerald-800";
  let badgeClass = "bg-emerald-600 text-white";
  let titleText = t.cardGreen;

  if (isRed) {
    bgClass = "bg-rose-50/70 border-rose-200 text-rose-800";
    badgeClass = "bg-red-600 text-white animate-pulse";
    titleText = t.cardEmergency;
  } else if (isYellow) {
    bgClass = "bg-amber-50/70 border-amber-250 text-amber-900";
    badgeClass = "bg-amber-500 text-white";
    titleText = t.cardYellow;
  }

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);

  const getSpeechText = () => {
    const localizedReason = t[result.reason as keyof typeof t] || result.reason;
    const localizedAdvice = t[result.advice as keyof typeof t] || result.advice;
    const levelKey = result.triage === "RED" ? "highRisk" : result.triage === "YELLOW" ? "moderateRisk" : "lowRisk";
    const levelName = t[levelKey] || result.triage;
    return `${t.latestTriage || "Triage"}: ${levelName}. ${titleText}. ${t.cardAdvice || "Advice"}: ${localizedAdvice}`;
  };

  useEffect(() => {
    const supported = isSpeechSupported();
    setVoiceSupported(supported);

    if (supported) {
      const textToSpeak = getSpeechText();
      speakText(
        textToSpeak,
        language,
        () => setIsSpeaking(true),
        () => setIsSpeaking(false),
        (err) => {
          console.error("Speech error:", err);
          setIsSpeaking(false);
        }
      );
    }

    return () => {
      stopSpeaking();
    };
  }, [result, language]);

  const toggleSpeech = () => {
    if (!voiceSupported) return;

    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else {
      const textToSpeak = getSpeechText();
      speakText(
        textToSpeak,
        language,
        () => setIsSpeaking(true),
        () => setIsSpeaking(false),
        (err) => {
          console.error("Speech error:", err);
          setIsSpeaking(false);
        }
      );
    }
  };

  const getConcernText = (concern: string) => {
    return t[concern as keyof typeof t] || concern;
  };

  return (
    <div className="space-y-4 animate-scaleUp text-left">
      <div className={`p-4 rounded-2xl border ${bgClass} shadow-sm space-y-3`}>
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full tracking-wider ${badgeClass} self-start shadow-sm`}>
              Triage: {t[result.triage === "RED" ? "highRisk" : result.triage === "YELLOW" ? "moderateRisk" : "lowRisk"] || result.triage}
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
            {result.isOffline && (
              <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full tracking-wide bg-slate-600 text-white border border-slate-500 self-start shadow-sm">
                {t.offlineBasicGuidance || "Offline basic guidance"}
              </span>
            )}
            {result.latencySec !== undefined && (
              <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full tracking-wide bg-sky-50 text-sky-850 border border-sky-200 self-start shadow-sm flex items-center gap-1.5 animate-fadeIn">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                <span>{result.latencySec}s response time ({result.resolvedVia || "Groq Cloud API"})</span>
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {voiceSupported ? (
              <button
                onClick={toggleSpeech}
                className="flex items-center gap-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 transition-all py-1 px-2.5 rounded-lg shadow-sm text-[10px] font-extrabold"
              >
                {isSpeaking ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-violet-600 animate-pulse" />
                    <span>{t.stopVoice || "Stop Voice"}</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-violet-600" />
                    <span>{t.playVoice || "Play Voice"}</span>
                  </>
                )}
              </button>
            ) : (
              <span className="text-[9px] font-extrabold text-slate-400 italic">
                {t.voiceUnavailable || "Voice not available"}
              </span>
            )}
            <span className="text-xs font-bold flex items-center gap-1 text-slate-700">
              <Heart className="w-3.5 h-3.5 fill-current text-rose-500 animate-pulse" />
              Saathi Triage
            </span>
          </div>
        </div>

        <h3 className="text-sm font-black leading-snug">{titleText}</h3>
        
        <div className="space-y-2 border-t border-slate-200/50 pt-2 text-xs">
          <div>
            <strong className="block text-[10px] uppercase tracking-wider text-slate-500 font-extrabold">{t.cardReason || "Reasoning"}:</strong>
            <p className="mt-0.5 leading-relaxed font-semibold text-slate-700">{t[result.reason as keyof typeof t] || result.reason}</p>
          </div>
          <div className="border-t border-slate-200/20 pt-2">
            <strong className="block text-[10px] uppercase tracking-wider text-slate-500 font-extrabold">{t.cardAdvice || "Recommended Advice"}:</strong>
            <p className="mt-0.5 leading-relaxed font-semibold text-slate-700">{t[result.advice as keyof typeof t] || result.advice}</p>
          </div>
        </div>
      </div>

      {result.possible_concerns && result.possible_concerns.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-2">
          <h4 className="text-xs font-bold text-slate-750 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-violet-650" />
            {t.cardConcerns || "Possible Concerns"}
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {result.possible_concerns.map((concern, idx) => (
              <span key={idx} className="bg-violet-50 text-violet-750 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-violet-100">
                {getConcernText(concern)}
              </span>
            ))}
          </div>
        </div>
      )}

      {isRed && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-3 shadow-sm border-red-200">
          <div className="flex items-center gap-2 text-red-800 font-extrabold text-xs uppercase tracking-wider">
            <AlertTriangle className="w-4.5 h-4.5 text-red-650 shrink-0 animate-bounce" />
            <span>
              {t.emergencyQuickAction || "Emergency Quick Action"}
            </span>
          </div>

          {hasEmergencyContact ? (
            <div className="grid grid-cols-2 gap-2">
              <a
                href={`tel:${emergencyPhone}`}
                className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs py-3 rounded-xl shadow-md transition-all active:scale-95 text-center min-h-[44px]"
              >
                <Phone className="w-4 h-4" />
                <span>
                  {(t.callEmergencyName || "Call {name}").replace("{name}", emergencyName)}
                </span>
              </a>
              <a
                href={`sms:${emergencyPhone}?body=${encodeURIComponent(smsText)}`}
                className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-655 text-white font-extrabold text-xs py-3 rounded-xl shadow-md transition-all active:scale-95 text-center min-h-[44px]"
              >
                <MessageSquare className="w-4 h-4" />
                <span>
                  {t.sendSms || "Send SMS"}
                </span>
              </a>
            </div>
          ) : (
            <a
              href="tel:108"
              className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-black text-xs py-3 px-4 rounded-xl shadow-md transition-all active:scale-95 text-center w-full min-h-[44px]"
            >
              <Phone className="w-4 h-4 animate-pulse" />
              <span>
                {t.callAmbulance || "Call 108 Ambulance"}
              </span>
            </a>
          )}
        </div>
      )}

      <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-3 flex gap-2 text-slate-500 leading-normal">
        <AlertTriangle className="w-4.5 h-4.5 text-slate-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <h5 className="text-[9px] font-extrabold uppercase tracking-wider text-slate-650">{t.cardDisclaimerTitle || "Medical Disclaimer"}</h5>
          <p className="text-[10px] font-medium leading-relaxed">{t.cardDisclaimerText || "Disclaimer text"}</p>
        </div>
      </div>

      <div className="flex flex-col gap-2 pt-1">
        <div className="flex gap-2">
          {result.see_doctor && onConnectDoctor && (
            <button
              onClick={onConnectDoctor}
              className="flex-1 bg-gradient-to-r from-violet-600 to-purple-650 text-white font-extrabold text-xs py-3 rounded-full hover:from-violet-750 hover:to-purple-750 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 min-h-[44px]"
            >
              <Video className="w-4 h-4" />
              <span>{t.cardConnect || "Connect to a Doctor"}</span>
            </button>
          )}
          {onReset && (
            <button
              onClick={onReset}
              className={`py-3 px-4 rounded-full font-bold text-xs transition-all flex items-center justify-center gap-1.5 min-h-[44px] ${
                result.see_doctor 
                  ? "border border-slate-200 text-slate-650 hover:bg-slate-50"
                  : "w-full bg-gradient-to-r from-violet-600 to-purple-650 text-white hover:from-violet-700 hover:to-purple-700 shadow-md"
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin-hover" />
              <span>{t.cardCheckAgain || "Check New Symptoms"}</span>
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={async () => {
            const localizedReason = t[result.reason as keyof typeof t] || result.reason;
            const localizedAdvice = t[result.advice as keyof typeof t] || result.advice;
            const localizedConcerns = result.possible_concerns.map(getConcernText).join(", ");
            const shareText = `Saathi AI Triage Report:
- Status: ${result.triage}
- Concerns: ${localizedConcerns}
- Explanation: ${localizedReason}
- Advice: ${localizedAdvice}

Shared via Saathi.`;
            await shareHealthReport({
              title: "Saathi AI Symptom Triage",
              text: shareText,
              url: window.location.origin
            });
          }}
          className="w-full flex items-center justify-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 font-extrabold text-xs py-2.5 rounded-xl active:scale-[0.98] transition-all min-h-[38px] shadow-sm"
        >
          <Share2 className="w-4 h-4 text-blue-650" />
          <span>
            {t.shareReport || "Share Triage Report"}
          </span>
        </button>
      </div>
    </div>
  );
}

interface TalkViewProps {
  recordsList: any[];
  setRecordsList: React.Dispatch<React.SetStateAction<any[]>>;
  attachRecordToActivePatient: (record: any, riskBand?: "GREEN" | "YELLOW" | "RED") => void;
  setActiveCall: React.Dispatch<React.SetStateAction<boolean>>;
  userProfile?: any;
}

export const TalkView: React.FC<TalkViewProps> = React.memo(({
  recordsList,
  setRecordsList,
  attachRecordToActivePatient,
  setActiveCall,
  userProfile
}) => {
  const { language, t } = useLanguage();
  const l = {
    header: t.talkHeader || "AI Voice Symptom Assessment",
    desc: t.talkDesc || "Speak in your language for immediate triage.",
    tapRecord: t.talkTapRecord || "Tap to Record Symptoms",
    recording: t.talkRecording || "Recording...",
    processing: t.talkProcessing || "Processing...",
    triaging: t.talkTriaging || "Triaging...",
    editingTitle: t.talkEditingTitle || "Edit Transcript",
    editingDesc: t.talkEditingDesc || "Please edit the transcript if needed.",
    btnAnalyze: t.talkBtnAnalyze || "Analyze",
    btnRecordAgain: t.talkBtnRecordAgain || "Record Again",
    textPlaceholder: t.talkTextPlaceholder || "Or type manually...",
    btnSubmitText: t.talkBtnSubmitText || "Submit",
    recordingError: t.talkRecordingError || "Error",
    microphoneNeeded: t.talkMicrophoneNeeded || "Microphone required.",
    stop: t.talkStop || "Stop",
    cancel: t.talkCancel || "Cancel",
    secRemaining: t.talkSecRemaining || "seconds",
    speakLangNotice: t.talkSpeakLangNotice || "Please speak clearly."
  };

  const [isTriaging, setIsTriaging] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcriptText, setTranscriptText] = useState("");
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null);
  const [talkError, setTalkError] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [triageHistory, setTriageHistory] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [chatInput, setChatInput] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (triageHistory.length > 0) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [triageHistory]);

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
        t.micAccessError || "Unable to access microphone. Please check permissions."
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
      const { allowed } = checkRateLimit("transcribe", 5, 30000);
      if (!allowed) {
        throw new Error("RateLimitExceeded");
      }

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
          setChatInput("");
          submitFollowUpAnswer(data.text);
        } else {
          setTranscriptText(data.text);
          handleTriage(data.text);
        }
      } else {
        throw new Error(data.error || "Failed to transcribe audio.");
      }
    } catch (err) {
      console.error("Transcription error:", err);
      const isRateLimit = err instanceof Error && err.message === "RateLimitExceeded";
      setTalkError(
        isRateLimit
          ? (t.systemBusyError || "System busy - please type manually or try again in a few moments.")
          : (t.transcribeError || "Transcription failed. Please try again or type manually.")
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

    const startTime = Date.now();
    try {
      const { allowed } = checkRateLimit("triage", 4, 30000);
      if (!allowed) {
        throw new Error("RateLimitExceeded");
      }

      if (!navigator.onLine) {
        throw new Error("Offline");
      }

      const res = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: transcriptText,
          history: updatedHistory,
          language,
          userProfile
        })
      });

      const data = await res.json();
      if (data.success) {
        if (data.follow_up_question) {
          setTriageHistory([
            ...updatedHistory,
            { role: "assistant" as const, content: data.follow_up_question }
          ]);
          speakAssistantMessage(data.follow_up_question);
        } else if (data.triageResult) {
          const latencySec = ((Date.now() - startTime) / 1000).toFixed(1);
          const enrichedResult = {
            ...data.triageResult,
            latencySec: Number(latencySec),
            resolvedVia: data.isMock ? "Groq Cloud Mock" : "Groq Cloud API"
          };
          setTriageResult(enrichedResult);
          speakTriageResult(enrichedResult);
          
          // Save case to health records if Yellow or Red
          const severityEmoji = enrichedResult.triage === "RED" ? "🚨 RED" : enrichedResult.triage === "YELLOW" ? "⚠️ YELLOW" : "🟢 GREEN";
          const concern = enrichedResult.possible_concerns.join(", ") || "Symptom Check";
          const dateStr = new Date().toISOString().split("T")[0];
          
          const addedItem = {
            id: Date.now(),
            title: `Triage: ${severityEmoji} - ${concern}`,
            date: dateStr,
            category: "Prescription" as const,
            doctor: "Saathi AI Triage",
            notes: `Urgency: ${enrichedResult.triage} | Reason: ${enrichedResult.reason} | Advice: ${enrichedResult.advice}`
          };

          if (enrichedResult.triage === "YELLOW" || enrichedResult.triage === "RED") {
            const nextRecords = [addedItem, ...recordsList];
            setRecordsList(nextRecords);
            safeSetItem("saathi_records", JSON.stringify(nextRecords));
          }

          attachRecordToActivePatient(addedItem, enrichedResult.triage);
        } else {
          throw new Error("Invalid response format from triage service.");
        }
      } else {
        throw new Error(data.error || "Failed to analyze symptoms.");
      }
    } catch (err) {
      const isRateLimit = err instanceof Error && err.message === "RateLimitExceeded";
      console.warn("Triage follow-up failed, running offline fallback triage engine:", err);
      // Run offline triage engine
      const combinedInput = transcriptText + " " + answerText;
      const startTimeOffline = Date.now();
      const offlineResult = performOfflineTriage(combinedInput, language);
      const latencySec = ((Date.now() - startTimeOffline) / 1000).toFixed(2);
      
      const enrichedOfflineResult = {
        ...offlineResult,
        isOffline: true,
        latencySec: Number(latencySec),
        resolvedVia: isRateLimit ? "Local Rule Engine (System Busy Fallback)" : "Local Rule Engine"
      };
      setTriageResult(enrichedOfflineResult);
      speakTriageResult(enrichedOfflineResult);
      
      const severityEmoji = enrichedOfflineResult.triage === "RED" ? "🚨 RED" : enrichedOfflineResult.triage === "YELLOW" ? "⚠️ YELLOW" : "🟢 GREEN";
      const concern = enrichedOfflineResult.possible_concerns.join(", ") || "Symptom Check";
      const dateStr = new Date().toISOString().split("T")[0];
      
      const addedItem = {
        id: Date.now(),
        title: `Triage (Offline): ${severityEmoji} - ${concern}`,
        date: dateStr,
        category: "Prescription" as const,
        doctor: "Saathi AI Triage (Offline)",
        notes: `Urgency: ${enrichedOfflineResult.triage} | Reason: ${enrichedOfflineResult.reason} | Advice: ${enrichedOfflineResult.advice}`
      };

      if (enrichedOfflineResult.triage === "YELLOW" || enrichedOfflineResult.triage === "RED") {
        const nextRecords = [addedItem, ...recordsList];
        setRecordsList(nextRecords);
        safeSetItem("saathi_records", JSON.stringify(nextRecords));
      }

      attachRecordToActivePatient(addedItem, enrichedOfflineResult.triage);
    } finally {
      setIsTriaging(false);
    }
  };

  const speakAssistantMessage = (text: string) => {
    if (isMuted || !isSpeechSupported()) return;
    speakText(
      text,
      language,
      () => {},
      () => {},
      (err) => console.error("Assistant Speech error:", err)
    );
  };

  const speakTriageResult = (res: any) => {
    if (isMuted || !isSpeechSupported()) return;
    const severityKey = res.triage === "RED" ? "severityRed" : res.triage === "YELLOW" ? "severityYellow" : "severityGreen";
    const severity = t[severityKey] || (res.triage === "RED" ? "Red, seek immediate medical attention" : res.triage === "YELLOW" ? "Yellow, consult a doctor soon" : "Green, you appear safe");
    const localizedReason = t[res.reason as keyof typeof t] || res.reason;
    const localizedAdvice = t[res.advice as keyof typeof t] || res.advice;
    const textToSpeak = (t.speakTriageTemplate || "Triage complete. Your status is {severity}. Recommended advice: {advice}. Assessment reason: {reason}")
      .replace("{severity}", severity)
      .replace("{advice}", localizedAdvice)
      .replace("{reason}", localizedReason);

    speakText(
      textToSpeak,
      language,
      () => {},
      () => {},
      (err) => console.error("Triage Speech error:", err)
    );
  };

  const handleTriage = async (overrideText?: string) => {
    const finalTxt = typeof overrideText === "string" ? overrideText : transcriptText;
    if (!finalTxt.trim()) return;
    setIsTriaging(true);
    setTalkError(null);

    const initialHistory = [{ role: "user" as const, content: finalTxt }];
    setTriageHistory(initialHistory);

    const startTime = Date.now();
    try {
      const { allowed } = checkRateLimit("triage", 4, 30000);
      if (!allowed) {
        throw new Error("RateLimitExceeded");
      }

      if (!navigator.onLine) {
        throw new Error("Offline");
      }

      const res = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: finalTxt,
          history: initialHistory,
          language,
          userProfile
        })
      });

      const data = await res.json();
      if (data.success) {
        if (data.follow_up_question) {
          setTriageHistory([
            ...initialHistory,
            { role: "assistant" as const, content: data.follow_up_question }
          ]);
          speakAssistantMessage(data.follow_up_question);
        } else if (data.triageResult) {
          const latencySec = ((Date.now() - startTime) / 1000).toFixed(1);
          const enrichedResult = {
            ...data.triageResult,
            latencySec: Number(latencySec),
            resolvedVia: data.isMock ? "Groq Cloud Mock" : "Groq Cloud API"
          };
          setTriageResult(enrichedResult);
          speakTriageResult(enrichedResult);
          
          // Save case to health records if Yellow or Red
          const severityEmoji = enrichedResult.triage === "RED" ? "🚨 RED" : enrichedResult.triage === "YELLOW" ? "⚠️ YELLOW" : "🟢 GREEN";
          const concern = enrichedResult.possible_concerns.join(", ") || "Symptom Check";
          const dateStr = new Date().toISOString().split("T")[0];
          
          const addedItem = {
            id: Date.now(),
            title: `Triage: ${severityEmoji} - ${concern}`,
            date: dateStr,
            category: "Prescription" as const,
            doctor: "Saathi AI Triage",
            notes: `Urgency: ${enrichedResult.triage} | Reason: ${enrichedResult.reason} | Advice: ${enrichedResult.advice}`
          };

          if (enrichedResult.triage === "YELLOW" || enrichedResult.triage === "RED") {
            const nextRecords = [addedItem, ...recordsList];
            setRecordsList(nextRecords);
            safeSetItem("saathi_records", JSON.stringify(nextRecords));
          }

          attachRecordToActivePatient(addedItem, enrichedResult.triage);
        } else {
          throw new Error("Invalid response format from triage service.");
        }
      } else {
        throw new Error(data.error || "Failed to get triage analysis.");
      }
    } catch (err) {
      const isRateLimit = err instanceof Error && err.message === "RateLimitExceeded";
      console.warn("Triage failed, running offline fallback triage engine:", err);
      // Run offline triage engine
      const startTimeOffline = Date.now();
      const offlineResult = performOfflineTriage(finalTxt, language);
      const latencySec = ((Date.now() - startTimeOffline) / 1000).toFixed(2);
      
      const enrichedOfflineResult = {
        ...offlineResult,
        isOffline: true,
        latencySec: Number(latencySec),
        resolvedVia: isRateLimit ? "Local Rule Engine (System Busy Fallback)" : "Local Rule Engine"
      };
      setTriageResult(enrichedOfflineResult);
      speakTriageResult(enrichedOfflineResult);
      
      const severityEmoji = enrichedOfflineResult.triage === "RED" ? "🚨 RED" : enrichedOfflineResult.triage === "YELLOW" ? "⚠️ YELLOW" : "🟢 GREEN";
      const concern = enrichedOfflineResult.possible_concerns.join(", ") || "Symptom Check";
      const dateStr = new Date().toISOString().split("T")[0];
      
      const addedItem = {
        id: Date.now(),
        title: `Triage (Offline): ${severityEmoji} - ${concern}`,
        date: dateStr,
        category: "Prescription" as const,
        doctor: "Saathi AI Triage (Offline)",
        notes: `Urgency: ${enrichedOfflineResult.triage} | Reason: ${enrichedOfflineResult.reason} | Advice: ${enrichedOfflineResult.advice}`
      };

      if (enrichedOfflineResult.triage === "YELLOW" || enrichedOfflineResult.triage === "RED") {
        const nextRecords = [addedItem, ...recordsList];
        setRecordsList(nextRecords);
        safeSetItem("saathi_records", JSON.stringify(nextRecords));
      }

      attachRecordToActivePatient(addedItem, enrichedOfflineResult.triage);
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
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-extrabold text-textprimary flex items-center gap-2">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <Mic className="w-4 h-4 text-primary" />
            </div>
            {l.header}
          </h2>
          <p className="text-xs text-textsecondary leading-normal">{l.desc}</p>
        </div>
        <button
          onClick={() => {
            const nextMute = !isMuted;
            setIsMuted(nextMute);
            if (nextMute) {
              stopSpeaking();
            }
          }}
          className={`p-2 rounded-2xl border transition-all shadow-soft active:scale-95 ${
            isMuted
              ? "bg-red-50 text-red-500 border-red-200"
              : "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
          }`}
          title={isMuted ? "Unmute Assistant Voice" : "Mute Assistant Voice"}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 animate-pulse" />}
        </button>
      </div>

      {talkError && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-3xl p-4 flex gap-2.5 animate-scaleUp shadow-soft">
          <AlertTriangle className="w-4.5 h-4.5 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-grow space-y-1">
            <span className="text-xs font-bold block">{l.recordingError}</span>
            <p className="text-[10px] font-semibold leading-normal">{talkError}</p>
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
          userProfile={userProfile}
          onConnectDoctor={() => setActiveCall(true)}
          onReset={resetTriageFlow}
        />
      )}

      {!triageResult && isTriaging && (
        <div className="bg-white/80 backdrop-blur-md rounded-[32px] p-8 border border-slate-100/80 shadow-soft flex flex-col items-center justify-center min-h-[300px] text-center space-y-4 animate-fadeIn">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/10 rounded-full animate-ping scale-150 duration-1000" />
            <div className="bg-primary/10 border border-primary/20 p-5 rounded-full relative z-10 text-primary">
              <Loader2 className="w-10 h-10 animate-spin" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-extrabold text-textprimary uppercase tracking-wider">{l.triaging}</h3>
            <p className="text-[10px] text-textsecondary max-w-xs leading-normal font-bold">
              {t.triagingStatus || "Saathi AI is evaluating your symptoms and checking guidelines..."}
            </p>
          </div>
        </div>
      )}

      {!triageResult && !isTriaging && isTranscribing && (
        <div className="bg-white/80 backdrop-blur-md rounded-[32px] p-8 border border-slate-100/80 shadow-soft flex flex-col items-center justify-center min-h-[300px] text-center space-y-4 animate-fadeIn">
          <div className="bg-primary/10 border border-primary/20 p-5 rounded-full text-primary animate-bounce">
            <Mic className="w-10 h-10 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-extrabold text-textprimary uppercase tracking-wider">{l.processing}</h3>
            <p className="text-[10px] text-textsecondary max-w-xs leading-normal font-bold">
              {t.transcribingStatus || "Groq Whisper AI is converting your voice into editable text..."}
            </p>
          </div>
        </div>
      )}

      {!triageResult && !isTriaging && !isTranscribing && isRecording && (
        <div className="bg-white/80 backdrop-blur-md rounded-[32px] p-6 border border-red-100 shadow-soft flex flex-col items-center justify-center min-h-[300px] text-center space-y-5 animate-fadeIn">
          <div className="relative">
            <div className="absolute inset-0 bg-red-500/10 rounded-full animate-ping scale-150 duration-700" />
            <div className="bg-red-50 border border-red-100 p-6 rounded-full relative z-10 text-red-500">
              <Mic className="w-12 h-12 animate-pulse" />
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-extrabold text-red-500 uppercase tracking-widest">{l.recording}</span>
            <div className="text-3xl font-black text-textprimary tracking-wider font-mono">
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
              className="flex-grow bg-gradient-to-r from-primary to-secondary hover:shadow-premium text-white font-extrabold text-xs py-3.5 rounded-2xl shadow-soft transition-all active:scale-[0.98] flex items-center justify-center gap-2 min-h-[44px]"
            >
              <div className="w-2.5 h-2.5 bg-white rounded-[2px] shrink-0" />
              <span>{l.stop}</span>
            </button>
            <button
              onClick={cancelRecording}
              className="px-5 border border-slate-200 text-textsecondary font-extrabold text-xs rounded-2xl hover:bg-slate-50 transition-colors shadow-soft min-h-[44px] active:scale-[0.98]"
            >
              {l.cancel}
            </button>
          </div>
        </div>
      )}

      {!triageResult && !isTriaging && !isTranscribing && !isRecording && transcriptText && (
        triageHistory.length > 1 ? (
          /* Follow-up question chat-style flow */
          <div className="bg-white/80 backdrop-blur-md rounded-[32px] p-5 border border-slate-100/80 shadow-soft space-y-4 animate-fadeIn">
            <div className="space-y-3 max-h-[300px] overflow-y-auto p-1.5 scrollbar-thin flex flex-col gap-2.5">
              {triageHistory.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === "assistant" ? "justify-start" : "justify-end"} animate-scaleUp`}
                >
                  <div
                    className={`max-w-[85%] rounded-[20px] px-4 py-2.5 text-xs font-bold leading-relaxed shadow-soft ${
                      msg.role === "assistant"
                        ? "bg-white text-violet-900 rounded-tl-none border border-violet-100/80"
                        : "bg-gradient-to-r from-violet-600 to-purple-650 text-white rounded-tr-none"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Answer input for follow-up */}
            <div className="space-y-3 border-t border-slate-150 pt-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={t.placeholderTypeAnswer || "Type your answer..."}
                  className="flex-grow px-4 py-3 input-premium text-xs font-bold focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 text-textprimary placeholder-textsecondary h-[44px] rounded-full"
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
                  className="bg-gradient-to-r from-violet-600 to-purple-650 text-white p-3 rounded-full hover:from-violet-700 hover:to-purple-700 active:scale-[0.98] transition-all shadow-soft min-w-[44px] h-[44px] flex items-center justify-center"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              
              {/* Voice button for follow-up answer */}
              <div className="flex justify-center gap-2">
                <button
                  onClick={startRecording}
                  className="bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200/50 font-extrabold text-[10px] py-2 px-4 rounded-full flex items-center gap-1.5 active:scale-[0.98] transition-all shadow-soft min-h-[36px]"
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>{t.btnSpeakAnswer || "Speak your answer"}</span>
                </button>
                <button
                  onClick={resetTriageFlow}
                  className="bg-slate-50 hover:bg-slate-100 text-textsecondary border border-slate-200 font-extrabold text-[10px] py-2 px-4 rounded-full flex items-center gap-1.5 active:scale-[0.98] transition-all shadow-soft min-h-[36px]"
                >
                  <span>{l.cancel}</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Initial draft drafting screen */
          <div className="bg-white/80 backdrop-blur-md rounded-[32px] p-5 border border-slate-100/80 shadow-soft space-y-4 animate-fadeIn">
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-textprimary flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-lg bg-violet-55/60 flex items-center justify-center">
                  <Info className="w-3.5 h-3.5 text-violet-605" />
                </div>
                {l.editingTitle}
              </h3>
              <p className="text-[10px] text-textsecondary leading-normal font-semibold">{l.editingDesc}</p>
            </div>

            <textarea
              value={transcriptText}
              onChange={(e) => setTranscriptText(e.target.value)}
              className="w-full h-32 p-4 input-premium text-xs font-semibold focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 text-textprimary leading-relaxed resize-none shadow-inner rounded-2xl"
            />

            <div className="flex gap-2">
              <button
                onClick={() => handleTriage()}
                className="flex-grow bg-gradient-to-r from-violet-600 to-purple-650 hover:from-violet-750 hover:to-purple-750 text-white font-extrabold text-xs py-3 rounded-full shadow-soft transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 min-h-[44px]"
              >
                <span>{l.btnAnalyze}</span>
                <Sparkles className="w-4 h-4" />
              </button>
              <button
                onClick={resetTriageFlow}
                className="px-4 border border-slate-200 text-textsecondary font-bold text-xs rounded-full hover:bg-slate-50 transition-colors shadow-soft min-h-[44px] active:scale-[0.98]"
              >
                {l.btnRecordAgain}
              </button>
            </div>
          </div>
        )
      )}

      {!triageResult && !isTriaging && !isTranscribing && !isRecording && !transcriptText && (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-violet-600 via-violet-700 to-purple-800 rounded-[32px] p-8 text-white shadow-soft flex flex-col items-center text-center space-y-5 relative overflow-hidden">
            <div className="absolute -right-8 -bottom-8 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
            <div className="absolute -left-8 -top-8 w-20 h-20 bg-white/10 rounded-full blur-lg pointer-events-none" />

            <div className="space-y-1 relative z-10">
              <span className="bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-widest border border-white/10">
                Multilingual AI Screening
              </span>
              <p className="text-[11px] text-white/90 font-bold leading-relaxed max-w-[90%] mx-auto pt-1">
                {l.speakLangNotice}
              </p>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-violet-600/30 rounded-full animate-ping duration-1000" />
              <button
                onClick={startRecording}
                className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-soft transition-transform hover:scale-[1.03] active:scale-95 border-4 border-white/20 group relative z-10"
              >
                <Mic className="w-10 h-10 text-violet-600 group-hover:scale-110 transition-transform" />
              </button>
            </div>

            <span className="text-xs font-extrabold tracking-wide text-white/90 relative z-10">
              {l.tapRecord}
            </span>
          </div>

          <div className="bg-white/80 backdrop-blur-md rounded-[32px] p-5 border border-slate-100/80 shadow-soft space-y-3">
            <div className="flex items-center gap-1.5 px-0.5">
              <div className="w-6 h-6 rounded-lg bg-violet-50 flex items-center justify-center">
                <Info className="w-3.5 h-3.5 text-violet-600" />
              </div>
              <span className="text-xs font-bold text-textprimary uppercase tracking-wide">Or type your symptoms</span>
            </div>
            <textarea
              placeholder={l.textPlaceholder}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="w-full h-24 p-4 input-premium text-xs font-semibold focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 text-textprimary leading-normal resize-none shadow-inner rounded-2xl"
            />
            <button
              onClick={() => {
                if (chatInput.trim()) {
                  setTranscriptText(chatInput.trim());
                  setChatInput("");
                }
              }}
              disabled={!chatInput.trim()}
              className="w-full bg-gradient-to-r from-violet-600 to-purple-650 hover:from-violet-750 hover:to-purple-750 text-white font-extrabold text-xs py-3 rounded-full transition-all disabled:opacity-50 active:scale-[0.98] flex items-center justify-center gap-1.5 shadow-soft min-h-[44px]"
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
