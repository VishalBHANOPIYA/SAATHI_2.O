import React, { useState, useRef, useEffect } from "react";
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
  Share2
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { safeGetItem, safeSetItem } from "@/utils/localStorageHelper";
import { speakText, stopSpeaking, isSpeechSupported } from "../utils/textToSpeech";
import { shareHealthReport } from "@/utils/shareHelper";
import { checkRateLimit } from "@/utils/rateLimit";

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
    good: "ઉત્કૃષ્ટ",
    ok: "સામાન્ય",
    poor: "નબળું"
  }
};

function rgbToLab(R: number, G: number, B: number) {
  // 1. Normalize RGB values to [0, 1]
  let r = R / 255;
  let g = G / 255;
  let b = B / 255;

  // 2. Convert sRGB to linear RGB by removing gamma companding
  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

  // 3. Convert linear RGB to XYZ using standard sRGB D65 white point matrix
  const X = r * 0.4124 + g * 0.3576 + b * 0.1805;
  const Y = r * 0.2126 + g * 0.7152 + b * 0.0722;
  const Z = r * 0.0193 + g * 0.1192 + b * 0.9505;

  // 4. Normalize by D65 reference white values (Xn=0.95047, Yn=1.00000, Zn=1.08883)
  const xr = X / 0.95047;
  const yr = Y / 1.00000;
  const zr = Z / 1.08883;

  // 5. Apply CIE non-linear conversion function f(t)
  const f = (t: number) => {
    return t > 0.008856 ? Math.pow(t, 1 / 3) : 7.787 * t + 16 / 116;
  };

  const fx = f(xr);
  const fy = f(yr);
  const fz = f(zr);

  // 6. Calculate L*, a*, b* (where L* is luminance, a* is red/green, b* is yellow/blue)
  const L = 116 * fy - 16;
  const a = 500 * (fx - fy);
  const b_star = 200 * (fy - fz);

  return { L, a, b_star };
}

