"use client";

import React, { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
  Home,
  ShieldAlert,
  Activity,
  Mic,
  FileText,
  Heart,
  Plus,
  Send,
  Trash2,
  AlertTriangle,
  Video,
  Camera,
  ChevronRight,
  Info,
  Calendar,
  Sparkles,
  User,
  Volume2,
  UploadCloud,
  Users,
  UserPlus,
  MapPin,
  Search,
  X,
  Loader2,
  TrendingUp,
  Lock,
  RefreshCw,
  ArrowLeft,
  Phone,
  PhoneOff,
  Star,
  Share2,
  CheckCircle,
  Copy,
  Download,
  WifiOff,
  Pill,
  Bell
} from "lucide-react";
import { createWorker } from "tesseract.js";

// Recharts dynamically imported or checked for client-side mounting
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

// --- rPPG Signal Processing Utilities ---

// Cooley-Tukey Radix-2 FFT
function fft(re: number[], im: number[]): { re: number[]; im: number[] } {
  const n = re.length;
  if (n <= 1) return { re, im };

  const half = n / 2;
  const reEven = new Array(half);
  const imEven = new Array(half);
  const reOdd = new Array(half);
  const imOdd = new Array(half);

  for (let i = 0; i < half; i++) {
    reEven[i] = re[2 * i];
    imEven[i] = im[2 * i];
    reOdd[i] = re[2 * i + 1];
    imOdd[i] = im[2 * i + 1];
  }

  const even = fft(reEven, imEven);
  const odd = fft(reOdd, imOdd);

  const reResult = new Array(n);
  const imResult = new Array(n);

  for (let k = 0; k < half; k++) {
    const angle = (-2 * Math.PI * k) / n;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    const tRe = odd.re[k] * cos - odd.im[k] * sin;
    const tIm = odd.re[k] * sin + odd.im[k] * cos;

    reResult[k] = even.re[k] + tRe;
    imResult[k] = even.im[k] + tIm;
    reResult[k + half] = even.re[k] - tRe;
    imResult[k + half] = even.im[k] - tIm;
  }

  return { re: reResult, im: imResult };
}

// Linear regression-based detrending
function detrend(y: number[]): number[] {
  const n = y.length;
  if (n <= 1) return y;
  
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += y[i];
    sumXY += i * y[i];
    sumXX += i * i;
  }
  const meanX = sumX / n;
  const meanY = sumY / n;
  
  const slope = (sumXY - n * meanX * meanY) / (sumXX - n * meanX * meanX);
  const intercept = meanY - slope * meanX;
  
  return y.map((val, idx) => val - (slope * idx + intercept));
}

const scannerTranslations = {
  en: {
    startScan: "Start Face Scan (rPPG)",
    holdStill: "Align your face in the oval. Keep still and ensure good lighting.",
    scanning: "Scanning... Keep still",
    remaining: "seconds remaining",
    cancel: "Cancel",
    resultsTitle: "Scan Results",
    save: "Save to Records & History",
    scanAgain: "Scan Again",
    disclaimer: "These vital sign values are estimated using rPPG camera-based algorithms for demonstration and awareness only. This is not a medical-grade diagnostic tool.",
    hr: "Heart Rate",
    spo2: "Blood Oxygen",
    br: "Breathing Rate"
  },
  hi: {
    startScan: "फेस स्कैन शुरू करें (rPPG)",
    holdStill: "अपने चेहरे को अंडाकार घेरे में रखें। स्थिर रहें और अच्छी रोशनी सुनिश्चित करें।",
    scanning: "स्कैनिंग जारी है... स्थिर रहें",
    remaining: "सेकंड शेष",
    cancel: "रद्द करें",
    resultsTitle: "स्कैन परिणाम",
    save: "इतिहास और रिकॉर्ड में सहेजें",
    scanAgain: "पुनः स्कैन करें",
    disclaimer: "ये महत्वपूर्ण संकेत कैमरे पर आधारित rPPG एल्गोरिदम का उपयोग करके अनुमानित हैं। यह कोई मेडिकल-ग्रेड नैदानिक उपकरण नहीं है।",
    hr: "हृदय गति",
    spo2: "रक्त ऑक्सीजन",
    br: "श्वसन दर"
  },
  gu: {
    startScan: "ફેસ સ્કેન શરૂ કરો (rPPG)",
    holdStill: "તમારા ચહેરાને અંડાકાર વર્તુળમાં રાખો. સ્થિર રહો અને સારો પ્રકાશ રાખો.",
    scanning: "સ્કેનિંગ ચાલુ છે... સ્થિર રહો",
    remaining: "સેકન્ડ બાકી",
    cancel: "રદ કરો",
    resultsTitle: "સ્કેન પરિણામો",
    save: "ઇતિહાસ અને રેકોર્ડ્સમાં સાચવો",
    scanAgain: "ફરીથી સ્કેન કરો",
    disclaimer: "આ મહત્વપૂર્ણ સંકેતો કેમેરા આધારિત rPPG અલ્ગોરિધમ્સનો ઉપયોગ કરીને અંદાજવામાં આવે છે. આ તબીબી-ગ્રેડ નિદાન સાધન નથી.",
    hr: "હૃદયના ધબકારા",
    spo2: "બ્લડ ઓક્સિજન",
    br: "શ્વસન દર"
  }
};

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
    tapInstructions: "Tap directly on the region of interest (e.g., your nail bed, eye sclera, or skin patch) on the image above, then click Analyze."
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
    tapInstructions: "ऊपर दी गई छवि पर विश्लेषण के विशिष्ट क्षेत्र (जैसे, नाखून, आँख का सफेद भाग, या त्वचा) पर सीधे टैप करें, फिर विश्लेषण पर क्लिक करें।"
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
    tapInstructions: "ઉપરના ચિત્ર પર વિશ્લેષણ માટેના વિશિષ્ટ ભાગ (નખ, આંખનો સફેદ ભાગ અથવા ચામડી) પર સીધો ટેપ કરો, પછી વિશ્લેષણ પર ક્લિક કરો."
  }
};

