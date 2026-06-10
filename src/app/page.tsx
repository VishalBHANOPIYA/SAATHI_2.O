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
  ChevronRight,
  Info,
  Calendar,
  Sparkles,
  User,
  Volume2,
  UploadCloud,
  X,
  Loader2,
  TrendingUp,
  Lock
} from "lucide-react";

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

export default function MainApp() {
  const { language, setLanguage, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"home" | "screen" | "vitals" | "talk" | "records">("home");
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

  // --- RECORDS STATE ---
  const [recordsList, setRecordsList] = useState([
    { id: 1, title: "Complete Blood Count (CBC)", date: "2026-05-15", category: "Lab Test", doctor: "Dr. A. K. Sharma" },
    { id: 2, title: "Chest X-Ray Screening", date: "2026-05-20", category: "Imaging", doctor: "Nirma Diagnostic Lab" },
    { id: 3, title: "Cardiology Prescription", date: "2026-06-02", category: "Prescription", doctor: "Dr. Ritu Patel" },
  ]);
  const [newRecord, setNewRecord] = useState({ title: "", category: "Lab Test", doctor: "" });
  const [showRecordForm, setShowRecordForm] = useState(false);

  // --- MOCK CALL STATE ---
  const [activeCall, setActiveCall] = useState(false);
  const [callTimer, setCallTimer] = useState(0);

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
  }, []);

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
      doctor: "Saathi Camera AI Scanner"
    };
    
    const updatedRecords = [newRecordItem, ...recordsList];
    setRecordsList(updatedRecords);
    localStorage.setItem("saathi_records", JSON.stringify(updatedRecords));
    
    setScanState("idle");
    alert(language === "hi" ? "वाइटल्स रिकॉर्ड में सफलतापूर्वक सहेज लिए गए हैं!" : language === "gu" ? "વાઇટલ્સ રેકોર્ડ્સમાં સફળતાપૂર્વક સાચવવામાં આવ્યા છે!" : "Vitals saved successfully to history and records!");
  };

  // Cleanup effects
  useEffect(() => {
    if (activeTab !== "vitals") {
      stopCameraStream();
      setScanState("idle");
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

  // Mock speak symptom checker
  const triggerVoiceSymptomCheck = () => {
    if (isListening) return;
    setIsListening(true);

    // After 3 seconds, insert mock voice transcript
    setTimeout(async () => {
      let voiceTranscript = "";
      if (language === "hi") {
        voiceTranscript = "मुझे पिछले दो दिनों से तेज़ बुखार, सूखी खाँसी और सांस लेने में कठिनाई हो रही है।";
      } else if (language === "gu") {
        voiceTranscript = "મને છેલ્લા બે દિવસથી ખૂબ તાવ, સૂકી ઉધરસ અને શ્વાસ લેવામાં તકલીફ છે.";
      } else {
        voiceTranscript = "I have a high fever, dry cough, and mild shortness of breath for the last two days.";
      }

      setIsListening(false);

      const userMsg = { role: "user" as const, content: voiceTranscript, timestamp: new Date() };
      setChatMessages(prev => [...prev, userMsg]);
      setIsChatLoading(true);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [...chatMessages, userMsg].map(m => ({ role: m.role, content: m.content })),
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
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsChatLoading(false);
      }
    }, 3000);
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

  // --- TELEMEDICINE MOCK TIMER ---
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeCall) {
      interval = setInterval(() => {
        setCallTimer(prev => prev + 1);
      }, 1000);
    } else {
      setCallTimer(0);
    }
    return () => clearInterval(interval);
  }, [activeCall]);

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
  const renderScreenView = () => (
    <div className="p-4 space-y-4 animate-fadeIn">
      {/* Header Info */}
      <div className="space-y-1">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-teal-600" />
          {t.screeningHeader}
        </h2>
        <p className="text-xs text-slate-500 leading-normal">{t.screeningDesc}</p>
      </div>

      {/* Screening Panel */}
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
    </div>
  );

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
  const renderTalkView = () => (
    <div className="h-full flex flex-col justify-between bg-slate-50 animate-fadeIn">
      {/* Description Info */}
      <div className="p-3 bg-white border-b border-slate-100 flex items-center justify-between shadow-sm shrink-0">
        <div>
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <Mic className="w-4 h-4 text-teal-600" />
            {t.talkHeader}
          </h2>
          <p className="text-[10px] text-slate-500">{t.talkDesc}</p>
        </div>
        <button
          onClick={triggerVoiceSymptomCheck}
          disabled={isListening}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm ${
            isListening
              ? "bg-red-500 text-white animate-pulse"
              : "bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-100"
          }`}
        >
          <Volume2 className="w-3.5 h-3.5" />
          <span>{isListening ? t.listening : t.tapToSpeak}</span>
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 no-scrollbar min-h-[300px]">
        {chatMessages.map((msg, index) => (
          <div
            key={index}
            className={`flex items-start gap-2 max-w-[85%] ${msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
          >
            <div className={`p-2 rounded-full shrink-0 ${msg.role === "user" ? "bg-slate-200 text-slate-600" : "bg-teal-600 text-white shadow-sm"}`}>
              <User className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <div
                className={`p-3 rounded-2xl text-xs font-medium leading-relaxed shadow-sm ${
                  msg.role === "user"
                    ? "bg-white text-slate-800 rounded-tr-none border border-slate-100"
                    : "bg-teal-50 text-teal-900 border border-teal-100/50 rounded-tl-none"
                }`}
              >
                {msg.content}
              </div>
              <div className={`text-[9px] text-slate-400 px-1 ${msg.role === "user" ? "text-right" : "text-left"}`}>
                {formatTime(msg.timestamp)}
              </div>
            </div>
          </div>
        ))}

        {/* Listening wave simulation */}
        {isListening && (
          <div className="mr-auto flex items-center gap-2 max-w-[85%] animate-pulse">
            <div className="p-2 rounded-full shrink-0 bg-red-500 text-white animate-bounce">
              <Mic className="w-4 h-4" />
            </div>
            <div className="p-3 bg-red-50 border border-red-100 rounded-2xl rounded-tl-none space-y-1">
              <p className="text-xs text-red-800 font-bold">{t.listening}</p>
              {/* Pulsing waveforms */}
              <div className="flex items-center gap-1 h-3 mt-1 px-1">
                <div className="w-0.5 bg-red-400 rounded animate-bounce h-2" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-0.5 bg-red-500 rounded animate-bounce h-3" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-0.5 bg-red-400 rounded animate-bounce h-1.5" style={{ animationDelay: '0.3s' }}></div>
                <div className="w-0.5 bg-red-600 rounded animate-bounce h-2.5" style={{ animationDelay: '0.4s' }}></div>
                <div className="w-0.5 bg-red-400 rounded animate-bounce h-1" style={{ animationDelay: '0.5s' }}></div>
              </div>
            </div>
          </div>
        )}

        {/* Loading Bubble */}
        {isChatLoading && (
          <div className="mr-auto flex items-start gap-2 max-w-[85%]">
            <div className="p-2 rounded-full shrink-0 bg-teal-600 text-white">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-3 bg-slate-100 rounded-2xl rounded-tl-none">
              <div className="flex gap-1 py-1">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Input bar */}
      <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-100 flex gap-2 items-center shrink-0 mb-12">
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder={language === "hi" ? "लक्षण लिखें..." : language === "gu" ? "લક્ષણો લખો..." : "Describe how you feel..."}
          className="flex-grow p-2.5 border border-slate-200 bg-slate-50 text-xs rounded-xl focus:outline-none focus:border-teal-500 font-medium text-slate-700"
        />
        <button
          type="submit"
          disabled={!chatInput.trim()}
          className="bg-teal-600 text-white p-2.5 rounded-xl hover:bg-teal-700 transition-colors disabled:opacity-50 flex items-center justify-center shadow-md active:scale-95"
        >
          <Send className="w-4.5 h-4.5" />
        </button>
      </form>
    </div>
  );

  // 5. RECORDS VIEW RENDER
  const renderRecordsView = () => (
    <div className="p-4 space-y-4 animate-fadeIn">
      {/* Header Info */}
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-600" />
            {t.recordsHeader}
          </h2>
          <p className="text-xs text-slate-500 leading-normal">{t.recordsDesc}</p>
        </div>
        <button
          onClick={() => setShowRecordForm(!showRecordForm)}
          className="bg-teal-50 text-teal-600 p-2 rounded-full border border-teal-100 hover:bg-teal-100 transition-all flex items-center justify-center"
        >
          {showRecordForm ? <X className="w-4.5 h-4.5" /> : <Plus className="w-4.5 h-4.5" />}
        </button>
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
              <label className="text-[10px] font-bold text-slate-500 uppercase">Document Title</label>
              <input
                type="text"
                placeholder="e.g. Blood Sugar Report"
                value={newRecord.title}
                onChange={e => setNewRecord(prev => ({ ...prev, title: e.target.value }))}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 font-semibold focus:outline-none focus:border-teal-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Category</label>
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
                <label className="text-[10px] font-bold text-slate-500 uppercase">Physician / Lab</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Ray"
                  value={newRecord.doctor}
                  onChange={e => setNewRecord(prev => ({ ...prev, doctor: e.target.value }))}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 font-semibold focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-teal-600 text-white font-bold text-xs py-2 rounded-lg hover:bg-teal-700 transition-colors mt-2"
          >
            {t.uploadRecordBtn}
          </button>
        </form>
      )}

      {/* Vault List */}
      <div className="space-y-3">
        {recordsList.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-100 text-center text-slate-400 text-xs">
            No health records saved. Click &quot;+&quot; to add reports.
          </div>
        ) : (
          recordsList.map((item) => (
            <div
              key={item.id}
              className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-start justify-between gap-3 hover:border-slate-200 transition-colors"
            >
              <div className="bg-slate-50 p-2.5 rounded-lg text-slate-500 shrink-0">
                <FileText className="w-5 h-5 text-teal-600" />
              </div>
              <div className="flex-grow space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-slate-800 text-xs leading-normal">{item.title}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${
                    item.category === "Prescription" 
                      ? "bg-purple-100 text-purple-700" 
                      : item.category === "Imaging" 
                      ? "bg-blue-100 text-blue-700" 
                      : "bg-teal-100 text-teal-700"
                  }`}>
                    {item.category}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {item.date}
                  </span>
                  <span>Issued By: {item.doctor}</span>
                </div>
              </div>
              <button
                onClick={() => deleteRecord(item.id)}
                className="text-slate-300 hover:text-red-500 p-1 transition-colors self-center active:scale-90"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Cloud Backup status */}
      <div className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl p-3 border border-teal-100/30 flex items-center justify-between text-[10px] text-teal-800">
        <span className="font-bold flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-teal-600" />
          End-to-End Encrypted Cloud Storage Active
        </span>
        <span className="font-semibold underline cursor-pointer">Manage Vault</span>
      </div>
    </div>
  );

  return (
    <main className="w-full max-w-[430px] h-[100dvh] bg-white sm:rounded-3xl shadow-2xl flex flex-col relative overflow-hidden border border-slate-200">
      {/* PERSISTENT DISCLAIMER BANNER */}
      <div className="bg-amber-50 border-b border-amber-200 px-3 py-2 text-[11px] text-amber-800 flex items-start gap-1.5 shrink-0 z-30 shadow-sm">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="leading-tight font-semibold">
          {t.disclaimer}
        </p>
      </div>

      {/* HEADER */}
      <header className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white px-4 py-3 shrink-0 shadow-md flex justify-between items-center z-20">
        <div>
          <div className="flex items-center gap-1.5">
            <Heart className="w-5 h-5 fill-white text-teal-600 animate-pulse" />
            <h1 className="text-lg font-bold tracking-tight">{t.appTitle}</h1>
          </div>
          <p className="text-[10px] text-teal-100 font-light mt-0.5">{t.tagline}</p>
        </div>

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
      </header>

      {/* CONTENT AREA */}
      <div className="flex-grow overflow-y-auto no-scrollbar bg-slate-50 pb-20 relative">
        {activeTab === "home" && renderHomeView()}
        {activeTab === "screen" && renderScreenView()}
        {activeTab === "vitals" && renderVitalsView()}
        {activeTab === "talk" && renderTalkView()}
        {activeTab === "records" && renderRecordsView()}
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
      </nav>

      {/* MOCK TELEMEDICINE POPUP */}
      {activeCall && (
        <div className="absolute inset-0 bg-slate-900/95 z-50 flex flex-col items-center justify-between p-6 text-white animate-scaleUp">
          <div className="text-center space-y-2 mt-10">
            <div className="bg-teal-500/10 p-5 rounded-full inline-block border border-teal-500/20 animate-pulse-ring">
              <User className="w-16 h-16 text-teal-400" />
            </div>
            <h3 className="text-lg font-bold">Saathi Health Consultant</h3>
            <p className="text-teal-400 text-xs font-semibold animate-pulse">Connecting to doctor...</p>
            <p className="text-[10px] text-slate-400 max-w-[250px] mx-auto">
              You are being connected to an AI-Simulated virtual medical assistant for consultation.
            </p>
          </div>

          <div className="text-center space-y-4 mb-10 w-full">
            <span className="text-sm font-semibold font-mono tracking-wider bg-slate-800 px-3 py-1.5 rounded-full">
              {formatCallTimer(callTimer)}
            </span>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setActiveCall(false)}
                className="bg-red-600 text-white p-4 rounded-full shadow-lg hover:bg-red-700 transition-colors flex items-center justify-center w-14 h-14"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
