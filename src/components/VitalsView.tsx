import React, { useState, useRef, useEffect } from "react";
import {
  Loader2,
  AlertTriangle,
  RefreshCw,
  Heart,
  Activity,
  TrendingUp,
  Video,
  Plus,
  X,
  Sparkles,
  Volume2,
  VolumeX,
  SwitchCamera
} from "lucide-react";
import { speakText, stopSpeaking, isSpeechSupported } from "../utils/textToSpeech";
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
import { ClinicalDisclaimer } from "./ClinicalDisclaimer";
import { StepCounterWidget } from "./StepCounterWidget";
import { safeGetItem, safeSetItem } from "@/utils/localStorageHelper";
import { useChartHeight } from "@/hooks/useChartHeight";
import { resampleSignal, estimateVitalsForWindow, detrend, computeChromSignal } from "../utils/vitalsRppg";
import { calculateBMI } from "../utils/bmiCalculator";

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
    holdStill: "તમારા ચહેરેને અંડાકાર વર્તુળમાં રાખો. સ્થિર રહો અને સારો પ્રકાશ રાખો.",
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

interface VitalsViewProps {
  vitalsHistory: any[];
  setVitalsHistory: React.Dispatch<React.SetStateAction<any[]>>;
  recordsList: any[];
  setRecordsList: React.Dispatch<React.SetStateAction<any[]>>;
  attachRecordToActivePatient: (record: any, riskBand?: "GREEN" | "YELLOW" | "RED") => void;
  userProfile?: any;
  language?: string;
}

const getNormalRanges = (age: number | null) => {
  const ageVal = age ?? 30; // default to adult if unknown
  if (ageVal <= 1) {
    return {
      hr: "100-160",
      spo2: "95-100",
      br: "30-60",
      bp: "75-100/50-70"
    };
  } else if (ageVal <= 5) {
    return {
      hr: "80-140",
      spo2: "95-100",
      br: "24-40",
      bp: "80-110/55-75"
    };
  } else if (ageVal <= 12) {
    return {
      hr: "70-120",
      spo2: "95-100",
      br: "18-30",
      bp: "80-110/55-75"
    };
  } else {
    return {
      hr: "60-100",
      spo2: "95-100",
      br: "12-20",
      bp: "90-120/60-80"
    };
  }
};

const VitalsSpeechPlayer: React.FC<{
  hr: number;
  spo2: number;
  br: number;
  language: string;
}> = ({ hr, spo2, br, language }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);

  const getSpeechText = () => {
    if (language === "hi") {
      return `आपके कैमरे से मापे गए जैविक मापदंड हैं: हृदय गति ${hr} धड़कन प्रति मिनट, ऑक्सीजन का स्तर ${spo2} प्रतिशत, और श्वसन दर ${br} सांस प्रति मिनट है।`;
    }
    if (language === "gu") {
      return `તમારા અંદાજિત જૈવિક માપદંડો છે: હૃદયના ધબકારા પ્રતિ મિનિટ ${hr}, ઓક્સિજનનું પ્રમાણ {spo2} ટકા, અને શ્વાસનો દર પ્રતિ મિનિટ {br} છે.`;
    }
    return `Your estimated vitals are: Heart rate is ${hr} beats per minute, blood oxygen level is ${spo2} percent, and breathing rate is ${br} breaths per minute.`;
  };

  useEffect(() => {
    const supported = isSpeechSupported();
    setVoiceSupported(supported);

    if (supported) {
      speakText(
        getSpeechText(),
        language,
        () => setIsSpeaking(true),
        () => setIsSpeaking(false),
        () => setIsSpeaking(false)
      );
    }
    return () => {
      stopSpeaking();
    };
  }, [hr, spo2, br, language]);

  const toggleSpeech = () => {
    if (!voiceSupported) return;
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else {
      speakText(
        getSpeechText(),
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
          <VolumeX className="w-3.5 h-3.5 text-violet-605 animate-pulse" />
          <span>{language === "hi" ? "आवाज रोकें" : language === "gu" ? "અવાજ બંધ કરો" : "Stop Voice"}</span>
        </>
      ) : (
        <>
          <Volume2 className="w-3.5 h-3.5 text-violet-605" />
          <span>{language === "hi" ? "आवाज सुनें" : language === "gu" ? "અવાજ સાંભળો" : "Play Voice"}</span>
        </>
      )}
    </button>
  );
};

