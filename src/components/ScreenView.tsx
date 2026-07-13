"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  AlertTriangle,
  ShieldAlert,
  Info,
  Camera,
  UploadCloud,
  Sparkles,
  Loader2,
  Volume2,
  VolumeX,
  Share2,
  SwitchCamera,
  ShieldCheck,
  Check
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { ClinicalDisclaimer } from "./ClinicalDisclaimer";
import { safeGetItem, safeSetItem } from "@/utils/localStorageHelper";
import { speakText, stopSpeaking, isSpeechSupported } from "../utils/textToSpeech";
import { shareHealthReport } from "@/utils/shareHelper";
import { checkRateLimit } from "@/utils/rateLimit";
import { findNuskhe } from "../utils/nuskheEngine";
import { performOfflineTriage } from "../utils/offlineTriage";
import { calculateBMI } from "../utils/bmiCalculator";

const screenTranslations = {
  en: {
    heroTitle: "AI Camera Screening (Hero Demo)",
    heroDesc: "Screen for Anemia, Jaundice, or skin irregularities using interactive pixel analysis of your camera captures.",
    selectCondition: "Select Condition to Screen",
    anemia: "Anemia (Nail/Eye/Palm)",
    jaundice: "Jaundice (Eye/Skin)",
    skin: "Skin Check",
    guideAnemia: "Align your fingernail, palm, or lower eyelid inside the box. Make sure you are in a bright, evenly lit area.",
    guideJaundice: "Align the white of your eye (sclera) or your skin area inside the box. Ensure natural light without yellow bulbs.",
    guideSkin: "Align the target skin rash, mole, or redness inside the box.",
    startCamera: "Use Live Camera",
    uploadImage: "Upload a Photo",
    captureBtn: "Capture Photo",
    analyzing: "Analyzing...",
    resultsTitle: "AI Screening Result",
    indexScore: "Analysis Index Score",
    riskLevel: "Risk Level",
    disclaimerTitle: "Prototype Warning & Clinical Disclaimer",
    disclaimerText: "This is a prototype color-analysis screening heuristic for demonstration purposes only. It is NOT a medical diagnosis. A production system would utilize a trained TensorFlow Lite CNN. If Moderate or High risk is detected, please consult a qualified healthcare professional.",
    saveReport: "Save to Health Records",
    retake: "Retake Scan",
    cancel: "Cancel",
    tapROI: "Interactive ROI Selection",
    tapInstructions: "Tap directly on the region of interest (e.g., your nail bed, eye sclera, or skin patch) on the image above, then click Analyze.",
    errLuminance: "Too dark / too bright, move to even lighting",
    errOverexposed: "Reduce direct light/flash",
    errTooSmall: "Move closer",
    errVariance: "Hold steady",
    signalQualityLabel: "Signal Quality",
    good: "Good",
    ok: "OK",
    poor: "Poor"
  },
  hi: {
    heroTitle: "AI कैमरा स्क्रीनिंग (हीरो डेमो)",
    heroDesc: "कैमरा कैप्चर के इंटरैक्टिव पिक्सेल विश्लेषण का उपयोग करके एनीमिया, पीलिया, या त्वचा की अनियमितताओं की जांच करें।",
    selectCondition: "जांच के लिए स्थिति चुनें",
    anemia: "एनीमिया (नाखून/आँख/हथेली)",
    jaundice: "पीलिया (आँख/त्वचा)",
    skin: "त्वचा की जांच",
    guideAnemia: "अपने नाखून, हथेली या निचली पलक को बॉक्स के अंदर संरेखित करें। सुनिश्चित करें कि आप अच्छी रोशनी वाले क्षेत्र में हैं।",
    guideJaundice: "अपनी आँख के सफेद भाग (स्केलेरा) या त्वचा के क्षेत्र को बॉक्स के अंदर रखें। पीली लाइट से बचें।",
    guideSkin: "लक्षित त्वचा रैश, तिल, या लाली को बॉक्स के अंदर संरेखित करें।",
    startCamera: "लाइव कैमरे का उपयोग करें",
    uploadImage: "फोटो अपलोड करें",
    captureBtn: "फोटो खींचें",
    analyzing: "विश्लेषण किया जा रहा है...",
    resultsTitle: "AI स्क्रीनिंग परिणाम",
    indexScore: "विश्लेषण इंडेक्स स्कोर",
    riskLevel: "जोखिम स्तर",
    disclaimerTitle: "प्रोटोटाइप चेतावनी और नैदानिक अस्वीकरण",
    disclaimerText: "यह केवल प्रदर्शन के लिए एक प्रोटोटाइप रंग-विश्लेषण स्क्रीनिंग एल्गोरिदम है। यह कोई चिकित्सा निदान नहीं है। एक वास्तविक उत्पादन प्रणाली प्रशिक्षित TensorFlow Lite CNN का उपयोग करेगी। यदि मध्यम या उच्च जोखिम पाया जाता है, तो कृपया डॉक्टर से परामर्श लें।",
    saveReport: "स्वास्थ्य रिकॉर्ड में सहेजें",
    retake: "दोबारा स्कैन करें",
    cancel: "रद्द करें",
    tapROI: "इंटरैक्टिव क्षेत्र चयन (ROI)",
    tapInstructions: "ऊपर दी गई छवि पर विश्लेषण के विशिष्ट क्षेत्र (जैसे, नाखून, आँख का सफेद भाग, या त्वचा) पर सीधे टैप करें, फिर विश्लेषण पर क्लिक करें।",
    errLuminance: "बहुत अंधेरा या बहुत तेज़ रोशनी है, समान रोशनी वाली जगह पर जाएँ",
    errOverexposed: "सीधी रोशनी या फ़्लैश कम करें",
    errTooSmall: "कैमरा और पास लाएँ",
    errVariance: "कैमरा स्थिर रखें",
    signalQualityLabel: "संकेत गुणवत्ता",
    good: "उत्कृष्ट",
    ok: "सामान्य",
    poor: "कमज़ोर"
  },
  gu: {
    heroTitle: "AI કેમેરા સ્ક્રીનીંગ (હીરો ડેમો)",
    heroDesc: "કેમેરા કેપ્ચરના ઇન્ટરેક્ટિવ પિક્સેલ વિશ્લેષણનો ઉપયોગ કરીને એનિમિયા, કમળો અથવા ત્વચાની અનિયમિતતાઓ શોધો.",
    selectCondition: "સ્ક્રીનીંગ માટે સ્થિતિ પસંદ કરો",
    anemia: "એનિમિયા (નખ/આંખ/હથેળી)",
    jaundice: "કમળો (આંખ/ત્વચા)",
    skin: "ત્વચા તપાસ",
    guideAnemia: "તમારા નખ, હથેળી અથવા નીચેની પોપચાને બોક્સની અંદર લાવો. ખાતરી કરો કે તમે પૂરતા પ્રકાશ વાળા સ્થળે છો.",
    guideJaundice: "તમારી આંખના સફેદ ભાગ (સ્ક્લેરા) અથવા ત્વચાના ભાગને બોક્સની અંદર રાખો. પીળા પ્રકાશથી બચો.",
    guideSkin: "ચામડીના લાલ ભાગ કે નિશાનને બોક્સની અંદર ગોઠવો.",
    startCamera: "લાઇવ કેમેરા વાપરો",
    uploadImage: "ફોટો અપલોડ કરો",
    captureBtn: "ફોટો કેપ્ચર કરો",
    analyzing: "વિશ્લેષણ ચાલુ છે...",
    resultsTitle: "AI સ્ક્રીનીંગ પરિણામ",
    indexScore: "વિશ્લેષણ ઇન્ડેક્સ સ્કોર",
    riskLevel: "જોખમ સ્તર",
    disclaimerTitle: "પ્રોટોટાઇપ ચેતવણી અને તબીબી અસ્વીકરણ",
    disclaimerText: "આ માત્ર પ્રદર્શન માટેનો પ્રોટોટાઇપ કલર-એનાલિસિસ સ્ક્રીનીંગ એલ્ગોરિધમ છે. આ કોઈ તબીબી નિદાન નથી. વાસ્તવિક ઉત્પાદન સિસ્ટમ પ્રશિક્ષિત TensorFlow Lite CNN નો ઉપયોગ કરશે. જો મધ્યમ અથવા ઉચ્ચ જોખમ જણાય, તો તબીબનો સંપર્ક કરો.",
    saveReport: "આરોગ્ય રેકોર્ડમાં સાચવો",
    retake: "ફરી સ્કેન કરો",
    cancel: "રદ કરો",
    tapROI: "ઇન્ટરેક્ટિવ વિસ્તાર પસંદગી (ROI)",
    tapInstructions: "ઉપરના ચિત્ર પર વિશ્લેષણ માટેના વિશિષ્ટ ભાગ (નખ, આંખનો સફેદ ભાગ અથવા ચામડી) પર સીધો ટેપ કરો, પછી વિશ્લેષણ પર ક્લિક કરો.",
    errLuminance: "ખૂબ અંધારું અથવા ખૂબ તેજસ્વી છે, સમાન પ્રકાશ વાળા સ્થળે ખસો",
    errOverexposed: "સીધો પ્રકાશ અથવા ફ્લેશ ઓછો કરો",
    errTooSmall: "વધુ નજીક લાવો",
    errVariance: "સ્થિર રાખો",
    signalQualityLabel: "સિગ્નલ ગુણવત્તા",
    good: "અતિ ઉત્તમ",
    ok: "સામાન્ય",
    poor: "નબળું"
  }
};