const ScreenSpeechPlayer: React.FC<{
  text: string;
  language: string;
}> = ({ text, language }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);

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
    }
    return () => {
      stopSpeaking();
    };
  }, [text, language]);

  const toggleSpeech = () => {
    if (!voiceSupported) return;
    if (isSpeaking) {
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
      className="flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-705 transition-all py-1 px-2.5 rounded-lg shadow-sm text-[10px] font-extrabold shrink-0"
    >
      {isSpeaking ? (
        <>
          <VolumeX className="w-3.5 h-3.5 text-teal-605 animate-pulse" />
          <span>{language === "hi" ? "आवाज रोकें" : language === "gu" ? "અવાજ બંધ કરો" : "Stop Voice"}</span>
        </>
      ) : (
        <>
          <Volume2 className="w-3.5 h-3.5 text-teal-605" />
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
}

export const ScreenView: React.FC<ScreenViewProps> = React.memo(({
  recordsList,
  setRecordsList,
  activePatientId,
  ashaModeActive,
  patientsList,
  setPatientsList,
  activeTab,
  userProfile
}) => {
  const { language, t } = useLanguage();
  const sTrans = screenTranslations[language] || screenTranslations.en;

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

  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const screenCanvasRef = useRef<HTMLCanvasElement | null>(null);
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
  const [isScreeningLoading, setIsScreeningLoading] = useState(false);

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

  const captureScreenPhoto = async () => {
    isStaticUploadRef.current = false;
    const video = screenVideoRef.current;
    if (!video) return;
    setIsCapturingMulti(true);

    const canvases: HTMLCanvasElement[] = [];
    // Capture 5 frames over ~1 second (spaced 200ms apart)
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

    // Use the last frame (canvases[4]) as the display image
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

        // Initialize 5 copies of the uploaded image in capturedFramesRef
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

    // Initialize 5 copies of the sample image in capturedFramesRef
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

      // Calculate coordinates clipped to canvas bounds to ensure accurate alignment
      const xStart = Math.max(0, Math.min(canvas.width - boxSize, x - boxSize / 2));
      const yStart = Math.max(0, Math.min(canvas.height - boxSize, y - boxSize / 2));

      const xStartRef = Math.max(0, Math.min(canvas.width - refSize, x - refSize / 2));
      const yStartRef = Math.max(0, Math.min(canvas.height - refSize, y - refSize / 2));

      // Draw inner ROI box (solid teal line)
      ctx.strokeStyle = "#14b8a6"; // teal-500
      ctx.lineWidth = 3;
      ctx.strokeRect(xStart, yStart, boxSize, boxSize);

      // Draw outer reference skin region (dotted boundary) for anemia
      if (selectedCondition === "anemia") {
        ctx.strokeStyle = "rgba(20, 184, 166, 0.5)";
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(xStartRef, yStartRef, refSize, refSize);
        ctx.setLineDash([]); // Reset dash
      }

      // Draw target dot at the center clicked point
      ctx.fillStyle = "#14b8a6";
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

            // Draw default ROI indicator on the canvas
            ctx.strokeStyle = "#14b8a6";
            ctx.lineWidth = 3;
            ctx.strokeRect(xStart, yStart, boxSize, boxSize);

            if (selectedCondition === "anemia") {
              const refSize = 100;
              const xStartRef = Math.max(0, Math.min(canvas.width - refSize, centerX - refSize / 2));
              const yStartRef = Math.max(0, Math.min(canvas.height - refSize, centerY - refSize / 2));
              ctx.strokeStyle = "rgba(20, 184, 166, 0.5)";
              ctx.lineWidth = 2;
              ctx.setLineDash([4, 4]);
              ctx.strokeRect(xStartRef, yStartRef, refSize, refSize);
              ctx.setLineDash([]);
            }
            ctx.fillStyle = "#14b8a6";
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

    // Allow the loader spinner to render first
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

      // Analyze each of the 5 frames
      for (let i = 0; i < 5; i++) {
        const canvas = canvases[i];
        if (!canvas) continue;
        const ctx = canvas.getContext("2d");
        if (!ctx) continue;

        // Coordinates clipped to canvas bounds (320x320)
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

        // Loop through the outer reference bounding box
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

              // Standard luminance: Y = 0.2126 * R + 0.7152 * G + 0.0722 * B
              const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
              roiLuminanceSum += lum;

              // Overexposed defined as any channel saturating >= 250
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

        // CIE LAB Color Conversion & Relative Calibration
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
          // Relative a* difference (redness of nail vs surrounding skin)
          const diff_a = lab_roi.a - lab_skin.a;
          // low a* (less redness) and high L* (paleness) increases anemia index
          frameIndex = 25 - 4.5 * diff_a + 0.8 * (lab_roi.L - 60);
        } else if (selectedCondition === "jaundice") {
          // Jaundice yellowness index based on b* axis (yellow-blue axis)
          frameIndex = (lab_roi.b_star - 8) * 3;
        } else {
          // Skin check index based on redness/inflammation (a* axis)
          frameIndex = (lab_roi.a - 10) * 4;
        }

        frameIndices.push(Math.max(0, Math.min(100, Math.round(frameIndex))));
      }

      // Localized low quality / dark image fallback message
      const lowQualityMsg = language === "hi"
        ? "छवि बहुत धुंधली या खराब गुणवत्ता की है। कृपया स्पष्ट रोशनी में पुनः प्रयास करें।"
        : language === "gu"
          ? "ચિત્ર ખૂબ ઝાંખું અથવા ખરાબ ગુણવત્તાનું છે. કૃપા કરીને સ્પષ્ટ પ્રકાશમાં ફરી પ્રયાસ કરો."
          : "Image too dark or low quality. Please try again with clear lighting.";

      // 1. Quality Gate: ROI too small
      if (roiCountForGate < 2500) {
        setScreenToast({
          message: sTrans.errTooSmall || "ROI too small (<2500 px). Move closer.",
          type: "error"
        });
        setIsAnalyzing(false);
        return;
      }

      // Calculate Median of Luminance, Overexposure, and Index
      const median = (arr: number[]) => {
        if (arr.length === 0) return 0;
        const sorted = [...arr].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
      };

      const medianLum = median(frameLums);
      const medianOverexposedPercent = median(frameOverexposedPercents);
      const medianIndex = median(frameIndices);

      // 2. Quality Gate: Mean luminance too low (<40) or too high (>220)
      if (medianLum < 40 || medianLum > 220) {
        setScreenToast({
          message: lowQualityMsg || sTrans.errLuminance || "Too dark / too bright, move to even lighting.",
          type: "error"
        });
        setIsAnalyzing(false);
        return;
      }

      // 3. Quality Gate: Overexposed pixels >10% in ROI
      if (medianOverexposedPercent > 10) {
        setScreenToast({
          message: lowQualityMsg || sTrans.errOverexposed || "Reduce direct light/flash.",
          type: "error"
        });
        setIsAnalyzing(false);
        return;
      }

      // Calculate Variance/Standard Deviation of indices across the 5 frames
      const meanIndex = frameIndices.reduce((sum, val) => sum + val, 0) / frameIndices.length;
      const indexVariance = frameIndices.reduce((sum, val) => sum + Math.pow(val - meanIndex, 2), 0) / frameIndices.length;
      const indexStdDev = Math.sqrt(indexVariance);

      // 4. Quality Gate: Frame-to-frame variance too high (motion blur) - SKIP FOR STATIC UPLOADS
      if (!isStatic && indexStdDev > 6.0) {
        setScreenToast({
          message: sTrans.errVariance || "Hold steady.",
          type: "error"
        });
        setIsAnalyzing(false);
        return;
      }

      // Determine Signal Quality badge
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

      // Map to risk levels using threshold bands
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

    // Attach to active ASHA patient if mode is active
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
  };

  // Run canvas re-draw when screenImage is ready in ROI mode
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

  // Stop camera feed when activeTab changes
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
    <div className="p-4 space-y-4 animate-fadeIn text-left">
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
        <div className="space-y-4 relative">
          {screenToast && (
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-2 bg-slate-900/95 text-white text-[11px] font-bold px-3 py-2 rounded-xl shadow-md border border-slate-700/50 backdrop-blur animate-scale-up">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
              <span>{screenToast.message}</span>
            </div>
          )}
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
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs text-slate-600 leading-normal flex gap-2 border-slate-200">
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
                  className="flex items-center justify-center gap-2 bg-teal-600 text-white font-bold text-xs py-3 rounded-xl hover:bg-teal-700 shadow-sm active:scale-[0.98] transition-all min-h-[44px]"
                >
                  <Camera className="w-4 h-4" />
                  {sTrans.startCamera}
                </button>
                <label className="flex items-center justify-center gap-2 bg-slate-100 border border-slate-205 text-slate-700 font-bold text-xs py-3 rounded-xl hover:bg-slate-200 cursor-pointer shadow-sm active:scale-[0.98] transition-all text-center border-slate-200 min-h-[44px]">
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

              {/* Try with sample */}
              <div className="pt-2.5 flex flex-col items-center border-t border-dashed border-slate-200 mt-2">
                <span className="text-[10px] font-black text-slate-400 mb-1.5 uppercase tracking-wider">
                  {language === "hi" ? "या नमूना छवि के साथ प्रयास करें" : language === "gu" ? "અથવા નમૂના ચિત્ર સાથે પ્રયાસ કરો" : "Or Try with a Sample"}
                </span>
                <button
                  type="button"
                  onClick={() => handleSampleSelect(selectedCondition)}
                  className="flex items-center justify-center gap-2 bg-purple-50 border border-purple-200 text-purple-700 hover:bg-purple-100 font-extrabold text-xs py-2.5 px-4 rounded-xl shadow-sm active:scale-[0.98] transition-all w-full min-h-[38px]"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-650 animate-pulse" />
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
                  className="flex-1 bg-slate-800 text-slate-300 font-bold text-xs py-2.5 rounded-xl hover:bg-slate-700 min-h-[36px]"
                >
                  {sTrans.cancel}
                </button>
                <button
                  onClick={captureScreenPhoto}
                  disabled={isCapturingMulti}
                  className="flex-1 bg-teal-600 text-white font-bold text-xs py-2.5 rounded-xl hover:bg-teal-500 shadow-md active:scale-[0.98] transition-all min-h-[36px] flex items-center justify-center"
                >
                  {isCapturingMulti ? "Capturing..." : sTrans.captureBtn}
                </button>
              </div>
            </div>
          )}

          {/* 3. ROI SELECTION STEP */}
          {screenStep === "roi" && (
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-700 flex items-center gap-1.5 font-sans">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  {sTrans.tapROI}
                </h3>
                <p className="text-[11px] text-slate-500 leading-normal font-sans">
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
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center gap-3 border-slate-200">
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
                      <p className="text-[9px] text-slate-405 text-slate-400">
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
                  className="bg-slate-100 text-slate-600 font-bold text-xs py-2.5 rounded-xl hover:bg-slate-200 min-h-[36px]"
                >
                  {sTrans.retake}
                </button>
                <button
                  onClick={runScreenAnalysis}
                  disabled={isAnalyzing}
                  className="bg-teal-600 text-white font-bold text-xs py-2.5 rounded-xl hover:bg-teal-700 shadow-sm active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 min-h-[36px]"
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
              <div className="flex justify-between items-center border-b border-slate-100 pb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
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
                <div className="flex gap-2">
                  {isSampleImage && (
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-purple-100 text-purple-800 animate-pulse uppercase tracking-wider">
                      {language === "hi" ? "नमूना" : language === "gu" ? "નમૂનો" : "Sample Image"}
                    </span>
                  )}
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    screenResults.riskBand === "Low" ? "bg-emerald-100 text-emerald-800" :
                    screenResults.riskBand === "Moderate" ? "bg-amber-100 text-amber-800" :
                    "bg-rose-100 text-rose-800"
                  }`}>
                    {screenResults.riskBand} Risk
                  </span>
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 ${
                    screenResults.signalQuality === "good" ? "bg-teal-100 text-teal-800" :
                    screenResults.signalQuality === "ok" ? "bg-blue-100 text-blue-800" :
                    "bg-slate-100 text-slate-800"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      screenResults.signalQuality === "good" ? "bg-teal-500" :
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

              <div className="space-y-3">
                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 border-slate-200">
                  <div
                    className="w-10 h-10 rounded-full border border-slate-200 shadow-sm shrink-0"
                    style={{ backgroundColor: `rgb(${avgColor?.r}, ${avgColor?.g}, ${avgColor?.b})` }}
                  />
                  <div className="text-left space-y-0.5">
                    <p className="text-xs font-bold text-slate-650 capitalize text-slate-700">
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
                <div className="text-xs text-slate-700 leading-relaxed font-semibold bg-slate-50 p-4 rounded-xl border border-slate-100 border-slate-200 text-left">
                  {screenResults.description}
                </div>

                {/* Strong Disclaimer Banner */}
                <div className="bg-rose-50 border border-rose-100 rounded-xl p-3.5 text-[10px] text-rose-700 leading-normal space-y-1 border-rose-200 text-left">
                  <div className="flex items-center gap-1.5 font-bold text-rose-800 uppercase tracking-wider mb-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>{sTrans.disclaimerTitle}</span>
                  </div>
                  <p>{sTrans.disclaimerText}</p>
                  <p className="text-[9px] font-mono text-slate-400 mt-2 font-bold">
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
                  className="bg-slate-100 text-slate-600 font-bold text-xs py-2.5 rounded-xl hover:bg-slate-200 min-h-[36px]"
                >
                  {sTrans.retake}
                </button>
                <button
                  onClick={saveScreeningResults}
                  className="bg-teal-600 text-white font-bold text-xs py-2.5 rounded-xl hover:bg-teal-700 shadow-md transition-all active:scale-[0.98] min-h-[36px]"
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
                className="w-full flex items-center justify-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 font-extrabold text-xs py-2.5 rounded-xl active:scale-[0.98] transition-all min-h-[38px] shadow-sm"
              >
                <Share2 className="w-4 h-4 text-blue-650" />
                <span>{language === "hi" ? "नतीजे साझा करें" : language === "gu" ? "પરિણામો શેર કરો" : "Share Screening Results"}</span>
              </button>
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
                <label className="text-xs font-bold text-slate-650 uppercase tracking-wide text-slate-650">
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
                        className={`py-2.5 px-3 text-xs font-bold rounded-lg border text-left flex justify-between items-center transition-all ${
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
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
                    {language === "hi" ? "आयु" : language === "gu" ? "ઉંમર" : "Age"}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={age}
                    onChange={(e) => setAge(parseInt(e.target.value) || 0)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 font-bold text-slate-700 focus:outline-none focus:border-teal-500 h-[38px]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
                    {language === "hi" ? "तापमान (°F)" : language === "gu" ? "તાપમાન (°F)" : "Temp (°F)"}
                  </label>
                  <input
                    type="text"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 font-bold text-slate-700 focus:outline-none focus:border-teal-500 h-[38px]"
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold text-sm py-3 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 hover:from-teal-700 hover:to-emerald-700 transition-all active:scale-[0.98] mt-2 min-h-[44px]"
              >
                <Sparkles className="w-4 h-4 fill-teal-100" />
                {t.startScreeningBtn}
              </button>
            </form>
          ) : isScreeningLoading ? (
            <div className="bg-white rounded-2xl p-10 border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-4 min-h-[300px]">
              <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
              <p className="text-sm text-slate-600 font-bold animate-pulse">{t.submitting}</p>
              <p className="text-[10px] text-slate-400 text-center max-w-[200px] font-bold">
                Saathi is analyzing safety parameters using Groq LLM screening models.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4 animate-scaleUp text-left">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                    {language === "hi" ? "स्क्रीनिंग रिपोर्ट" : language === "gu" ? "સ્ક્રીનીંગ રીપોર્ટ" : "Screening Report"}
                  </span>
                  <ScreenSpeechPlayer text={screeningResult || ""} language={language} />
                </div>
                <span className="bg-teal-100 text-teal-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                  AI Screened
                </span>
              </div>

              <div className="text-xs text-slate-700 leading-relaxed font-bold space-y-3 whitespace-pre-line bg-slate-50 p-4 rounded-xl border border-slate-100 border-slate-200">
                {screeningResult}
              </div>

              <div className="bg-amber-50 border border-amber-200/50 rounded-xl p-3 text-[10px] text-amber-700 leading-normal flex gap-2 border-amber-200">
                <Info className="w-4 h-4 shrink-0 text-amber-500 animate-pulse" />
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
                className="w-full bg-teal-600 text-white font-bold text-xs py-2.5 rounded-xl hover:bg-teal-700 transition-colors min-h-[36px]"
              >
                {language === "hi" ? "नई जांच शुरू करें" : language === "gu" ? "નવી તપાસ શરૂ કરો" : "Start New Assessment"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
});

ScreenView.displayName = "ScreenView";