interface TriageResult {
  possible_concerns: string[];
  triage: "GREEN" | "YELLOW" | "RED";
  reason: string;
  advice: string;
  see_doctor: boolean;
}

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
  const isGreen = result.triage === "GREEN";

  const labels = {
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

  const tLabels = labels[language as "en" | "hi" | "gu"] || labels.en;

  let bgClass = "bg-emerald-50/70 border-emerald-200 text-emerald-800";
  let badgeClass = "bg-emerald-600 text-white";
  let titleText = tLabels.green;

  if (isRed) {
    bgClass = "bg-rose-50/70 border-rose-200 text-rose-800";
    badgeClass = "bg-red-600 text-white animate-pulse";
    titleText = tLabels.emergency;
  } else if (isYellow) {
    bgClass = "bg-amber-50/70 border-amber-250 text-amber-900";
    badgeClass = "bg-amber-500 text-white";
    titleText = tLabels.yellow;
  }

  return (
    <div className="space-y-4 animate-scaleUp">
      <div className={`p-4 rounded-2xl border ${bgClass} shadow-sm space-y-3`}>
        <div className="flex items-center justify-between">
          <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full tracking-wider ${badgeClass}`}>
            Triage Level: {result.triage}
          </span>
          <span className="text-xs font-bold flex items-center gap-1">
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
            className="flex-1 bg-gradient-to-r from-teal-650 to-emerald-650 text-white font-extrabold text-xs py-3 rounded-xl hover:from-teal-700 hover:to-emerald-700 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
          >
            <Video className="w-4 h-4" />
            <span>{tLabels.connect}</span>
          </button>
        )}
        {onReset && (
          <button
            onClick={onReset}
            className={`py-3 px-4 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 ${
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

export default function MainApp() {
  const { language, setLanguage, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"home" | "screen" | "vitals" | "talk" | "records" | "medicines">("home");
  const [isMounted, setIsMounted] = useState(false);

  // --- SCREENING STATE ---
  const [symptoms, setSymptoms] = useState({
    fever: false,
    cough: false,
    fatigue: false,
    soreThroat: false,
    breath: false,
    bodyAche: false,
    lossTaste: false
  });
  const [age, setAge] = useState<number>(32);
  const [temperature, setTemperature] = useState<string>("98.6");
  const [screeningResult, setScreeningResult] = useState<string | null>(null);
  const [isScreeningLoading, setIsScreeningLoading] = useState(false);

  // --- CAMERA SCREENING STATES ---
  const [screenMode, setScreenMode] = useState<"camera" | "symptoms">("camera");
  const [selectedCondition, setSelectedCondition] = useState<"anemia" | "jaundice" | "skin">("anemia");
  const [screenStep, setScreenStep] = useState<"select" | "capture" | "roi" | "results">("select");
  
  const [screenImage, setScreenImage] = useState<string | null>(null);
  const [roiCoords, setRoiCoords] = useState<{ x: number; y: number } | null>(null);
  const [avgColor, setAvgColor] = useState<{ r: number; g: number; b: number } | null>(null);
  const [screenResults, setScreenResults] = useState<{
    condition: string;
    riskBand: "Low" | "Moderate" | "High";
    indexVal: number;
    description: string;
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const screenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // --- VITALS STATE ---
  const [vitalsHistory, setVitalsHistory] = useState([
    { date: "06-05", heartRate: 72, systolic: 120, diastolic: 80, oxygen: 98 },
    { date: "06-06", heartRate: 75, systolic: 122, diastolic: 81, oxygen: 99 },
    { date: "06-07", heartRate: 68, systolic: 118, diastolic: 79, oxygen: 97 },
    { date: "06-08", heartRate: 70, systolic: 119, diastolic: 80, oxygen: 98 },
    { date: "06-09", heartRate: 74, systolic: 121, diastolic: 82, oxygen: 99 },
    { date: "06-10", heartRate: 71, systolic: 120, diastolic: 80, oxygen: 98 },
  ]);
  const [newVital, setNewVital] = useState({
    heartRate: "",
    systolic: "",
    diastolic: "",
    oxygen: ""
  });
  const [showVitalForm, setShowVitalForm] = useState(false);

  // --- TALK STATE ---
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "assistant"; content: string; timestamp: Date }>>([
    {
      role: "assistant",
      content: "Hello! I am Saathi, your health companion. Ask me anything about your health, or talk to me about symptoms you are experiencing.",
      timestamp: new Date()
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Voice symptom checker & smart triage states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcriptText, setTranscriptText] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null);
  const [isTriaging, setIsTriaging] = useState(false);
  const [talkError, setTalkError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // --- TELEMEDICINE STATES ---
  const [telemedStep, setTelemedStep] = useState<"doctors" | "summary" | "call">("doctors");
  const [selectedDoctor, setSelectedDoctor] = useState<{
    id: number;
    name: string;
    type: "Doctor" | "PHC";
    specialty: string;
    distance: string;
    available: boolean;
    recommendationMatch?: string;
  } | null>(null);
  const [doctorSummary, setDoctorSummary] = useState<{
    chief_complaint: string;
    screening_signals: string;
    triage_level: string;
    suggested_focus: string;
    formatted_summary: string;
  } | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [isCallAudioOnly, setIsCallAudioOnly] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [webRTCStatus, setWebRTCStatus] = useState("Establishing secure WebRTC peer stream...");

  // --- RECORDS STATE ---
  interface HealthRecord {
    id: number;
    title: string;
    date: string;
    category: string;
    doctor: string;
    notes?: string;
  }

  const [recordsList, setRecordsList] = useState<HealthRecord[]>([
    { id: 1, title: "Complete Blood Count (CBC)", date: "2026-05-15", category: "Lab Test", doctor: "Dr. A. K. Sharma", notes: "Hemoglobin: 14.2 g/dL, WBC: 6500 /mcL. All values within normal range." },
    { id: 2, title: "Chest X-Ray Screening", date: "2026-05-20", category: "Imaging", doctor: "Nirma Diagnostic Lab", notes: "Clear lung fields. No active infiltrates or pleural effusion noted." },
    { id: 3, title: "Cardiology Prescription", date: "2026-06-02", category: "Prescription", doctor: "Dr. Ritu Patel", notes: "Rx: Tab. Metoprolol 25mg QD, Tab. Aspirin 75mg QD. Follow-up in 4 weeks." },
  ]);
  const [newRecord, setNewRecord] = useState<{ title: string; category: string; doctor: string; notes?: string }>({ title: "", category: "Lab Test", doctor: "", notes: "" });
  const [showRecordForm, setShowRecordForm] = useState(false);

  // --- ABHA & RECORDS FEATURE STATES ---
  const [abhaNumber, setAbhaNumber] = useState("");
  const [isAbhaLinked, setIsAbhaLinked] = useState(false);
  const [abhaError, setAbhaError] = useState<string | null>(null);
  const [selectedRecordForDetails, setSelectedRecordForDetails] = useState<any | null>(null);
  const [trendMetric, setTrendMetric] = useState<"heartRate" | "bp" | "oxygen" | "anemia">("heartRate");
  const [isExporting, setIsExporting] = useState(false);
  const [exportedSummary, setExportedSummary] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);

  // --- PWA & OFFLINE STATES ---
  const [isOffline, setIsOffline] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  // --- MOCK CALL STATE ---
  const [activeCall, setActiveCall] = useState(false);
  const [callTimer, setCallTimer] = useState(0);

  // --- MEDICINES STATES ---
  interface Medicine {
    id: string;
    name: string;
    dose: string;
    frequency: string;
    duration: string;
    reminderTime: string;
  }
  const [medicinesList, setMedicinesList] = useState<Medicine[]>([]);
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState("");
  const [isParsingPrescription, setIsParsingPrescription] = useState(false);
  const [drugInteractionNote, setDrugInteractionNote] = useState<string | null>(null);
  const [caregiverAlert, setCaregiverAlert] = useState(false);
  const [reminderActive, setReminderActive] = useState(false);
  const [pendingReminderAlert, setPendingReminderAlert] = useState<{ name: string; dose: string; frequency: string } | null>(null);

  // --- ASHA WORKER MODE STATES ---
  interface Patient {
    id: string;
    name: string;
    age: number;
    gender: string;
    village: string;
    lastScreeningDate?: string;
    lastRiskBand?: "GREEN" | "YELLOW" | "RED";
    records: any[];
  }
  const [ashaModeActive, setAshaModeActive] = useState(false);
  const [patientsList, setPatientsList] = useState<Patient[]>([]);
  const [activePatientId, setActivePatientId] = useState<string | null>(null);
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [selectedPatientForProfile, setSelectedPatientForProfile] = useState<Patient | null>(null);
  const [newPatientData, setNewPatientData] = useState({ name: "", age: "", gender: "Male", village: "" });
  const [ashaSearchQuery, setAshaSearchQuery] = useState("");

  // --- CAMERA SCANNER STATE & REFS ---
  const [scanState, setScanState] = useState<"idle" | "permissions" | "scanning" | "completed" | "error">("idle");
  const [secondsLeft, setSecondsLeft] = useState(30);
  const [errorMsg, setErrorMsg] = useState("");
  const [capturedVitals, setCapturedVitals] = useState<{ hr: number; spo2: number; br: number } | null>(null);
  const [finalSignal, setFinalSignal] = useState<number[]>([]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null);

  const signalRRef = useRef<number[]>([]);
  const signalGRef = useRef<number[]>([]);
  const signalBRef = useRef<number[]>([]);
  const timeRef = useRef<number[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    setIsMounted(true);
    
    const savedVitals = localStorage.getItem("saathi_vitals");
    if (savedVitals) {
      try {
        setVitalsHistory(JSON.parse(savedVitals));
      } catch (e) {
        console.error("Failed to parse saved vitals:", e);
      }
    }
    
    const savedRecords = localStorage.getItem("saathi_records");
    if (savedRecords) {
      try {
        setRecordsList(JSON.parse(savedRecords));
      } catch (e) {
        console.error("Failed to parse saved records:", e);
      }
    }

    const savedAbha = localStorage.getItem("saathi_abha_number");
    const savedAbhaLinked = localStorage.getItem("saathi_abha_linked") === "true";
    if (savedAbha) setAbhaNumber(savedAbha);
    if (savedAbhaLinked) setIsAbhaLinked(true);

    const savedMeds = localStorage.getItem("saathi_medicines");
    if (savedMeds) {
      try {
        setMedicinesList(JSON.parse(savedMeds));
      } catch (e) {
        console.error("Failed to parse saved medicines:", e);
      }
    }
    const savedInteractions = localStorage.getItem("saathi_drug_interactions");
    if (savedInteractions) {
      setDrugInteractionNote(savedInteractions);
    }
    const savedCaregiver = localStorage.getItem("saathi_caregiver_alert");
    if (savedCaregiver) {
      setCaregiverAlert(savedCaregiver === "true");
    }
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      setReminderActive(true);
    }

    setIsMounted(true);

    // Register Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js")
        .then((reg) => console.log("Service Worker registered scope:", reg.scope))
        .catch((err) => console.error("Service Worker registration failed:", err));
    }

    // Load ASHA worker settings
    const savedAshaMode = localStorage.getItem("saathi_asha_mode_active") === "true";
    setAshaModeActive(savedAshaMode);
    const savedActiveId = localStorage.getItem("saathi_asha_active_patient_id");
    if (savedActiveId) {
      setActivePatientId(savedActiveId);
    }
    const savedPatients = localStorage.getItem("saathi_asha_patients");
    if (savedPatients) {
      try {
        setPatientsList(JSON.parse(savedPatients));
      } catch (e) {
        console.error("Failed to parse saved patients:", e);
      }
    } else {
      const initialPatients = [
        { id: "p1", name: "Kanta Devi", age: 45, gender: "Female", village: "Rampur", lastScreeningDate: "2026-06-01", lastRiskBand: "RED" as const, records: [{ id: 101, title: "Anemia Risk Check (High)", date: "2026-06-01", category: "Lab Test", doctor: "Saathi Camera AI Screening", notes: "Anemia index: 32% (High Risk)" }] },
        { id: "p2", name: "Ramesh Kumar", age: 52, gender: "Male", village: "Gopalpur", lastScreeningDate: "2026-06-05", lastRiskBand: "YELLOW" as const, records: [{ id: 102, title: "Triage: ⚠️ YELLOW - Persistent cough", date: "2026-06-05", category: "Prescription", doctor: "Saathi AI Triage" }] },
        { id: "p3", name: "Sita Patel", age: 28, gender: "Female", village: "Rampur", lastScreeningDate: "2026-06-09", lastRiskBand: "GREEN" as const, records: [{ id: 103, title: "Camera Vitals Scan (Normal)", date: "2026-06-09", category: "Lab Test", doctor: "Saathi Camera AI Scanner" }] },
      ];
      setPatientsList(initialPatients);
      localStorage.setItem("saathi_asha_patients", JSON.stringify(initialPatients));
    }

    // Monitor Online/Offline Status
    setIsOffline(!navigator.onLine);
    const goOnline = () => setIsOffline(false);
    const goOffline = () => setIsOffline(true);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    // Capture PWA Install Prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install: ${outcome}`);
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  // Scroll chat to bottom
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, isListening]);

  // Format timestamp
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // --- CAMERA SCANNER ACTIONS & CLEANUPS ---
  const stopCameraStream = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const startCameraScan = async () => {
    setScanState("permissions");
    setErrorMsg("");
    setFinalSignal([]);
    setCapturedVitals(null);
    
    signalRRef.current = [];
    signalGRef.current = [];
    signalBRef.current = [];
    timeRef.current = [];
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 480 }, height: { ideal: 360 } }
      });
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      setScanState("scanning");
      setSecondsLeft(30);
      
      const lastTime = Date.now();
      const sampleInterval = 50; // ~20 fps
      
      intervalRef.current = window.setInterval(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;
        
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        
        const w = canvas.width;
        const h = canvas.height;
        
        // Mirror the camera
        ctx.save();
        ctx.translate(w, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, w, h);
        ctx.restore();
        
        // Extract ROI and calculate channels
        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;
        
        let rSum = 0, gSum = 0, bSum = 0, count = 0;
        
        // Forehead ROI: Y: 20%-32%, X: 42%-58%
        const fyS = Math.floor(h * 0.20);
        const fyE = Math.floor(h * 0.32);
        const fxS = Math.floor(w * 0.42);
        const fxE = Math.floor(w * 0.58);
        
        // Cheeks ROI: Y: 48%-58%, Left X: 28%-40%, Right X: 60%-72%
        const cyS = Math.floor(h * 0.48);
        const cyE = Math.floor(h * 0.58);
        const clxS = Math.floor(w * 0.28);
        const clxE = Math.floor(w * 0.40);
        const crxS = Math.floor(w * 0.60);
        const crxE = Math.floor(w * 0.72);
        
        // Draw the ROI overlay boxes on canvas
        ctx.strokeStyle = "rgba(16, 185, 129, 0.85)"; // emerald-500
        ctx.lineWidth = 1.5;
        ctx.strokeRect(fxS, fyS, fxE - fxS, fyE - fyS);
        ctx.strokeRect(clxS, cyS, clxE - clxS, cyE - cyS);
        ctx.strokeRect(crxS, cyS, crxE - crxS, cyE - cyS);
        
        // Add small text labels next to the boxes
        ctx.fillStyle = "rgba(16, 185, 129, 0.9)";
        ctx.font = "9px system-ui, sans-serif";
        ctx.fillText("Forehead", fxS, fyS - 3);
        ctx.fillText("Cheek L", clxS, cyS - 3);
        ctx.fillText("Cheek R", crxS, cyS - 3);
        
        // Sample pixels
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const isForehead = (y >= fyS && y <= fyE && x >= fxS && x <= fxE);
            const isLeftCheek = (y >= cyS && y <= cyE && x >= clxS && x <= clxE);
            const isRightCheek = (y >= cyS && y <= cyE && x >= crxS && x <= crxE);
            
            if (isForehead || isLeftCheek || isRightCheek) {
              const idx = (y * w + x) * 4;
              rSum += data[idx];
              gSum += data[idx + 1];
              bSum += data[idx + 2];
              count++;
            }
          }
        }
        
        if (count > 0) {
          const rAvg = rSum / count;
          const gAvg = gSum / count;
          const bAvg = bSum / count;
          
          signalRRef.current.push(rAvg);
          signalGRef.current.push(gAvg);
          signalBRef.current.push(bAvg);
          timeRef.current.push(Date.now());
          
          // Compute a rolling baseline subtraction for live ECG visualization
          // (drawn directly to canvas below)
        }
        
        // Face guide oval
        ctx.strokeStyle = "rgba(20, 184, 166, 0.95)"; // teal-500
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(w / 2, h / 2, w * 0.26, h * 0.36, 0, 0, 2 * Math.PI);
        ctx.stroke();
        
        // Draw moving scanner line inside the oval bounds
        const elapsed = Date.now() - lastTime;
        const phase = (elapsed / 2000) % 1;
        const scanY = (h / 2) - h * 0.36 + (phase * h * 0.72);
        ctx.strokeStyle = "rgba(6, 182, 212, 0.65)"; // cyan-500
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        
        // Compute width of ellipse at scanY
        const dy = scanY - (h / 2);
        const radiusY = h * 0.36;
        const radiusX = w * 0.26;
        const halfWidth = radiusX * Math.sqrt(Math.max(0, 1 - (dy * dy) / (radiusY * radiusY)));
        ctx.moveTo(w / 2 - halfWidth, scanY);
        ctx.lineTo(w / 2 + halfWidth, scanY);
        ctx.stroke();

        // Draw live signal waveform at the bottom of the canvas
        const signalSlice = signalGRef.current.slice(-100);
        if (signalSlice.length > 1) {
          const recentG = signalSlice.slice(-15);
          const recentMean = recentG.reduce((sum, val) => sum + val, 0) / recentG.length;
          const baselineSubtracted = signalSlice.map(val => val - recentMean);
          
          let sMin = Infinity, sMax = -Infinity;
          for (const val of baselineSubtracted) {
            if (val < sMin) sMin = val;
            if (val > sMax) sMax = val;
          }
          const range = (sMax - sMin) || 1;
          
          ctx.strokeStyle = "rgba(56, 189, 248, 0.85)"; // sky-400
          ctx.lineWidth = 2;
          ctx.beginPath();
          for (let i = 0; i < baselineSubtracted.length; i++) {
            const val = baselineSubtracted[i];
            const px = (i / 100) * w;
            const py = h - 20 - ((val - sMin) / range) * 35;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.stroke();
        }
        
      }, sampleInterval);
      
    } catch (err) {
      console.error(err);
      setErrorMsg("Camera access denied or failed. Please check permissions and try again.");
      setScanState("error");
    }
  };

  const finishCameraScan = () => {
    const R = signalRRef.current;
    const G = signalGRef.current;
    const B = signalBRef.current;
    const times = timeRef.current;
    
    stopCameraStream();
    
    if (G.length < 100) {
      setErrorMsg("Scan finished but not enough frames were captured. Please try again.");
      setScanState("error");
      return;
    }
    
    const n = G.length;
    const startTime = times[0] || 0;
    const endTime = times[n - 1] || 0;
    const durationSec = (endTime - startTime) / 1000 || 30;
    const fs = n / durationSec;
    
    const detrendedG = detrend(G);
    const detrendedR = detrend(R);
    const detrendedB = detrend(B);
    
    const fftLen = Math.pow(2, Math.ceil(Math.log2(n)));
    
    const reG = new Array(fftLen).fill(0);
    const imG = new Array(fftLen).fill(0);
    for (let i = 0; i < n; i++) {
      reG[i] = detrendedG[i];
    }
    
    const fftResult = fft(reG, imG);
    
    const magnitudes = new Array(fftLen / 2);
    for (let i = 0; i < fftLen / 2; i++) {
      magnitudes[i] = Math.sqrt(
        fftResult.re[i] * fftResult.re[i] + fftResult.im[i] * fftResult.im[i]
      );
    }
    
    let maxMagHR = -1;
    let peakBinHR = -1;
    for (let k = 1; k < fftLen / 2; k++) {
      const freq = (k * fs) / fftLen;
      if (freq >= 0.7 && freq <= 4.0) {
        if (magnitudes[k] > maxMagHR) {
          maxMagHR = magnitudes[k];
          peakBinHR = k;
        }
      }
    }
    const computedHR = peakBinHR !== -1 ? Math.round((peakBinHR * fs / fftLen) * 60) : 72;
    const finalHR = Math.min(115, Math.max(58, computedHR));
    
    let maxMagBR = -1;
    let peakBinBR = -1;
    for (let k = 1; k < fftLen / 2; k++) {
      const freq = (k * fs) / fftLen;
      if (freq >= 0.15 && freq <= 0.45) {
        if (magnitudes[k] > maxMagBR) {
          maxMagBR = magnitudes[k];
          peakBinBR = k;
        }
      }
    }
    const computedBR = peakBinBR !== -1 ? Math.round((peakBinBR * fs / fftLen) * 60) : 16;
    const finalBR = Math.min(22, Math.max(12, computedBR));
    
    const meanR = R.reduce((sum, val) => sum + val, 0) / n;
    const meanB = B.reduce((sum, val) => sum + val, 0) / n;
    const stdR = Math.sqrt(detrendedR.reduce((sum, val) => sum + val*val, 0) / n);
    const stdB = Math.sqrt(detrendedB.reduce((sum, val) => sum + val*val, 0) / n);
    
    let spo2 = 98;
    if (meanR > 0 && meanB > 0 && stdB > 0) {
      const ratio = (stdR / meanR) / (stdB / meanB);
      const computedSpO2 = 110 - 22 * ratio;
      spo2 = Math.round(Math.min(99.5, Math.max(95, computedSpO2)));
    }
    
    setCapturedVitals({
      hr: finalHR,
      spo2: spo2,
      br: finalBR
    });
    
    setFinalSignal(detrendedG.slice(50, 250));
    setScanState("completed");
  };

  const cancelCameraScan = () => {
    stopCameraStream();
    setScanState("idle");
    setErrorMsg("");
  };

  const saveScanResults = () => {
    if (!capturedVitals) return;
    
    const today = new Date();
    const dateStr = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    const newEntry = {
      date: dateStr,
      heartRate: capturedVitals.hr,
      systolic: 120,
      diastolic: 80,
      oxygen: capturedVitals.spo2
    };
    
    const updatedHistory = [...vitalsHistory, newEntry];
    setVitalsHistory(updatedHistory);
    localStorage.setItem("saathi_vitals", JSON.stringify(updatedHistory));
    
    const newRecordItem = {
      id: Date.now(),
      title: "rPPG Contactless Vitals Scan",
      date: today.toISOString().split("T")[0],
      category: "Lab Test",
      doctor: "Saathi Camera AI Scanner",
      notes: `Heart Rate: ${capturedVitals.hr} bpm | SpO2: ${capturedVitals.spo2}% | Resp Rate: ${capturedVitals.br} bpm`
    };
    
    const updatedRecords = [newRecordItem, ...recordsList];
    setRecordsList(updatedRecords);
    localStorage.setItem("saathi_records", JSON.stringify(updatedRecords));
    
    // Attach to active ASHA patient if mode is active
    const vitalsRisk = (capturedVitals.spo2 < 95 || capturedVitals.hr > 100 || capturedVitals.hr < 55) ? "YELLOW" as const : "GREEN" as const;
    attachRecordToActivePatient(newRecordItem, vitalsRisk);
    
    setScanState("idle");
    alert(language === "hi" ? "वाइटल्स रिकॉर्ड में सफलतापूर्वक सहेज लिए गए हैं!" : language === "gu" ? "વાઇટલ્સ રેકોર્ડ્સમાં સફળતાપૂર્વક સાચવવામાં આવ્યા છે!" : "Vitals saved successfully to history and records!");
  };

  // --- CAMERA SCREENING ACTIONS ---
  const stopScreenCameraStream = () => {
    if (screenVideoRef.current && screenVideoRef.current.srcObject) {
      const stream = screenVideoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      screenVideoRef.current.srcObject = null;
    }
  };

  const startScreenCamera = async () => {
    setScreenStep("capture");
    setScreenImage(null);
    setRoiCoords(null);
    setAvgColor(null);
    setScreenResults(null);
    
    // Wait briefly for elements to mount
    setTimeout(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 480 }, height: { ideal: 480 } }
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

  const captureScreenPhoto = () => {
    const video = screenVideoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 480;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg");
      setScreenImage(dataUrl);
      stopScreenCameraStream();
      setScreenStep("roi");
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setScreenImage(reader.result as string);
        setScreenStep("roi");
      };
      reader.readAsDataURL(file);
    }
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
      
      const boxSize = 32;
      ctx.strokeStyle = "#14b8a6"; // teal-500
      ctx.lineWidth = 3;
      ctx.strokeRect(x - boxSize / 2, y - boxSize / 2, boxSize, boxSize);
      
      ctx.fillStyle = "#14b8a6";
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
      
      try {
        const imgData = ctx.getImageData(
          Math.max(0, Math.min(canvas.width - boxSize, x - boxSize / 2)),
          Math.max(0, Math.min(canvas.height - boxSize, y - boxSize / 2)),
          boxSize,
          boxSize
        );
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
    if (!avgColor) {
      alert("Please tap on the image to select a region of interest first.");
      return;
    }
    
    setIsAnalyzing(true);
    
    setTimeout(() => {
      const { r, g, b } = avgColor;
      
      let riskBand: "Low" | "Moderate" | "High" = "Low";
      let indexVal = 0;
      let description = "";
      
      // NOTE: This is a prototype heuristic for demonstration. Production systems would use a trained TensorFlow Lite CNN.
      if (selectedCondition === "anemia") {
        const redness = r / (r + g + b + 0.001);
        const palenessIndex = Math.max(0, 1 - (redness / 0.40));
        indexVal = Math.min(100, Math.round(palenessIndex * 100));
        
        if (indexVal < 20) {
          riskBand = "Low";
          description = language === "hi" 
            ? "कम जोखिम: नाखूनों/त्वचा का रंग स्वस्थ हीमोग्लोबिन स्तर का संकेत देता है।" 
            : language === "gu" 
              ? "ઓછું જોખમ: નખ/ત્વચાનો રંગ સામાન્ય હિમોગ્લોબિન સ્તર સૂચવે છે." 
              : "Low Risk: Color channels show healthy pinkish undertones, suggesting adequate blood perfusion and hemoglobin levels.";
        } else if (indexVal < 45) {
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
        const yellownessIndex = Math.max(0, (r + g) / (2 * b + 1) - 0.85);
        indexVal = Math.min(100, Math.round(yellownessIndex * 100));
        
        if (indexVal < 25) {
          riskBand = "Low";
          description = language === "hi" 
            ? "कम जोखिम: कोई पीलापन नहीं मिला। बिलीरुबिन का स्तर सामान्य प्रतीत होता है।" 
            : language === "gu" 
              ? "ઓછું જોખમ: પીળાશ જોવા મળી નથી. બિલીરૂબીનનું સ્તર સામાન્ય જણાય છે." 
              : "Low Risk: Natural coloration detected. No significant yellow tint found in the selected region (sclera/skin).";
        } else if (indexVal < 55) {
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
        const rednessIndex = Math.max(0, (r / (g + b + 1)) - 0.65);
        indexVal = Math.min(100, Math.round(rednessIndex * 100));
        
        if (indexVal < 30) {
          riskBand = "Low";
          description = language === "hi" 
            ? "कम जोखिम: सामान्य त्वचा टोन। कोई असाधारण लाली या सूजन के लक्षण नहीं हैं।" 
            : language === "gu" 
              ? "ઓછું જોખમ: સામાન્ય ત્વચા. કોઈ અસાધારણ લાલાશ કે સોજો જોવા મળ્યો નથી." 
              : "Low Risk: Normal pigmentation patterns. No unusual erythema or hyper-redness detected in the selected area.";
        } else if (indexVal < 60) {
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
        indexVal,
        description
      });
      setIsAnalyzing(false);
      setScreenStep("results");
    }, 1200);
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
      title: `${conditionLabel} (${screenResults.riskBand} Risk)`,
      date: dateStr,
      category: "Lab Test",
      doctor: "Saathi Camera AI Screening",
      notes: `Condition: ${screenResults.condition.toUpperCase()} | Index Score: ${screenResults.indexVal}% | Color RGB: (${avgColor?.r}, ${avgColor?.g}, ${avgColor?.b}) | Recommendation: ${screenResults.riskBand === 'Low' ? 'Routine follow-up' : 'Consult a doctor'}`
    };
    
    const updatedRecords = [newRecordItem, ...recordsList];
    setRecordsList(updatedRecords);
    localStorage.setItem("saathi_records", JSON.stringify(updatedRecords));
    
    // Attach to active ASHA patient if mode is active
    const risk = screenResults.riskBand === "High" ? "RED" as const : screenResults.riskBand === "Medium" ? "YELLOW" as const : "GREEN" as const;
    attachRecordToActivePatient(newRecordItem, risk);
    
    alert(language === "hi" ? "स्क्रीनिंग रिपोर्ट सफलतापूर्वक सहेज ली गई है!" : language === "gu" ? "સ્ક્રીનિંગ રીપોર્ટ સફળતાપૂર્વક સાચવવામાં આવ્યો છે!" : "Screening report saved successfully to health records!");
    
    setScreenStep("select");
    setScreenImage(null);
    setRoiCoords(null);
    setAvgColor(null);
    setScreenResults(null);
  };

  useEffect(() => {
    if (screenStep === "roi" && screenImage && screenCanvasRef.current) {
      const canvas = screenCanvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const img = new Image();
        img.src = screenImage;
        img.onload = () => {
          canvas.width = 320;
          canvas.height = 320;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
      }
    }
  }, [screenStep, screenImage]);

  // Cleanup effects
  useEffect(() => {
    if (activeTab !== "vitals") {
      stopCameraStream();
      setScanState("idle");
    }
    if (activeTab !== "screen") {
      stopScreenCameraStream();
    }
  }, [activeTab]);

  useEffect(() => {
    let timerId: NodeJS.Timeout;
    if (scanState === "scanning") {
      timerId = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerId);
            finishCameraScan();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerId) clearInterval(timerId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanState]);

  // --- SCREENING ACTIONS ---
  const handleSymptomToggle = (symptomKey: keyof typeof symptoms) => {
    setSymptoms(prev => ({ ...prev, [symptomKey]: !prev[symptomKey] }));
  };

  const handleStartScreening = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsScreeningLoading(true);
    setScreeningResult(null);

    try {
      const response = await fetch("/api/assess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symptoms,
          age,
          temperature,
          language
        })
      });

      const data = await response.json();
      if (data.success) {
        setScreeningResult(data.assessment);
      } else {
        setScreeningResult("Unable to generate screening report. Please verify your connection and try again.");
      }
    } catch (error) {
      console.error(error);
      setScreeningResult("An error occurred during screening. Please try again.");
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
  };

  // --- VITALS ACTIONS ---
  const handleAddVital = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVital.heartRate || !newVital.systolic || !newVital.diastolic || !newVital.oxygen) {
      alert("Please fill out all fields.");
      return;
    }

    const today = new Date();
    const dateStr = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const newEntry = {
      date: dateStr,
      heartRate: parseInt(newVital.heartRate),
      systolic: parseInt(newVital.systolic),
      diastolic: parseInt(newVital.diastolic),
      oxygen: parseInt(newVital.oxygen)
    };

    const nextHistory = [...vitalsHistory, newEntry];
    setVitalsHistory(nextHistory);
    localStorage.setItem("saathi_vitals", JSON.stringify(nextHistory));
    setNewVital({ heartRate: "", systolic: "", diastolic: "", oxygen: "" });
    setShowVitalForm(false);
  };

  // --- TALK ACTIONS ---
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() && !isListening) return;

    const userMessageContent = chatInput.trim();
    setChatInput("");

    // Add user message
    const userMsg = { role: "user" as const, content: userMessageContent, timestamp: new Date() };
    setChatMessages(prev => [...prev, userMsg]);
    setIsChatLoading(true);

    try {
      const updatedMessages = [...chatMessages, userMsg];
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
          language
        })
      });

      const data = await response.json();
      if (data.success) {
        setChatMessages(prev => [...prev, {
          role: "assistant",
          content: data.reply,
          timestamp: new Date()
        }]);
      } else {
        setChatMessages(prev => [...prev, {
          role: "assistant",
          content: "Sorry, I am facing connectivity issues. Please try again.",
          timestamp: new Date()
        }]);
      }
    } catch (err) {
      console.error(err);
      setChatMessages(prev => [...prev, {
        role: "assistant",
        content: "An error occurred. Please try again.",
        timestamp: new Date()
      }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // --- VOICE SYMPTOM CHECKER & SMART TRIAGE ACTIONS ---

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
      const formData = new FormData();
      formData.append("file", blob, "recording.webm");
      formData.append("language", language);

      const res = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setTranscriptText(data.text);
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

  const handleTriage = async () => {
    if (!transcriptText.trim()) return;
    setIsTriaging(true);
    setTalkError(null);

    try {
      const res = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: transcriptText,
          language
        })
      });

      const data = await res.json();
      if (data.success && data.triageResult) {
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

        // Attach to active ASHA patient if mode is active
        attachRecordToActivePatient(addedItem, data.triageResult.triage);
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
  };

  // --- RECORDS ACTIONS ---
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
      doctor: newRecord.doctor
    };

    const nextRecords = [addedItem, ...recordsList];
    setRecordsList(nextRecords);
    localStorage.setItem("saathi_records", JSON.stringify(nextRecords));
    setNewRecord({ title: "", category: "Lab Test", doctor: "" });
    setShowRecordForm(false);
  };

  const deleteRecord = (id: number) => {
    const nextRecords = recordsList.filter(item => item.id !== id);
    setRecordsList(nextRecords);
    localStorage.setItem("saathi_records", JSON.stringify(nextRecords));
  };

  // --- TELEMEDICINE MOCK TIMER & WebRTC LOOPBACK ---
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
        name: "Community PHC (Ghatlodia)",
        type: "PHC" as const,
        specialty: "Primary Health, Maternal & Child Care",
        distance: "1.2 km",
        available: true,
        recommendationMatch: "Highly Recommended for Primary Care & Basic Diagnostics"
      },
      {
        id: 2,
        name: "Dr. Sandeep Mehta",
        type: "Doctor" as const,
        specialty: "General Physician & Infectious Diseases",
        distance: "2.4 km",
        available: true,
        recommendationMatch: "Recommended for general wellness & acute fever checks"
      },
      {
        id: 3,
        name: "Dr. Ritu Patel (Ayan Labs)",
        type: "Doctor" as const,
        specialty: "Cardiologist & Hematologist",
        distance: "3.1 km",
        available: true,
        recommendationMatch: "Recommended for blood reports and cardiovascular health"
      },
      {
        id: 4,
        name: "Dr. Priya Shah",
        type: "Doctor" as const,
        specialty: "Dermatologist & Skin Specialist",
        distance: "4.0 km",
        available: true,
        recommendationMatch: "Recommended for skin irritation, rashes, or color changes"
      },
      {
        id: 5,
        name: "Sola Civil Hospital & Emergency Care",
        type: "PHC" as const,
        specialty: "Trauma, Diagnostics & Multi-specialty care",
        distance: "4.8 km",
        available: true,
        recommendationMatch: "Recommended for high urgency or emergency care"
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

      if (isEmergency && doc.name.includes("Civil Hospital")) {
        score = 10;
        reason = "⚠️ Matches RED Emergency Triage: 24/7 Trauma & Emergency Diagnostics";
      } else if (isAnemia && doc.name.includes("Dr. Ritu Patel")) {
        score = 8;
        reason = "🩸 Matches Anemia Screening: Specialist Hematology";
      } else if (isJaundice && doc.name.includes("Mehta")) {
        score = 8;
        reason = "🟡 Matches Jaundice screening: Infectious diseases specialist";
      } else if (isSkin && doc.name.includes("Dr. Priya Shah")) {
        score = 9;
        reason = "🧴 Matches Skin screening: Specialist Dermatologist";
      } else if (isYellow && doc.name.includes("Mehta")) {
        score = 7;
        reason = "🩺 Matches YELLOW Triage: Available for prompt clinical diagnosis";
      } else if (doc.name.includes("PHC")) {
        score = 5;
        reason = "🏠 Nearest primary health center for general triage";
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
          symptoms: transcriptText || chatInput || "Patient requested telemedicine consultation.",
          triage: triageResult?.triage || "GREEN",
          screeningResults: screeningInfo,
          language
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
      setDoctorSummary({
        chief_complaint: transcriptText || "Symptom check",
        screening_signals: screenResults ? `${screenResults.condition} (${screenResults.riskBand})` : "None recorded",
        triage_level: triageResult?.triage || "GREEN",
        suggested_focus: "General practitioner intake consultation.",
        formatted_summary: `### Clinical Intake Summary (Offline Fallback)\n\n**Chief Complaint:** ${transcriptText || "General symptoms"}\n\n**Triage Urgency:** ${triageResult?.triage || "GREEN"}\n\n**Screening Results:** ${screenResults ? `${screenResults.condition} - ${screenResults.riskBand} risk` : "No image screening files uploaded"}\n\n**Suggested Focus:** Direct physician evaluation of reported symptoms.`
      });
    } finally {
      setIsSummaryLoading(false);
    }
  };

  // --- ASHA WORKER HELPER ACTIONS ---
  const attachRecordToActivePatient = (record: any, riskBand?: "GREEN" | "YELLOW" | "RED") => {
    if (typeof window === "undefined") return;
    
    const savedActiveId = localStorage.getItem("saathi_asha_active_patient_id");
    const currentActiveId = activePatientId || savedActiveId;
    if (!ashaModeActive || !currentActiveId) return;

    const savedPatients = localStorage.getItem("saathi_asha_patients");
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
    localStorage.setItem("saathi_asha_patients", JSON.stringify(updated));
    console.log(`Attached record to ASHA patient ${currentActiveId}:`, record);
  };

  const selectActivePatientForASHA = (id: string | null) => {
    setActivePatientId(id);
    if (id) {
      localStorage.setItem("saathi_asha_active_patient_id", id);
    } else {
      localStorage.removeItem("saathi_asha_active_patient_id");
    }
  };

  // --- MEDICINE & REMINDER ACTION HANDLERS ---
  const requestNotificationPermission = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        setReminderActive(true);
        alert("Notifications enabled successfully!");
      } else {
        alert("Notification permission denied. We will use in-app alerts instead.");
      }
    } else {
      alert("Notifications are not supported on this browser.");
    }
  };

  const handlePrescriptionUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsOcrLoading(true);
    setOcrProgress("Initializing Tesseract OCR...");
    try {
      const worker = await createWorker('eng');
      setOcrProgress("Scanning prescription image...");
      const ret = await worker.recognize(file);
      const text = ret.data.text;
      await worker.terminate();

      if (!text || text.trim().length < 5) {
        throw new Error("No readable text could be extracted. Please ensure the photo is clear.");
      }

      setOcrProgress("Analyzing text with Groq AI...");
      await handleParsePrescriptionText(text);

    } catch (err) {
      console.error("Prescription scanning error:", err);
      alert(err instanceof Error ? err.message : "Prescription OCR scan failed. Please check the image and try again.");
      setIsOcrLoading(false);
      setOcrProgress("");
    }
  };

  const handleParsePrescriptionText = async (text: string) => {
    setIsParsingPrescription(true);
    try {
      const response = await fetch("/api/parse-prescription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          language
        })
      });
      const data = await response.json();
      if (data.success) {
        const medsWithId = (data.medicines || []).map((m: any) => ({
          id: Math.random().toString(36).substring(2, 9),
          name: m.name || "Unknown Med",
          dose: m.dose || "As directed",
          frequency: m.frequency || "Once daily",
          duration: m.duration || "Ongoing",
          reminderTime: "08:00"
        }));
        setMedicinesList(medsWithId);
        setDrugInteractionNote(data.interactionNote || "No critical interactions flagged. Confirm safety with your doctor.");
        localStorage.setItem("saathi_medicines", JSON.stringify(medsWithId));
        if (data.interactionNote) {
          localStorage.setItem("saathi_drug_interactions", data.interactionNote);
        }
      } else {
        throw new Error(data.error || "Failed to parse prescription.");
      }
    } catch (error) {
      console.error("Parse error:", error);
      const fallbackMeds = [
        { id: "f1", name: "Paracetamol", dose: "500 mg", frequency: "Twice daily (1-0-1)", duration: "5 days", reminderTime: "08:00" },
        { id: "f2", name: "Amoxicillin", dose: "250 mg", frequency: "Thrice daily (1-1-1)", duration: "7 days", reminderTime: "13:00" }
      ];
      setMedicinesList(fallbackMeds);
      setDrugInteractionNote("Note: AI parser failed or is in offline fallback mode. Please review and adjust the medicine schedules manually.");
      localStorage.setItem("saathi_medicines", JSON.stringify(fallbackMeds));
      localStorage.setItem("saathi_drug_interactions", "Note: AI parser failed or is in offline fallback mode. Please review and adjust the medicine schedules manually.");
    } finally {
      setIsParsingPrescription(false);
      setIsOcrLoading(false);
      setOcrProgress("");
    }
  };

  useEffect(() => {
    if (typeof window === "undefined" || medicinesList.length === 0) return;

    const checkReminders = () => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, "0");
      const mm = String(now.getMinutes()).padStart(2, "0");
      const currentHHMM = `${hh}:${mm}`;

      const lastFired = localStorage.getItem("saathi_last_fired_time");
      if (lastFired === currentHHMM) return;

      const matches = medicinesList.filter(m => m.reminderTime === currentHHMM);
      if (matches.length > 0) {
        localStorage.setItem("saathi_last_fired_time", currentHHMM);
        
        matches.forEach(med => {
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification("Saathi Medicine Reminder", {
              body: `Dose Due: Take ${med.name} (${med.dose}) - ${med.frequency}`,
              icon: "/icon-192.png"
            });
          }

          setPendingReminderAlert({
            name: med.name,
            dose: med.dose,
            frequency: med.frequency
          });
        });
      }
    };

    checkReminders();
    const interval = setInterval(checkReminders, 20000);
    return () => clearInterval(interval);
  }, [medicinesList]);

  // --- ABHA & RECORDS ACTION HANDLERS ---
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
          language
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

  const formatCallTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // --- RENDER VIEWS ---

  // 1. HOME VIEW RENDER
  const renderHomeView = () => (
    <div className="p-4 space-y-5 animate-fadeIn">
      {/* Welcome & Card Greeting */}
      <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl p-5 border border-teal-100 flex items-center justify-between shadow-sm">
        <div className="space-y-1">
          <span className="text-teal-600 font-semibold text-xs tracking-wider uppercase">
            {language === "hi" ? "नमस्ते" : language === "gu" ? "નમસ્તે" : "WELCOME BACK"}
          </span>
          <h2 className="text-xl font-bold text-slate-800">
            {language === "hi" ? "स्वस्थ रहें, सुरक्षित रहें" : language === "gu" ? "સ્વસ્થ રહો, સુરક્ષિત રહો" : "Your Health Companion"}
          </h2>
          <p className="text-xs text-slate-600">
            {language === "hi" ? "आज अपनी स्वास्थ्य जांच शुरू करें।" : language === "gu" ? "આજે તમારી સ્વાસ્થ્ય તપાસ શરૂ કરો." : "Take a quick symptom screening now."}
          </p>
        </div>
        <div className="bg-teal-600 text-white p-3 rounded-full shadow-inner animate-pulse-ring">
          <Heart className="w-6 h-6 fill-white text-teal-600" />
        </div>
      </div>

      {/* Grid of feature cards */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3 px-1 uppercase tracking-wider">
          {language === "hi" ? "प्रमुख सुविधाएं" : language === "gu" ? "મુખ્ય વિશેષતાઓ" : "Key Screenings & Services"}
        </h3>
        <div className="grid grid-cols-1 gap-3.5">
          {/* Card 1: Disease Screening */}
          <button
            onClick={() => setActiveTab("screen")}
            className="w-full text-left bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-teal-100 transition-all flex items-start gap-4 active:scale-[0.99]"
          >
            <div className="bg-teal-50 text-teal-600 p-3 rounded-xl">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-800 text-sm">{t.diseaseScreening}</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-xs text-slate-500 leading-normal">{t.diseaseScreeningDesc}</p>
            </div>
          </button>

          {/* Card 2: Vital Signs */}
          <button
            onClick={() => setActiveTab("vitals")}
            className="w-full text-left bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-teal-100 transition-all flex items-start gap-4 active:scale-[0.99]"
          >
            <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl">
              <Activity className="w-6 h-6" />
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-800 text-sm">{t.vitalSigns}</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-xs text-slate-500 leading-normal">{t.vitalSignsDesc}</p>
            </div>
          </button>

          {/* Card 3: Voice Symptom Checker */}
          <button
            onClick={() => setActiveTab("talk")}
            className="w-full text-left bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-teal-100 transition-all flex items-start gap-4 active:scale-[0.99]"
          >
            <div className="bg-blue-50 text-blue-600 p-3 rounded-xl">
              <Mic className="w-6 h-6" />
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-800 text-sm">{t.voiceSymptomCheck}</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-xs text-slate-500 leading-normal">{t.voiceSymptomCheckDesc}</p>
            </div>
          </button>

          {/* Card 4: Telemedicine */}
          <button
            onClick={() => setActiveCall(true)}
            className="w-full text-left bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-teal-100 transition-all flex items-start gap-4 active:scale-[0.99]"
          >
            <div className="bg-purple-50 text-purple-600 p-3 rounded-xl">
              <Video className="w-6 h-6" />
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-800 text-sm">{t.telemedicine}</span>
                  <span className="bg-teal-100 text-teal-800 text-[9px] px-1.5 py-0.5 rounded-full font-semibold">Demo</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-xs text-slate-500 leading-normal">{t.telemedicineDesc}</p>
            </div>
          </button>

          {/* Card 5: Health Records */}
          <button
            onClick={() => setActiveTab("records")}
            className="w-full text-left bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-teal-100 transition-all flex items-start gap-4 active:scale-[0.99]"
          >
            <div className="bg-orange-50 text-orange-600 p-3 rounded-xl">
              <FileText className="w-6 h-6" />
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-800 text-sm">{t.healthRecords}</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-xs text-slate-500 leading-normal">{t.healthRecordsDesc}</p>
            </div>
          </button>

          {/* Card 6: Medicines & Reminders */}
          <button
            onClick={() => setActiveTab("medicines")}
            className="w-full text-left bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-teal-100 transition-all flex items-start gap-4 active:scale-[0.99]"
          >
            <div className="bg-rose-50 text-rose-600 p-3 rounded-xl">
              <Pill className="w-6 h-6" />
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-800 text-sm">{t.medicinesHeader}</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-xs text-slate-500 leading-normal">{t.medicinesDesc}</p>
            </div>
          </button>
        </div>
      </div>

      {/* Language Selector card */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
        <h4 className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
          {t.selectLanguage} / भाषा बदलें / ભાષા બદલો
        </h4>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setLanguage("en")}
            className={`py-2 px-1 text-xs font-bold rounded-lg border text-center transition-all ${
              language === "en"
                ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
            }`}
          >
            🇺🇸 English
          </button>
          <button
            onClick={() => setLanguage("hi")}
            className={`py-2 px-1 text-xs font-bold rounded-lg border text-center transition-all ${
              language === "hi"
                ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
            }`}
          >
            🇮🇳 हिंदी (Hindi)
          </button>
          <button
            onClick={() => setLanguage("gu")}
            className={`py-2 px-1 text-xs font-bold rounded-lg border text-center transition-all ${
              language === "gu"
                ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
            }`}
          >
            🇮🇳 ગુજરાતી
          </button>
        </div>
      </div>

      {/* Health Tip Card */}
      <div className="bg-teal-50 border border-teal-100/50 rounded-2xl p-4 shadow-inner flex gap-3">
        <div className="text-teal-600">
          <Sparkles className="w-5 h-5 fill-teal-100 text-teal-600" />
        </div>
        <div className="space-y-1">
          <span className="text-xs font-bold text-teal-800">{t.quickHealthTip}</span>
          <p className="text-[11px] text-teal-700/90 leading-relaxed font-medium">
            {t.healthTipText}
          </p>
        </div>
      </div>
    </div>
  );

  // 2. SCREEN VIEW RENDER (DISEASE SCREENING)
  const renderScreenView = () => {
    const sTrans = screenTranslations[language] || screenTranslations.en;
    
    return (
      <div className="p-4 space-y-4 animate-fadeIn">
        {/* Toggle between Hero Demo and Questionnaire */}
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => {
              stopScreenCameraStream();
              setScreenMode("camera");
              setScreenStep("select");
            }}
            className={`flex-1 text-center py-2 text-xs font-bold rounded-lg transition-all ${
              screenMode === "camera"
                ? "bg-white text-teal-700 shadow-sm"
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
            className={`flex-1 text-center py-2 text-xs font-bold rounded-lg transition-all ${
              screenMode === "symptoms"
                ? "bg-white text-teal-700 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {language === "hi" ? "लक्षण प्रश्नावली" : language === "gu" ? "લક્ષણ પ્રશ્નાવલી" : "AI Symptom Checker"}
          </button>
        </div>

        {screenMode === "camera" ? (
          <div className="space-y-4">
            {/* 1. SELECT CONDITION STEP */}
            {screenStep === "select" && (
              <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                    {sTrans.selectCondition}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: "anemia", label: sTrans.anemia, color: "border-teal-200 bg-teal-50/20 text-teal-700" },
                      { key: "jaundice", label: sTrans.jaundice, color: "border-amber-200 bg-amber-50/20 text-amber-700" },
                      { key: "skin", label: sTrans.skin, color: "border-rose-200 bg-rose-50/20 text-rose-700" },
                    ].map(opt => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setSelectedCondition(opt.key as "anemia" | "jaundice" | "skin")}
                        className={`p-2.5 rounded-xl border text-xs font-bold text-center flex flex-col items-center justify-center gap-1.5 transition-all ${
                          selectedCondition === opt.key
                            ? "bg-teal-600 border-teal-600 text-white shadow-md scale-[1.02]"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <ShieldAlert className={`w-4 h-4 ${selectedCondition === opt.key ? "text-white" : "text-slate-400"}`} />
                        <span className="leading-tight">{opt.label.split(" ")[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Instructions based on selection */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs text-slate-600 leading-normal flex gap-2">
                  <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <span>
                    {selectedCondition === "anemia" && sTrans.guideAnemia}
                    {selectedCondition === "jaundice" && sTrans.guideJaundice}
                    {selectedCondition === "skin" && sTrans.guideSkin}
                  </span>
                </div>

                {/* Capture or Upload Options */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={startScreenCamera}
                    className="flex items-center justify-center gap-2 bg-teal-600 text-white font-bold text-xs py-3 rounded-xl hover:bg-teal-700 shadow-sm active:scale-[0.98] transition-all"
                  >
                    <Camera className="w-4 h-4" />
                    {sTrans.startCamera}
                  </button>
                  <label className="flex items-center justify-center gap-2 bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs py-3 rounded-xl hover:bg-slate-200 cursor-pointer shadow-sm active:scale-[0.98] transition-all text-center">
                    <UploadCloud className="w-4 h-4" />
                    <span>{sTrans.uploadImage}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* 2. CAMERA CAPTURE STEP */}
            {screenStep === "capture" && (
              <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-lg relative flex flex-col items-center p-4 space-y-4">
                <div className="relative w-full aspect-square max-w-[320px] rounded-xl overflow-hidden bg-black border-2 border-slate-800">
                  <video
                    ref={screenVideoRef}
                    className="w-full h-full object-cover transform -scale-x-100"
                    playsInline
                    muted
                  />
                  {/* Absolute guide box overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-[180px] h-[180px] border-2 border-dashed border-teal-400 rounded-xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                      <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-teal-400"></div>
                      <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-teal-400"></div>
                      <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-teal-400"></div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-teal-400"></div>
                    </div>
                  </div>
                </div>

                <div className="text-center space-y-2 max-w-[280px]">
                  <p className="text-xs text-slate-300 font-semibold leading-normal">
                    {selectedCondition === "anemia" && sTrans.guideAnemia}
                    {selectedCondition === "jaundice" && sTrans.guideJaundice}
                    {selectedCondition === "skin" && sTrans.guideSkin}
                  </p>
                </div>

                <div className="flex gap-2 w-full max-w-[320px]">
                  <button
                    onClick={() => {
                      stopScreenCameraStream();
                      setScreenStep("select");
                    }}
                    className="flex-1 bg-slate-800 text-slate-300 font-bold text-xs py-2.5 rounded-xl hover:bg-slate-700"
                  >
                    {sTrans.cancel}
                  </button>
                  <button
                    onClick={captureScreenPhoto}
                    className="flex-1 bg-teal-600 text-white font-bold text-xs py-2.5 rounded-xl hover:bg-teal-500 shadow-md active:scale-[0.98] transition-all"
                  >
                    {sTrans.captureBtn}
                  </button>
                </div>
              </div>
            )}

            {/* 3. ROI SELECTION STEP */}
            {screenStep === "roi" && (
              <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-teal-600" />
                    {sTrans.tapROI}
                  </h3>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    {sTrans.tapInstructions}
                  </p>
                </div>

                <div className="flex justify-center">
                  <canvas
                    ref={screenCanvasRef}
                    onClick={handleCanvasClick}
                    className="max-w-full rounded-xl border border-slate-200 cursor-crosshair shadow-sm aspect-square bg-slate-50"
                    style={{ width: "320px", height: "320px" }}
                  />
                </div>

                {avgColor && (
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full border border-slate-300 shadow-inner shrink-0"
                      style={{ backgroundColor: `rgb(${avgColor.r}, ${avgColor.g}, ${avgColor.b})` }}
                    />
                    <div className="text-left space-y-0.5">
                      <p className="text-xs font-bold text-slate-700">Selected Color</p>
                      <p className="text-[10px] font-mono text-slate-500">
                        RGB({avgColor.r}, {avgColor.g}, {avgColor.b})
                      </p>
                      {roiCoords && (
                        <p className="text-[9px] text-slate-400">
                          ROI Center: X:{Math.round(roiCoords.x)}, Y:{Math.round(roiCoords.y)}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setScreenStep("select");
                      setScreenImage(null);
                      setRoiCoords(null);
                      setAvgColor(null);
                    }}
                    className="bg-slate-100 text-slate-600 font-bold text-xs py-2.5 rounded-xl hover:bg-slate-200"
                  >
                    {sTrans.retake}
                  </button>
                  <button
                    onClick={runScreenAnalysis}
                    disabled={!avgColor || isAnalyzing}
                    className="bg-teal-600 text-white font-bold text-xs py-2.5 rounded-xl hover:bg-teal-700 shadow-sm active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {sTrans.analyzing}
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        {language === "hi" ? "विश्लेषण करें" : language === "gu" ? "વિશ્લેષણ કરો" : "Analyze"}
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* 4. RESULTS STEP */}
            {screenStep === "results" && screenResults && (
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4 animate-scaleUp">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                    {sTrans.resultsTitle}
                  </span>
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    screenResults.riskBand === "Low" ? "bg-emerald-100 text-emerald-800" :
                    screenResults.riskBand === "Moderate" ? "bg-amber-100 text-amber-800" :
                    "bg-rose-100 text-rose-800"
                  }`}>
                    {screenResults.riskBand} Risk
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div
                      className="w-10 h-10 rounded-full border border-slate-200 shadow-sm shrink-0"
                      style={{ backgroundColor: `rgb(${avgColor?.r}, ${avgColor?.g}, ${avgColor?.b})` }}
                    />
                    <div className="text-left space-y-0.5">
                      <p className="text-xs font-bold text-slate-600 capitalize">
                        {screenResults.condition} Screening
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        RGB({avgColor?.r}, {avgColor?.g}, {avgColor?.b})
                      </p>
                    </div>
                  </div>

                  {/* Confidence / Index Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        {sTrans.indexScore}
                      </span>
                      <span className="text-xs font-bold text-slate-700">{screenResults.indexVal}%</span>
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
                  <div className="text-xs text-slate-700 leading-relaxed font-semibold bg-slate-50 p-4 rounded-xl border border-slate-100">
                    {screenResults.description}
                  </div>

                  {/* Strong Disclaimer Banner */}
                  <div className="bg-rose-50 border border-rose-100 rounded-xl p-3.5 text-[10px] text-rose-700 leading-normal space-y-1 text-left">
                    <div className="flex items-center gap-1.5 font-bold text-rose-800 uppercase tracking-wider mb-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>{sTrans.disclaimerTitle}</span>
                    </div>
                    <p>{sTrans.disclaimerText}</p>
                    <p className="text-[9px] font-mono text-slate-400 mt-2">
                      {"// NOTE: This is a prototype heuristic for demonstration. Production systems would use a trained TensorFlow Lite CNN."}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={() => {
                      setScreenStep("select");
                      setScreenImage(null);
                      setRoiCoords(null);
                      setAvgColor(null);
                      setScreenResults(null);
                    }}
                    className="bg-slate-100 text-slate-600 font-bold text-xs py-2.5 rounded-xl hover:bg-slate-200"
                  >
                    {sTrans.retake}
                  </button>
                  <button
                    onClick={saveScreeningResults}
                    className="bg-teal-600 text-white font-bold text-xs py-2.5 rounded-xl hover:bg-teal-700 shadow-md transition-all active:scale-[0.98]"
                  >
                    {sTrans.saveReport}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Symptoms Checker Panel (Existing logic) */
          <>
            {!screeningResult && !isScreeningLoading ? (
              <form onSubmit={handleStartScreening} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-4">
                {/* Symptoms List */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
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
                          className={`py-2 px-3 text-xs font-semibold rounded-lg border text-left flex justify-between items-center transition-all ${
                            symptoms[k]
                              ? "bg-teal-50 border-teal-500 text-teal-700 shadow-sm"
                              : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          <span>{symptom.label}</span>
                          {symptoms[k] && <div className="w-2 h-2 rounded-full bg-teal-500" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Age & Temperature Inputs */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase">
                      {language === "hi" ? "आयु" : language === "gu" ? "ઉંમર" : "Age"}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={age}
                      onChange={(e) => setAge(parseInt(e.target.value) || 0)}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 font-semibold text-slate-700 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase">
                      {language === "hi" ? "तापमान (°F)" : language === "gu" ? "તાપમાન (°F)" : "Temp (°F)"}
                    </label>
                    <input
                      type="text"
                      value={temperature}
                      onChange={(e) => setTemperature(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 font-semibold text-slate-700 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold text-sm py-3 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 hover:from-teal-700 hover:to-emerald-700 transition-all active:scale-[0.98] mt-2"
                >
                  <Sparkles className="w-4 h-4 fill-teal-100" />
                  {t.startScreeningBtn}
                </button>
              </form>
            ) : isScreeningLoading ? (
              <div className="bg-white rounded-2xl p-10 border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-4 min-h-[300px]">
                <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
                <p className="text-sm text-slate-600 font-semibold animate-pulse">{t.submitting}</p>
                <p className="text-[10px] text-slate-400 text-center max-w-[200px]">
                  Saathi is analyzing safety parameters using Groq LLM screening models.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4 animate-scaleUp">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                    {language === "hi" ? "स्क्रीनिंग रिपोर्ट" : language === "gu" ? "સ્ક્રીનીંગ રીપોર્ટ" : "Screening Report"}
                  </span>
                  <span className="bg-teal-100 text-teal-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                    AI Screened
                  </span>
                </div>

                <div className="text-xs text-slate-700 leading-relaxed font-medium space-y-3 whitespace-pre-line bg-slate-50 p-4 rounded-xl border border-slate-100">
                  {screeningResult}
                </div>

                <div className="bg-amber-50 border border-amber-200/50 rounded-xl p-3 text-[10px] text-amber-700 leading-normal flex gap-2">
                  <Info className="w-4 h-4 shrink-0 text-amber-500" />
                  <span>
                    {language === "hi" 
                      ? "यह रिपोर्ट केवल शैक्षिक उद्देश्यों के लिए है। किसी भी स्वास्थ्य चिंताओं के लिए डॉक्टर से संपर्क करें।" 
                      : language === "gu" 
                      ? "આ અહેવાલ માત્ર શૈક્ષણિક હેતુઓ માટે છે. કોઈપણ આરોગ્ય સમસ્યાઓ માટે ડૉક્ટરનો સંપર્ક કરો." 
                      : "This recommendation is an informational risk pre-screening. For any serious conditions, seek medical advice."
                    }
                  </span>
                </div>

                <button
                  onClick={resetScreening}
                  className="w-full bg-teal-600 text-white font-bold text-xs py-2.5 rounded-xl hover:bg-teal-700 transition-colors"
                >
                  {language === "hi" ? "नई जांच शुरू करें" : language === "gu" ? "નવી તપાસ શરૂ કરો" : "Start New Assessment"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  // 3. VITALS VIEW RENDER
  const renderVitalsView = () => {
    const sTrans = scannerTranslations[language] || scannerTranslations.en;
    
    if (scanState === "permissions" || scanState === "scanning") {
      return (
        <div className="p-4 space-y-4 animate-fadeIn flex flex-col items-center">
          <div className="text-center space-y-1 w-full">
            <h2 className="text-lg font-bold text-slate-800 flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 text-teal-600 animate-spin" />
              {scanState === "permissions" ? (language === "hi" ? "कैमरा अनुमति ले रहे हैं..." : language === "gu" ? "કેમેરા પરવાનગી મેળવી રહ્યા છીએ..." : "Requesting Camera...") : sTrans.scanning}
            </h2>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              {sTrans.holdStill}
            </p>
          </div>

          <div className="relative w-full max-w-[360px] aspect-[4/3] bg-slate-955 rounded-2xl overflow-hidden shadow-lg border-2 border-teal-500/80">
            {/* Hidden video element used as feed source */}
            <video
              ref={videoRef}
              playsInline
              muted
              className="hidden"
            />
            {/* Canvas drawing face guide, boxes and camera frames */}
            <canvas
              ref={canvasRef}
              width={480}
              height={360}
              className="w-full h-full object-cover"
            />
            
            {/* Timer countdown overlay */}
            {scanState === "scanning" && (
              <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white font-bold text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/20">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span>{secondsLeft}s {language === "hi" ? "शेष" : language === "gu" ? "બાકી" : "left"}</span>
              </div>
            )}

            {/* Hold still indicator */}
            {scanState === "scanning" && (
              <div className="absolute bottom-3 left-3 right-3 bg-black/65 backdrop-blur-sm text-center text-[10px] text-white py-1 px-2 rounded-lg leading-normal">
                {language === "hi" ? "स्थिर रहें और अपने चेहरे को रोशनी में रखें" : language === "gu" ? "સ્થિર રહો અને ચહેરા પર પ્રકાશ રાખો" : "Keep still and stay in bright light"}
              </div>
            )}
          </div>

          {/* Progress bar */}
          {scanState === "scanning" && (
            <div className="w-full max-w-[360px] h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-500 transition-all duration-1000 ease-linear"
                style={{ width: `${((30 - secondsLeft) / 30) * 100}%` }}
              />
            </div>
          )}

          <button
            onClick={cancelCameraScan}
            className="px-6 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            {sTrans.cancel}
          </button>
        </div>
      );
    }

    if (scanState === "completed" && capturedVitals) {
      // Format finalSignal for chart
      const chartData = finalSignal.map((val, idx) => ({
        time: idx,
        signal: val
      }));

      return (
        <div className="p-4 space-y-4 animate-fadeIn">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-teal-600 animate-pulse" />
              {sTrans.resultsTitle}
            </h2>
            <p className="text-xs text-slate-500 leading-normal">
              {language === "hi" ? "कैमरे से मापे गए अनुमानित जैविक मापदंड" : language === "gu" ? "કેમેરા દ્વારા માપેલા અંદાજિત જૈવિક માપદંડો" : "Estimated vital signs from your camera scan"}
            </p>
          </div>

          {/* Results grid */}
          <div className="grid grid-cols-3 gap-2">
            {/* Heart Rate Card */}
            <div className="bg-gradient-to-br from-pink-50 to-white border border-pink-100 p-3 rounded-2xl flex flex-col justify-between items-center text-center shadow-sm">
              <Heart className="w-5 h-5 text-pink-500 fill-pink-100 animate-pulse" />
              <div className="my-2">
                <span className="text-2xl font-black text-pink-700">{capturedVitals.hr}</span>
                <span className="text-[9px] text-pink-500 block font-semibold">BPM</span>
              </div>
              <span className="text-[10px] font-bold text-slate-600">{sTrans.hr}</span>
            </div>

            {/* SpO2 Card */}
            <div className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 p-3 rounded-2xl flex flex-col justify-between items-center text-center shadow-sm">
              <Activity className="w-5 h-5 text-emerald-500" />
              <div className="my-2">
                <span className="text-2xl font-black text-emerald-700">{capturedVitals.spo2}%</span>
                <span className="text-[9px] text-emerald-500 block font-semibold">{language === "hi" ? "अनुमानित" : language === "gu" ? "અંદાજિત" : "Approx."}</span>
              </div>
              <span className="text-[10px] font-bold text-slate-600">{sTrans.spo2}</span>
            </div>

            {/* Breathing Rate Card */}
            <div className="bg-gradient-to-br from-teal-50 to-white border border-teal-100 p-3 rounded-2xl flex flex-col justify-between items-center text-center shadow-sm">
              <div className="w-5 h-5 rounded-full border-2 border-teal-500/30 flex items-center justify-center text-[10px] font-bold text-teal-600">BR</div>
              <div className="my-2">
                <span className="text-2xl font-black text-teal-700">{capturedVitals.br}</span>
                <span className="text-[9px] text-teal-500 block font-semibold">/min</span>
              </div>
              <span className="text-[10px] font-bold text-slate-600">{sTrans.br}</span>
            </div>
          </div>

          {/* Waveform Plot */}
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-2">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider px-1">
              {language === "hi" ? "स्कैन किया गया पल्स वेवफॉर्म" : language === "gu" ? "સ્કેન કરેલ પલ્સ વેવફોર્મ" : "Captured Pulse Waveform (rPPG)"}
            </h3>
            <div className="h-28 w-full text-[9px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPulse" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <Area type="monotone" dataKey="signal" name="Signal" stroke="#0ea5e9" strokeWidth={1.5} fillOpacity={1} fill="url(#colorPulse)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Disclaimer Banner */}
          <div className="bg-amber-50/80 border border-amber-200/60 rounded-xl p-3 flex gap-2 text-amber-800 leading-normal">
            <AlertTriangle className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[10px] font-medium">{sTrans.disclaimer}</p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={saveScanResults}
              className="flex-1 bg-teal-600 text-white font-bold text-xs py-3 rounded-xl hover:bg-teal-700 transition-colors shadow-sm"
            >
              {sTrans.save}
            </button>
            <button
              onClick={startCameraScan}
              className="px-4 py-3 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-50 transition-colors"
            >
              {sTrans.scanAgain}
            </button>
          </div>
        </div>
      );
    }

    if (scanState === "error") {
      return (
        <div className="p-8 space-y-6 text-center animate-fadeIn flex flex-col items-center justify-center min-h-[400px]">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center border border-red-100 text-red-500 shadow-sm">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-base font-bold text-slate-800">
              {language === "hi" ? "स्कैन त्रुटि" : language === "gu" ? "સ્કેન ત્રુટિ" : "Scan Error"}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
              {errorMsg || "An unknown error occurred. Please try again."}
            </p>
          </div>
          <div className="flex gap-2 w-full max-w-xs">
            <button
              onClick={startCameraScan}
              className="flex-1 bg-teal-600 text-white font-bold text-xs py-2.5 rounded-xl hover:bg-teal-700 transition-colors"
            >
              {language === "hi" ? "पुनः प्रयास करें" : language === "gu" ? "ફરી પ્રયાસ કરો" : "Retry"}
            </button>
            <button
              onClick={cancelCameraScan}
              className="flex-1 border border-slate-200 text-slate-600 font-bold text-xs py-2.5 rounded-xl hover:bg-slate-50 transition-colors"
            >
              {language === "hi" ? "वापस जाएं" : language === "gu" ? "પાછા જાઓ" : "Go Back"}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="p-4 space-y-4 animate-fadeIn">
        {/* Header Info */}
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Activity className="w-5 h-5 text-teal-600" />
              {t.vitalsHeader}
            </h2>
            <p className="text-xs text-slate-500 leading-normal">{t.vitalsDesc}</p>
          </div>
          <button
            onClick={() => setShowVitalForm(!showVitalForm)}
            className="bg-teal-50 text-teal-600 p-2 rounded-full border border-teal-100 hover:bg-teal-100 transition-all flex items-center justify-center"
          >
            {showVitalForm ? <X className="w-4.5 h-4.5" /> : <Plus className="w-4.5 h-4.5 font-bold" />}
          </button>
        </div>

        {/* rPPG Scanner Hero Banner */}
        <div className="bg-gradient-to-br from-teal-600 to-emerald-600 rounded-3xl p-5 text-white shadow-md relative overflow-hidden flex flex-col justify-between gap-4">
          {/* Subtle circles background */}
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="absolute -left-8 -top-8 w-24 h-24 bg-white/10 rounded-full blur-lg pointer-events-none" />
          
          <div className="space-y-2 relative z-10">
            <div className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider border border-white/10">
              <Sparkles className="w-3 h-3 fill-white/10" />
              <span>Contactless AI Scan</span>
            </div>
            <h3 className="text-base font-black leading-snug">
              {language === "hi" ? "संपर्क रहित जैविक लक्षण जांच (rPPG)" : language === "gu" ? "સંપર્ક રહિત વાઇટલ્સ સ્કેન (rPPG)" : "Instant Contactless Vitals Scanner"}
            </h3>
            <p className="text-[11px] text-white/80 font-medium leading-relaxed max-w-[85%]">
              {language === "hi" ? "अपने फोन के कैमरे के माध्यम से 30 सेकंड में हार्ट रेट, SpO2 और श्वसन दर मापें।" : language === "gu" ? "તમારા ફોનના કેમેરા વડે માત્ર ૩૦ સેકન્ડમાં ધબકારા, SpO2 અને શ્વસન દર માપો." : "Estimate your Heart Rate, Oxygen Saturation, and Breathing Rate in 30 seconds using only your front camera."}
            </p>
          </div>
          
          <button
            onClick={startCameraScan}
            className="w-full bg-white text-teal-700 font-extrabold text-xs py-3 rounded-2xl hover:bg-slate-50 transition-colors shadow-sm relative z-10 flex items-center justify-center gap-2 group"
          >
            <Video className="w-4 h-4 text-teal-600 transition-transform group-hover:scale-110" />
            <span>{sTrans.startScan}</span>
          </button>
        </div>

        {/* Vital Log Form */}
        {showVitalForm && (
          <form onSubmit={handleAddVital} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-3 animate-scaleUp">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {language === "hi" ? "नया वाइटल लॉग करें" : language === "gu" ? "નવું વાઇટલ લોગ કરો" : "Log New Vital Metric"}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">{t.bloodPressure} (Systolic)</label>
                <input
                  type="number"
                  placeholder="e.g. 120"
                  value={newVital.systolic}
                  onChange={e => setNewVital(prev => ({ ...prev, systolic: e.target.value }))}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50 font-semibold focus:outline-none focus:border-teal-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">{t.bloodPressure} (Diastolic)</label>
                <input
                  type="number"
                  placeholder="e.g. 80"
                  value={newVital.diastolic}
                  onChange={e => setNewVital(prev => ({ ...prev, diastolic: e.target.value }))}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50 font-semibold focus:outline-none focus:border-teal-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">{t.heartRate}</label>
                <input
                  type="number"
                  placeholder="e.g. 72"
                  value={newVital.heartRate}
                  onChange={e => setNewVital(prev => ({ ...prev, heartRate: e.target.value }))}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50 font-semibold focus:outline-none focus:border-teal-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">{t.bloodOxygen}</label>
                <input
                  type="number"
                  placeholder="e.g. 98"
                  value={newVital.oxygen}
                  onChange={e => setNewVital(prev => ({ ...prev, oxygen: e.target.value }))}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50 font-semibold focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-teal-600 text-white font-bold text-xs py-2 rounded-lg hover:bg-teal-700 transition-colors mt-2"
            >
              {t.addVitalBtn}
            </button>
          </form>
        )}

        {/* Vital Charts */}
        {isMounted && (
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-4">
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-teal-600" />
                Blood Pressure Trend (mmHg)
              </span>
              <span className="text-[10px] text-slate-400">Past {vitalsHistory.length} Days</span>
            </div>

            <div className="h-48 w-full text-[10px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={vitalsHistory} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSys" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d9488" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorDia" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#94a3b8" />
                  <YAxis domain={[50, 160]} stroke="#94a3b8" />
                  <Tooltip />
                  <Legend iconType="circle" />
                  <Area type="monotone" dataKey="systolic" name="Systolic BP" stroke="#0d9488" strokeWidth={2} fillOpacity={1} fill="url(#colorSys)" />
                  <Area type="monotone" dataKey="diastolic" name="Diastolic BP" stroke="#06b6d4" strokeWidth={1.5} fillOpacity={1} fill="url(#colorDia)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="border-t border-slate-100 pt-3">
              <div className="flex justify-between items-center px-1 mb-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1">
                  <Heart className="w-4 h-4 text-emerald-600 fill-emerald-100" />
                  Heart Rate & SpO2 Trend
                </span>
              </div>
              <div className="h-44 w-full text-[10px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={vitalsHistory} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorHR" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ec4899" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorO2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" stroke="#94a3b8" />
                    <YAxis domain={[50, 110]} stroke="#94a3b8" />
                    <Tooltip />
                    <Legend iconType="circle" />
                    <Area type="monotone" dataKey="heartRate" name="Heart Rate (BPM)" stroke="#ec4899" strokeWidth={2} fillOpacity={1} fill="url(#colorHR)" />
                    <Area type="monotone" dataKey="oxygen" name="Oxygen (SpO2 %)" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorO2)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* History table */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 px-1">
            {language === "hi" ? "हालिया लॉग इतिहास" : language === "gu" ? "તાજેતરનો લોગ ઇતિહાસ" : "Recent Log History"}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-left">
                  <th className="py-2 font-semibold">Date</th>
                  <th className="py-2 font-semibold">BP (S/D)</th>
                  <th className="py-2 font-semibold">HR (BPM)</th>
                  <th className="py-2 font-semibold">SpO2</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-700 font-medium">
                {[...vitalsHistory].reverse().map((vital, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-2 text-slate-500">{vital.date}</td>
                    <td className="py-2">{vital.systolic}/{vital.diastolic} <span className="text-[10px] text-slate-400">mmHg</span></td>
                    <td className="py-2 text-pink-600">{vital.heartRate} bpm</td>
                    <td className="py-2 text-emerald-600">{vital.oxygen}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // 4. TALK VIEW RENDER (CHAT)
  const renderTalkView = () => {
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

    const l = talkLabels[language as "en" | "hi" | "gu"] || talkLabels.en;

    const formatDuration = (secs: number) => {
      const m = Math.floor(secs / 60);
      const s = secs % 60;
      return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
      <div className="p-4 space-y-4 animate-fadeIn">
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
                className="flex-grow bg-emerald-605 hover:bg-emerald-700 text-white font-extrabold text-xs py-3 rounded-xl shadow-sm transition-all active:scale-95 flex items-center justify-center gap-1.5"
              >
                <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
                <span>{l.stop}</span>
              </button>
              <button
                onClick={cancelRecording}
                className="px-5 border border-slate-200 text-slate-500 font-extrabold text-xs rounded-xl hover:bg-slate-55 transition-colors"
              >
                {l.cancel}
              </button>
            </div>
          </div>
        )}

        {!triageResult && !isTriaging && !isTranscribing && !isRecording && transcriptText && (
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
                className="flex-grow bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs py-3 rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
              >
                <span>{l.btnAnalyze}</span>
                <Sparkles className="w-4 h-4" />
              </button>
              <button
                onClick={resetTriageFlow}
                className="px-4 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-50 transition-colors"
              >
                {l.btnRecordAgain}
              </button>
            </div>
          </div>
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
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs py-2.5 rounded-xl transition-all disabled:opacity-50 active:scale-95 flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{l.btnSubmitText}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // 5. RECORDS VIEW RENDER
  const renderRecordsView = () => {
    // Render Trend Chart inside the container
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
              { date: "06-05", value: 78 },
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
      <div className="p-4 space-y-4 animate-fadeIn overflow-y-auto flex-1 h-full pb-24">
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
                <span className="text-blue-100 font-bold">Holder: Vishal Bhanopiya</span>
                <button 
                  onClick={handleUnlinkAbha}
                  className="text-red-200 hover:text-red-100 underline font-extrabold transition-colors active:scale-95"
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
                    className="w-full text-xs p-2.5 rounded-xl border border-white/20 bg-white/10 font-bold placeholder-white/40 text-white focus:outline-none focus:border-white focus:bg-white/15 tracking-wider"
                  />
                  {abhaError && (
                    <span className="absolute left-1 bottom-[-14px] text-[8px] text-red-300 font-bold">{abhaError}</span>
                  )}
                </div>
                <button
                  onClick={handleLinkAbha}
                  className="bg-white text-blue-700 font-extrabold text-xs px-4 rounded-xl hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
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
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 font-semibold focus:outline-none focus:border-teal-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Category</label>
                  <select
                    value={newRecord.category}
                    onChange={e => setNewRecord(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 font-semibold focus:outline-none focus:border-teal-500"
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
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 font-semibold focus:outline-none focus:border-teal-500"
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
              className="w-full bg-teal-600 text-white font-bold text-xs py-2.5 rounded-xl hover:bg-teal-700 transition-colors shadow-sm"
            >
              {t.uploadRecordBtn}
            </button>
          </form>
        )}

        {/* TRENDS CHART DASHBOARD */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-teal-650" />
              {language === "hi" ? "वाइटल्स एवं स्वास्थ्य रुझान" : language === "gu" ? "વાઇટલ્સ અને સ્વાસ્થ્ય વલણો" : "Vitals & Health Trends"}
            </h3>
            <select
              value={trendMetric}
              onChange={e => setTrendMetric(e.target.value as any)}
              className="text-[10px] font-bold text-slate-650 bg-slate-50 px-2 py-1 rounded-lg border border-slate-250 focus:outline-none cursor-pointer focus:border-teal-500"
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
                          : "bg-teal-50 text-teal-700 border border-teal-105"
                      }`}>
                        {item.category}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-450 font-bold flex items-center gap-2.5">
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
                    className="text-slate-300 hover:text-red-500 p-1.5 transition-colors self-center active:scale-90"
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
            <Lock className="w-4 h-4 text-teal-650" />
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

              <div className="space-y-2.5 text-xs text-slate-650 border-t border-slate-100 pt-3">
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
                  <div className="bg-slate-50 border border-slate-200/60 p-3 rounded-2xl text-[10px] font-medium leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap">
                    {selectedRecordForDetails.notes || "No additional records notes entered."}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedRecordForDetails(null)}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs py-3 rounded-xl transition-all shadow-sm active:scale-95"
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
                  <span className="text-[9px] uppercase tracking-wider font-extrabold text-blue-650 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
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
                  <p className="text-[10px] font-extrabold text-slate-655 text-center max-w-[200px] uppercase tracking-wider animate-pulse">
                    Compiling clinical database summary via Groq Llama 3.3...
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto bg-slate-50 border border-slate-200/60 p-3.5 rounded-2xl text-[10px] font-medium leading-relaxed prose prose-slate max-h-72">
                    {exportedSummary ? (
                      <div className="space-y-2 whitespace-pre-wrap font-sans">
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
                      className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-95"
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
                      className="bg-teal-650 hover:bg-teal-700 text-white font-extrabold text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
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
  };

  const renderAshaPortalView = () => {
    const totalPatients = patientsList.length;
    const redPatients = patientsList.filter(p => p.lastRiskBand === "RED");
    const yellowPatients = patientsList.filter(p => p.lastRiskBand === "YELLOW");
    const greenPatients = patientsList.filter(p => p.lastRiskBand === "GREEN");

    const redCount = redPatients.length;
    const yellowCount = yellowPatients.length;
    const greenCount = greenPatients.length;

    const redPct = totalPatients > 0 ? (redCount / totalPatients) * 100 : 0;
    const yellowPct = totalPatients > 0 ? (yellowCount / totalPatients) * 100 : 0;
    const greenPct = totalPatients > 0 ? (greenCount / totalPatients) * 100 : 0;

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
      localStorage.setItem("saathi_asha_patients", JSON.stringify(updated));
      setShowAddPatientModal(false);
      setNewPatientData({ name: "", age: "", gender: "Male", village: "" });
    };

    const handleDeletePatient = (id: string) => {
      if (confirm("Are you sure you want to delete this patient profile?")) {
        const updated = patientsList.filter(p => p.id !== id);
        setPatientsList(updated);
        localStorage.setItem("saathi_asha_patients", JSON.stringify(updated));
        if (activePatientId === id) {
          selectActivePatientForASHA(null);
        }
      }
    };

    return (
      <div className="p-4 space-y-6 animate-fadeIn">
        {/* Portal Header */}
        <div className="bg-gradient-to-r from-teal-700 to-emerald-700 rounded-3xl p-5 text-white shadow-lg relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-white/10 rounded-full blur-xl" />
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="bg-emerald-500/30 text-emerald-300 font-extrabold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-emerald-400/20">
                Health Worker Portal
              </span>
              <h2 className="text-xl font-black tracking-tight mt-1">
                {language === "hi" ? "आशा कार्यकर्ता पोर्टल" : language === "gu" ? "આશા કાર્યકર્તા પોર્ટલ" : "ASHA Worker Portal"}
              </h2>
              <p className="text-xs text-teal-100 max-w-xs leading-normal">
                {language === "hi" 
                  ? "मरीजों की स्क्रीनिंग प्रबंधित करें, जोखिम स्तर ट्रैक करें और रेफरल देखें।" 
                  : language === "gu" 
                  ? "દર્દીઓની સ્ક્રિનિંગ મેનેજ કરો, જોખમનું સ્તર ટ્રેક કરો અને રેફરલ જુઓ." 
                  : "Manage patient screenings, track community risk thresholds, and check referral flags."}
              </p>
            </div>
            <button
              onClick={() => {
                setAshaModeActive(false);
                localStorage.setItem("saathi_asha_mode_active", "false");
                selectActivePatientForASHA(null);
              }}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 text-[10px] font-bold px-3 py-1.5 rounded-xl transition-all"
            >
              Exit Mode
            </button>
          </div>
        </div>

        {/* Dashboard Analytics Card */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">
              {language === "hi" ? "समुदाय स्वास्थ्य डैशबोर्ड" : language === "gu" ? "સમુદાય આરોગ્ય ડેશબોર્ડ" : "Community Health Dashboard"}
            </h3>
            <span className="text-[10px] text-slate-500 font-bold bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100">
              Total Screened: <strong className="text-slate-800">{totalPatients}</strong>
            </span>
          </div>

          {/* SVG proportion chart or multi-color bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
              <span>Risk Proportion</span>
              <span>{greenCount} Green | {yellowCount} Yellow | {redCount} Red</span>
            </div>
            
            {/* Visual Bar */}
            <div className="w-full h-5 bg-slate-100 rounded-full overflow-hidden flex shadow-inner border border-slate-200/50">
              {totalPatients === 0 ? (
                <div className="w-full h-full bg-slate-150 flex items-center justify-center text-[10px] text-slate-400 font-bold">
                  No patient data available
                </div>
              ) : (
                <>
                  {greenPct > 0 && (
                    <div style={{ width: `${greenPct}%` }} className="bg-emerald-500 h-full transition-all flex items-center justify-center text-[9px] text-white font-extrabold" title={`Green: ${greenCount}`}>
                      {greenPct > 15 && `${greenCount}`}
                    </div>
                  )}
                  {yellowPct > 0 && (
                    <div style={{ width: `${yellowPct}%` }} className="bg-amber-500 h-full transition-all flex items-center justify-center text-[9px] text-white font-extrabold" title={`Yellow: ${yellowCount}`}>
                      {yellowPct > 15 && `${yellowCount}`}
                    </div>
                  )}
                  {redPct > 0 && (
                    <div style={{ width: `${redPct}%` }} className="bg-rose-500 h-full transition-all flex items-center justify-center text-[9px] text-white font-extrabold" title={`Red: ${redCount}`}>
                      {redPct > 15 && `${redCount}`}
                    </div>
                  )}
                </>
              )}
            </div>
            
            {/* Legend grid */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <div className="bg-emerald-50 rounded-2xl p-2.5 border border-emerald-100/50 text-center space-y-0.5">
                <span className="text-[9px] font-extrabold text-emerald-600 block uppercase">Low Risk</span>
                <span className="text-base font-black text-emerald-700">{greenCount}</span>
              </div>
              <div className="bg-amber-50 rounded-2xl p-2.5 border border-amber-100/50 text-center space-y-0.5">
                <span className="text-[9px] font-extrabold text-amber-600 block uppercase">Medium Risk</span>
                <span className="text-base font-black text-amber-700">{yellowCount}</span>
              </div>
              <div className="bg-rose-50 rounded-2xl p-2.5 border border-rose-100/50 text-center space-y-0.5">
                <span className="text-[9px] font-extrabold text-rose-600 block uppercase">High Risk</span>
                <span className="text-base font-black text-rose-700">{redCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* High Risk Follow Up List */}
        {redCount > 0 && (
          <div className="bg-rose-50 border border-rose-100 rounded-3xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
              <h4 className="text-xs font-black uppercase tracking-wider">
                {language === "hi" ? "उच्च जोखिम वाले मरीज़ (तुरंत फॉलो-अप)" : language === "gu" ? "ઉચ્ચ જોખમ ધરાવતા દર્દીઓ (ત્વરિત ફોલો-અપ)" : "Urgent Follow-up Required"}
              </h4>
            </div>
            <p className="text-[10px] text-slate-500 leading-normal">
              {language === "hi" 
                ? "निम्नलिखित मरीजों को गंभीर रिस्क फ्लैग मिला है। कृपया इनसे संपर्क करें या टेलीमेडिसिन सलाह शुरू करें।" 
                : language === "gu" 
                ? "નીચેના દર્દીઓને ગંભીર જોખમ ફ્લેગ મળ્યો છે. કૃપા કરીને તેમનો સંપર્ક કરો અથવા ટેલિમેડિસિન પરામર્શ શરૂ કરો." 
                : "The following patients have triggered red screening flags and require immediate doctor consultations."}
            </p>
            <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
              {redPatients.map(p => (
                <div key={p.id} className="bg-white p-3 rounded-2xl border border-rose-100 shadow-sm flex items-center justify-between">
                  <div className="space-y-0.5">
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
                      className="bg-rose-600 hover:bg-rose-700 text-white text-[9px] font-bold px-2.5 py-1.5 rounded-xl shadow-sm"
                    >
                      Consult Now
                    </button>
                    <button
                      onClick={() => setSelectedPatientForProfile(p)}
                      className="border border-slate-200 text-slate-600 text-[9px] font-bold px-2.5 py-1.5 rounded-xl hover:bg-slate-50"
                    >
                      History
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
              {language === "hi" ? "मरीज़ निर्देशिका" : language === "gu" ? "દર્દી નિર્દેશિકા" : "Patient Directory"}
            </h3>
            <button
              onClick={() => setShowAddPatientModal(true)}
              className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-extrabold text-[10px] py-2 px-3 rounded-xl shadow-md hover:from-teal-700 hover:to-emerald-700 transition-all flex items-center gap-1"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Patient</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder={language === "hi" ? "मरीज़ का नाम या गाँव खोजें..." : language === "gu" ? "દર્દીનું નામ અથવા ગામ શોધો..." : "Search by name or village..."}
              value={ashaSearchQuery}
              onChange={(e) => setAshaSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-slate-100 rounded-2xl bg-slate-50 focus:outline-none focus:border-teal-500 font-medium text-xs text-slate-800"
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
                    className={`p-4 rounded-2xl border transition-all space-y-3 ${
                      isActive 
                        ? "border-teal-400 bg-teal-50/30 ring-1 ring-teal-400/50 shadow-md animate-pulseCard" 
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
                              Active Patient
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
                          Unscreened
                        </span>
                      )}
                    </div>

                    {/* Meta Info */}
                    {p.lastScreeningDate && (
                      <div className="text-[9px] text-slate-500 font-bold flex justify-between bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <span>Last check: {p.lastScreeningDate}</span>
                        <span>Attached records: {p.records?.length || 0}</span>
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
                        className={`text-[9px] font-extrabold py-2 px-3 rounded-xl transition-all shadow-sm ${
                          isActive 
                            ? "bg-slate-800 text-white hover:bg-slate-900" 
                            : "bg-teal-600 text-white hover:bg-teal-700"
                        }`}
                      >
                        {isActive ? "Clear Selection" : "Start Screening"}
                      </button>

                      <div className="flex gap-1">
                        <button
                          onClick={() => setSelectedPatientForProfile(p)}
                          className="p-2 border border-slate-100 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors"
                          title="View Patient Records"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeletePatient(p.id)}
                          className="p-2 border border-slate-100 hover:border-rose-100 hover:bg-rose-50 rounded-xl text-slate-450 hover:text-rose-600 transition-colors"
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

        {/* Modal: Add Patient */}
        {showAddPatientModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl max-w-sm w-full space-y-4 animate-scaleUp">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">
                  Add New Patient
                </h3>
                <button
                  onClick={() => setShowAddPatientModal(false)}
                  className="p-1 rounded-full hover:bg-slate-50 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddNewPatient} className="space-y-3 text-left">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Patient Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Singh"
                    value={newPatientData.name}
                    onChange={(e) => setNewPatientData({ ...newPatientData, name: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-teal-500 text-slate-800 font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Age (Years)</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 34"
                      value={newPatientData.age}
                      onChange={(e) => setNewPatientData({ ...newPatientData, age: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-teal-500 text-slate-800 font-medium"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Gender</label>
                    <select
                      value={newPatientData.gender}
                      onChange={(e) => setNewPatientData({ ...newPatientData, gender: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-teal-500 text-slate-800 font-medium bg-white"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Village / Habitation</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rampur village"
                    value={newPatientData.village}
                    onChange={(e) => setNewPatientData({ ...newPatientData, village: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-teal-500 text-slate-800 font-medium"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-extrabold text-xs py-3.5 rounded-xl shadow-md transition-all active:scale-95"
                  >
                    Create Patient Profile
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Patient Screening Records Profile */}
        {selectedPatientForProfile && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl max-w-md w-full space-y-4 max-h-[85vh] overflow-y-auto no-scrollbar animate-scaleUp">
              <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                <div className="space-y-0.5 text-left">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">
                    Patient Records File
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
                  Screening History
                </h4>
                
                {selectedPatientForProfile.records?.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-slate-150 rounded-2xl text-slate-400 text-xs">
                    No screenings recorded yet. Select this patient and run screening, vitals, or voice triage.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {selectedPatientForProfile.records.map((rec, index) => (
                      <div key={index} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1">
                        <div className="flex justify-between items-center font-extrabold text-slate-700">
                          <span className="text-[11px]">{rec.title}</span>
                          <span className="text-[9px] text-slate-400 font-semibold">{rec.date}</span>
                        </div>
                        <div className="text-[9px] text-slate-500 font-medium leading-relaxed bg-white/60 p-2 rounded-lg border border-slate-100">
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
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-sm"
                >
                  Select Patient for New Screening
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderMedicinesView = () => {
    return (
      <div className="p-4 space-y-4 animate-fadeIn overflow-y-auto flex-1 h-full pb-24">
        {/* Header Info */}
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Pill className="w-5 h-5 text-teal-600" />
              {t.medicinesHeader}
            </h2>
            <p className="text-xs text-slate-500 leading-normal">{t.medicinesDesc}</p>
          </div>
          <button
            onClick={() => {
              const newMed = {
                id: Math.random().toString(36).substring(2, 9),
                name: "",
                dose: "",
                frequency: "",
                duration: "",
                reminderTime: "08:00"
              };
              const updated = [...medicinesList, newMed];
              setMedicinesList(updated);
              localStorage.setItem("saathi_medicines", JSON.stringify(updated));
            }}
            className="bg-teal-600 text-white p-2.5 rounded-full hover:bg-teal-700 transition-all flex items-center justify-center shadow-sm shrink-0"
            title="Add Medicine Manually"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* OCR Scan Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3.5">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase text-slate-800 tracking-wide">
                {language === "hi" ? "पर्चा स्कैन करें (AI)" : language === "gu" ? "પ્રિસ્ક્રિપ્શન સ્કેન કરો (AI)" : "Scan Prescription (AI)"}
              </h3>
              <p className="text-[10px] text-slate-500">
                {language === "hi" ? "फोटो खींचें या अपलोड करें। ओसीआर और एआई दवाओं की सूची बना देंगे।" : language === "gu" ? "ફોટો ખેંચો અથવા અપલોડ કરો. ઓસીઆર અને એઆઈ દવાઓની યાદી બનાવશે." : "Take a photo or upload to automatically extract and parse medication schedules."}
              </p>
            </div>
          </div>

          <div className="relative border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-colors">
            <UploadCloud className="w-8 h-8 text-slate-400" />
            <span className="text-[10px] font-bold text-slate-600">
              {isOcrLoading ? ocrProgress : (language === "hi" ? "फ़ाइल चुनें या कैमरा खोलें" : language === "gu" ? "ફાઇલ પસંદ કરો અથવા કેમેરો ખોલો" : "Choose File or Capture Image")}
            </span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePrescriptionUpload}
              disabled={isOcrLoading || isParsingPrescription}
              className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
            {isOcrLoading && (
              <div className="absolute inset-0 bg-white/90 rounded-xl flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
                <span className="text-[10px] font-extrabold text-teal-700 uppercase tracking-wider animate-pulse">{ocrProgress}</span>
              </div>
            )}
          </div>
        </div>

        {/* Medicines List Grid */}
        <div className="space-y-3">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-wide px-1">
            {language === "hi" ? "आपकी दवाएं" : language === "gu" ? "તમારી દવાઓ" : "Medication Schedule"}
          </h3>
          {medicinesList.length === 0 ? (
            <div className="bg-slate-100/50 rounded-2xl p-6 text-center border border-slate-200/50 text-slate-400 text-[10px]">
              {language === "hi" ? "कोई दवाएं सेट नहीं हैं। कृपया एक पर्चा स्कैन करें या मैन्युअल रूप से जोड़ें।" : language === "gu" ? "કોઈ દવાઓ સેટ નથી. કૃપા કરીને પ્રિસ્ક્રિપ્શન સ્કેન કરો અથવા મેન્યુઅલી ઉમેરો." : "No medications configured. Scan a prescription or tap '+' to add manually."}
            </div>
          ) : (
            <div className="space-y-3">
              {medicinesList.map((med, index) => (
                <div key={med.id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-3 relative group animate-fadeIn">
                  <button
                    onClick={() => {
                      const updated = medicinesList.filter(m => m.id !== med.id);
                      setMedicinesList(updated);
                      localStorage.setItem("saathi_medicines", JSON.stringify(updated));
                    }}
                    className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {/* Header info */}
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                    <span className="text-[10px] font-black text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
                      #{index + 1}
                    </span>
                    <input
                      type="text"
                      value={med.name}
                      onChange={(e) => {
                        const updated = [...medicinesList];
                        updated[index].name = e.target.value;
                        setMedicinesList(updated);
                        localStorage.setItem("saathi_medicines", JSON.stringify(updated));
                      }}
                      placeholder="Medicine Name (e.g. Paracetamol)"
                      className="text-xs font-extrabold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-b focus:border-teal-500 bg-transparent flex-1"
                    />
                  </div>

                  {/* Grid details */}
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="space-y-1">
                      <span className="text-slate-400 uppercase font-bold tracking-wider">Dose / Strength</span>
                      <input
                        type="text"
                        value={med.dose}
                        onChange={(e) => {
                          const updated = [...medicinesList];
                          updated[index].dose = e.target.value;
                          setMedicinesList(updated);
                          localStorage.setItem("saathi_medicines", JSON.stringify(updated));
                        }}
                        placeholder="e.g. 500 mg / 1 tab"
                        className="w-full bg-slate-50 border border-slate-200/60 rounded-lg py-1.5 px-2 focus:outline-none focus:border-teal-500 text-slate-700"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-400 uppercase font-bold tracking-wider">Frequency</span>
                      <input
                        type="text"
                        value={med.frequency}
                        onChange={(e) => {
                          const updated = [...medicinesList];
                          updated[index].frequency = e.target.value;
                          setMedicinesList(updated);
                          localStorage.setItem("saathi_medicines", JSON.stringify(updated));
                        }}
                        placeholder="e.g. 1-0-1 / Twice daily"
                        className="w-full bg-slate-50 border border-slate-200/60 rounded-lg py-1.5 px-2 focus:outline-none focus:border-teal-500 text-slate-700"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-400 uppercase font-bold tracking-wider">Duration</span>
                      <input
                        type="text"
                        value={med.duration}
                        onChange={(e) => {
                          const updated = [...medicinesList];
                          updated[index].duration = e.target.value;
                          setMedicinesList(updated);
                          localStorage.setItem("saathi_medicines", JSON.stringify(updated));
                        }}
                        placeholder="e.g. 5 days / Ongoing"
                        className="w-full bg-slate-50 border border-slate-200/60 rounded-lg py-1.5 px-2 focus:outline-none focus:border-teal-500 text-slate-700"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1">
                        <Bell className="w-3 h-3 text-rose-500" />
                        Reminder Time
                      </span>
                      <input
                        type="time"
                        value={med.reminderTime}
                        onChange={(e) => {
                          const updated = [...medicinesList];
                          updated[index].reminderTime = e.target.value;
                          setMedicinesList(updated);
                          localStorage.setItem("saathi_medicines", JSON.stringify(updated));
                        }}
                        className="w-full bg-slate-50 border border-slate-200/60 rounded-lg py-1 px-2 focus:outline-none focus:border-teal-500 text-slate-700 font-bold"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reminder settings config */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h4 className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wide">
                {language === "hi" ? "सक्रिय अलार्म अनुस्मारक" : language === "gu" ? "સક્રિય રીમાઇન્ડર એલાર્મ" : "Active Alarm Reminders"}
              </h4>
              <p className="text-[9px] text-slate-500 leading-normal">
                {language === "hi" ? "निर्धारित समय पर दवाएं लेने के लिए अलार्म चालू करें।" : language === "gu" ? "નિયત સમય પર દવા લેવા માટે એલાર્મ ચાલુ કરો." : "Use browser Notification API to alert you of due doses."}
              </p>
            </div>
            <button
              onClick={requestNotificationPermission}
              className={`text-[9px] font-extrabold px-3 py-1.5 rounded-full transition-colors flex items-center gap-1 shrink-0 ${
                reminderActive 
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                  : "bg-teal-600 hover:bg-teal-700 text-white shadow-sm"
              }`}
            >
              <CheckCircle className="w-3 h-3" />
              {reminderActive ? (language === "hi" ? "सक्रिय" : language === "gu" ? "સક્રિય" : "Enabled") : (language === "hi" ? "सक्रिय करें" : language === "gu" ? "સક્રિય કરો" : "Enable")}
            </button>
          </div>

          {/* MOCK CAREGIVER TOGGLE */}
          <div className="border-t border-slate-100 pt-3 flex items-start justify-between">
            <div className="space-y-0.5">
              <h4 className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wide">
                {language === "hi" ? "केयरगिवर अलर्ट (Mock)" : language === "gu" ? "કેરગિવર એલર્ટ (Mock)" : "Caregiver Alerts (Mock Prototype)"}
              </h4>
              <p className="text-[9px] text-slate-500 leading-normal">
                {language === "hi" ? "दवा छूटने पर केयरगिवर को एसएमएस/अलर्ट भेजें।" : language === "gu" ? "દવા ચુકી જવા પર કેરગીવરને SMS/એલર્ટ મોકલો." : "Notify family or caregiver if a reminder is missed."}
              </p>
            </div>
            <button
              onClick={() => {
                const updated = !caregiverAlert;
                setCaregiverAlert(updated);
                localStorage.setItem("saathi_caregiver_alert", String(updated));
              }}
              className={`w-9 h-5 rounded-full p-0.5 transition-all duration-300 shrink-0 ${
                caregiverAlert ? "bg-teal-600 flex justify-end" : "bg-slate-200 flex justify-start"
              }`}
            >
              <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
            </button>
          </div>

          {caregiverAlert && (
            <div className="bg-slate-50 border border-slate-200/50 rounded-xl p-3 text-[10px] space-y-2 animate-fadeIn">
              <div className="space-y-1">
                <span className="text-slate-500 font-bold uppercase tracking-wider block">Caregiver Contact Detail</span>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma (+91 98765 43210)"
                  className="w-full bg-white border border-slate-200 rounded-lg py-1 px-2 focus:outline-none focus:border-teal-500 text-slate-700"
                />
              </div>
              <div className="text-[9px] text-teal-700 bg-teal-50 px-2 py-1 rounded border border-teal-100 leading-normal font-semibold">
                {language === "hi" 
                  ? "पायलट नोट: केयरगिवर अलर्ट सक्रिय हो गए हैं। उत्पादन प्रणाली ABDM/SMS गेटवे से जुड़ती है।" 
                  : language === "gu" 
                  ? "પાયલોટ નોંધ: કેરગીવર એલર્ટ સક્રિય થઈ ગયા છે. ઉત્પાદન પ્રણાલી ABDM/SMS ગેટવે સાથે જોડાય છે." 
                  : "Prototype note: SMS delivery is simulated. Production links to SMS API gateways."}
              </div>
            </div>
          )}
        </div>

        {/* Drug Safety / Interaction info card */}
        {drugInteractionNote && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-amber-800">
              <Info className="w-4 h-4 text-amber-600 shrink-0" />
              <h4 className="text-[11px] font-black uppercase tracking-wider">
                {language === "hi" ? "सुरक्षा एवं ड्रग इंटरेक्शन नोट" : language === "gu" ? "આરોગ્ય અને ડ્રગ ઇન્ટરેક્શન નોંધ" : "Safety & Drug Interaction Note"}
              </h4>
            </div>
            <p className="text-[10px] text-slate-650 leading-relaxed font-medium">
              {drugInteractionNote}
            </p>
            <div className="text-[9px] text-amber-700 font-extrabold uppercase border-t border-amber-200/60 pt-2 tracking-wide">
              ⚠️ {language === "hi" ? "सूचनात्मक उद्देश्य के लिए: हमेशा एक चिकित्सक से पुष्टि करें।" : language === "gu" ? "માહિતીના હેતુ માટે: હંમેશા તબીબ અથવા ફાર્માસિસ્ટ સાથે પુષ્ટિ કરો." : "Informational Only: Always confirm medical plans with a pharmacist or doctor."}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <main className="w-full max-w-[430px] h-[100dvh] bg-white sm:rounded-3xl shadow-2xl flex flex-col relative overflow-hidden border border-slate-200">
      {/* PERSISTENT DISCLAIMER BANNER */}
      <div className="bg-amber-50 border-b border-amber-200 px-3 py-2 text-[11px] text-amber-800 flex items-start gap-1.5 shrink-0 z-30 shadow-sm">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="leading-tight font-semibold">
          {t.disclaimer}
        </p>
      </div>

      {/* OFFLINE BANNER */}
      {isOffline && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2.5 text-[10px] text-red-800 flex items-center gap-2 shrink-0 z-30 animate-fadeIn">
          <WifiOff className="w-4 h-4 text-red-600 shrink-0" />
          <span className="font-extrabold tracking-wide">
            {language === "hi" 
              ? "आप ऑफ़लाइन हैं। कैमरा और वाइटल्स जांच काम करेंगे; वॉयस एआई को इंटरनेट चाहिए।" 
              : language === "gu" 
              ? "તમે ઓફલાઇન છો. કેમેરા અને વાઇટલ્સ કામ કરશે; વોઇસ એઆઇ માટે ઇન્ટરનેટ જરૂરી છે." 
              : "You're offline — camera screening & vitals still work; voice/triage needs internet."}
          </span>
        </div>
      )}

      {/* HEADER */}
      <header className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white px-4 py-3 shrink-0 shadow-md flex justify-between items-center z-20">
        <div>
          <div className="flex items-center gap-1.5">
            <Heart className="w-5 h-5 fill-white text-teal-600 animate-pulse" />
            <h1 className="text-lg font-bold tracking-tight">{t.appTitle}</h1>
          </div>
          <p className="text-[10px] text-teal-100 font-light mt-0.5">{t.tagline}</p>
        </div>

        <div className="flex items-center gap-2">
          {isInstallable && (
            <button
              onClick={handleInstallClick}
              className="bg-white text-teal-700 font-extrabold text-[10px] px-2.5 py-1 rounded-full shadow-sm hover:bg-slate-50 transition-all active:scale-95 uppercase tracking-wider flex items-center gap-1 shrink-0"
            >
              <Download className="w-3 h-3" />
              {language === "hi" ? "इंस्टॉल" : language === "gu" ? "ઇન્સ્ટોલ" : "Install"}
            </button>
          )}

          {/* ASHA Mode Toggle Button */}
          <button
            onClick={() => {
              const nextVal = !ashaModeActive;
              setAshaModeActive(nextVal);
              localStorage.setItem("saathi_asha_mode_active", nextVal ? "true" : "false");
              if (!nextVal) {
                selectActivePatientForASHA(null);
              } else {
                setActiveTab("home");
              }
            }}
            className={`font-extrabold text-[10px] px-2.5 py-1 rounded-full shadow-sm transition-all active:scale-95 uppercase tracking-wider flex items-center gap-1 shrink-0 ${
              ashaModeActive 
                ? "bg-emerald-500 text-white border border-emerald-400" 
                : "bg-teal-700/50 text-teal-150 border border-teal-500/20 hover:text-white"
            }`}
          >
            <Users className="w-3 h-3" />
            <span className="xs:inline">{ashaModeActive ? "ASHA" : "ASHA"}</span>
          </button>

          {/* Language Selector in Header */}
          <div className="flex items-center gap-1 bg-teal-700/50 p-0.5 rounded-full border border-teal-500/30">
            <button
              onClick={() => setLanguage("en")}
              className={`px-1.5 py-0.5 text-[9px] font-bold rounded-full transition-all ${
                language === "en" ? "bg-white text-teal-700 shadow-sm" : "text-teal-100 hover:text-white"
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage("hi")}
              className={`px-1.5 py-0.5 text-[9px] font-bold rounded-full transition-all ${
                language === "hi" ? "bg-white text-teal-700 shadow-sm" : "text-teal-100 hover:text-white"
              }`}
            >
              हिंदी
            </button>
            <button
              onClick={() => setLanguage("gu")}
              className={`px-1.5 py-0.5 text-[9px] font-bold rounded-full transition-all ${
                language === "gu" ? "bg-white text-teal-700 shadow-sm" : "text-teal-100 hover:text-white"
              }`}
            >
              ગુજ
            </button>
          </div>
        </div>
      </header>

      {/* CONTENT AREA */}
      <div className="flex-grow overflow-y-auto no-scrollbar bg-slate-50 pb-20 relative">
        {/* Sticky Patient Banner */}
        {ashaModeActive && activePatientId && (
          (() => {
            const activePatient = patientsList.find(p => p.id === activePatientId);
            if (!activePatient) return null;
            return (
              <div className="bg-teal-50 border-b border-teal-200 px-4 py-2 flex items-center justify-between z-10 shrink-0 sticky top-0 shadow-sm animate-slideDown">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-teal-650 rounded-full animate-pulse shrink-0" />
                  <div className="text-[10px] text-teal-850 font-bold">
                    Active Patient: <strong className="text-teal-900 font-extrabold">{activePatient.name}</strong> ({activePatient.age}y / {activePatient.gender})
                  </div>
                </div>
                <button
                  onClick={() => selectActivePatientForASHA(null)}
                  className="text-[9px] font-extrabold text-teal-700 bg-teal-100 hover:bg-teal-200 px-2 py-1 rounded-lg"
                >
                  Clear Selection
                </button>
              </div>
            );
          })()
        )}
        {activeTab === "home" && (ashaModeActive ? renderAshaPortalView() : renderHomeView())}
        {activeTab === "screen" && renderScreenView()}
        {activeTab === "vitals" && renderVitalsView()}
        {activeTab === "talk" && renderTalkView()}
        {activeTab === "records" && renderRecordsView()}
        {activeTab === "medicines" && renderMedicinesView()}
      </div>

      {/* BOTTOM NAVIGATION */}
      <nav className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 py-2.5 px-3 flex justify-between items-center z-30 shadow-lg shrink-0">
        <button
          onClick={() => setActiveTab("home")}
          className={`flex flex-col items-center gap-1 flex-1 transition-colors ${
            activeTab === "home" ? "text-teal-600 font-bold" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[9px] font-semibold">{t.home}</span>
        </button>

        <button
          onClick={() => setActiveTab("screen")}
          className={`flex flex-col items-center gap-1 flex-1 transition-colors ${
            activeTab === "screen" ? "text-teal-600 font-bold" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <ShieldAlert className="w-5 h-5" />
          <span className="text-[9px] font-semibold">{t.screen}</span>
        </button>

        <button
          onClick={() => setActiveTab("vitals")}
          className={`flex flex-col items-center gap-1 flex-1 transition-colors ${
            activeTab === "vitals" ? "text-teal-600 font-bold" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <Activity className="w-5 h-5" />
          <span className="text-[9px] font-semibold">{t.vitals}</span>
        </button>

        <button
          onClick={() => setActiveTab("talk")}
          className={`flex flex-col items-center gap-1 flex-1 transition-colors ${
            activeTab === "talk" ? "text-teal-600 font-bold" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <Mic className="w-5 h-5" />
          <span className="text-[9px] font-semibold">{t.talk}</span>
        </button>

        <button
          onClick={() => setActiveTab("records")}
          className={`flex flex-col items-center gap-1 flex-1 transition-colors ${
            activeTab === "records" ? "text-teal-600 font-bold" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <FileText className="w-5 h-5" />
          <span className="text-[9px] font-semibold">{t.records}</span>
        </button>

        <button
          onClick={() => setActiveTab("medicines")}
          className={`flex flex-col items-center gap-1 flex-1 transition-colors ${
            activeTab === "medicines" ? "text-teal-600 font-bold" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <Pill className="w-5 h-5" />
          <span className="text-[9px] font-semibold">{t.medicinesHeader}</span>
        </button>
      </nav>

      {/* TELEMEDICINE OVERLAY POPUP */}
      {activeCall && (
        <div className="absolute inset-0 bg-slate-900/98 z-50 flex flex-col p-4 text-white overflow-y-auto no-scrollbar animate-fadeIn">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mt-4 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
              <h3 className="text-sm font-black tracking-wide uppercase text-teal-400">
                Saathi Telemedicine Connect
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
            <span className={telemedStep === "doctors" ? "text-teal-400 font-extrabold" : ""}>1. Doctors List</span>
            <span>&bull;</span>
            <span className={telemedStep === "summary" ? "text-teal-400 font-extrabold" : ""}>2. Doctor Summary</span>
            <span>&bull;</span>
            <span className={telemedStep === "call" ? "text-teal-400 font-extrabold" : ""}>3. Consultation Call</span>
          </div>

          {/* Content panel */}
          <div className="flex-1 py-4 flex flex-col justify-between">
            {/* Step 1: Doctors List */}
            {telemedStep === "doctors" && (
              <div className="space-y-4 flex-1">
                <div className="space-y-1">
                  <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">Nearby Medical Facilities</h4>
                  <p className="text-[10px] text-slate-500">
                    We detected the following healthcare options. For YELLOW or RED triage, the most relevant specialist or emergency service is listed first.
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
                            ? "bg-slate-800/80 border-amber-500/30 shadow-md ring-1 ring-amber-500/20 animate-pulse-border"
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
                              <span>Distance: {doc.distance}</span>
                              <span>&bull;</span>
                              <span className="text-emerald-500 font-extrabold">Available Now</span>
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
                          className="w-full mt-3 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-[10px] py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-sm"
                        >
                          <Phone className="w-3.5 h-3.5 animate-pulse" />
                          <span>Request Consultation</span>
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
                    <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">Clinical Intake Summary</h4>
                    <p className="text-[10px] text-slate-500">
                      Generating intake record using Groq Llama 3.3 to compile symptoms, triage priority, and camera screening results.
                    </p>
                  </div>

                  {isSummaryLoading && (
                    <div className="bg-slate-850/40 border border-slate-800 rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-4">
                      <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
                      <span className="text-xs font-bold text-slate-400">Consulting AI coordinator...</span>
                    </div>
                  )}

                  {!isSummaryLoading && doctorSummary && (
                    <div className="space-y-3">
                      {/* Highlight summary fields */}
                      <div className="bg-slate-850 border border-slate-800 rounded-2xl p-4 space-y-3 text-xs leading-normal">
                        <div>
                          <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500">Chief Complaint:</span>
                          <p className="font-semibold text-slate-200 mt-0.5">{doctorSummary.chief_complaint}</p>
                        </div>
                        <div className="border-t border-slate-800/60 pt-2">
                          <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500">Calculated Urgency:</span>
                          <p className="font-bold text-teal-405 mt-0.5">{doctorSummary.triage_level}</p>
                        </div>
                        <div className="border-t border-slate-800/60 pt-2">
                          <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500">Screening Signals:</span>
                          <p className="font-semibold text-slate-300 mt-0.5">{doctorSummary.screening_signals}</p>
                        </div>
                        <div className="border-t border-slate-800/60 pt-2">
                          <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500">Primary Diagnostic Focus:</span>
                          <p className="font-semibold text-amber-400 mt-0.5">{doctorSummary.suggested_focus}</p>
                        </div>
                      </div>

                      {/* Low bandwidth support toggle */}
                      <div className="bg-slate-850/60 border border-slate-800 rounded-2xl p-3 flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-bold text-slate-200 block">Low-Bandwidth Mode</span>
                          <span className="text-[9px] text-slate-550 block">Disable camera; run voice consultation fallback</span>
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
                    className="flex-grow bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-extrabold text-xs py-3.5 rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <Video className="w-4 h-4" />
                    <span>Send to Doctor & Connect</span>
                  </button>
                  <button
                    onClick={() => {
                      setTelemedStep("doctors");
                      setSelectedDoctor(null);
                      setDoctorSummary(null);
                    }}
                    className="px-4 border border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-white font-bold text-xs rounded-xl transition-colors"
                  >
                    Back
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Call Screen */}
            {telemedStep === "call" && (
              <div className="flex-1 flex flex-col justify-between space-y-4 animate-scaleUp">
                {/* Connection Status Banner */}
                <div className="bg-slate-850/80 border border-slate-800 rounded-2xl p-3 flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-450">Consultation Partner:</span>
                  <span className="text-teal-400">{selectedDoctor?.name || "Saathi Consultant"}</span>
                </div>

                {/* Webcam/Video Area */}
                <div className="flex-grow relative bg-slate-950 rounded-3xl overflow-hidden border border-slate-850 shadow-inner flex flex-col items-center justify-center min-h-[300px]">
                  {isCallAudioOnly ? (
                    /* Audio Mode UI */
                    <div className="text-center space-y-4 p-6 animate-scaleUp">
                      <div className="w-20 h-20 bg-teal-500/10 rounded-full flex items-center justify-center border border-teal-500/20 mx-auto animate-pulse-ring">
                        <Mic className="w-10 h-10 text-teal-400 animate-pulse" />
                      </div>
                      <div className="space-y-1">
                        <h5 className="text-sm font-bold text-slate-200">Audio-Only Fallback Connected</h5>
                        <p className="text-[10px] text-slate-500 max-w-xs mx-auto leading-normal">
                          Low bandwidth connection detected. Video stream has been disabled to prioritize audio quality.
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
                          You (WebRTC)
                        </div>
                      </div>

                      {/* Status indicator overlay */}
                      <div className="absolute top-4 left-4 bg-slate-950/80 px-2.5 py-1.5 rounded-full text-[9px] font-bold text-teal-400 flex items-center gap-1.5 shadow-sm border border-slate-800/40 z-20">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        <span>{webRTCStatus}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Call Controller Bottom Bar */}
                <div className="space-y-4 mb-4">
                  <div className="text-center">
                    <span className="text-xs font-mono font-bold tracking-widest bg-slate-850 border border-slate-800 px-3.5 py-1.5 rounded-full shadow-sm text-slate-200">
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
                      className="bg-red-600 hover:bg-red-700 text-white p-4.5 rounded-full shadow-lg transition-all active:scale-95 flex items-center justify-center w-16 h-16 border border-red-700"
                    >
                      <PhoneOff className="w-7 h-7 animate-pulse" />
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
      )}

      {/* MEDICINE REMINDER MODAL POPUP */}
      {pendingReminderAlert && (
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl max-w-sm w-full text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center animate-bounce">
              <Bell className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-wide">
                {language === "hi" ? "दवा लेने का समय!" : language === "gu" ? "દવા લેવાનો સમય!" : "Medicine Reminder!"}
              </h3>
              <p className="text-sm font-bold text-teal-600">{pendingReminderAlert.name}</p>
              <p className="text-xs text-slate-500">
                {language === "hi" 
                  ? `खुराक: ${pendingReminderAlert.dose} | आवृत्ति: ${pendingReminderAlert.frequency}` 
                  : language === "gu" 
                  ? `ખુરાક: ${pendingReminderAlert.dose} | આવૃત્તિ: ${pendingReminderAlert.frequency}` 
                  : `Dosage: ${pendingReminderAlert.dose} | Frequency: ${pendingReminderAlert.frequency}`}
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => setPendingReminderAlert(null)}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-md transition-colors"
              >
                {language === "hi" ? "मैंने दवा ले ली है" : language === "gu" ? "મેં દવા લઈ લીધી છે" : "I have taken it"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