function rgbToLab(R: number, G: number, B: number) {
  let r = R / 255;
  let g = G / 255;
  let b = B / 255;

  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

  const X = r * 0.4124 + g * 0.3576 + b * 0.1805;
  const Y = r * 0.2126 + g * 0.7152 + b * 0.0722;
  const Z = r * 0.0193 + g * 0.1192 + b * 0.9505;

  const xr = X / 0.95047;
  const yr = Y / 1.00000;
  const zr = Z / 1.08883;

  const f = (t: number) => {
    return t > 0.008856 ? Math.pow(t, 1 / 3) : 7.787 * t + 16 / 116;
  };

  const fx = f(xr);
  const fy = f(yr);
  const fz = f(zr);

  const L = 116 * fy - 16;
  const a = 500 * (fx - fy);
  const b_star = 200 * (fy - fz);

  return { L, a, b_star };
}

const ScreenSpeechPlayer: React.FC<{
  text: string;
  language: string;
  matchedNuskhe?: any[];
  triageLevel?: string;
}> = ({ text, language, matchedNuskhe, triageLevel }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const clearPendingSpeech = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  useEffect(() => {
    const supported = isSpeechSupported();
    setVoiceSupported(supported);

    if (supported && text) {
      speakText(
        text,
        language,
        () => setIsSpeaking(true),
        () => setIsSpeaking(false),
        () => setIsSpeaking(false)
      );

      if (matchedNuskhe && matchedNuskhe.length > 0 && triageLevel !== 'RED') {
        const nuskheIntro = language === 'hi'
          ? 'और ये रहे नानी-दादी के नुस्खे।'
          : language === 'gu'
          ? 'અને આ રહ્યા નાની-દાદીના નુસ્ખા।'
          : 'And here are some traditional home remedies from Nani-Dadi.';

        const nuskheText = matchedNuskhe
          .slice(0, 3)
          .map(n => language === 'hi'
            ? n.language.hi
            : language === 'gu'
            ? n.language.gu
            : n.remedy)
          .join('. ');

        clearPendingSpeech();
        timeoutRef.current = setTimeout(() => {
          speakText(
            nuskheIntro + ' ' + nuskheText,
            language,
            () => setIsSpeaking(true),
            () => setIsSpeaking(false),
            () => setIsSpeaking(false)
          );
        }, 1500);
      }
    }
    return () => {
      clearPendingSpeech();
      stopSpeaking();
    };
  }, [text, language, matchedNuskhe, triageLevel]);

  const toggleSpeech = () => {
    if (!voiceSupported) return;
    if (isSpeaking) {
      clearPendingSpeech();
      stopSpeaking();
      setIsSpeaking(false);
    } else {
      speakText(
        text,
        language,
        () => setIsSpeaking(true),
        () => setIsSpeaking(false),
        () => setIsSpeaking(false)
      );

      if (matchedNuskhe && matchedNuskhe.length > 0 && triageLevel !== 'RED') {
        const nuskheIntro = language === 'hi'
          ? 'और ये रहे नानी-दादी के नुस्खे।'
          : language === 'gu'
          ? 'અને આ રહ્યા નાની-દાદીના નુસ્ખા।'
          : 'And here are some traditional home remedies from Nani-Dadi.';

        const nuskheText = matchedNuskhe
          .slice(0, 3)
          .map(n => language === 'hi'
            ? n.language.hi
            : language === 'gu'
            ? n.language.gu
            : n.remedy)
          .join('. ');

        clearPendingSpeech();
        timeoutRef.current = setTimeout(() => {
          speakText(
            nuskheIntro + ' ' + nuskheText,
            language,
            () => setIsSpeaking(true),
            () => setIsSpeaking(false),
            () => setIsSpeaking(false)
          );
        }, 1500);
      }
    }
  };

  if (!voiceSupported) {
    return (
      <span className="text-[9px] text-slate-400 italic">
        {language === "hi" ? "आवाज उपलब्ध नहीं" : language === "gu" ? "અવાજ ઉપલબ્ધ નથી" : "Voice not available"}
      </span>
    );
  }

  return (
    <button
      onClick={toggleSpeech}
      className="flex items-center gap-1.5 bg-white/80 hover:bg-slate-50 border border-slate-200 text-slate-705 transition-all py-1 px-2.5 rounded-lg shadow-sm text-[10px] font-extrabold shrink-0"
    >
      {isSpeaking ? (
        <>
          <VolumeX className="w-3.5 h-3.5 text-violet-600 animate-pulse" />
          <span>{language === "hi" ? "आवाज रोकें" : language === "gu" ? "અવાજ બંધ કરો" : "Stop Voice"}</span>
        </>
      ) : (
        <>
          <Volume2 className="w-3.5 h-3.5 text-violet-600" />
          <span>{language === "hi" ? "आवाज सुनें" : language === "gu" ? "અવાજ સાંભળો" : "Play Voice"}</span>
        </>
      )}
    </button>
  );
};

interface ScreenViewProps {
  recordsList: any[];
  setRecordsList: React.Dispatch<React.SetStateAction<any[]>>;
  activePatientId: string | null;
  ashaModeActive: boolean;
  patientsList: any[];
  setPatientsList: React.Dispatch<React.SetStateAction<any[]>>;
  activeTab: string;
  userProfile?: any;
  language?: string;
}