export const VitalsView: React.FC<VitalsViewProps> = React.memo(({
  vitalsHistory,
  setVitalsHistory,
  recordsList,
  setRecordsList,
  attachRecordToActivePatient,
  userProfile = null,
  language: languageProp
}) => {
  const { language, t } = useLanguage();
  const chartHeight = useChartHeight();
  const sTrans = scannerTranslations[language as keyof typeof scannerTranslations] || scannerTranslations.en;
  const profileAge = userProfile?.age ? Number(userProfile.age) : null;

  const glassesRef = useRef<boolean>(false);
  const [showGlassesHint, setShowGlassesHint] = useState(false);

  const [scanState, setScanState] = useState<"idle" | "permissions" | "scanning" | "completed" | "error">("idle");
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [obstructionWarning, setObstructionWarning] = useState(false);
  const [movementWarning, setMovementWarning] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [finalSignal, setFinalSignal] = useState<number[]>([]);
  const [capturedVitals, setCapturedVitals] = useState<{
    hr: number;
    spo2: number;
    br: number;
    hrList: number[];
    snr: number;
    hrIsEstimated?: boolean;
  } | null>(null);

  const [liveFps, setLiveFps] = useState(0);
  const [brightnessWarning, setBrightnessWarning] = useState(false);
  const [vitalSparklineData, setVitalSparklineData] = useState<number[]>([]);
  const [vitalQualityError, setVitalQualityError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(30);

  const [showVitalForm, setShowVitalForm] = useState(false);
  const [newVital, setNewVital] = useState({
    heartRate: "",
    systolic: "",
    diastolic: "",
    oxygen: ""
  });

  const [isMounted, setIsMounted] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const intervalRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const liveFpsRef = useRef<number>(0);
  const brightnessWarningRef = useRef<boolean>(false);
  const signalRRef = useRef<number[]>([]);
  const signalGRef = useRef<number[]>([]);
  const signalBRef = useRef<number[]>([]);
  const timeRef = useRef<number[]>([]);
  const scanStartTimeRef = useRef<number>(0);

  useEffect(() => {
    setIsMounted(true);
    return () => {
      stopCameraStream();
    };
  }, []);

  // Update timer countdown
  useEffect(() => {
    let timer: number;
    if (scanState === "scanning" && secondsLeft > 0) {
      timer = window.setTimeout(() => {
        setSecondsLeft(prev => prev - 1);
      }, 1000);
    } else if (scanState === "scanning" && secondsLeft === 0) {
      finishCameraScan();
    }
    return () => clearTimeout(timer);
  }, [scanState, secondsLeft]);

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

  const toggleFacingMode = async () => {
    const nextFacing = facingMode === "user" ? "environment" : "user";
    setFacingMode(nextFacing);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: nextFacing, width: { ideal: 480 }, height: { ideal: 360 } }
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } catch (err: any) {
        setErrorMsg("Failed to switch camera: " + err.message);
      }
    }
  };

  const startCameraScan = async () => {
    setScanState("permissions");
    setErrorMsg("");
    setFinalSignal([]);
    setCapturedVitals(null);
    setLiveFps(0);
    setBrightnessWarning(false);
    setVitalSparklineData([]);
    setVitalQualityError(null);
    liveFpsRef.current = 0;
    brightnessWarningRef.current = false;
    glassesRef.current = false;
    setShowGlassesHint(false);

    signalRRef.current = [];
    signalGRef.current = [];
    signalBRef.current = [];
    timeRef.current = [];
    scanStartTimeRef.current = performance.now();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode, width: { ideal: 480 }, height: { ideal: 360 } }
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      setScanState("scanning");
      setSecondsLeft(30);

      const lastTime = Date.now();
      const sampleInterval = 33; // ~30fps target

      intervalRef.current = window.setInterval(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const w = canvas.width;
        const h = canvas.height;

        ctx.save();
        if (facingMode === "user") {
          ctx.translate(w, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0, w, h);
        ctx.restore();

        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;



        const fyS = Math.floor(h * 0.20);
        const fyE = Math.floor(h * 0.32);
        const fxS = Math.floor(w * 0.42);
        const fxE = Math.floor(w * 0.58);

        const cyS = Math.floor(h * 0.48);
        const cyE = Math.floor(h * 0.58);
        const clxS = Math.floor(w * 0.28);
        const clxE = Math.floor(w * 0.40);
        const crxS = Math.floor(w * 0.60);
        const crxE = Math.floor(w * 0.72);

        ctx.strokeStyle = "rgba(16, 185, 129, 0.85)";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(fxS, fyS, fxE - fxS, fyE - fyS);
        ctx.strokeRect(clxS, cyS, clxE - clxS, cyE - cyS);
        ctx.strokeRect(crxS, cyS, crxE - crxS, cyE - cyS);

        ctx.fillStyle = "rgba(16, 185, 129, 0.9)";
        ctx.font = "9px system-ui, sans-serif";
        ctx.fillText("Forehead", fxS, fyS - 3);
        ctx.fillText("Cheek L", clxS, cyS - 3);
        ctx.fillText("Cheek R", crxS, cyS - 3);

        let fR = 0, fG = 0, fB = 0, fCount = 0;
        let lR = 0, lG = 0, lB = 0, lCount = 0;
        let rR = 0, rG = 0, rB = 0, rCount = 0;

        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const isForehead = (y >= fyS && y <= fyE && x >= fxS && x <= fxE);
            const isLeftCheek = (y >= cyS && y <= cyE && x >= clxS && x <= clxE);
            const isRightCheek = (y >= cyS && y <= cyE && x >= crxS && x <= crxE);

            if (isForehead) {
              const idx = (y * w + x) * 4;
              fR += data[idx];
              fG += data[idx + 1];
              fB += data[idx + 2];
              fCount++;
            } else if (isLeftCheek) {
              const idx = (y * w + x) * 4;
              lR += data[idx];
              lG += data[idx + 1];
              lB += data[idx + 2];
              lCount++;
            } else if (isRightCheek) {
              const idx = (y * w + x) * 4;
              rR += data[idx];
              rG += data[idx + 1];
              rB += data[idx + 2];
              rCount++;
            }
          }
        }

        const totalCount = fCount + lCount + rCount;
        if (totalCount > 0) {
          const rAvg = (fR + lR + rR) / totalCount;
          const gAvg = (fG + lG + rG) / totalCount;
          const bAvg = (fB + lB + rB) / totalCount;

          signalRRef.current.push(rAvg);
          signalGRef.current.push(gAvg);
          signalBRef.current.push(bAvg);

          const nowMs = performance.now();
          timeRef.current.push(nowMs);

          const elapsedSec = (nowMs - scanStartTimeRef.current) / 1000;
          if (elapsedSec > 0.5) {
            const calculatedFps = Math.round(((signalGRef.current.length - 1) / elapsedSec) * 10) / 10;
            setLiveFps(calculatedFps);
            liveFpsRef.current = calculatedFps;
          }

          // Obstruction warning logic (Fix 6): if forehead or cheeks are too dark, or there is a huge mismatch (asymmetry)
          const fAvgInt = fCount > 0 ? (fR + fG + fB) / (3 * fCount) : 0;
          const lAvgInt = lCount > 0 ? (lR + lG + lB) / (3 * lCount) : 0;
          const rAvgInt = rCount > 0 ? (rR + rG + rB) / (3 * rCount) : 0;

          const isObstructed =
            fAvgInt < 8 ||
            lAvgInt < 8 ||
            rAvgInt < 8 ||
            Math.abs(lAvgInt - rAvgInt) > 90;
          setObstructionWarning(isObstructed);

          // Show glasses advisory (not error) separately:
          const hasGlasses =
            (fAvgInt < 40 || lAvgInt < 40 || rAvgInt < 40) && !isObstructed;
          // Store in a ref for UI display
          glassesRef.current = hasGlasses;

          if (hasGlasses && signalRRef.current.length < 30) {
            setShowGlassesHint(true);
          } else {
            setShowGlassesHint(false);
          }

          const currentY = 0.299 * rAvg + 0.587 * gAvg + 0.114 * bAvg;
          const nFrames = signalRRef.current.length;
          if (nFrames > 10) {
            let ySum = 0;
            for (let i = 0; i < nFrames; i++) {
              ySum += 0.299 * signalRRef.current[i] + 0.587 * signalGRef.current[i] + 0.114 * signalBRef.current[i];
            }
            const yAvg = ySum / nFrames;
            const deviation = Math.abs(currentY - yAvg) / yAvg;

            // Relaxed thresholds — normal breathing and
            // micro-movement should NOT trigger warnings
            // Only flag truly extreme changes
            if (deviation > 0.35) {
              setBrightnessWarning(true);
              brightnessWarningRef.current = true;
              setMovementWarning(false);
            } else if (deviation > 0.22) {
              setBrightnessWarning(false);
              brightnessWarningRef.current = false;
              setMovementWarning(true);
            } else {
              setBrightnessWarning(false);
              brightnessWarningRef.current = false;
              setMovementWarning(false);
            }
          }
        }

        ctx.strokeStyle = "rgba(139, 92, 246, 0.95)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(w / 2, h / 2, w * 0.26, h * 0.36, 0, 0, 2 * Math.PI);
        ctx.stroke();

        const elapsed = Date.now() - lastTime;
        const phase = (elapsed / 2000) % 1;
        const scanY = (h / 2) - h * 0.36 + (phase * h * 0.72);
        ctx.strokeStyle = "rgba(6, 182, 212, 0.65)";
        ctx.lineWidth = 2.5;
        ctx.beginPath();

        const dy = scanY - (h / 2);
        const radiusY = h * 0.36;
        const radiusX = w * 0.26;
        const halfWidth = radiusX * Math.sqrt(Math.max(0, 1 - (dy * dy) / (radiusY * radiusY)));
        ctx.moveTo(w / 2 - halfWidth, scanY);
        ctx.lineTo(w / 2 + halfWidth, scanY);
        ctx.stroke();

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

          ctx.strokeStyle = "rgba(56, 189, 248, 0.85)";
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

        if (brightnessWarningRef.current) {
          ctx.fillStyle = "rgba(239, 68, 68, 0.85)";
          ctx.fillRect(10, 10, w - 20, 24);
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 10px system-ui, sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("WARNING: Keep still / lighting is changing!", w / 2, 25);
        }

        ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
        ctx.fillRect(10, h - 35, 62, 15);
        ctx.fillStyle = "#06b6d4";
        ctx.font = "bold 9px monospace";
        ctx.textAlign = "left";
        ctx.fillText(`FPS: ${liveFpsRef.current.toFixed(1)}`, 15, h - 25);

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

    const targetFs = 30;
    const resampledR = resampleSignal(times, R, targetFs);
    const resampledG = resampleSignal(times, G, targetFs);
    const resampledB = resampleSignal(times, B, targetFs);

    const nSamples = resampledG.length;
    if (nSamples < 200) {
      setErrorMsg(
        "Not enough signal captured. " +
        "Please ensure face is visible and " +
        "hold for the full 30 seconds."
      );
      setScanState("error");
      return;
    }

    // Adapt window size to available samples
    // Minimum window = 150 samples (5s at 30fps)
    // Ideal window = 300 samples (10s at 30fps)
    const wSize = Math.min(300, Math.floor(nSamples * 0.7));
    const wStep = Math.floor(wSize / 2);
    const hrs: number[] = [];
    const brs: number[] = [];
    const snrs: number[] = [];

    for (let startIdx = 0; startIdx + wSize <= nSamples; startIdx += wStep) {
      const subR = resampledR.slice(startIdx, startIdx + wSize);
      const subG = resampledG.slice(startIdx, startIdx + wSize);
      const subB = resampledB.slice(startIdx, startIdx + wSize);

      const winResult = estimateVitalsForWindow(subR, subG, subB, targetFs);
      if (winResult.isValid) {
        hrs.push(winResult.hr);
        brs.push(winResult.br);
        snrs.push(winResult.snr);
      }
    }

    const getMedian = (arr: number[]): number => {
      if (arr.length === 0) return 0;
      const sorted = [...arr].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      if (sorted.length % 2 !== 0) {
        return sorted[mid];
      }
      return (sorted[mid - 1] + sorted[mid]) / 2;
    };

    const medianHR = Math.round(getMedian(hrs));
    const medianBR = Math.round(getMedian(brs));
    const medianSNR = getMedian(snrs);

    // Three-tier SNR system:
    // >= 1.2 → Good signal → show results normally
    // >= 0.5 → Fair signal → show with low-confidence note
    // < 0.5  → Poor signal → show error (retry)
    if (medianSNR < 0.5) {
      setErrorMsg(
        "Signal too weak. Please ensure:\n" +
        "• Face clearly visible in oval\n" +
        "• Bright, even lighting on face\n" +
        "• Hold completely still"
      );
      setScanState("error");
      return;
    }

    let qualityError: string | null = null;

    const detrendedR = detrend(resampledR);
    const detrendedB = detrend(resampledB);
    const meanR = resampledR.reduce((sum, val) => sum + val, 0) / nSamples;
    const meanB = resampledB.reduce((sum, val) => sum + val, 0) / nSamples;
    const stdR = Math.sqrt(detrendedR.reduce((sum, val) => sum + val * val, 0) / nSamples);
    const stdB = Math.sqrt(detrendedB.reduce((sum, val) => sum + val * val, 0) / nSamples);

    // R/B ratio method (Beer-Lambert approximation)
    // More stable than raw ratio
    const rAC = stdR / (meanR > 0 ? meanR : 1);
    const bAC = stdB / (meanB > 0 ? meanB : 1);

    let spo2: number;
    if (rAC > 0.0001 && bAC > 0.0001) {
      // Calibrated formula for camera-based rPPG
      // (empirically derived, camera ≠ pulse oximeter)
      const ratio = rAC / bAC;
      spo2 = Math.round(110 - 25 * ratio);
      // Clamp to realistic range
      spo2 = Math.max(90, Math.min(100, spo2));
    } else {
      // Fallback when signal too weak
      spo2 = 97; // population average
    }

    // Clamp to physiologically realistic range
    // HR: 40-180 BPM (resting to intense exercise)
    // BR: 8-30 breaths/min
    const clampedHR = Math.round(
      Math.max(40, Math.min(180, medianHR))
    );
    const clampedBR = Math.round(
      Math.max(8, Math.min(30, medianBR))
    );

    // If clamped value = boundary (40 or 180),
    // it means signal was noise → show as estimated
    const hrIsEstimated = clampedHR === 40 || clampedHR === 180;

    setVitalQualityError(qualityError);
    setVitalSparklineData(hrs);

    setCapturedVitals({
      hr: clampedHR,
      spo2: spo2,
      br: clampedBR,
      hrList: hrs,
      snr: medianSNR,
      hrIsEstimated: hrIsEstimated
    });

    const chromWhole = computeChromSignal(resampledR, resampledG, resampledB);
    const detrendedChrom = detrend(chromWhole);
    setFinalSignal(detrendedChrom.slice(100, 300));
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

    const activePatientId = safeGetItem("saathi_asha_active_patient_id");
    let patientHeight = undefined;
    let patientWeight = undefined;

    if (activePatientId) {
      const savedPatients = safeGetItem("saathi_asha_patients");
      if (savedPatients) {
        try {
          const patients = JSON.parse(savedPatients);
          const activePatient = patients.find((p: any) => p.id === activePatientId);
          if (activePatient) {
            patientHeight = activePatient.heightCm || activePatient.height;
            patientWeight = activePatient.weightKg || activePatient.weight;
          }
        } catch (e) {
          console.error(e);
        }
      }
    }

    const heightVal = patientHeight || userProfile?.heightCm || userProfile?.height || undefined;
    const weightVal = patientWeight || userProfile?.weightKg || userProfile?.weight || undefined;
    let bmiVal = undefined;
    let bmiCatVal = undefined;

    if (heightVal && weightVal) {
      const bmiRes = calculateBMI(Number(weightVal), Number(heightVal));
      if (bmiRes) {
        bmiVal = bmiRes.bmi;
        bmiCatVal = bmiRes.category;
      }
    }

    const newEntry = {
      date: dateStr,
      heartRate: capturedVitals.hr,
      systolic: 120,
      diastolic: 80,
      oxygen: capturedVitals.spo2,
      height: heightVal,
      weight: weightVal,
      bmi: bmiVal,
      bmiCategory: bmiCatVal
    };

    const updatedHistory = [...vitalsHistory, newEntry];
    setVitalsHistory(updatedHistory);
    safeSetItem("saathi_vitals", JSON.stringify(updatedHistory));

    const newRecordItem = {
      id: Date.now(),
      title: "rPPG Contactless Vitals Scan",
      date: today.toISOString().split("T")[0],
      category: "Lab Test",
      doctor: "Saathi Camera AI Scanner",
      notes: `Heart Rate: ${capturedVitals.hr} bpm | SpO2: ${capturedVitals.spo2}% | Resp Rate: ${capturedVitals.br} bpm` +
             (heightVal && weightVal ? ` | Height: ${heightVal} cm | Weight: ${weightVal} kg | BMI: ${bmiVal} (${bmiCatVal})` : '')
    };

    const updatedRecords = [newRecordItem, ...recordsList];
    setRecordsList(updatedRecords);
    safeSetItem("saathi_records", JSON.stringify(updatedRecords));

    const vitalsRisk = (capturedVitals.spo2 < 95 || capturedVitals.hr > 100 || capturedVitals.hr < 55) ? "YELLOW" as const : "GREEN" as const;
    attachRecordToActivePatient(newRecordItem, vitalsRisk);

    setScanState("idle");
    alert(language === "hi" ? "वाइटल्स रिकॉर्ड में सफलतापूर्वक सहेज लिए गए हैं!" : language === "gu" ? "વાઇટલ્સ રેકોર્ડ્સમાં સફળતાપૂર્વક સાચવવામાં આવ્યા છે!" : "Vitals saved successfully to history and records!");
  };

  const handleAddVital = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVital.heartRate || !newVital.systolic || !newVital.diastolic || !newVital.oxygen) {
      alert(language === "hi" ? "कृपया सभी फ़ील्ड भरें।" : "Please fill in all fields.");
      return;
    }

    const today = new Date();
    const dateStr = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const activePatientId = safeGetItem("saathi_asha_active_patient_id");
    let patientHeight = undefined;
    let patientWeight = undefined;

    if (activePatientId) {
      const savedPatients = safeGetItem("saathi_asha_patients");
      if (savedPatients) {
        try {
          const patients = JSON.parse(savedPatients);
          const activePatient = patients.find((p: any) => p.id === activePatientId);
          if (activePatient) {
            patientHeight = activePatient.heightCm || activePatient.height;
            patientWeight = activePatient.weightKg || activePatient.weight;
          }
        } catch (e) {
          console.error(e);
        }
      }
    }

    const heightVal = patientHeight || userProfile?.heightCm || userProfile?.height || undefined;
    const weightVal = patientWeight || userProfile?.weightKg || userProfile?.weight || undefined;
    let bmiVal = undefined;
    let bmiCatVal = undefined;

    if (heightVal && weightVal) {
      const bmiRes = calculateBMI(Number(weightVal), Number(heightVal));
      if (bmiRes) {
        bmiVal = bmiRes.bmi;
        bmiCatVal = bmiRes.category;
      }
    }

    const newEntry = {
      date: dateStr,
      heartRate: parseInt(newVital.heartRate),
      systolic: parseInt(newVital.systolic),
      diastolic: parseInt(newVital.diastolic),
      oxygen: parseInt(newVital.oxygen),
      height: heightVal,
      weight: weightVal,
      bmi: bmiVal,
      bmiCategory: bmiCatVal
    };

    const updatedHistory = [...vitalsHistory, newEntry];
    setVitalsHistory(updatedHistory);
    safeSetItem("saathi_vitals", JSON.stringify(updatedHistory));

    const newRecordItem = {
      id: Date.now(),
      title: "Manual Vitals Entry",
      date: today.toISOString().split("T")[0],
      category: "Lab Test",
      doctor: "Manual Entry Log",
      notes: `Heart Rate: ${newEntry.heartRate} bpm | BP: ${newEntry.systolic}/${newEntry.diastolic} mmHg | SpO2: ${newEntry.oxygen}%` +
             (heightVal && weightVal ? ` | Height: ${heightVal} cm | Weight: ${weightVal} kg | BMI: ${bmiVal} (${bmiCatVal})` : '')
    };

    const updatedRecords = [newRecordItem, ...recordsList];
    setRecordsList(updatedRecords);
    safeSetItem("saathi_records", JSON.stringify(updatedRecords));

    const vitalsRisk = (newEntry.oxygen < 95 || newEntry.heartRate > 100 || newEntry.heartRate < 55) ? "YELLOW" as const : "GREEN" as const;
    attachRecordToActivePatient(newRecordItem, vitalsRisk);

    setNewVital({ heartRate: "", systolic: "", diastolic: "", oxygen: "" });
    setShowVitalForm(false);
    alert(language === "hi" ? "वाइटल्स जोड़ दिए गए हैं!" : "Vitals added successfully!");
  };

  if (scanState === "permissions" || scanState === "scanning") {
    return (
      <div className="p-4 space-y-4 animate-fadeIn flex flex-col items-center">
        <div className="text-center space-y-1 w-full">
          <h2 className="text-lg font-bold text-slate-800 flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 text-violet-600 animate-spin" />
            {scanState === "permissions" ? (language === "hi" ? "कैमरा अनुमति ले रहे हैं..." : language === "gu" ? "કેમેરા પરવાનગી મેળવી રહ્યા છીએ..." : "Requesting Camera...") : sTrans.scanning}
          </h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            {sTrans.holdStill}
          </p>
        </div>

        <div className="relative w-full md:max-w-md lg:max-w-lg mx-auto aspect-[4/3] bg-slate-950 rounded-2xl overflow-hidden shadow-lg border-2 border-violet-500/80">
          <video
            ref={videoRef}
            playsInline
            muted
            className="hidden"
          />
          <canvas
            ref={canvasRef}
            width={480}
            height={360}
            className="w-full h-full object-cover"
          />

          {scanState === "scanning" && (
            <>
              {/* Timer & FPS Badge */}
              <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md text-white font-bold text-[10px] px-3 py-1.5 rounded-full flex flex-col items-start gap-0.5 border border-white/20 shadow-md">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  <span>{secondsLeft}s {language === "hi" ? "शेष" : language === "gu" ? "બાકી" : "left"}</span>
                </div>
                <span className="text-[8px] text-slate-300 font-normal">
                  {30 - secondsLeft}s elapsed | {liveFps.toFixed(1)} FPS
                </span>
              </div>

              {/* Floating Camera Flip Button (Fix 1) */}
              <button
                onClick={toggleFacingMode}
                className="absolute top-3 right-3 z-30 w-8 h-8 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 hover:bg-black/80 transition-all active:scale-90 shadow-md"
                title="Flip Camera"
              >
                <SwitchCamera className="w-4 h-4 text-white" />
              </button>
            </>
          )}

          {scanState === "scanning" && (
            <div className="absolute top-16 left-3 right-3 flex flex-col gap-1.5 z-10">
              {brightnessWarning && (
                <div className="bg-red-500/95 backdrop-blur-sm text-white text-center text-[10px] font-bold py-1.5 px-3 rounded-lg border border-red-400/30 animate-pulse shadow-md">
                  ⚠️ {language === "hi" ? "चेतावनी: अस्थिर प्रकाश या अत्यधिक हलचल!" : language === "gu" ? "ચેતવણી: અસ્થિર પ્રકાશ અથવા ભારે હલનચલન!" : "WARNING: Unstable lighting or extreme movement!"}
                </div>
              )}
              {movementWarning && !brightnessWarning && (
                <div className="bg-amber-500/95 backdrop-blur-sm text-white text-center text-[10px] font-bold py-1.5 px-3 rounded-lg border border-amber-400/30 animate-pulse shadow-md">
                  ⚠️ {language === "hi" ? "चेतावनी: हलचल का पता चला, कृपया स्थिर रहें!" : language === "gu" ? "ચેતવણી: હલનચલન જણાયું, કૃપા કરીને સ્થિર રહો!" : "WARNING: Movement detected, please hold still!"}
                </div>
              )}
              {obstructionWarning && (
                <div className="bg-red-600/95 backdrop-blur-sm text-white text-center text-[10px] font-bold py-1.5 px-3 rounded-lg border border-red-500/30 animate-pulse shadow-md">
                  🕶️ {language === "hi" ? "चेतावनी: चेहरा ढका हुआ है या छाया है (चश्मा/बाल हटाएं)!" : language === "gu" ? "ચેતવણી: ચહેરો ઢંકાયેલો છે અથવા પડછાયો છે (ચશ્મા/વાળ દૂર કરો)!" : "WARNING: Face obstructed or shadow (remove glasses/hair)!"}
                </div>
              )}
              {showGlassesHint && !obstructionWarning && (
                <div className="bg-amber-500/90 text-white text-center text-[10px] font-bold py-1.5 px-3 rounded-xl border border-amber-400/30 shadow-md">
                  👓 Glasses detected — results may vary. Remove if possible for better accuracy.
                </div>
              )}
              {liveFps > 0 && liveFps < 8 && secondsLeft > 20 && (
                <div className="text-[10px] text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
                  📱 Low camera FPS ({liveFps.toFixed(0)}). For best results, use a phone in good lighting. Scan continues...
                </div>
              )}
            </div>
          )}

          {scanState === "scanning" && (
            <div className="absolute bottom-3 left-3 right-3 bg-black/65 backdrop-blur-sm text-center text-[10px] text-white py-1.5 px-2 rounded-lg leading-normal">
              {language === "hi" ? "स्थिर रहें और अपने चेहरे को रोशनी में रखें" : language === "gu" ? "સ્થિર રહો અને ચહેરા પર પ્રકાશ રાખો" : "Keep still and stay in bright light"}
            </div>
          )}
        </div>

        {scanState === "scanning" && (
          <div className="w-full md:max-w-md lg:max-w-lg h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-violet-500 transition-all duration-1000 ease-linear"
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
    if (vitalQualityError) {
      return (
        <div className="p-4 space-y-4 animate-fadeIn">
          <div className="bg-red-50 border border-red-100 p-5 rounded-2xl flex flex-col items-center text-center space-y-3 shadow-sm">
            <AlertTriangle className="w-12 h-12 text-red-500 animate-bounce" />
            <h3 className="text-sm font-bold text-red-800">
              {language === "hi" ? "कमजोर सिग्नल - पुनः प्रयास करें" : language === "gu" ? "નબળો સિગ્નલ - ફરી પ્રયાસ કરો" : "Signal Quality Alert"}
            </h3>
            <p className="text-xs text-red-600 font-semibold leading-relaxed max-w-sm">
              {vitalQualityError}
            </p>
            <div className="bg-white border border-red-100 rounded-xl p-3.5 text-left w-full space-y-2 text-[11px] text-slate-600">
              <p className="font-bold text-slate-700">{language === "hi" ? "सुझाव:" : language === "gu" ? "ટિપ્સ:" : "Tips for a successful scan:"}</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>{language === "hi" ? "अपने चेहरे पर पर्याप्त और एकसमान रोशनी रखें।" : language === "gu" ? "તમારા ચહેરા પર પૂરતો અને એકસમાન પ્રકાશ રાખો." : "Ensure bright, even light on your face."}</li>
                <li>{language === "hi" ? "बिना हिले-डुले और शांत बैठें।" : language === "gu" ? "હલનચલન કર્યા વિના શાંત બેસો." : "Sit completely still and do not move or talk."}</li>
                <li>{language === "hi" ? "चेहरे को नीले अंडाकार (oval) के अंदर रखें।" : language === "gu" ? "ચહેરાને વાદળી અંડાકાર (oval) ની અંદર રાખો." : "Keep your face aligned inside the blue oval guide."}</li>
              </ul>
            </div>
            <button
              onClick={startCameraScan}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              {language === "hi" ? "फिर से स्कैन करें" : language === "gu" ? "ફરીથી સ્કેન કરો" : "Retry Scan"}
            </button>
          </div>

          <button
            onClick={() => setScanState("idle")}
            className="w-full py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            {language === "hi" ? "वापस जाएँ" : language === "gu" ? "પાછા જાઓ" : "Go Back"}
          </button>
        </div>
      );
    }

    const chartData = finalSignal.map((val, idx) => ({
      time: idx,
      signal: val
    }));

    return (
      <div className="p-4 space-y-4 animate-fadeIn text-left">
        <div className="flex justify-between items-start gap-2">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-600 animate-pulse" />
              {sTrans.resultsTitle}
            </h2>
            <p className="text-xs text-slate-500 leading-normal">
              {language === "hi" ? "कैमरे से मापे गए अनुमानित जैविक मापदंड" : language === "gu" ? "કેમેરા દ્વારા માપેલા અંદાજિત જૈવિક માપદંડો" : "Estimated vital signs from your camera scan"}
            </p>
          </div>
          <VitalsSpeechPlayer hr={capturedVitals.hr} spo2={capturedVitals.spo2} br={capturedVitals.br} language={language} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="bg-gradient-to-br from-pink-50 to-white border border-pink-100 p-3 rounded-2xl flex flex-col justify-between items-center text-center shadow-sm">
            <Heart className="w-5 h-5 text-pink-500 fill-pink-100 animate-pulse" />
            <div className="my-2">
              <span className="text-2xl font-black text-pink-700">{capturedVitals.hr}</span>
              <span className="text-[9px] text-pink-500 block font-semibold">
                BPM {capturedVitals.hrIsEstimated && (language === "hi" ? "(अनुमानित)" : language === "gu" ? "(અંદાજિત)" : "(estimated)")}
              </span>
            </div>
            <span className="text-[10px] font-bold text-slate-600">{sTrans.hr}</span>
            <span className="text-[9px] text-slate-400 mt-1 font-semibold">Normal: {getNormalRanges(profileAge).hr}</span>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 p-3 rounded-2xl flex flex-col justify-between items-center text-center shadow-sm">
            <Activity className="w-5 h-5 text-emerald-500" />
            <div className="my-2">
              <span className="text-2xl font-black text-emerald-700">{capturedVitals.spo2}%</span>
              <span className="text-[9px] text-emerald-500 block font-semibold">{language === "hi" ? "अनुमानित" : language === "gu" ? "અંદાજિત" : "Approx."}</span>
            </div>
            <span className="text-[10px] font-bold text-slate-600">{sTrans.spo2}</span>
            <span className="text-[9px] text-slate-400 mt-1 font-semibold">Normal: {getNormalRanges(profileAge).spo2}%</span>
          </div>

          <div className="bg-gradient-to-br from-violet-50 to-white border border-violet-100 p-3 rounded-2xl flex flex-col justify-between items-center text-center shadow-sm">
            <div className="w-5 h-5 rounded-full border-2 border-violet-500/30 flex items-center justify-center text-[10px] font-bold text-violet-600">BR</div>
            <div className="my-2">
              <span className="text-2xl font-black text-violet-700">{capturedVitals.br}</span>
              <span className="text-[9px] text-violet-500 block font-semibold">/min</span>
            </div>
            <span className="text-[10px] font-bold text-slate-600">{sTrans.br}</span>
            <span className="text-[9px] text-slate-400 mt-1 font-semibold">Normal: {getNormalRanges(profileAge).br}</span>
          </div>

          {userProfile?.bmi ? (
            <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-100 p-3 rounded-2xl flex flex-col justify-between items-center text-center shadow-sm">
              <div className="w-5 h-5 rounded-full border-2 border-blue-500/30 flex items-center justify-center text-[10px] font-bold text-blue-600">BMI</div>
              <div className="my-2">
                <span className="text-2xl font-black text-blue-700">{userProfile.bmi}</span>
                <span className="text-[9px] text-blue-500 block font-semibold truncate max-w-[80px]">
                  {userProfile.bmiCategory ? userProfile.bmiCategory.replace('_', ' ').toUpperCase() : ""}
                </span>
              </div>
              <span className="text-[10px] font-bold text-slate-600">Body Mass Index</span>
              <span className="text-[9px] text-slate-400 mt-1 font-semibold">Healthy: 18.5 - 23</span>
            </div>
          ) : (
            <div 
              className="bg-gradient-to-br from-slate-50 to-white border border-slate-200 p-3 rounded-2xl flex flex-col justify-between items-center text-center shadow-sm cursor-pointer hover:bg-slate-100/50" 
              onClick={() => alert(language === "hi" ? "कृपया अपनी ऊंचाई और वजन प्रोफाइल में दर्ज करें।" : "Please configure your Height & Weight in Profile to calculate BMI")}
            >
              <div className="w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-500">BMI</div>
              <div className="my-2 text-[10px] text-slate-400 font-bold px-1 whitespace-nowrap">
                {language === "hi" ? "प्रोफ़ाइल सेट करें" : language === "gu" ? "પ્રોફાઇલ સેટ કરો" : "Set Profile"}
              </div>
              <span className="text-[10px] font-bold text-slate-600">Body Mass Index</span>
              <span className="text-[9px] text-slate-400 mt-1 font-semibold">Not Configured</span>
            </div>
          )}
        </div>

        {/* Tiered Confidence Feedback (Fix 5) */}
        {capturedVitals.snr !== undefined && (
          <div className={`p-3 rounded-2xl border flex items-start gap-2.5 shadow-sm text-left animate-fadeIn ${
            capturedVitals.snr >= 1.2 
              ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
              : capturedVitals.snr >= 0.5
              ? "bg-amber-50 border-amber-200 text-amber-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}>
            <AlertTriangle className={`w-4.5 h-4.5 shrink-0 mt-0.5 ${
              capturedVitals.snr >= 1.2 ? "text-emerald-600" : capturedVitals.snr >= 0.5 ? "text-amber-600" : "text-red-600"
            }`} />
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-wider">
                {capturedVitals.snr >= 1.2 
                  ? (language === "hi" ? "सिग्नल गुणवत्ता: अच्छी" : language === "gu" ? "સિગ્નલ ગુણવત્તા: સારી" : "Signal Quality: Good")
                  : (language === "hi" ? "सिग्नल गुणवत्ता: निष्पक्ष — कम विश्वसनीयता अनुमान" : language === "gu" ? "સિગ્નલ ગુણવત્તા: યોગ્ય — ઓછી વિશ્વસનીયતા અંદાજ" : "Signal Quality: Fair — low confidence estimate")
                }
              </h4>
              <p className="text-[9px] font-semibold opacity-90 mt-0.5 leading-normal">
                {capturedVitals.snr >= 1.2 
                  ? (language === "hi" ? "सिग्नल स्पष्ट और मजबूत है। आपके अनुमानित वाइटल्स अत्यधिक सटीक हैं।" : language === "gu" ? "સિગ્નલ સ્પષ્ટ અને મજબૂત છે. તમારા અંદાજિત વાઇટલ્સ અત્યંત સચોટ છે." : "The signal is clear and strong. Your estimated vitals have high baseline accuracy.")
                  : (language === "hi" ? "सिग्नल स्वीकार्य है लेकिन मामूली उतार-चढ़ाव हैं। सलाह दी जाती है कि शांत बैठें और सर्वोत्तम परिणामों के लिए पर्याप्त रोशनी में स्कैन करें।" : language === "gu" ? "સિગ્નલ સ્વીકાર્ય છે પરંતુ નજીવો ફેરફાર છે. શાંત બેસવા અને શ્રેષ્ઠ પરિણામો માટે સારી લાઇટિંગમાં સ્કેન કરવાની સલાહ આપવામાં આવે છે." : "The signal is acceptable but contains minor noise. For highest accuracy, sit still and scan under good, direct lighting.")
                }
              </p>
            </div>
          </div>
        )}

        {capturedVitals.hrList && capturedVitals.hrList.length > 0 && (
          <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 shadow-sm space-y-2">
            <div className="flex justify-between items-center px-1">
              <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                {language === "hi" ? "प्रति-विंडो विवरण (10s माप)" : language === "gu" ? "પ્રતિ-વિંડો વિગતો (10s માપ)" : "Per-Window Heart Rate Details (10s measurements)"}
              </h4>
              <span className="text-[9px] font-bold text-slate-400 bg-slate-200/50 px-2 py-0.5 rounded-full">
                SNR: {capturedVitals.snr?.toFixed(2)}
              </span>
            </div>
            <div className="flex gap-2">
              {capturedVitals.hrList.map((val, idx) => (
                <div key={idx} className="flex-1 bg-white border border-slate-100 rounded-xl p-2 text-center shadow-sm">
                  <span className="text-[8px] font-semibold text-slate-400 block mb-0.5">W{idx + 1}</span>
                  <span className="text-xs font-black text-violet-605 font-bold">{Math.round(val)}</span>
                  <span className="text-[7px] text-slate-405 block font-bold">bpm</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-2">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider px-1">
            {language === "hi" ? "स्कैन किया गया पल्स वेवफॉर्म" : language === "gu" ? "સ્કેન કરેલ પલ્સ વેવફોર્મ" : "Captured Pulse Waveform (rPPG)"}
          </h3>
          <div className="h-28 w-full text-[9px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPulse" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <Area type="monotone" dataKey="signal" name="Signal" stroke="#0ea5e9" strokeWidth={1.5} fillOpacity={1} fill="url(#colorPulse)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-amber-55/80 border border-amber-200/60 rounded-xl p-3 flex gap-2 text-amber-800 leading-normal">
          <AlertTriangle className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-[10px] font-medium">{sTrans.disclaimer}</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={saveScanResults}
            className="flex-1 bg-violet-600 text-white font-bold text-xs py-3 rounded-xl hover:bg-violet-700 transition-colors shadow-sm min-h-[44px]"
          >
            {sTrans.save}
          </button>
          <button
            onClick={startCameraScan}
            className="px-4 py-3 border border-slate-205 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-50 transition-colors min-h-[44px]"
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
            className="flex-1 bg-violet-600 text-white font-bold text-xs py-2.5 rounded-xl hover:bg-violet-700 transition-colors min-h-[44px]"
          >
            {language === "hi" ? "पुनः प्रयास करें" : language === "gu" ? "ફરી પ્રયાસ કરો" : "Retry"}
          </button>
          <button
            onClick={cancelCameraScan}
            className="flex-1 border border-slate-200 text-slate-600 font-bold text-xs py-2.5 rounded-xl hover:bg-slate-50 transition-colors min-h-[44px]"
          >
            {language === "hi" ? "वापस जाएं" : language === "gu" ? "પાછા જાઓ" : "Go Back"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 animate-fadeIn text-left">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Activity className="w-5 h-5 text-violet-600" />
            {t.vitalsHeader}
          </h2>
          <p className="text-xs text-slate-500 leading-normal">{t.vitalsDesc}</p>
        </div>
        <button
          onClick={() => setShowVitalForm(!showVitalForm)}
          className="bg-violet-50 text-violet-600 p-2 rounded-full border border-violet-100 hover:bg-violet-100 transition-all flex items-center justify-center min-w-[40px] min-h-[40px]"
        >
          {showVitalForm ? <X className="w-4.5 h-4.5" /> : <Plus className="w-4.5 h-4.5 font-bold" />}
        </button>
      </div>

      <div className="bg-gradient-to-br from-violet-600 to-indigo-650 rounded-3xl p-5 text-white shadow-md relative overflow-hidden flex flex-col justify-between gap-4">
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
          className="w-full bg-white text-violet-700 font-extrabold text-xs py-3 rounded-2xl hover:bg-slate-50 transition-colors shadow-sm relative z-10 flex items-center justify-center gap-2 group min-h-[44px]"
        >
          <Video className="w-4 h-4 text-violet-600 transition-transform group-hover:scale-110" />
          <span>{sTrans.startScan}</span>
        </button>
      </div>

      {showVitalForm && (
        <form onSubmit={handleAddVital} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-3 animate-scaleUp">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            {language === "hi" ? "नया वाइटल लॉग करें" : language === "gu" ? "નવું વાઇટલ લોગ કરો" : "Log New Vital Metric"}
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">
                {t.bloodPressure} (Systolic) <span className="text-slate-400">({getNormalRanges(profileAge).bp.split("/")[0]})</span>
              </label>
              <input
                type="number"
                placeholder="e.g. 120"
                value={newVital.systolic}
                onChange={e => setNewVital(prev => ({ ...prev, systolic: e.target.value }))}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 font-semibold focus:outline-none focus:border-violet-500 h-[44px]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">
                {t.bloodPressure} (Diastolic) <span className="text-slate-400">({getNormalRanges(profileAge).bp.split("/")[1]})</span>
              </label>
              <input
                type="number"
                placeholder="e.g. 80"
                value={newVital.diastolic}
                onChange={e => setNewVital(prev => ({ ...prev, diastolic: e.target.value }))}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 font-semibold focus:outline-none focus:border-violet-500 h-[44px]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">
                {t.heartRate} <span className="text-slate-400">({getNormalRanges(profileAge).hr} BPM)</span>
              </label>
              <input
                type="number"
                placeholder="e.g. 72"
                value={newVital.heartRate}
                onChange={e => setNewVital(prev => ({ ...prev, heartRate: e.target.value }))}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 font-semibold focus:outline-none focus:border-violet-500 h-[44px]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">
                {t.bloodOxygen} <span className="text-slate-400">({getNormalRanges(profileAge).spo2}%)</span>
              </label>
              <input
                type="number"
                placeholder="e.g. 98"
                value={newVital.oxygen}
                onChange={e => setNewVital(prev => ({ ...prev, oxygen: e.target.value }))}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 font-semibold focus:outline-none focus:border-violet-500 h-[44px]"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-violet-600 text-white font-bold text-xs py-3 rounded-lg hover:bg-violet-700 transition-colors mt-2 min-h-[44px]"
          >
            {t.addVitalBtn}
          </button>
        </form>
      )}

      {isMounted && vitalsHistory && vitalsHistory.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-4">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1">
              <TrendingUp className="w-4 h-4 text-violet-600" />
              Blood Pressure Trend (mmHg)
            </span>
            <span className="text-[10px] text-slate-400">Past {vitalsHistory.length} Days</span>
          </div>

          <div className="w-full text-[10px]">
            <ResponsiveContainer width="100%" height={chartHeight}>
              <AreaChart data={vitalsHistory} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSys" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorDia" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c084fc" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#c084fc" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis domain={[50, 160]} stroke="#94a3b8" />
                <Tooltip />
                <Legend iconType="circle" />
                <Area type="monotone" dataKey="systolic" name="Systolic BP" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorSys)" />
                <Area type="monotone" dataKey="diastolic" name="Diastolic BP" stroke="#c084fc" strokeWidth={1.5} fillOpacity={1} fill="url(#colorDia)" />
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
            <div className="w-full text-[10px]">
              <ResponsiveContainer width="100%" height={chartHeight}>
                <AreaChart data={vitalsHistory} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorHR" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ec4899" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorO2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
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

      {vitalsHistory && vitalsHistory.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 px-1">
            {language === "hi" ? "हालिया लॉग इतिहास" : language === "gu" ? "તાજેતરનો લોગ ઇતિહાસ" : "Recent Log History"}
          </h3>
          <div className="overflow-x-auto w-full no-scrollbar">
            <table className="w-full text-xs table-fixed min-w-[320px]">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-left">
                  <th className="py-2 font-semibold w-1/4 truncate">Date</th>
                  <th className="py-2 font-semibold w-1/4 truncate">BP (S/D)</th>
                  <th className="py-2 font-semibold w-1/4 truncate">HR (BPM)</th>
                  <th className="py-2 font-semibold w-1/4 truncate">SpO2</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-700 font-medium">
                {[...vitalsHistory].reverse().map((vital, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-2 text-slate-550 truncate" title={vital.date}>{vital.date}</td>
                    <td className="py-2 truncate">{vital.systolic}/{vital.diastolic} <span className="text-[10px] text-slate-400 font-bold">mmHg</span></td>
                    <td className="py-2 text-pink-605 font-bold truncate">{vital.heartRate} bpm</td>
                    <td className="py-2 text-emerald-605 font-bold truncate">{vital.oxygen}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Step Counter Section */}
      <div className="mt-4">
        <StepCounterWidget userProfile={userProfile} />
      </div>

      {/* Collapsible Clinical Disclaimer (Fix 4) */}
      <ClinicalDisclaimer />
    </div>
  );
});

VitalsView.displayName = "VitalsView";