export const ScreenView: React.FC<ScreenViewProps> = React.memo(({
  recordsList,
  setRecordsList,
  activePatientId,
  ashaModeActive,
  patientsList,
  setPatientsList,
  activeTab,
  userProfile,
  language: languageProp
}) => {
  const { language, t } = useLanguage();
  const sTrans = screenTranslations[language as keyof typeof screenTranslations] || screenTranslations.en;

  const [screenMode, setScreenMode] = useState<"camera" | "symptoms">("camera");
  const [selectedCondition, setSelectedCondition] = useState<"anemia" | "jaundice" | "skin">("anemia");
  const [screenStep, setScreenStep] = useState<"select" | "capture" | "roi" | "results">("select");

  const [screenImage, setScreenImage] = useState<string | null>(null);
  const [isSampleImage, setIsSampleImage] = useState(false);
  const [roiCoords, setRoiCoords] = useState<{ x: number; y: number } | null>(null);
  const [avgColor, setAvgColor] = useState<{ r: number; g: number; b: number } | null>(null);
  const [screenResults, setScreenResults] = useState<{
    condition: string;
    riskBand: "Low" | "Moderate" | "High";
    indexVal: number;
    description: string;
    signalQuality: "good" | "ok" | "poor";
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [screenToast, setScreenToast] = useState<{ message: string; type: "error" | "success" | "info" } | null>(null);
  const [isCapturingMulti, setIsCapturingMulti] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");

  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const screenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const capturedFramesRef = useRef<HTMLCanvasElement[]>([]);
  const isStaticUploadRef = useRef(false);

  // Symptom checker states
  const [symptoms, setSymptoms] = useState({
    fever: false,
    cough: false,
    fatigue: false,
    soreThroat: false,
    breath: false,
    bodyAche: false,
    lossTaste: false
  });
  const [age, setAge] = useState(32);
  const [temperature, setTemperature] = useState("98.6");
  const [screeningResult, setScreeningResult] = useState<string | null>(null);
  const [assessElapsed, setAssessElapsed] = useState<string | null>(null);
  const [isScreeningLoading, setIsScreeningLoading] = useState(false);

  // Nani-Dadi Ke Nuskhe Memoized Matcher
  const { matchedNuskhe, triageLevel, speechText } = useMemo(() => {
    if (!screeningResult) {
      return { matchedNuskhe: [], triageLevel: "GREEN" as const, speechText: "" };
    }

    const activeKeys: string[] = [];
    if (symptoms.fever) activeKeys.push("fever");
    if (symptoms.cough) activeKeys.push("cough");
    if (symptoms.fatigue) activeKeys.push("fatigue");
    if (symptoms.soreThroat) activeKeys.push("sore throat");
    if (symptoms.breath) activeKeys.push("breath");
    if (symptoms.bodyAche) activeKeys.push("body ache");
    if (symptoms.lossTaste) activeKeys.push("taste");

    const inputForTriage = (activeKeys.join(" ") + " " + screeningResult).toLowerCase();
    const triageRes = performOfflineTriage(inputForTriage, language);
    const calculatedTriage = triageRes.triage;

    // Determine BMI Category
    let bmiCategory = "";
    if (ashaModeActive && activePatientId) {
      const activePatient = patientsList.find(p => p.id === activePatientId);
      if (activePatient && activePatient.height && activePatient.weight) {
        const bmiRes = calculateBMI(Number(activePatient.weight), Number(activePatient.height));
        bmiCategory = bmiRes ? bmiRes.category : "";
      }
    } else if (userProfile && userProfile.height && userProfile.weight) {
      const bmiRes = calculateBMI(Number(userProfile.weight), Number(userProfile.height));
      bmiCategory = bmiRes ? bmiRes.category : "";
    }

    const matched = findNuskhe(activeKeys, screeningResult, calculatedTriage, language, bmiCategory);

    let voiceText = screeningResult;
    if (calculatedTriage !== "RED" && matched.length > 0) {
      const remediesTitle = language === "hi"
        ? "\n\nपारंपरिक घरेलू नुस्खे:\n"
        : language === "gu"
        ? "\n\nપરંપરાગત ઘરેલું નુસ્ખા:\n"
        : "\n\nTraditional Home Remedies:\n";
      voiceText += remediesTitle;

      matched.forEach((n, idx) => {
        const remedyDesc = language === "hi" ? n.language.hi : language === "gu" ? n.language.gu : n.remedy;
        voiceText += `${idx + 1}. ${remedyDesc}\n`;
      });
    }

    return {
      matchedNuskhe: matched,
      triageLevel: calculatedTriage,
      speechText: voiceText
    };
  }, [screeningResult, symptoms, language, ashaModeActive, activePatientId, patientsList, userProfile]);

  // Prefill age from userProfile if available
  useEffect(() => {
    if (userProfile && userProfile.age) {
      const parsedAge = Number(userProfile.age);
      if (!isNaN(parsedAge)) {
        setAge(parsedAge);
      }
    }
  }, [userProfile]);

  // Automatically clear screening toast
  useEffect(() => {
    if (screenToast) {
      const timer = setTimeout(() => setScreenToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [screenToast]);

  const stopScreenCameraStream = () => {
    if (screenVideoRef.current && screenVideoRef.current.srcObject) {
      const stream = screenVideoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      screenVideoRef.current.srcObject = null;
    }
  };

  const startScreenCamera = async () => {
    isStaticUploadRef.current = false;
    setIsSampleImage(false);
    setScreenStep("capture");
    setScreenImage(null);
    setRoiCoords(null);
    setAvgColor(null);
    setScreenResults(null);

    setTimeout(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facingMode, width: { ideal: 480 }, height: { ideal: 480 } }
        });
        if (screenVideoRef.current) {
          screenVideoRef.current.srcObject = stream;
          screenVideoRef.current.play();
        }
      } catch (err) {
        console.error("Failed to open camera for screening:", err);
        alert("Failed to access camera. You can still upload a photo instead.");
        setScreenStep("select");
      }
    }, 100);
  };

  const toggleCameraFacing = async () => {
    const newMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(newMode);
    stopScreenCameraStream();

    isStaticUploadRef.current = false;
    setIsSampleImage(false);
    setScreenStep("capture");
    setScreenImage(null);
    setRoiCoords(null);
    setAvgColor(null);
    setScreenResults(null);

    setTimeout(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: newMode, width: { ideal: 480 }, height: { ideal: 480 } }
        });
        if (screenVideoRef.current) {
          screenVideoRef.current.srcObject = stream;
          screenVideoRef.current.play();
        }
      } catch (err) {
        console.error("Failed to switch camera:", err);
        alert("Failed to switch camera direction. Reverting.");
        setScreenStep("select");
      }
    }, 100);
  };

  const captureScreenPhoto = async () => {
    isStaticUploadRef.current = false;
    const video = screenVideoRef.current;
    if (!video) return;
    setIsCapturingMulti(true);

    const canvases: HTMLCanvasElement[] = [];
    for (let i = 0; i < 5; i++) {
      const canvas = document.createElement("canvas");
      canvas.width = 320;
      canvas.height = 320;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      }
      canvases.push(canvas);
      if (i < 4) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    capturedFramesRef.current = canvases;

    const displayCanvas = canvases[4];
    const dataUrl = displayCanvas.toDataURL("image/jpeg");
    setScreenImage(dataUrl);

    stopScreenCameraStream();
    setIsCapturingMulti(false);
    setScreenStep("roi");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    isStaticUploadRef.current = true;
    setIsSampleImage(false);
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setScreenImage(dataUrl);
        setScreenStep("roi");

        const img = new Image();
        img.src = dataUrl;
        img.onload = () => {
          const canvases: HTMLCanvasElement[] = [];
          for (let i = 0; i < 5; i++) {
            const canvas = document.createElement("canvas");
            canvas.width = 320;
            canvas.height = 320;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(img, 0, 0, 320, 320);
            }
            canvases.push(canvas);
          }
          capturedFramesRef.current = canvases;
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSampleSelect = (condition: "anemia" | "jaundice" | "skin") => {
    isStaticUploadRef.current = true;
    setIsSampleImage(true);
    capturedFramesRef.current = [];
    
    let path = "";
    if (condition === "anemia") {
      path = "/samples/nail_bed.png";
    } else if (condition === "jaundice") {
      path = "/samples/eye.svg";
    } else {
      path = "/samples/skin.svg";
    }

    setScreenImage(path);
    setScreenStep("roi");

    const img = new Image();
    img.src = path;
    img.onload = () => {
      const canvases: HTMLCanvasElement[] = [];
      for (let i = 0; i < 5; i++) {
        const canvas = document.createElement("canvas");
        canvas.width = 320;
        canvas.height = 320;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, 320, 320);
        }
        canvases.push(canvas);
      }
      capturedFramesRef.current = canvases;
    };
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = screenCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    setRoiCoords({ x, y });

    const ctx = canvas.getContext("2d");
    if (!ctx || !screenImage) return;

    const img = new Image();
    img.src = screenImage;
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const boxSize = 60;
      const refSize = 100;

      const xStart = Math.max(0, Math.min(canvas.width - boxSize, x - boxSize / 2));
      const yStart = Math.max(0, Math.min(canvas.height - boxSize, y - boxSize / 2));

      const xStartRef = Math.max(0, Math.min(canvas.width - refSize, x - refSize / 2));
      const yStartRef = Math.max(0, Math.min(canvas.height - refSize, y - refSize / 2));

      ctx.strokeStyle = "#7c3aed";
      ctx.lineWidth = 3;
      ctx.strokeRect(xStart, yStart, boxSize, boxSize);

      if (selectedCondition === "anemia") {
        ctx.strokeStyle = "rgba(124, 58, 237, 0.4)";
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(xStartRef, yStartRef, refSize, refSize);
        ctx.setLineDash([]);
      }

      ctx.fillStyle = "#7c3aed";
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();

      try {
        const imgData = ctx.getImageData(xStart, yStart, boxSize, boxSize);
        const data = imgData.data;
        let rSum = 0, gSum = 0, bSum = 0;
        for (let i = 0; i < data.length; i += 4) {
          rSum += data[i];
          gSum += data[i + 1];
          bSum += data[i + 2];
        }
        const pixelsCount = data.length / 4;
        setAvgColor({
          r: Math.round(rSum / pixelsCount),
          g: Math.round(gSum / pixelsCount),
          b: Math.round(bSum / pixelsCount)
        });
      } catch (err) {
        console.error("ROI selection out of bounds or cross-origin issue:", err);
      }
    };
  };

  const runScreenAnalysis = () => {
    let currentRoiCoords = roiCoords;
    let currentAvgColor = avgColor;

    if (!currentRoiCoords) {
      const centerX = 160;
      const centerY = 160;
      currentRoiCoords = { x: centerX, y: centerY };
      
      const canvas = screenCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const boxSize = 60;
          const xStart = Math.max(0, Math.min(canvas.width - boxSize, centerX - boxSize / 2));
          const yStart = Math.max(0, Math.min(canvas.height - boxSize, centerY - boxSize / 2));
          try {
            const imgData = ctx.getImageData(xStart, yStart, boxSize, boxSize);
            const data = imgData.data;
            let rSum = 0, gSum = 0, bSum = 0;
            for (let i = 0; i < data.length; i += 4) {
              rSum += data[i];
              gSum += data[i + 1];
              bSum += data[i + 2];
            }
            const pixelsCount = data.length / 4;
            const computedAvgColor = {
              r: Math.round(rSum / pixelsCount),
              g: Math.round(gSum / pixelsCount),
              b: Math.round(bSum / pixelsCount)
            };
            currentAvgColor = computedAvgColor;
            setAvgColor(computedAvgColor);
            setRoiCoords(currentRoiCoords);

            ctx.strokeStyle = "#7c3aed";
            ctx.lineWidth = 3;
            ctx.strokeRect(xStart, yStart, boxSize, boxSize);

            if (selectedCondition === "anemia") {
              const refSize = 100;
              const xStartRef = Math.max(0, Math.min(canvas.width - refSize, centerX - refSize / 2));
              const yStartRef = Math.max(0, Math.min(canvas.height - refSize, centerY - refSize / 2));
              ctx.strokeStyle = "rgba(124, 58, 237, 0.4)";
              ctx.lineWidth = 2;
              ctx.setLineDash([4, 4]);
              ctx.strokeRect(xStartRef, yStartRef, refSize, refSize);
              ctx.setLineDash([]);
            }
            ctx.fillStyle = "#7c3aed";
            ctx.beginPath();
            ctx.arc(centerX, centerY, 4, 0, 2 * Math.PI);
            ctx.fill();
          } catch (err) {
            console.error("Default ROI calculation failed:", err);
          }
        }
      }
    }

    if (!currentRoiCoords) {
      setScreenToast({
        message: language === "hi" ? "कृपया पहले क्षेत्र चुनने के लिए छवि पर टैप करें।" : language === "gu" ? "કૃપા કરીને પહેલા વિસ્તાર પસંદ કરવા માટે છબી પર ટેપ કરો." : "Please tap on the image to select a region of interest first.",
        type: "error"
      });
      return;
    }

    setIsAnalyzing(true);

    setTimeout(() => {
      const canvases = (capturedFramesRef.current && capturedFramesRef.current.length === 5)
        ? capturedFramesRef.current
        : [screenCanvasRef.current, screenCanvasRef.current, screenCanvasRef.current, screenCanvasRef.current, screenCanvasRef.current];

      const { x, y } = currentRoiCoords;
      const boxSize = 60;
      const refSize = 100;

      const frameIndices: number[] = [];
      const frameLums: number[] = [];
      const frameOverexposedPercents: number[] = [];

      let roiCountForGate = 0;
      const isStatic = isStaticUploadRef.current;

      for (let i = 0; i < 5; i++) {
        const canvas = canvases[i];
        if (!canvas) continue;
        const ctx = canvas.getContext("2d");
        if (!ctx) continue;

        const xStart = Math.max(0, Math.min(canvas.width - boxSize, x - boxSize / 2));
        const yStart = Math.max(0, Math.min(canvas.height - boxSize, y - boxSize / 2));

        const xStartRef = Math.max(0, Math.min(canvas.width - refSize, x - refSize / 2));
        const yStartRef = Math.max(0, Math.min(canvas.height - refSize, y - refSize / 2));

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        let rRoiSum = 0, gRoiSum = 0, bRoiSum = 0, roiCount = 0;
        let rSkinSum = 0, gSkinSum = 0, bSkinSum = 0, skinCount = 0;
        let overexposedCount = 0;
        let roiLuminanceSum = 0;

        for (let py = yStartRef; py < yStartRef + refSize; py++) {
          for (let px = xStartRef; px < xStartRef + refSize; px++) {
            if (px < 0 || px >= canvas.width || py < 0 || py >= canvas.height) continue;

            const idx = (py * canvas.width + px) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];

            const isInsideInner = (px >= xStart && px < xStart + boxSize && py >= yStart && py < yStart + boxSize);

            if (isInsideInner) {
              rRoiSum += r;
              gRoiSum += g;
              bRoiSum += b;
              roiCount++;

              const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
              roiLuminanceSum += lum;

              if (r >= 250 || g >= 250 || b >= 250) {
                overexposedCount++;
              }
            } else {
              rSkinSum += r;
              gSkinSum += g;
              bSkinSum += b;
              skinCount++;
            }
          }
        }

        if (roiCount === 0) continue;
        roiCountForGate = roiCount;

        const meanLum = roiLuminanceSum / roiCount;
        const overexposedPercent = (overexposedCount / roiCount) * 100;

        frameLums.push(meanLum);
        frameOverexposedPercents.push(overexposedPercent);

        const R_roi = rRoiSum / roiCount;
        const G_roi = gRoiSum / roiCount;
        const B_roi = bRoiSum / roiCount;

        const R_skin = skinCount > 0 ? rSkinSum / skinCount : R_roi;
        const G_skin = skinCount > 0 ? gSkinSum / skinCount : G_roi;
        const B_skin = skinCount > 0 ? bSkinSum / skinCount : B_roi;

        const lab_roi = rgbToLab(R_roi, G_roi, B_roi);
        const lab_skin = rgbToLab(R_skin, G_skin, B_skin);

        let frameIndex = 0;
        if (selectedCondition === "anemia") {
          const diff_a = lab_roi.a - lab_skin.a;
          frameIndex = 25 - 4.5 * diff_a + 0.8 * (lab_roi.L - 60);
        } else if (selectedCondition === "jaundice") {
          frameIndex = (lab_roi.b_star - 8) * 3;
        } else {
          frameIndex = (lab_roi.a - 10) * 4;
        }

        frameIndices.push(Math.max(0, Math.min(100, Math.round(frameIndex))));
      }

      const lowQualityMsg = language === "hi"
        ? "छवि बहुत धुंधली या खराब गुणवत्ता की है। कृपया स्पष्ट रोशनी में पुनः प्रयास करें।"
        : language === "gu"
          ? "ચિત્ર ખૂબ ઝાંખું અથવા ખરાબ ગુણવત્તાનું છે. કૃપા કરીને સ્પષ્ટ પ્રકાશમાં ફરી પ્રયાસ કરો."
          : "Image too dark or low quality. Please try again with clear lighting.";

      if (roiCountForGate < 2500) {
        setScreenToast({
          message: sTrans.errTooSmall || "ROI too small (<2500 px). Move closer.",
          type: "error"
        });
        setIsAnalyzing(false);
        return;
      }

      const median = (arr: number[]) => {
        if (arr.length === 0) return 0;
        const sorted = [...arr].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
      };

      const medianLum = median(frameLums);
      const medianOverexposedPercent = median(frameOverexposedPercents);
      const medianIndex = median(frameIndices);

      if (medianLum < 40 || medianLum > 220) {
        setScreenToast({
          message: lowQualityMsg || sTrans.errLuminance || "Too dark / too bright, move to even lighting.",
          type: "error"
        });
        setIsAnalyzing(false);
        return;
      }

      if (medianOverexposedPercent > 10) {
        setScreenToast({
          message: lowQualityMsg || sTrans.errOverexposed || "Reduce direct light/flash.",
          type: "error"
        });
        setIsAnalyzing(false);
        return;
      }

      const meanIndex = frameIndices.reduce((sum, val) => sum + val, 0) / frameIndices.length;
      const indexVariance = frameIndices.reduce((sum, val) => sum + Math.pow(val - meanIndex, 2), 0) / frameIndices.length;
      const indexStdDev = Math.sqrt(indexVariance);

      if (!isStatic && indexStdDev > 6.0) {
        setScreenToast({
          message: sTrans.errVariance || "Hold steady.",
          type: "error"
        });
        setIsAnalyzing(false);
        return;
      }

      let signalQuality: "good" | "ok" | "poor" = "good";
      if (isStatic) {
        if (medianOverexposedPercent > 6.0) {
          signalQuality = "poor";
        } else if (medianOverexposedPercent > 2.0) {
          signalQuality = "ok";
        }
      } else {
        if (indexStdDev > 4.0 || medianOverexposedPercent > 6.0) {
          signalQuality = "poor";
        } else if (indexStdDev > 2.0 || medianOverexposedPercent > 2.0) {
          signalQuality = "ok";
        }
      }

      let riskBand: "Low" | "Moderate" | "High" = "Low";
      let description = "";

      if (selectedCondition === "anemia") {
        if (medianIndex < 20) {
          riskBand = "Low";
          description = language === "hi"
            ? "कम जोखिम: नाखूनों/त्वचा का रंग स्वस्थ हीमोग्लोबिन स्तर का संकेत देता है।"
            : language === "gu"
              ? "ઓછું જોખમ: નખ/ત્વચાનો રંગ સામાન્ય હિમોગ્લોબિન સ્તર સૂચવે છે."
              : "Low Risk: Color channels show healthy pinkish undertones, suggesting adequate blood perfusion and hemoglobin levels.";
        } else if (medianIndex < 45) {
          riskBand = "Moderate";
          description = language === "hi"
            ? "मध्यम जोखिम: हल्का पीलापन पाया गया है। संतुलित आहार लें और डॉक्टर से परामर्श करें।"
            : language === "gu"
              ? "મધ્યમ જોખમ: સહેજ ફીકાશ જોવા મળી છે. સંતુલિત આહાર લો અને ડોક્ટરની સલાહ લો."
              : "Moderate Risk: Mild paleness detected. This could indicate borderline anemia or low iron. We recommend consulting a clinician.";
        } else {
          riskBand = "High";
          description = language === "hi"
            ? "उच्च जोखिम: अधिक पीलापन पाया गया है। यह गंभीर एनीमिया का संकेत हो सकता है। तुरंत डॉक्टर से संपर्क करें।"
            : language === "gu"
              ? "ઉચ્ચ જોખમ: ગંભીર ફીકાશ જોવા મળી છે. આ ગંભીર એનિમિયા હોઈ શકે છે. તાત્કાલિક ડોક્ટરનો સંપર્ક કરો."
              : "High Risk: Significant paleness detected in the region of interest. This may indicate severe anemia. A clinical blood test (CBC) is strongly advised.";
        }
      } else if (selectedCondition === "jaundice") {
        if (medianIndex < 25) {
          riskBand = "Low";
          description = language === "hi"
            ? "कम जोखिम: कोई पीलापन नहीं मिला। बिलीरुबिन का स्तर सामान्य प्रतीत होता है।"
            : language === "gu"
              ? "ઓછું જોખમ: પીળાશ જોવા મળી નથી. બિલીરૂબીનનું સ્તર સામાન્ય જણાય છે."
              : "Low Risk: Natural coloration detected. No significant yellow tint found in the selected region (sclera/skin).";
        } else if (medianIndex < 55) {
          riskBand = "Moderate";
          description = language === "hi"
            ? "मध्यम जोखिम: हल्का पीलापन पाया गया है। कृपया अपने खान-पान पर ध्यान दें और चिकित्सक से परामर्श करें।"
            : language === "gu"
              ? "મધ્યમ જોખમ: સહેજ પીળાશ જોવા મળી છે. કૃપા કરીને ડોક્ટરની સલાહ લો."
              : "Moderate Risk: Mild yellowish tone detected. This could be early-stage jaundice or bilirubin accumulation. Consider consulting a doctor.";
        } else {
          riskBand = "High";
          description = language === "hi"
            ? "उच्च जोखिम: आँखों/त्वचा में अत्यधिक पीलापन मिला है। यह पीलिया या लिवर रोग का लक्षण हो सकता है।"
            : language === "gu"
              ? "ઉચ્ચ જોખમ: ભારે પીળાશ જોવા મળી છે. આ કમળો અથવા લીવરની ગંભીર બીમારી હોઈ શકે છે."
              : "High Risk: Pronounced yellow tone detected. This strongly suggests elevated bilirubin levels (jaundice), often linked to liver or gallbladder issues. Please seek medical evaluation immediately.";
        }
      } else {
        if (medianIndex < 30) {
          riskBand = "Low";
          description = language === "hi"
            ? "कम जोखिम: सामान्य त्वचा टोन। कोई असाधारण लाली या सूजन के लक्षण नहीं हैं।"
            : language === "gu"
              ? "ઓછું જોખમ: સામાન્ય ત્વચા. કોઈ અસાધારણ લાલાશ કે સોજો જોવા મળ્યો નથી."
              : "Low Risk: Normal pigmentation patterns. No unusual erythema or hyper-redness detected in the selected area.";
        } else if (medianIndex < 60) {
          riskBand = "Moderate";
          description = language === "hi"
            ? "मध्यम जोखिम: त्वचा में लाली/उत्तेजना। यह किसी एलर्जी या हल्के त्वचा रोग का संकेत हो सकता है।"
            : language === "gu"
              ? "મધ્યમ જોખમ: ત્વચામાં લાલાશ/બળતરા. આ એલર્જી અથવા ત્વચાનો સોજો હોઈ છે."
              : "Moderate Risk: Elevated redness index. This could indicate skin irritation, mild rash, dermatitis, or sunburn.";
        } else {
          riskBand = "High";
          description = language === "hi"
            ? "उच्च जोखिम: त्वचा में अत्यधिक लाली या असामान्यता। चिकित्सक या त्वचा रोग विशेषज्ञ को दिखाएं।"
            : language === "gu"
              ? "ઉચ્ચ જોખમ: અતિશય લાલાશ કે અનિયમિતતા. ચર્મરોગ નિષ્ણાત (Dermatologist) નો સંપર્ક કરો."
              : "High Risk: Highly elevated redness or color irregularity. This might indicate severe inflammation, infection, or chronic erythema. Dermatological assessment recommended.";
        }
      }

      setScreenResults({
        condition: selectedCondition,
        riskBand,
        indexVal: medianIndex,
        description,
        signalQuality
      });

      setIsAnalyzing(false);
      setScreenStep("results");
    }, 1200);
  };

  const attachRecordToActivePatient = (record: any, riskBand?: "GREEN" | "YELLOW" | "RED") => {
    if (typeof window === "undefined") return;

    const savedActiveId = safeGetItem("saathi_asha_active_patient_id");
    const currentActiveId = activePatientId || savedActiveId;
    if (!ashaModeActive || !currentActiveId) return;

    const savedPatients = safeGetItem("saathi_asha_patients");
    let currentPatients = patientsList;
    if (savedPatients) {
      try {
        currentPatients = JSON.parse(savedPatients);
      } catch (e) {
        console.error(e);
      }
    }

    const updated = currentPatients.map(p => {
      if (p.id === currentActiveId) {
        const todayStr = new Date().toISOString().split("T")[0];
        return {
          ...p,
          lastScreeningDate: todayStr,
          lastRiskBand: riskBand || p.lastRiskBand || "GREEN",
          records: [record, ...(p.records || [])]
        };
      }
      return p;
    });

    setPatientsList(updated);
    safeSetItem("saathi_asha_patients", JSON.stringify(updated));
    console.log(`Attached record to ASHA patient ${currentActiveId}:`, record);
  };

  const saveScreeningResults = () => {
    if (!screenResults) return;

    const conditionLabel =
      screenResults.condition === "anemia" ? "Anemia Screening" :
      screenResults.condition === "jaundice" ? "Jaundice Screening" :
      "Skin Check Scan";

    const today = new Date();
    const dateStr = today.toISOString().split("T")[0];

    const newRecordItem = {
      id: Date.now(),
      title: `${isSampleImage ? "Sample: " : ""}${conditionLabel} (${screenResults.riskBand} Risk)`,
      date: dateStr,
      category: "Lab Test",
      doctor: "Saathi Camera AI Screening",
      notes: `${isSampleImage ? "[Sample Image Demo] " : ""}Condition: ${screenResults.condition.toUpperCase()} | Index Score: ${screenResults.indexVal}% | Color RGB: (${avgColor?.r}, ${avgColor?.g}, ${avgColor?.b}) | Recommendation: ${screenResults.riskBand === 'Low' ? 'Routine follow-up' : 'Consult a doctor'}`
    };

    const updatedRecords = [newRecordItem, ...recordsList];
    setRecordsList(updatedRecords);
    safeSetItem("saathi_records", JSON.stringify(updatedRecords));

    const risk = screenResults.riskBand === "High" ? "RED" as const : screenResults.riskBand === "Moderate" ? "YELLOW" as const : "GREEN" as const;
    attachRecordToActivePatient(newRecordItem, risk);

    alert(language === "hi" ? "स्क्रीनिंग रिपोर्ट सफलतापूर्वक सहेज ली गई है!" : language === "gu" ? "સ્ક્રીનિંગ રીપોર્ટ સફળતાપૂર્વક સાચવવામાં આવ્યો છે!" : "Screening report saved successfully to health records!");

    setScreenStep("select");
    setScreenImage(null);
    setRoiCoords(null);
    setAvgColor(null);
    setScreenResults(null);
  };

  const handleStartScreening = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsScreeningLoading(true);
    setScreeningResult(null);
    setAssessElapsed(null);

    const startTimeAssess = Date.now();
    try {
      const { allowed } = checkRateLimit("assess", 4, 30000);
      if (!allowed) {
        throw new Error("RateLimitExceeded");
      }

      const response = await fetch("/api/assess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symptoms,
          age,
          temperature,
          language,
          userProfile
        })
      });

      const data = await response.json();
      if (data.success) {
        const elapsed = ((Date.now() - startTimeAssess) / 1000).toFixed(1);
        setAssessElapsed(elapsed);
        setScreeningResult(data.assessment);
      } else {
        setScreeningResult("Unable to generate screening report. Please verify your connection and try again.");
      }
    } catch (error) {
      console.error(error);
      const isRateLimit = error instanceof Error && error.message === "RateLimitExceeded";
      if (isRateLimit) {
        const symptomsList: string[] = [];
        if (symptoms.fever) symptomsList.push(language === "hi" ? "बुखार" : language === "gu" ? "તાવ" : "Fever");
        if (symptoms.cough) symptomsList.push(language === "hi" ? "खांसी" : language === "gu" ? "ખાંસી" : "Cough");
        if (symptoms.breath) symptomsList.push(language === "hi" ? "सांस लेने में तकलीफ" : language === "gu" ? "શ્વાસ લેવામાં તકલીફ" : "Shortness of breath");
        
        const offlineReport = language === "hi"
          ? `[सिस्टम व्यस्त - ऑफ़लाइन स्थानीय आकलन]
आयु: ${age} वर्ष, तापमान: ${temperature}°F
लक्षण: ${symptomsList.join(", ") || "कोई गंभीर लक्षण नहीं"}
जोखिम स्तर: मध्यम। पर्याप्त आराम करें, तरल पदार्थ लें और लक्षणों की निगरानी करें।`
          : language === "gu"
          ? `[સિસ્ટમ વ્યસ્ત - ઑફલાઇન સ્થાનિક આકારણી]
ઉંમર: ${age} વર્ષ, તાપમાન: ${temperature}°F
લક્ષણો: ${symptomsList.join(", ") || "કોઈ ગંભીર લક્ષણો નથી"}
જોખમ સ્તર: મધ્યમ. પૂરતો આરામ કરો અને પુષ્કળ પ્રવાહી લો.`
          : `[System Busy - Offline Fallback Assessment]
Age: ${age} years, Temp: ${temperature}°F
Symptoms: ${symptomsList.join(", ") || "None severe"}
Risk Level: Moderate. Monitor symptoms, stay hydrated, and rest.`;
        setScreeningResult(offlineReport);
      } else {
        setScreeningResult("An error occurred during screening. Please try again.");
      }
    } finally {
      setIsScreeningLoading(false);
    }
  };

  const resetScreening = () => {
    setSymptoms({
      fever: false,
      cough: false,
      fatigue: false,
      soreThroat: false,
      breath: false,
      bodyAche: false,
      lossTaste: false
    });
    setAge(32);
    setTemperature("98.6");
    setScreeningResult(null);
    setAssessElapsed(null);
  };

  useEffect(() => {
    if (screenStep === "roi" && screenCanvasRef.current && canvasContainerRef.current) {
      const canvas = screenCanvasRef.current;
      const container = canvasContainerRef.current;
      const resizeObserver = new ResizeObserver(entries => {
        if (!entries || entries.length === 0) return;
        const { width } = entries[0].contentRect;
        
        // Ensure width is valid before updating canvas size
        if (width > 0) {
          const displayWidth = Math.min(320, width);
          canvas.width = displayWidth;
          canvas.height = displayWidth;
          
          if (screenImage) {
            const ctx = canvas.getContext("2d");
            if (ctx) {
              const img = new Image();
              img.src = screenImage;
              img.onload = () => {
                ctx.drawImage(img, 0, 0, displayWidth, displayWidth);
              };
            }
          }
        }
      });
      resizeObserver.observe(container);
      return () => resizeObserver.disconnect();
    }
  }, [screenStep, screenImage]);

  useEffect(() => {
    if (activeTab !== "screen") {
      stopScreenCameraStream();
    }
  }, [activeTab]);

  const handleSymptomToggle = (symptomKey: keyof typeof symptoms) => {
    setSymptoms(prev => ({
      ...prev,
      [symptomKey]: !prev[symptomKey]
    }));
  };

  return (
    <div className="p-4 space-y-5 animate-fadeIn text-left">
      {/* Toggle between Hero Demo and Questionnaire */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200/40">
        <button
          onClick={() => {
            stopScreenCameraStream();
            setScreenMode("camera");
            setScreenStep("select");
          }}
          className={`flex-1 text-center py-2.5 text-xs font-black rounded-xl transition-all duration-300 ${
            screenMode === "camera"
              ? "bg-white text-violet-700 shadow-soft"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          {sTrans.heroTitle}
        </button>
        <button
          onClick={() => {
            stopScreenCameraStream();
            setScreenMode("symptoms");
          }}
          className={`flex-1 text-center py-2.5 text-xs font-black rounded-xl transition-all duration-300 ${
            screenMode === "symptoms"
              ? "bg-white text-violet-700 shadow-soft"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          {language === "hi" ? "लक्षण प्रश्नावली" : language === "gu" ? "લક્ષણ પ્રશ્નાવલી" : "AI Symptom Checker"}
        </button>
      </div>

      {screenMode === "camera" ? (
        <div className="space-y-4 relative">
          {screenToast && (
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-2 bg-slate-900/95 text-white text-[11px] font-bold px-3 py-2.5 rounded-xl shadow-lg border border-slate-700/50 backdrop-blur animate-scale-up">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
              <span>{screenToast.message}</span>
            </div>
          )}

          {/* 1. SELECT CONDITION STEP */}
          {screenStep === "select" && (
            <div className="glass-card p-5 space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  {sTrans.selectCondition}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: "anemia", label: sTrans.anemia, activeColor: "bg-violet-600 border-violet-600 text-white shadow-soft" },
                    { key: "jaundice", label: sTrans.jaundice, activeColor: "bg-amber-600 border-amber-600 text-white shadow-soft" },
                    { key: "skin", label: sTrans.skin, activeColor: "bg-rose-600 border-rose-600 text-white shadow-soft" },
                  ].map(opt => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setSelectedCondition(opt.key as "anemia" | "jaundice" | "skin")}
                      className={`p-3 rounded-2xl border text-xs font-black text-center flex flex-col items-center justify-center gap-1.5 transition-all duration-300 ${
                        selectedCondition === opt.key
                          ? opt.activeColor + " scale-[1.02]"
                          : "bg-slate-50/50 border-slate-200 text-slate-650 hover:bg-slate-100/80"
                      }`}
                    >
                      <ShieldAlert className={`w-4 h-4 ${selectedCondition === opt.key ? "text-white" : "text-slate-450"}`} />
                      <span className="leading-tight text-[10px]">{opt.label.split(" ")[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Instructions based on selection */}
              <div className="bg-slate-500/[0.03] border border-slate-500/10 rounded-2xl p-4 text-[10px] text-slate-550 leading-relaxed flex gap-3 font-semibold">
                <Info className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
                <span>
                  {selectedCondition === "anemia" && sTrans.guideAnemia}
                  {selectedCondition === "jaundice" && sTrans.guideJaundice}
                  {selectedCondition === "skin" && sTrans.guideSkin}
                </span>
              </div>

              {/* Capture or Upload Options */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={startScreenCamera}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-black text-xs py-3 rounded-full hover:from-violet-750 hover:to-purple-750 shadow-soft active:scale-[0.98] transition-all min-h-[44px]"
                >
                  <Camera className="w-4 h-4" />
                  {sTrans.startCamera}
                </button>
                <label className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs py-3 rounded-full border border-slate-200 cursor-pointer shadow-soft active:scale-[0.98] transition-all text-center min-h-[44px]">
                  <UploadCloud className="w-4 h-4 text-slate-500" />
                  <span>{sTrans.uploadImage}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Try with sample */}
              <div className="pt-4 flex flex-col items-center border-t border-dashed border-slate-200">
                <span className="text-[9px] font-black text-slate-400 mb-2 uppercase tracking-wider">
                  {language === "hi" ? "या नमूना छवि के साथ प्रयास करें" : language === "gu" ? "અથવા નમૂના ચિત્ર સાથે પ્રયાસ કરો" : "Or Try with a Sample"}
                </span>
                <button
                  type="button"
                  onClick={() => handleSampleSelect(selectedCondition)}
                  className="flex items-center justify-center gap-2 bg-purple-500/[0.04] border border-purple-500/10 text-purple-700 hover:bg-purple-500/[0.08] font-black text-[11px] py-2.5 px-4 rounded-2xl shadow-soft active:scale-[0.98] transition-all w-full min-h-[38px]"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
                  <span>
                    {selectedCondition === "anemia" && (language === "hi" ? "नाखून का नमूना (एनीमिया)" : language === "gu" ? "નખનો નમૂનો (એનિમિયા)" : "Fingernail Sample (Anemia)")}
                    {selectedCondition === "jaundice" && (language === "hi" ? "आंख का नमूना (पीलिया)" : language === "gu" ? "આંખનો નમૂનો (કમળો)" : "Eye Sclera Sample (Jaundice)")}
                    {selectedCondition === "skin" && (language === "hi" ? "त्वचा का नमूना (चकत्ते)" : language === "gu" ? "ત્વચાનો નમૂનો (કાળજી)" : "Skin Rash Sample (Skin Check)")}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* 2. CAMERA CAPTURE STEP */}
          {screenStep === "capture" && (
            <div className="bg-[#1E1B4B] border border-slate-800 rounded-3xl overflow-hidden shadow-lg relative flex flex-col items-center p-5 space-y-4 w-full">
              <div className="relative w-full aspect-[4/3] md:max-w-md lg:max-w-lg mx-auto rounded-2xl overflow-hidden bg-black border-2 border-slate-800 shadow-inner">
                <video
                  ref={screenVideoRef}
                  className={`w-full h-full object-cover transform ${facingMode === "user" ? "-scale-x-100" : ""}`}
                  playsInline
                  muted
                />
                
                {/* Floating camera flip button */}
                <button
                  type="button"
                  onClick={toggleCameraFacing}
                  className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-white w-10 h-10 rounded-full shadow-lg border border-white/10 transition-all active:scale-[0.97] z-30 flex items-center justify-center"
                  style={{ minWidth: "40px", minHeight: "40px" }}
                  title="Flip Camera"
                >
                  <SwitchCamera className="w-5 h-5 text-white" />
                </button>

                {/* Guide box overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-[180px] h-[180px] border-2 border-dashed border-purple-500 rounded-2xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]">
                    <div className="absolute -top-1.5 -left-1.5 w-5 h-5 border-t-4 border-l-4 border-purple-500 rounded-tl-lg"></div>
                    <div className="absolute -top-1.5 -right-1.5 w-5 h-5 border-t-4 border-r-4 border-purple-500 rounded-tr-lg"></div>
                    <div className="absolute -bottom-1.5 -left-1.5 w-5 h-5 border-b-4 border-l-4 border-purple-500 rounded-bl-lg"></div>
                    <div className="absolute -bottom-1.5 -right-1.5 w-5 h-5 border-b-4 border-r-4 border-purple-500 rounded-br-lg"></div>
                  </div>
                </div>
              </div>

              <div className="text-center space-y-2 max-w-[280px]">
                <p className="text-[11px] text-slate-300 font-semibold leading-relaxed">
                  {selectedCondition === "anemia" && sTrans.guideAnemia}
                  {selectedCondition === "jaundice" && sTrans.guideJaundice}
                  {selectedCondition === "skin" && sTrans.guideSkin}
                </p>
              </div>

              <div className="flex gap-3 w-full md:max-w-md lg:max-w-lg">
                <button
                  onClick={() => {
                    stopScreenCameraStream();
                    setScreenStep("select");
                  }}
                  className="flex-1 bg-slate-800 text-slate-300 font-black text-xs py-3 rounded-full hover:bg-slate-700 active:scale-[0.97] transition-all min-h-[44px]"
                >
                  {sTrans.cancel}
                </button>
                <button
                  onClick={captureScreenPhoto}
                  disabled={isCapturingMulti}
                  className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-750 hover:to-purple-750 text-white font-black text-xs py-3 rounded-full shadow-soft active:scale-[0.97] transition-all min-h-[44px] flex items-center justify-center border-4 border-violet-100/30"
                >
                  {isCapturingMulti ? "Capturing..." : sTrans.captureBtn}
                </button>
              </div>
            </div>
          )}

          {/* 3. ROI SELECTION STEP */}
          {screenStep === "roi" && (
            <div className="glass-card p-5 space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-violet-600 animate-pulse" />
                  {sTrans.tapROI}
                </h3>
                <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                  {sTrans.tapInstructions}
                </p>
              </div>

              <div ref={canvasContainerRef} className="flex justify-center w-full max-w-[320px] mx-auto">
                <canvas
                  ref={screenCanvasRef}
                  onClick={handleCanvasClick}
                  className="w-full rounded-2xl border border-slate-200 cursor-crosshair shadow-soft aspect-square bg-slate-50/50"
                />
              </div>

              {avgColor && (
                <div className="bg-slate-500/[0.02] border border-slate-200 rounded-2xl p-4 flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-full border border-slate-200 shadow-inner shrink-0"
                    style={{ backgroundColor: `rgb(${avgColor.r}, ${avgColor.g}, ${avgColor.b})` }}
                  />
                  <div className="text-left space-y-0.5">
                    <p className="text-[11px] font-black text-slate-800">Selected Color</p>
                    <p className="text-[10px] font-mono text-slate-500">
                      RGB({avgColor.r}, {avgColor.g}, {avgColor.b})
                    </p>
                    {roiCoords && (
                      <p className="text-[9px] font-semibold text-slate-400">
                        ROI Center: X:{Math.round(roiCoords.x)}, Y:{Math.round(roiCoords.y)}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setScreenStep("select");
                    setScreenImage(null);
                    setRoiCoords(null);
                    setAvgColor(null);
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-650 font-black text-xs py-3 rounded-full active:scale-[0.98] transition-all min-h-[44px]"
                >
                  {sTrans.retake}
                </button>
                <button
                  onClick={runScreenAnalysis}
                  disabled={isAnalyzing}
                  className="bg-gradient-to-r from-violet-600 to-purple-650 text-white font-black text-xs py-3 rounded-full hover:from-violet-750 hover:to-purple-750 shadow-soft active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 min-h-[44px]"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {sTrans.analyzing}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 animate-pulse" />
                      <span>{language === "hi" ? "विश्लेषण करें" : language === "gu" ? "વિશ્લેષણ કરો" : "Analyze"}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* 4. RESULTS STEP */}
          {screenStep === "results" && screenResults && (
            <div className="glass-card p-5 space-y-5 animate-scaleUp">
              <div className="flex justify-between items-center border-b border-slate-100/80 pb-4 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    {sTrans.resultsTitle}
                  </span>
                  <ScreenSpeechPlayer
                    text={(() => {
                      const condition = screenResults.condition;
                      const risk = screenResults.riskBand;
                      const desc = screenResults.description;
                      if (language === "hi") {
                        const condName = condition === "anemia" ? "एनीमिया" : condition === "jaundice" ? "पीलिया" : "त्वचा";
                        const riskName = risk === "Low" ? "कम" : risk === "Moderate" ? "मध्यम" : "उच्च";
                        return `स्क्रीनिंग परिणाम: ${condName} जांच। जोखिम का स्तर ${riskName} जोखिम है। विवरण: ${desc}`;
                      }
                      if (language === "gu") {
                        const condName = condition === "anemia" ? "એનિમિયા" : condition === "jaundice" ? "કમળો" : "ત્વચા";
                        const riskName = risk === "Low" ? "ઓછું" : risk === "Moderate" ? "મધ્યમ" : "ઉચ્ચ";
                        return `તપાસનું પરિણામ: ${condName} તપાસ. જોખમનું સ્તર ${riskName} જોખમ છે. વિગતો: ${desc}`;
                      }
                      return `Screening Result: ${condition} screening. Urgency level: ${risk} Risk. Description: ${desc}`;
                    })()}
                    language={language}
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {isSampleImage && (
                    <span className="text-[9px] px-2.5 py-0.5 rounded-full font-black bg-purple-100 text-purple-800 animate-pulse uppercase tracking-wider">
                      {language === "hi" ? "नमूना" : language === "gu" ? "નમૂનો" : "Sample Image"}
                    </span>
                  )}
                  <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider ${
                    screenResults.riskBand === "Low" ? "bg-emerald-100 text-emerald-800" :
                    screenResults.riskBand === "Moderate" ? "bg-amber-100 text-amber-800" :
                    "bg-rose-100 text-rose-850"
                  }`}>
                    {screenResults.riskBand} Risk
                  </span>
                  <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider flex items-center gap-1 ${
                    screenResults.signalQuality === "good" ? "bg-violet-100 text-violet-850" :
                    screenResults.signalQuality === "ok" ? "bg-blue-100 text-blue-800" :
                    "bg-slate-100 text-slate-805"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      screenResults.signalQuality === "good" ? "bg-violet-600" :
                      screenResults.signalQuality === "ok" ? "bg-blue-500" :
                      "bg-slate-450"
                    }`} />
                    {sTrans.signalQualityLabel || "Signal Quality"}: {
                      screenResults.signalQuality === "good" ? (sTrans.good || "Good") :
                      screenResults.signalQuality === "ok" ? (sTrans.ok || "OK") :
                      (sTrans.poor || "Poor")
                    }
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 bg-violet-50/50 p-3.5 rounded-2xl border border-violet-100">
                  <div
                    className="w-10 h-10 rounded-full border border-slate-200 shadow-sm shrink-0"
                    style={{ backgroundColor: `rgb(${avgColor?.r}, ${avgColor?.g}, ${avgColor?.b})` }}
                  />
                  <div className="text-left space-y-0.5">
                    <p className="text-xs font-black text-slate-700 capitalize">
                      {screenResults.condition} Screening
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      RGB({avgColor?.r}, {avgColor?.g}, {avgColor?.b})
                    </p>
                  </div>
                </div>

                {/* Confidence / Index Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      {sTrans.indexScore}
                    </span>
                    <span className="text-xs font-black text-slate-800">{screenResults.indexVal}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        screenResults.riskBand === "Low" ? "bg-emerald-500" :
                        screenResults.riskBand === "Moderate" ? "bg-amber-500" :
                        "bg-rose-500"
                      }`}
                      style={{ width: `${screenResults.indexVal}%` }}
                    />
                  </div>
                </div>

                {/* Result Explanation */}
                <div className="text-xs text-slate-700 leading-relaxed font-semibold bg-violet-50/30 p-4 rounded-2xl border border-violet-100 text-left">
                  {screenResults.description}
                </div>

                {/* Strong Disclaimer Banner */}
                <div className="bg-rose-500/[0.03] border border-rose-500/15 rounded-2xl p-4 text-[10px] text-rose-800 leading-relaxed space-y-1 text-left font-semibold">
                  <div className="flex items-center gap-1.5 font-black text-rose-900 uppercase tracking-wider mb-1">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{sTrans.disclaimerTitle}</span>
                  </div>
                  <p>{sTrans.disclaimerText}</p>
                  <p className="text-[9px] font-mono text-slate-400 mt-2 font-bold">
                    {"// NOTE: This is a prototype heuristic for demonstration. Production systems would use a trained TensorFlow Lite CNN."}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => {
                    setScreenStep("select");
                    setScreenImage(null);
                    setRoiCoords(null);
                    setAvgColor(null);
                    setScreenResults(null);
                  }}
                  className="bg-white hover:bg-slate-50 text-slate-700 border border-gray-300 font-black text-xs py-3 rounded-full active:scale-[0.98] transition-all min-h-[44px]"
                >
                  {sTrans.retake}
                </button>
                <button
                  onClick={saveScreeningResults}
                  className="bg-gradient-to-r from-violet-600 to-purple-650 hover:from-violet-750 hover:to-purple-750 text-white font-black text-xs py-3 rounded-full shadow-soft active:scale-[0.98] transition-all min-h-[44px]"
                >
                  {sTrans.saveReport}
                </button>
              </div>

              {/* Share Results Button */}
              <button
                type="button"
                onClick={async () => {
                  if (!screenResults) return;
                  const condLabel = screenResults.condition === "anemia" ? "Anemia" : screenResults.condition === "jaundice" ? "Jaundice" : "Skin Rash";
                  const shareText = `Saathi Health AI Screening Report:
- Condition: ${condLabel} Check
- Risk Level: ${screenResults.riskBand} Risk
- Score: ${screenResults.indexVal}%
- Details: ${screenResults.description}

Shared via Saathi.`;
                  await shareHealthReport({
                    title: `${condLabel} Screening`,
                    text: shareText,
                    url: window.location.origin
                  });
                }}
                className="w-full flex items-center justify-center gap-2 bg-blue-500/[0.04] border border-blue-500/10 text-blue-700 hover:bg-blue-500/[0.08] font-black text-xs py-3 rounded-2xl active:scale-[0.98] transition-all min-h-[44px] shadow-soft"
              >
                <Share2 className="w-4 h-4 text-blue-650" />
                <span>{language === "hi" ? "नतीजे साझा करें" : language === "gu" ? "પરિણામો શેર કરો" : "Share Screening Results"}</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Symptoms Checker Panel */
        <>
          {!screeningResult && !isScreeningLoading ? (
            <form onSubmit={handleStartScreening} className="glass-card p-5 space-y-5">
              {/* Symptoms List */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-450 uppercase tracking-wider">
                  {language === "hi" ? "लक्षण चुनें" : language === "gu" ? "લક્ષણો પસંદ કરો" : "Select Symptoms"}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: "fever", label: language === "hi" ? "बुखार" : language === "gu" ? "તાવ" : "Fever" },
                    { key: "cough", label: language === "hi" ? "सूखी खांसी" : language === "gu" ? "સૂકી ઉધરસ" : "Dry Cough" },
                    { key: "fatigue", label: language === "hi" ? "थकान" : language === "gu" ? "થાક" : "Fatigue" },
                    { key: "soreThroat", label: language === "hi" ? "गले में खराश" : language === "gu" ? "ગળામાં દુખાવો" : "Sore Throat" },
                    { key: "breath", label: language === "hi" ? "सांस फूलना" : language === "gu" ? "શ્વાસ ચડવો" : "Shortness of Breath" },
                    { key: "bodyAche", label: language === "hi" ? "बदन दर्द" : language === "gu" ? "શરીરનો દુખાવો" : "Body Ache" },
                    { key: "lossTaste", label: language === "hi" ? "स्वाद/गंध की कमी" : language === "gu" ? "સ્વાદ ગુમાવવો" : "Loss of Taste/Smell" },
                  ].map((symptom) => {
                    const k = symptom.key as keyof typeof symptoms;
                    return (
                      <button
                        key={symptom.key}
                        type="button"
                        onClick={() => handleSymptomToggle(k)}
                        className={`py-3 px-3.5 text-xs font-black rounded-2xl border text-left flex justify-between items-center transition-all duration-300 ${
                          symptoms[k]
                            ? "bg-violet-50 border-violet-500 text-violet-750 shadow-soft scale-[1.02]"
                            : "bg-slate-50/50 border-slate-200 text-slate-650 hover:bg-slate-100/80"
                        }`}
                      >
                        <span className="leading-snug">{symptom.label}</span>
                        {symptoms[k] && <div className="w-2 h-2 rounded-full bg-violet-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Age & Temperature Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-450 uppercase tracking-wider">
                    {language === "hi" ? "आयु" : language === "gu" ? "ઉંમર" : "Age"}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={age}
                    onChange={(e) => setAge(parseInt(e.target.value) || 0)}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-700 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 h-[40px]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-450 uppercase tracking-wider">
                    {language === "hi" ? "तापमान (°F)" : language === "gu" ? "તાપમાન (°F)" : "Temp (°F)"}
                  </label>
                  <input
                    type="text"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-700 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 h-[40px]"
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-violet-600 to-purple-650 text-white font-black text-sm py-3 px-4 rounded-full shadow-soft flex items-center justify-center gap-2 hover:from-violet-750 hover:to-purple-750 transition-all active:scale-[0.98] mt-2 min-h-[44px]"
              >
                <Sparkles className="w-4 h-4 fill-violet-100 animate-pulse" />
                {t.startScreeningBtn}
              </button>
            </form>
          ) : isScreeningLoading ? (
            <div className="glass-card p-10 flex flex-col items-center justify-center gap-4 min-h-[300px]">
              <Loader2 className="w-10 h-10 text-violet-600 animate-spin" />
              <p className="text-sm text-slate-700 font-black animate-pulse">{t.submitting}</p>
              <p className="text-[10px] text-slate-400 text-center max-w-[200px] font-bold">
                Saathi is analyzing safety parameters using Groq LLM screening models.
              </p>
            </div>
          ) : (
            <div className="glass-card p-5 space-y-4 animate-scaleUp text-left">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-wide">
                    {language === "hi" ? "स्क्रीनिंग रिपोर्ट" : language === "gu" ? "સ્ક્રીનીંગ રીપોર્ટ" : "Screening Report"}
                  </span>
                  <ScreenSpeechPlayer text={screeningResult || ""} language={language} matchedNuskhe={matchedNuskhe} triageLevel={triageLevel} />
                </div>
                <span className="bg-violet-100 text-violet-850 text-[10px] px-2.5 py-0.5 rounded-full font-black">
                  AI Screened
                </span>
              </div>

              <div className="text-xs text-slate-700 leading-relaxed font-bold space-y-3 whitespace-pre-line bg-violet-50/30 p-4 rounded-xl border border-violet-100">
                {screeningResult}
              </div>

              {assessElapsed && (
                <div className="text-[11px] text-slate-550 font-bold px-1 flex items-center gap-1">
                  <span>⚡ {assessElapsed}s · Groq</span>
                </div>
              )}

              <div className="bg-amber-500/[0.03] border border-amber-500/10 rounded-2xl p-4 text-[10px] text-amber-900 leading-relaxed flex gap-3 font-semibold">
                <Info className="w-4 h-4 shrink-0 text-amber-500 animate-pulse mt-0.5" />
                <span>
                  {language === "hi"
                    ? "यह रिपोर्ट केवल शैक्षिक उद्देश्यों के लिए है। किसी भी स्वास्थ्य चिंताओं के लिए डॉक्टर से संपर्क करें।"
                    : language === "gu"
                    ? "આ અહેવાલ માત્ર શૈક્ષણિક હેતુઓ માટે છે. કોઈપણ આરોગ્ય સમસ્યાઓ માટે ડૉક્ટરનો સંપર્ક કરો."
                    : "This recommendation is an informational risk pre-screening. For any serious conditions, seek medical advice."
                  }
                </span>
              </div>

              {/* Nani-Dadi Ke Nuskhe Card (Traditional Home Remedies) */}
              {triageLevel !== "RED" && matchedNuskhe.length > 0 && (
                <div className="bg-gradient-to-br from-amber-500/[0.02] to-orange-500/[0.02] border border-amber-500/15 rounded-3xl p-5 space-y-4 shadow-soft text-left">
                  <div className="flex items-center justify-between border-b border-amber-250/20 pb-3 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">👵🏽</span>
                      <div>
                        <h4 className="text-sm font-black text-amber-950 tracking-tight">
                          {t.nuskheTitle}
                        </h4>
                        <p className="text-[10px] text-amber-700 font-semibold">
                          {t.nuskheSubtitle}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 ml-auto">
                      <button
                        type="button"
                        onClick={() => {
                          stopSpeaking();
                          if (matchedNuskhe && matchedNuskhe.length > 0) {
                            const nuskheIntro = language === 'hi'
                              ? 'और ये रहे नानी-दादी के नुस्खे।'
                              : language === 'gu'
                              ? 'અને આ રહ્યા નાની-દાદીના નુસ્ખા।'
                              : 'And here are some traditional home remedies from Nani-Dadi.';

                            const nuskheText = matchedNuskhe
                              .slice(0, 3)
                              .map(n => language === 'hi'
                                ? n.language.hi
                                : language === 'gu'
                                ? n.language.gu
                                : n.remedy)
                              .join('. ');

                            speakText(nuskheIntro + ' ' + nuskheText, language);
                          }
                        }}
                        title="Replay Remedies"
                        className="w-7 h-7 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 flex items-center justify-center transition-all shadow-sm active:scale-95 text-xs shrink-0"
                      >
                        🔊
                      </button>
                      <button
                        type="button"
                        onClick={() => stopSpeaking()}
                        title="Stop Voice"
                        className="w-7 h-7 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 flex items-center justify-center transition-all shadow-sm active:scale-95 text-xs shrink-0"
                      >
                        ⏹️
                      </button>
                      <span className="bg-amber-100 border border-amber-200 text-amber-800 text-[9px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">
                        Traditional Care
                      </span>
                    </div>
                  </div>

                  {/* Yellow caution warning */}
                  {triageLevel === "YELLOW" && (
                    <div className="bg-amber-100/60 border border-amber-300 rounded-2xl p-3.5 text-[10px] text-amber-950 font-black flex gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-605 shrink-0 animate-bounce" />
                      <span>{t.nuskheYellowWarning}</span>
                    </div>
                  )}

                  {/* List of Remedies */}
                  <div className="space-y-3">
                    {matchedNuskhe.map((n) => {
                      const remedyText = language === "hi" ? n.language.hi : language === "gu" ? n.language.gu : n.remedy;
                      return (
                        <div key={n.id} className="bg-white/80 backdrop-blur-sm border border-amber-100 rounded-2xl p-4 space-y-2.5 shadow-sm transition-all hover:shadow-md">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <span className="text-base shrink-0">{n.emoji}</span>
                              <span className="text-xs font-black text-amber-950 capitalize">
                                {n.condition}
                              </span>
                            </div>
                            <span className="text-[9px] font-mono text-amber-600/70 font-black">
                              Nuskha #{n.id}
                            </span>
                          </div>
                          
                          <p className="text-xs text-slate-700 font-bold leading-relaxed">
                            {remedyText}
                          </p>

                          {/* Ingredients pills */}
                          {n.ingredients.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {n.ingredients.map((ing, i) => (
                                <span key={i} className="bg-amber-50/60 hover:bg-amber-100 border border-amber-100/80 text-amber-800 text-[9px] px-2.5 py-0.5 rounded-full font-black tracking-tight transition-all">
                                  🌱 {ing}
                                </span>
                              ))}
                            </div>
                          )}
                          
                          {/* Warning if any */}
                          {n.warning && (
                            <p className="text-[9px] text-amber-900 font-black italic">
                              ⚠️ {n.warning}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Footer closing line / persistent advice disclaimer */}
                  <div className="text-[10px] text-amber-900 leading-relaxed flex gap-2 font-semibold bg-amber-100/30 p-3 rounded-2xl border border-amber-200/20">
                    <Info className="w-4 h-4 shrink-0 text-amber-600 animate-pulse" />
                    <span>{t.nuskheFooter}</span>
                  </div>
                </div>
              )}

              <button
                onClick={resetScreening}
                className="w-full bg-gradient-to-r from-violet-600 to-purple-650 hover:from-violet-750 hover:to-purple-750 text-white font-black text-xs py-3 rounded-full shadow-soft active:scale-[0.98] transition-all min-h-[40px]"
              >
                {language === "hi" ? "नई जांच शुरू करें" : language === "gu" ? "નવી તપાસ શરૂ કરો" : "Start New Assessment"}
              </button>
            </div>
          )}
        </>
      )}

      {/* Collapsible Clinical Disclaimer */}
      <ClinicalDisclaimer />
    </div>
  );
});

ScreenView.displayName = "ScreenView";
