"use client";

import React, { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { useLanguage } from "@/context/LanguageContext";
import { safeGetItem, safeSetItem, safeRemoveItem, safeClear } from "@/utils/localStorageHelper";
import {
  Heart,
  Settings,
  WifiOff,
  Users,
  X,
  Bell,
  AlertTriangle,
  Download,
  ChevronRight,
  ChevronDown,
  Check,
  Camera,
  FileText,
  Trash2,
  Sparkles,
  SwitchCamera,
  Search,
  Globe
} from "lucide-react";
import {
  demoPatients,
  demoMedicines,
  demoVitalsHistory,
  demoRecords
} from "../utils/demoData";

// Dynamically import heavy subcomponents to optimize bundle size and prevent SSR issues
const HomeView = dynamic(() => import("@/components/HomeView").then(m => m.HomeView), { ssr: false });
const ScreenView = dynamic(() => import("@/components/ScreenView").then(m => m.ScreenView), { ssr: false });
const VitalsView = dynamic(() => import("@/components/VitalsView").then(m => m.VitalsView), { ssr: false });
const TalkView = dynamic(() => import("@/components/TalkView").then(m => m.TalkView), { ssr: false });
const RecordsView = dynamic(() => import("@/components/RecordsView").then(m => m.RecordsView), { ssr: false });
const MedicinesView = dynamic(() => import("@/components/MedicinesView").then(m => m.MedicinesView), { ssr: false });
const AshaView = dynamic(() => import("@/components/AshaView").then(m => m.AshaView), { ssr: false });
const TelemedicineOverlay = dynamic(() => import("@/components/TelemedicineOverlay").then(m => m.TelemedicineOverlay), { ssr: false });
const BottomNav = dynamic(() => import("@/components/BottomNav").then(m => m.BottomNav), { ssr: false });
const Sidebar = dynamic(() => import("@/components/Sidebar").then(m => m.Sidebar), { ssr: false });
const RightPanel = dynamic(() => import("@/components/RightPanel").then(m => m.RightPanel), { ssr: false });

const formatABHA = (raw: string) => {
  const cleaned = raw.replace(/\D/g, "").slice(0, 14);
  if (cleaned.length <= 2) return cleaned;
  if (cleaned.length <= 6) return `${cleaned.slice(0, 2)}-${cleaned.slice(2)}`;
  if (cleaned.length <= 10) return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 6)}-${cleaned.slice(6, 10)}-${cleaned.slice(10, 14)}`;
};

export default function MainApp() {
  const { language, setLanguage, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"home" | "screen" | "vitals" | "talk" | "records" | "medicines">("home");
  const [isMounted, setIsMounted] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [onboardStep, setOnboardStep] = useState(0);
  const [agreedDisclaimer, setAgreedDisclaimer] = useState(false);

  // --- ONBOARDING CAMERA STATE ---
  const [onboardCamStream, setOnboardCamStream] = useState<MediaStream | null>(null);
  const [onboardCamErr, setOnboardCamErr] = useState<boolean>(false);
  const [onboardCamLoading, setOnboardCamLoading] = useState<boolean>(false);
  const [onboardCamFacing, setOnboardCamFacing] = useState<"user" | "environment">("environment");

  // Country codes for international phone selector (Fix 2)
  const [countryCodes, setCountryCodes] = useState([
    { code: "+91", country: "India", flag: "🇮🇳", short: "IN" },
    { code: "+1", country: "United States", flag: "🇺🇸", short: "US" },
    { code: "+44", country: "United Kingdom", flag: "🇬🇧", short: "GB" },
    { code: "+971", country: "UAE", flag: "🇦🇪", short: "AE" },
    { code: "+966", country: "Saudi Arabia", flag: "🇸🇦", short: "SA" },
    { code: "+61", country: "Australia", flag: "🇦🇺", short: "AU" },
    { code: "+49", country: "Germany", flag: "🇩🇪", short: "DE" },
    { code: "+81", country: "Japan", flag: "🇯🇵", short: "JP" },
    { code: "+86", country: "China", flag: "🇨🇳", short: "CN" },
    { code: "+33", country: "France", flag: "🇫🇷", short: "FR" },
    { code: "+55", country: "Brazil", flag: "🇧🇷", short: "BR" },
    { code: "+7", country: "Russia", flag: "🇷🇺", short: "RU" },
    { code: "+27", country: "South Africa", flag: "🇿🇦", short: "ZA" },
    { code: "+234", country: "Nigeria", flag: "🇳🇬", short: "NG" },
    { code: "+92", country: "Pakistan", flag: "🇵🇰", short: "PK" },
    { code: "+880", country: "Bangladesh", flag: "🇧🇩", short: "BD" },
    { code: "+977", country: "Nepal", flag: "🇳🇵", short: "NP" },
    { code: "+94", country: "Sri Lanka", flag: "🇱🇰", short: "LK" },
    { code: "+60", country: "Malaysia", flag: "🇲🇾", short: "MY" },
    { code: "+65", country: "Singapore", flag: "🇸🇬", short: "SG" },
  ]);
  const [selectedCountryCode, setSelectedCountryCode] = useState("+91");
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");

  // World languages for searchable dropdown selector (Fix 3)
  const worldLanguages = [
    { code: "es", label: "Spanish (Español)" },
    { code: "fr", label: "French (Français)" },
    { code: "de", label: "German (Deutsch)" },
    { code: "ar", label: "Arabic (العربية)" },
    { code: "zh", label: "Mandarin (中文)" },
    { code: "ta", label: "Tamil (தமிழ்)" },
    { code: "te", label: "Telugu (తెలుగు)" },
    { code: "mr", label: "Marathi (मराठी)" },
    { code: "bn", label: "Bengali (বাংলা)" },
    { code: "pa", label: "Punjabi (ਪੰਜਾਬી)" },
    { code: "kn", label: "Kannada (ಕನ್ನಡ)" },
    { code: "ml", label: "Malayalam (മലയാളം)" },
    { code: "or", label: "Oriya (ଓડ଼િઆ)" },
    { code: "ur", label: "Urdu (اردو)" },
    { code: "pt", label: "Portuguese (Português)" },
    { code: "vi", label: "Vietnamese (Tiếng Việt)" }
  ];
  const [worldLangSearch, setWorldLangSearch] = useState("");
  const [showWorldLangDropdown, setShowWorldLangDropdown] = useState(false);

  // Refs for custom dropdown containers (Fix 2 & Fix 3)
  const onboardCountryRef = React.useRef<HTMLDivElement>(null);
  const profileCountryRef = React.useRef<HTMLDivElement>(null);
  const onboardLangRef = React.useRef<HTMLDivElement>(null);
  const settingsLangRef = React.useRef<HTMLDivElement>(null);

  // Synchronize dropdowns so only one can be open at a time
  useEffect(() => {
    if (showCountryDropdown) {
      setShowWorldLangDropdown(false);
    }
  }, [showCountryDropdown]);

  useEffect(() => {
    if (showWorldLangDropdown) {
      setShowCountryDropdown(false);
    }
  }, [showWorldLangDropdown]);

  // Focus, click, scroll, and escape handlers for custom dropdowns (Fix 2 & Fix 3)
  useEffect(() => {
    const handleInteraction = (e: Event) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      // Close country code dropdown if open and interaction is outside
      if (showCountryDropdown) {
        const insideOnboard = onboardCountryRef.current?.contains(target);
        const insideProfile = profileCountryRef.current?.contains(target);

        // If it is a scroll event, verify if scroll happened inside the dropdown list
        if (e.type === "scroll") {
          const activeContainer = onboardCountryRef.current || profileCountryRef.current;
          if (activeContainer) {
            const scrollableList = activeContainer.querySelector(".overflow-y-auto");
            if (scrollableList && (scrollableList === target || scrollableList.contains(target))) {
              return;
            }
          }
        }

        if (!insideOnboard && !insideProfile) {
          setShowCountryDropdown(false);
        }
      }

      // Close language dropdown if open and interaction is outside
      if (showWorldLangDropdown) {
        const insideOnboard = onboardLangRef.current?.contains(target);
        const insideSettings = settingsLangRef.current?.contains(target);

        // If it is a scroll event, verify if scroll happened inside the dropdown list
        if (e.type === "scroll") {
          const activeContainer = onboardLangRef.current || settingsLangRef.current;
          if (activeContainer) {
            const scrollableList = activeContainer.querySelector(".overflow-y-auto");
            if (scrollableList && (scrollableList === target || scrollableList.contains(target))) {
              return;
            }
          }
        }

        if (!insideOnboard && !insideSettings) {
          setShowWorldLangDropdown(false);
        }
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        let activeContainer: HTMLElement | null = null;
        if (showCountryDropdown) {
          activeContainer = (onboardCountryRef.current || profileCountryRef.current) as HTMLElement | null;
        } else if (showWorldLangDropdown) {
          activeContainer = (onboardLangRef.current || settingsLangRef.current) as HTMLElement | null;
        }

        if (activeContainer) {
          const trigger = activeContainer.parentElement?.firstElementChild as HTMLElement;
          if (trigger && typeof trigger.focus === "function") {
            trigger.focus();
          }
        }
        setShowCountryDropdown(false);
        setShowWorldLangDropdown(false);
        return;
      }

      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        let activeContainer: HTMLElement | null = null;
        if (showCountryDropdown) {
          activeContainer = (onboardCountryRef.current || profileCountryRef.current) as HTMLElement | null;
        } else if (showWorldLangDropdown) {
          activeContainer = (onboardLangRef.current || settingsLangRef.current) as HTMLElement | null;
        }

        if (!activeContainer) return;

        // Find focusable items in the active dropdown (inputs and buttons)
        const focusables = Array.from(
          activeContainer.querySelectorAll("input, button:not([disabled])")
        ) as HTMLElement[];

        if (focusables.length === 0) return;

        const activeEl = document.activeElement as HTMLElement;
        const currentIndex = focusables.indexOf(activeEl);

        let nextIndex = currentIndex;
        if (e.key === "ArrowDown") {
          if (currentIndex === -1) {
            nextIndex = 0;
          } else {
            nextIndex = currentIndex < focusables.length - 1 ? currentIndex + 1 : 0;
          }
        } else if (e.key === "ArrowUp") {
          if (currentIndex === -1) {
            nextIndex = focusables.length - 1;
          } else {
            nextIndex = currentIndex > 0 ? currentIndex - 1 : focusables.length - 1;
          }
        }

        focusables[nextIndex]?.focus();
        e.preventDefault();
      }
    };

    const handleWindowBlur = () => {
      setShowCountryDropdown(false);
      setShowWorldLangDropdown(false);
    };

    // Use capture phase to handle events reliably before propagation is stopped
    document.addEventListener("pointerdown", handleInteraction, true);
    document.addEventListener("focusin", handleInteraction, true);
    document.addEventListener("scroll", handleInteraction, true);
    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      document.removeEventListener("pointerdown", handleInteraction, true);
      document.removeEventListener("focusin", handleInteraction, true);
      document.removeEventListener("scroll", handleInteraction, true);
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [showCountryDropdown, showWorldLangDropdown]);

  // Stop camera stream when leaving onboard step 1
  useEffect(() => {
    if (onboardStep !== 1 && onboardCamStream) {
      onboardCamStream.getTracks().forEach(track => track.stop());
      setOnboardCamStream(null);
    }
  }, [onboardStep, onboardCamStream]);

  // Cleanup stream on unmount
  useEffect(() => {
    return () => {
      if (onboardCamStream) {
        onboardCamStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [onboardCamStream]);

  // --- PROFILE STATE ---
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [welcomeToast, setWelcomeToast] = useState<string | null>(null);
  const [profileSubStep, setProfileSubStep] = useState<"A" | "B">("A");
  const [profileForm, setProfileForm] = useState({
    name: "",
    age: "",
    gender: "Male",
    phone: "",
    conditions: [] as string[],
    otherCondition: "",
    allergies: "",
    medications: "",
    bloodGroup: "Unknown",
    emergencyName: "",
    emergencyPhone: "",
    abha: ""
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // --- SHARED STATE ---
  const [recordsList, setRecordsList] = useState<any[]>([]);
  const [vitalsHistory, setVitalsHistory] = useState<any[]>([]);
  const [medicinesList, setMedicinesList] = useState<any[]>([]);
  const [patientsList, setPatientsList] = useState<any[]>([]);
  const [activePatientId, setActivePatientId] = useState<string | null>(null);
  const [ashaModeActive, setAshaModeActive] = useState(false);

  // --- INTER-TAB COMMUNICATION STATE ---
  const [triageResult, setTriageResult] = useState<any | null>(null);
  const [screenResults, setScreenResults] = useState<any | null>(null);
  const [transcriptText, setTranscriptText] = useState("");

  // --- REMINDERS & SETTINGS STATE ---
  const [reminderActive, setReminderActive] = useState(false);
  const [caregiverAlert, setCaregiverAlert] = useState(false);
  const [drugInteractionNote, setDrugInteractionNote] = useState<string | null>(null);
  const [pendingReminderAlert, setPendingReminderAlert] = useState<{ name: string; dose: string; frequency: string } | null>(null);

  // --- TELEMEDICINE OVERLAY STATE ---
  const [activeCall, setActiveCall] = useState(false);

  // --- SETTINGS MODAL ---
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [resetConfirmPending, setResetConfirmPending] = useState(false);
  const [resetCountdown, setResetCountdown] = useState(5);

  // --- OFFLINE & PWA STATE ---
  const [isOffline, setIsOffline] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [demoModeActive, setDemoModeActive] = useState(false);

  // --- INITIALIZATION ---
  useEffect(() => {
    setIsMounted(true);
    
    const savedDemoMode = safeGetItem("saathi_demo_mode") === "true";
    setDemoModeActive(savedDemoMode);
    
    const onboarded = safeGetItem("saathi_onboarding_complete");
    if (onboarded === "true") {
      setShowOnboarding(false);
    } else {
      setShowOnboarding(true);
      setOnboardStep(0);
    }

    const savedProfile = safeGetItem("saathi_user_profile");
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        setUserProfile(parsed);
        if (parsed.countryCode) {
          setSelectedCountryCode(parsed.countryCode);
        }
        setProfileForm({
          name: parsed.name || "",
          age: String(parsed.age || ""),
          gender: parsed.gender || "Male",
          phone: parsed.phone || "",
          conditions: parsed.conditions || [],
          otherCondition: parsed.otherCondition || "",
          allergies: parsed.allergies || "",
          medications: parsed.medications || "",
          bloodGroup: parsed.bloodGroup || "Unknown",
          emergencyName: parsed.emergencyContact?.name || "",
          emergencyPhone: parsed.emergencyContact?.phone || "",
          abha: parsed.abha || ""
        });
      } catch (e) {
        console.error("Failed to parse saved user profile:", e);
      }
    }

    const savedVitals = safeGetItem("saathi_vitals");
    if (savedVitals) {
      try {
        setVitalsHistory(JSON.parse(savedVitals));
      } catch (e) {
        console.error("Failed to parse saved vitals:", e);
      }
    } else {
      const initialVitals = [
        { date: "06-05", heartRate: 72, systolic: 120, diastolic: 80, oxygen: 98 },
        { date: "06-06", heartRate: 75, systolic: 122, diastolic: 81, oxygen: 99 },
        { date: "06-07", heartRate: 68, systolic: 118, diastolic: 79, oxygen: 97 },
        { date: "06-08", heartRate: 70, systolic: 119, diastolic: 80, oxygen: 98 },
        { date: "06-09", heartRate: 74, systolic: 121, diastolic: 82, oxygen: 99 },
        { date: "06-10", heartRate: 71, systolic: 120, diastolic: 80, oxygen: 98 },
      ];
      setVitalsHistory(initialVitals);
      safeSetItem("saathi_vitals", JSON.stringify(initialVitals));
    }
    
    const savedRecords = safeGetItem("saathi_records");
    if (savedRecords) {
      try {
        setRecordsList(JSON.parse(savedRecords));
      } catch (e) {
        console.error("Failed to parse saved records:", e);
      }
    } else {
      const initialRecords = [
        { id: 1, title: "Complete Blood Count (CBC)", date: "2026-05-15", category: "Lab Test", doctor: "Dr. A. K. Sharma", notes: "Hemoglobin: 14.2 g/dL, WBC: 6500 /mcL. All values within normal range." },
        { id: 2, title: "Chest X-Ray Screening", date: "2026-05-20", category: "Imaging", doctor: "Nirma Diagnostic Lab", notes: "Clear lung fields. No active infiltrates or pleural effusion noted." },
        { id: 3, title: "Cardiology Prescription", date: "2026-06-02", category: "Prescription", doctor: "Dr. Ritu Patel", notes: "Rx: Tab. Metoprolol 25mg QD, Tab. Aspirin 75mg QD. Follow-up in 4 weeks." },
      ];
      setRecordsList(initialRecords);
      safeSetItem("saathi_records", JSON.stringify(initialRecords));
    }

    const savedMeds = safeGetItem("saathi_medicines");
    if (savedMeds) {
      try {
        setMedicinesList(JSON.parse(savedMeds));
      } catch (e) {
        console.error("Failed to parse saved medicines:", e);
      }
    }
    const savedInteractions = safeGetItem("saathi_drug_interactions");
    if (savedInteractions) {
      setDrugInteractionNote(savedInteractions);
    }
    const savedCaregiver = safeGetItem("saathi_caregiver_alert");
    if (savedCaregiver) {
      setCaregiverAlert(savedCaregiver === "true");
    }
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      setReminderActive(true);
    }

    // Register Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js")
        .then((reg) => console.log("Service Worker registered scope:", reg.scope))
        .catch((err) => console.error("Service Worker registration failed:", err));
    }

    // Load ASHA worker settings
    const savedAshaMode = safeGetItem("saathi_asha_mode_active") === "true";
    setAshaModeActive(savedAshaMode);
    const savedActiveId = safeGetItem("saathi_asha_active_patient_id");
    if (savedActiveId) {
      setActivePatientId(savedActiveId);
    }
    const savedPatients = safeGetItem("saathi_asha_patients");
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
      safeSetItem("saathi_asha_patients", JSON.stringify(initialPatients));
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

  // Automatically detect user's country code on first load (Fix: Auto-detect Country Code)
  useEffect(() => {
    const detectCountry = async () => {
      // 1. Try localStorage or saved profile first
      const cachedCode = safeGetItem("saathi_country_code");
      if (cachedCode) {
        setSelectedCountryCode(cachedCode);
        return;
      }

      const savedProfile = safeGetItem("saathi_user_profile");
      if (savedProfile) {
        try {
          const parsed = JSON.parse(savedProfile);
          if (parsed.countryCode) {
            setSelectedCountryCode(parsed.countryCode);
            safeSetItem("saathi_country_code", parsed.countryCode);
            return;
          }
        } catch (e) {
          console.error("Failed to parse saved profile in detectCountry:", e);
        }
      }

      // Helper function to set country code and save to localStorage (with dynamic additions)
      const selectCountryByShortCode = (shortCode: string, name?: string, callingCode?: string): boolean => {
        const upperShort = shortCode.toUpperCase();
        
        // Comprehensive mapping of common ISO code to calling code as reference
        const ISO_TO_CALLING_CODE: Record<string, string> = {
          US: "+1", CA: "+1", MX: "+52", GB: "+44", DE: "+49", FR: "+33", IT: "+39", ES: "+34", NL: "+31", SE: "+46", NO: "+47", FI: "+358", DK: "+45", CH: "+41", AT: "+43", BE: "+32", IE: "+353", PT: "+351", GR: "+30", PL: "+48", CZ: "+420", HU: "+36", RO: "+40", BG: "+359", HR: "+385", SK: "+421", SI: "+386", EE: "+372", LV: "+371", LT: "+370",
          IN: "+91", CN: "+86", JP: "+81", KR: "+82", SG: "+65", MY: "+60", TH: "+66", ID: "+62", PH: "+63", VN: "+84", PK: "+92", BD: "+880", LK: "+94", NP: "+977", MM: "+95", KH: "+855", LA: "+856", MN: "+976", AF: "+93", MV: "+960", BT: "+975",
          AE: "+971", SA: "+966", IL: "+972", TR: "+90", EG: "+20", ZA: "+27", NG: "+234", KE: "+254", GH: "+233", MA: "+212", DZ: "+213", TN: "+216", LY: "+218", SD: "+249", ET: "+251", SO: "+252", DJ: "+253", SN: "+221", GM: "+220", MR: "+222", ML: "+223", GN: "+224", SL: "+232", LR: "+231", CI: "+225", TG: "+228", BJ: "+229", NE: "+227", BF: "+226",
          AU: "+61", NZ: "+64", FJ: "+679", PG: "+675", SB: "+677", VU: "+678", TO: "+676", WS: "+685",
          BR: "+55", AR: "+54", CL: "+56", CO: "+57", PE: "+51", VE: "+58", EC: "+593", BO: "+591", PY: "+595", UY: "+598", GY: "+592", SR: "+597", GF: "+594",
          RU: "+7", UA: "+380", BY: "+375", KZ: "+7", UZ: "+998", AZ: "+994", GE: "+995", AM: "+374", MD: "+373", KG: "+996", TJ: "+992", TM: "+993"
        };

        const code = callingCode || ISO_TO_CALLING_CODE[upperShort];
        if (!code) return false;

        const countryName = name || upperShort;

        // Generate flag emoji
        let flag = "🌐";
        try {
          const codePoints = upperShort.split('').map(char => 127397 + char.charCodeAt(0));
          flag = String.fromCodePoint(...codePoints);
        } catch (e) {
          console.error("Error generating flag:", e);
        }

        const newCountry = {
          code,
          country: countryName,
          flag,
          short: upperShort
        };

        setCountryCodes(prev => {
          if (prev.some(c => c.short === upperShort)) {
            return prev;
          }
          return [...prev, newCountry];
        });

        setSelectedCountryCode(code);
        safeSetItem("saathi_country_code", code);
        return true;
      };

      // Helper function to try IP geolocation (sequentially)
      const detectCountryByIP = async () => {
        // Try FreeIPAPI first (fast, free HTTPS, supports calling codes)
        try {
          const response = await fetch("https://freeipapi.com/api/json");
          if (response.ok) {
            const data = await response.json();
            const countryCode = data.countryCode;
            const countryName = data.countryName;
            const callingCode = data.countriesCallingCodes && data.countriesCallingCodes[0] 
              ? `+${data.countriesCallingCodes[0]}` 
              : undefined;
            if (countryCode && selectCountryByShortCode(countryCode, countryName, callingCode)) {
              return;
            }
          }
        } catch (e) {
          console.warn("freeipapi.com failed, trying fallback...", e);
        }

        // Try IPAPI.co
        try {
          const response = await fetch("https://ipapi.co/json/");
          if (response.ok) {
            const data = await response.json();
            const countryCode = data.country_code;
            const countryName = data.country_name;
            const callingCode = data.country_calling_code;
            if (countryCode && selectCountryByShortCode(countryCode, countryName, callingCode)) {
              return;
            }
          }
        } catch (e) {
          console.warn("ipapi.co failed, trying next fallback...", e);
        }

        // Try IPInfo (no token fallback)
        try {
          const response = await fetch("https://ipinfo.io/json");
          if (response.ok) {
            const data = await response.json();
            const countryCode = data.country;
            if (countryCode && selectCountryByShortCode(countryCode)) {
              return;
            }
          }
        } catch (e) {
          console.warn("ipinfo.io failed, using default...", e);
        }

        // Default to India (+91) if all else fails
        setSelectedCountryCode("+91");
      };

      // 2. Try Geolocation API
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            
            // Try BigDataCloud reverse geocoding first (fast, free, over HTTPS, no key)
            try {
              const response = await fetch(
                `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
              );
              if (response.ok) {
                const data = await response.json();
                const countryCode = data.countryCode;
                const countryName = data.countryName;
                if (countryCode && selectCountryByShortCode(countryCode, countryName)) {
                  return;
                }
              }
            } catch (e) {
              console.warn("BigDataCloud reverse geocoding failed, trying OSM Nominatim fallback...", e);
            }

            // Fallback to OSM Nominatim
            try {
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=3&addressdetails=1`,
                {
                  headers: {
                    "Accept-Language": "en"
                  }
                }
              );
              if (response.ok) {
                const data = await response.json();
                const countryCode = data.address?.country_code;
                const countryName = data.address?.country;
                if (countryCode && selectCountryByShortCode(countryCode.toUpperCase(), countryName)) {
                  return;
                }
              }
            } catch (error) {
              console.warn("OSM Nominatim reverse geocoding failed, trying IP detection:", error);
            }

            // If reverse geocoding fails, try IP fallback
            await detectCountryByIP();
          },
          async (error) => {
            console.log("Geolocation permission denied or error, using IP fallback:", error);
            await detectCountryByIP();
          },
          { timeout: 10000, maximumAge: 600000 }
        );
      } else {
        await detectCountryByIP();
      }
    };

    detectCountry();
  }, []);

  // --- PATIENT ATTACHMENT CALLBACK ---
  const attachRecordToActivePatient = useCallback((record: any, riskBand?: "GREEN" | "YELLOW" | "RED") => {
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
  }, [activePatientId, ashaModeActive, patientsList]);

  const selectActivePatientForASHA = useCallback((id: string | null) => {
    setActivePatientId(id);
    if (id) {
      safeSetItem("saathi_asha_active_patient_id", id);
    } else {
      safeRemoveItem("saathi_asha_active_patient_id");
    }
  }, []);

  const toggleDemoMode = () => {
    if (!demoModeActive) {
      const confirmMsg = t.demoActivateConfirm;

      if (window.confirm(confirmMsg)) {
        setDemoModeActive(true);
        safeSetItem("saathi_demo_mode", "true");

        const updatedPatients = [...demoPatients, ...patientsList];
        setPatientsList(updatedPatients);
        safeSetItem("saathi_asha_patients", JSON.stringify(updatedPatients));

        const updatedVitals = [...demoVitalsHistory, ...vitalsHistory];
        setVitalsHistory(updatedVitals);
        safeSetItem("saathi_vitals", JSON.stringify(updatedVitals));

        const updatedRecords = [...demoRecords, ...recordsList];
        setRecordsList(updatedRecords);
        safeSetItem("saathi_records", JSON.stringify(updatedRecords));

        const updatedMedicines = [...demoMedicines, ...medicinesList];
        setMedicinesList(updatedMedicines);
        safeSetItem("saathi_medicines", JSON.stringify(updatedMedicines));
      }
    } else {
      const confirmMsg = t.demoDeactivateConfirm;

      if (window.confirm(confirmMsg)) {
        setDemoModeActive(false);
        safeSetItem("saathi_demo_mode", "false");

        const cleanedPatients = patientsList.filter(p => !p.isDemo);
        setPatientsList(cleanedPatients);
        safeSetItem("saathi_asha_patients", JSON.stringify(cleanedPatients));

        const cleanedVitals = vitalsHistory.filter(v => !v.isDemo);
        setVitalsHistory(cleanedVitals);
        safeSetItem("saathi_vitals", JSON.stringify(cleanedVitals));

        const cleanedRecords = recordsList.filter(r => !r.isDemo);
        setRecordsList(cleanedRecords);
        safeSetItem("saathi_records", JSON.stringify(cleanedRecords));

        const cleanedMedicines = medicinesList.filter(m => !m.isDemo);
        setMedicinesList(cleanedMedicines);
        safeSetItem("saathi_medicines", JSON.stringify(cleanedMedicines));

        if (activePatientId && activePatientId.startsWith("demo-")) {
          setActivePatientId(null);
          safeRemoveItem("saathi_asha_active_patient_id");
        }
      }
    }
  };

  // --- RESET COUNTDOWN EFFECT ---
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resetConfirmPending && resetCountdown > 0) {
      timer = setTimeout(() => {
        setResetCountdown(prev => prev - 1);
      }, 1000);
    } else if (resetConfirmPending && resetCountdown === 0) {
      setResetConfirmPending(false);
      setResetCountdown(5);
    }
    return () => clearTimeout(timer);
  }, [resetConfirmPending, resetCountdown]);

  // --- REMINDERS HANDLER ---
  useEffect(() => {
    if (typeof window === "undefined" || medicinesList.length === 0) return;

    const checkReminders = () => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, "0");
      const mm = String(now.getMinutes()).padStart(2, "0");
      const currentHHMM = `${hh}:${mm}`;

      const lastFired = safeGetItem("saathi_last_fired_time");
      if (lastFired === currentHHMM) return;

      const matches = medicinesList.filter(m => m.reminderTime === currentHHMM);
      if (matches.length > 0) {
        safeSetItem("saathi_last_fired_time", currentHHMM);
        
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

  // --- PWA INSTALL HANDLER ---
  const handleInstallClick = useCallback(async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install: ${outcome}`);
    setDeferredPrompt(null);
    setIsInstallable(false);
  }, [deferredPrompt]);

  // --- HEALTH PROFILE VALIDATION HELPERS ---
  const validateSubStepA = () => {
    const errors: { [key: string]: string } = {};
    if (!profileForm.name.trim()) {
      errors.name = t.valNameRequired;
    }
    const ageNum = Number(profileForm.age);
    if (!profileForm.age || isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
      errors.age = t.valAgeValid;
    }
    const phoneTrim = profileForm.phone.trim();
    if (!phoneTrim || phoneTrim.length < 4 || phoneTrim.length > 15 || !/^\d+$/.test(phoneTrim)) {
      errors.phone = t.valPhoneValid;
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateSubStepB = () => {
    const errors: { [key: string]: string } = {};
    const emergencyPhone = profileForm.emergencyPhone.trim();
    if (emergencyPhone && (emergencyPhone.length < 4 || emergencyPhone.length > 15 || !/^\d+$/.test(emergencyPhone))) {
      errors.emergencyPhone = t.valEmergencyPhoneValid;
    }
    const abhaTrim = profileForm.abha.replace(/\D/g, "");
    if (abhaTrim && abhaTrim.length !== 14) {
      errors.abha = t.valAbhaValid;
    }
    setFormErrors(prev => ({ ...prev, ...errors }));
    return Object.keys(errors).length === 0;
  };

  const handleConditionClick = (cond: string) => {
    setProfileForm(p => {
      let nextConds = [...p.conditions];
      if (cond === "None") {
        nextConds = ["None"];
      } else {
        nextConds = nextConds.filter(c => c !== "None");
        if (nextConds.includes(cond)) {
          nextConds = nextConds.filter(c => c !== cond);
        } else {
          nextConds.push(cond);
        }
      }
      return { ...p, conditions: nextConds };
    });
  };

  const handleSaveProfile = () => {
    if (profileSubStep === "A") {
      if (!validateSubStepA()) return;
    } else {
      if (!validateSubStepB()) return;
    }

    const existingProfile = userProfile || {};
    const finalProfile = {
      name: profileForm.name.trim(),
      age: Number(profileForm.age),
      gender: profileForm.gender,
      phone: profileForm.phone.trim(),
      countryCode: selectedCountryCode,
      conditions: profileForm.conditions,
      otherCondition: profileForm.conditions.includes("Other") ? profileForm.otherCondition.trim() : "",
      allergies: profileForm.allergies.trim(),
      medications: profileForm.medications.trim(),
      bloodGroup: profileForm.bloodGroup,
      emergencyContact: {
        name: profileForm.emergencyName.trim(),
        phone: profileForm.emergencyPhone.trim()
      },
      abha: profileForm.abha.replace(/\D/g, ""),
      language,
      createdAt: existingProfile.createdAt || new Date().toISOString()
    };

    safeSetItem("saathi_user_profile", JSON.stringify(finalProfile));
    setUserProfile(finalProfile);

    // If we are in onboarding, finish it
    if (showOnboarding) {
      safeSetItem("saathi_onboarding_complete", "true");
      setShowOnboarding(false);

      // Trigger Namaste Toast
      const firstName = finalProfile.name.split(" ")[0];
      const toastMsg = `${t.namaste || 'Namaste'}, ${firstName}!`;
      setWelcomeToast(toastMsg);
      setTimeout(() => {
        setWelcomeToast(null);
      }, 4000);
    }
  };

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab as any);
  }, []);

  const handleUpdateProfile = useCallback((updated: any) => {
    setUserProfile(updated);
    safeSetItem("saathi_user_profile", JSON.stringify(updated));
  }, []);

  const handleResetApp = useCallback(() => {
    const confirmed = window.confirm(
      t.resetConfirmShort
    );
    if (confirmed) {
      safeRemoveItem("saathi_onboarding_complete");
      safeRemoveItem("saathi_user_profile");
      window.location.reload();
    }
  }, [language]);

  // --- ONBOARDING UI ---
  const renderOnboarding = () => {
    return (
      <div className="absolute inset-0 bg-[#F7F9FC] text-[#111827] z-50 flex flex-col font-sans p-4 sm:p-8 md:p-12 justify-between select-none animate-fadeIn items-center overflow-y-auto">
        {/* Decorative background blurs */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl pointer-events-none -translate-x-1/4 translate-y-1/4" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-accent/5 rounded-full blur-3xl pointer-events-none translate-x-1/4 -translate-y-1/4" />

        {/* Top Header */}
        <div className="flex justify-between items-center z-10 shrink-0 w-full max-w-lg mb-6">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
              <Heart className="w-5 h-5 text-primary fill-primary/20 animate-pulse" />
            </div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Saathi</span>
          </div>
          {onboardStep >= 1 && onboardStep <= 3 && (
            <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full border border-primary/20 shadow-soft">
              {t.onboardStepIndicator ? t.onboardStepIndicator.replace("{current}", String(onboardStep)) : `Step ${onboardStep} of 3`}
            </span>
          )}
        </div>

        {/* STEP 0: Welcome & Language selection */}
        {onboardStep === 0 && (
          <div className="w-full my-auto flex flex-col justify-center space-y-6 z-10 animate-scaleUp text-center max-w-lg card-premium p-5 sm:p-8 border border-slate-100 bg-white/80 backdrop-blur-md shadow-soft">
            <div className="space-y-3 animate-fadeIn">
              <div className="w-20 h-20 bg-violet-600 rounded-full flex items-center justify-center mx-auto shadow-md">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                  <Heart className="w-8 h-8 text-violet-600 fill-violet-600/10 animate-pulse" />
                </div>
              </div>
              <h2 className="text-[28px] font-bold mt-4 text-violet-600 leading-none">
                Saathi
              </h2>
              <p className="text-sm text-gray-500 max-w-xs mx-auto leading-relaxed font-semibold">
                Your AI Health Companion
              </p>
            </div>

            <div className="space-y-3 pt-4 w-full text-left">
              <span className="text-[10px] font-bold text-textsecondary uppercase tracking-wider block text-center">
                Select Your Language / भाषा चुनें / ભાષા પસંદ કરો
              </span>
              <div className="grid grid-cols-1 gap-2.5">
                {[
                  { code: "en", label: "English" },
                  { code: "hi", label: "हिंदी (Hindi)" },
                  { code: "gu", label: "ગુજરાતી (Gujarati)" }
                ].map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      setLanguage(l.code as any);
                      setShowWorldLangDropdown(false);
                    }}
                    className={`py-3 px-6 rounded-full text-xs font-bold border-2 transition-all flex items-center justify-between w-full ${
                      (language === l.code)
                        ? "bg-violet-600 border-violet-600 text-white shadow-soft scale-[1.01]"
                        : "bg-white border-violet-600 text-violet-600 hover:bg-violet-50"
                    }`}
                  >
                    <span>{l.label}</span>
                    {language === l.code && <Check className="w-4 h-4 text-white" />}
                  </button>
                ))}
              </div>

              {/* World language selector (Fix 3) */}
              <div className="space-y-2 pt-2 relative text-left">
                <span className="text-[10px] font-bold text-textsecondary uppercase tracking-wider block text-center">
                  {t.onboardOrSelectOtherLanguage}
                </span>
                <div className="relative" ref={onboardLangRef}>
                  <button
                    type="button"
                    id="onboard-lang-btn"
                    aria-haspopup="listbox"
                    aria-expanded={showWorldLangDropdown}
                    aria-controls="onboard-lang-listbox"
                    onClick={() => setShowWorldLangDropdown(!showWorldLangDropdown)}
                    className="w-full bg-white border-2 border-violet-600 rounded-full py-3 px-6 text-xs text-left font-bold flex items-center justify-between text-violet-600 hover:bg-violet-50 transition-colors focus:border-violet-600 focus:outline-none"
                  >
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-violet-600" />
                      <span className="text-violet-600">
                        {worldLanguages.find(wl => wl.code === language)?.label || t.selectLanguage}
                      </span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-violet-600" />
                  </button>

                  {showWorldLangDropdown && (
                    <div id="onboard-lang-listbox" role="listbox" aria-labelledby="onboard-lang-btn" className="absolute left-0 right-0 bottom-full mb-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden max-h-48 flex flex-col">
                      <div className="p-2 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
                        <Search className="w-3.5 h-3.5 text-textsecondary shrink-0" />
                        <input
                          type="text"
                          placeholder="Search language..."
                          value={worldLangSearch}
                          onChange={e => setWorldLangSearch(e.target.value)}
                          className="w-full text-xs bg-transparent text-textprimary focus:outline-none placeholder-textsecondary"
                        />
                      </div>
                      <div className="overflow-y-auto flex-1">
                        {worldLanguages.filter(wl =>
                          wl.label.toLowerCase().includes(worldLangSearch.toLowerCase()) ||
                          wl.code.toLowerCase().includes(worldLangSearch.toLowerCase())
                        ).map(wl => (
                          <button
                            key={wl.code}
                            type="button"
                            role="option"
                            aria-selected={language === wl.code}
                            onClick={(e) => {
                              setLanguage(wl.code);
                              setShowWorldLangDropdown(false);
                              setWorldLangSearch("");
                              const trigger = e.currentTarget.closest('.relative')?.firstElementChild as HTMLElement;
                              if (trigger && typeof trigger.focus === "function") {
                                trigger.focus();
                              }
                            }}
                            className={`w-full text-left px-4 py-3 text-xs font-semibold hover:bg-violet-50 transition-colors flex items-center justify-between ${
                              language === wl.code ? "bg-violet-100 text-violet-700 font-bold" : "text-textsecondary"
                            }`}
                          >
                            <span>{wl.label}</span>
                            {language === wl.code && <Check className="w-3.5 h-3.5 text-violet-600" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={() => setOnboardStep(1)}
                className="w-full py-4 px-6 rounded-full bg-violet-600 hover:bg-violet-750 text-sm font-bold text-white shadow-soft transition-all active:scale-[0.97] flex items-center justify-center gap-1.5 mx-auto"
              >
                <span>{t.onboardGetStarted}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}


        {/* Slide 1 */}
        {onboardStep === 1 && (
          <div className="w-full my-auto flex flex-col justify-between space-y-4 z-10 animate-slide-in text-left max-w-lg card-premium p-5 sm:p-8 border border-slate-100 bg-white/80 backdrop-blur-md shadow-soft">
            <div className="flex justify-between items-center shrink-0">
              <span className="text-[10px] font-black uppercase text-primary tracking-widest bg-primary/10 px-2.5 py-1 rounded-full">
                {t.onboardFeature1Title}
              </span>
              <button 
                onClick={() => setOnboardStep(4)} 
                className="text-xs font-bold text-textsecondary hover:text-primary transition-colors uppercase tracking-wider"
              >
                {t.skip}
              </button>
            </div>
            
            <div className="flex-1 flex flex-col justify-center space-y-4">
              {/* Tappable Live Camera Demo Box */}
              <div
                className="w-full aspect-video bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-center relative overflow-hidden group shrink-0 cursor-pointer active:scale-[0.98] transition-transform"
                onClick={async () => {
                  if (onboardCamStream || onboardCamLoading) return;
                  setOnboardCamLoading(true);
                  try {
                    const stream = await navigator.mediaDevices.getUserMedia({
                      video: { facingMode: onboardCamFacing, width: { ideal: 480 }, height: { ideal: 360 } }
                    });
                    setOnboardCamStream(stream);
                    setOnboardCamErr(false);
                  } catch {
                    setOnboardCamErr(true);
                  } finally {
                    setOnboardCamLoading(false);
                  }
                }}
              >
                {onboardCamStream ? (
                  /* Live camera preview */
                  <>
                    <video
                      className="absolute inset-0 w-full h-full object-cover rounded-3xl"
                      autoPlay
                      playsInline
                      muted
                      ref={(el) => {
                        if (el && el.srcObject !== onboardCamStream) {
                          el.srcObject = onboardCamStream;
                        }
                      }}
                    />
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-accent/70 animate-scan pointer-events-none z-20" />
                    <span className="absolute top-2 left-2 bg-accent/90 text-white text-[8px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider z-20 animate-pulse shadow-soft">
                      {t.cameraLivePreview}
                    </span>
                    {/* Camera Flip Button */}
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        const nextFacing = onboardCamFacing === "user" ? "environment" : "user";
                        setOnboardCamFacing(nextFacing);
                        if (onboardCamStream) {
                          onboardCamStream.getTracks().forEach(track => track.stop());
                        }
                        try {
                          const stream = await navigator.mediaDevices.getUserMedia({
                            video: { facingMode: nextFacing, width: { ideal: 480 }, height: { ideal: 360 } }
                          });
                          setOnboardCamStream(stream);
                        } catch {
                          setOnboardCamErr(true);
                        }
                      }}
                      className="absolute top-2 right-2 z-30 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center border border-slate-100 hover:bg-white transition-all active:scale-90 shadow-soft"
                      title="Flip Camera"
                    >
                      <SwitchCamera className="w-4 h-4 text-primary" />
                    </button>
                  </>
                ) : onboardCamErr ? (
                  /* Animated fallback illustration (permission denied) */
                  <>
                    <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-accent/5" />
                    <div className="relative z-10 flex flex-col items-center gap-2">
                      <div className="relative">
                        <Camera className="w-14 h-14 text-primary/75 animate-onboard-cam-pulse" />
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full animate-ping" />
                        <div className="absolute -bottom-1 -left-2 w-2 h-2 bg-primary rounded-full animate-onboard-float-dot" />
                        <div className="absolute top-1/2 right-[-14px] w-2.5 h-2.5 bg-accent rounded-full animate-onboard-float-dot2" />
                      </div>
                      <span className="text-[9px] text-textsecondary font-bold">
                        {t.cameraUnavailable}
                      </span>
                    </div>
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-accent/40 animate-scan pointer-events-none" />
                  </>
                ) : (
                  /* Default: tap to activate */
                  <>
                    <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-accent/5" />
                    {onboardCamLoading ? (
                      <div className="relative z-10 flex flex-col items-center gap-2">
                        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <span className="text-[9px] text-textsecondary font-bold">
                          {t.cameraOpening}
                        </span>
                      </div>
                    ) : (
                      <div className="relative z-10 flex flex-col items-center gap-2">
                        <Camera className="w-14 h-14 text-primary animate-onboard-cam-pulse" />
                        <span className="text-[10px] text-primary font-bold bg-primary/10 px-3 py-1 rounded-full">
                          {t.cameraTapForDemo}
                        </span>
                      </div>
                    )}
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-accent/40 animate-scan pointer-events-none" />
                  </>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-extrabold text-textprimary leading-tight">
                  {t.onboardSlide1TitleDetailed}
                </h3>
                <p className="text-xs text-textsecondary leading-relaxed font-medium">
                  {t.onboardSlide1DescDetailed}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Slide 2 */}
        {onboardStep === 2 && (
          <div className="w-full my-auto flex flex-col justify-between space-y-4 z-10 animate-slide-in text-left max-w-lg card-premium p-5 sm:p-8 border border-slate-100 bg-white/80 backdrop-blur-md shadow-soft">
            <div className="flex justify-between items-center shrink-0">
              <span className="text-[10px] font-black uppercase text-primary tracking-widest bg-primary/10 px-2.5 py-1 rounded-full">
                {t.onboardFeature2Title}
              </span>
              <button 
                onClick={() => setOnboardStep(4)} 
                className="text-xs font-bold text-textsecondary hover:text-primary transition-colors uppercase tracking-wider"
              >
                {t.skip}
              </button>
            </div>
            
            <div className="flex-1 flex flex-col justify-center space-y-4">
              <div className="w-full aspect-video bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-center relative overflow-hidden shrink-0">
                <div className="absolute inset-0 bg-gradient-to-tr from-rose-500/5 to-primary/5" />
                <div className="flex flex-col items-center gap-3 relative z-10">
                  <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl shadow-soft border border-slate-100">
                    <Heart className="w-8 h-8 text-rose-500 fill-rose-500/10 animate-onboard-heartbeat" />
                    <span className="text-xs font-extrabold text-textprimary">72 BPM</span>
                  </div>
                  {/* Animated Heartbeat Waveform SVG */}
                  <svg viewBox="0 0 200 40" className="w-48 h-8" preserveAspectRatio="none">
                    <polyline
                      points="0,20 20,20 30,20 38,5 46,35 54,10 62,30 70,20 80,20 100,20 110,20 118,5 126,35 134,10 142,30 150,20 160,20 200,20"
                      fill="none"
                      stroke="#EF4444"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="animate-onboard-ecg"
                    />
                  </svg>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-extrabold text-textprimary leading-tight">
                  {t.onboardSlide2TitleDetailed}
                </h3>
                <p className="text-xs text-textsecondary leading-relaxed font-medium">
                  {t.onboardSlide2DescDetailed}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Slide 3 */}
        {onboardStep === 3 && (
          <div className="w-full my-auto flex flex-col justify-between space-y-4 z-10 animate-slide-in text-left max-w-lg card-premium p-5 sm:p-8 border border-slate-100 bg-white/80 backdrop-blur-md shadow-soft">
            <div className="flex justify-between items-center shrink-0">
              <span className="text-[10px] font-black uppercase text-primary tracking-widest bg-primary/10 px-2.5 py-1 rounded-full">
                {t.onboardFeature3Title}
              </span>
              <button 
                onClick={() => setOnboardStep(4)} 
                className="text-xs font-bold text-textsecondary hover:text-primary transition-colors uppercase tracking-wider"
              >
                {t.skip}
              </button>
            </div>
            
            <div className="flex-1 flex flex-col justify-center space-y-4">
              <div className="w-full aspect-video bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-center relative overflow-hidden shrink-0">
                <div className="absolute inset-0 bg-gradient-to-tr from-accent/5 to-primary/5" />
                <div className="flex flex-col items-center gap-4 relative z-10 text-center px-4">
                  <div className="flex items-center gap-4 bg-white px-5 py-2.5 rounded-2xl shadow-soft border border-slate-100">
                    <div className="w-3.5 h-3.5 rounded-full bg-danger animate-onboard-triage-red shadow-lg shadow-danger/40" />
                    <div className="w-4 h-4 rounded-full bg-warning animate-onboard-triage-yellow shadow-lg shadow-warning/40" />
                    <div className="w-4.5 h-4.5 rounded-full bg-success animate-onboard-triage-green shadow-lg shadow-success/40" />
                  </div>
                  <div className="flex items-center gap-2 bg-primary/5 border border-primary/10 px-3.5 py-1.5 rounded-xl">
                    <FileText className="w-4 h-4 text-primary" />
                    <span className="text-[9px] font-black text-primary uppercase tracking-widest">ABDM ABHA Health ID</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-extrabold text-textprimary leading-tight">
                  {t.onboardSlide3TitleDetailed}
                </h3>
                <p className="text-xs text-textsecondary leading-relaxed font-medium">
                  {t.onboardSlide3DescDetailed}
                </p>
                <p className="text-[10px] text-success font-bold italic mt-1 animate-pulse">
                  {t.onboardSlide3AbhaNote}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Slide navigation controls */}
        {onboardStep >= 1 && onboardStep <= 3 && (
          <div className="flex justify-between items-center gap-3 z-10 pt-4 border-t border-slate-100 shrink-0 w-full max-w-lg">
            <button
              onClick={() => setOnboardStep(prev => prev - 1)}
              className="py-3 px-5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold transition-all text-textsecondary shadow-soft active:scale-[0.98]"
            >
              {t.back}
            </button>

            {/* Dots */}
            <div className="flex items-center gap-1.5">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    onboardStep === step ? "w-5 bg-primary" : "w-1.5 bg-slate-200"
                  }`}
                />
              ))}
            </div>

            <button
              onClick={() => setOnboardStep(prev => prev + 1)}
              className="py-3 px-6 rounded-2xl bg-gradient-to-r from-primary to-secondary hover:shadow-premium text-xs font-bold text-white shadow-soft transition-all active:scale-[0.98] flex items-center gap-1.5"
            >
              <span>{t.next}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* STEP 4: Profile intake form */}
        {onboardStep === 4 && (
          <div className="flex-1 flex flex-col justify-between z-10 text-left h-full overflow-hidden w-full max-w-lg card-premium p-6 sm:p-8 border border-slate-100 bg-white/80 backdrop-blur-md shadow-soft">
            <div className="flex justify-between items-center bg-violet-600 text-white rounded-t-[24px] -mx-6 sm:-mx-8 -mt-6 sm:-mt-8 px-6 py-4 mb-4 shrink-0">
              <h3 className="text-md font-extrabold tracking-tight flex items-center gap-2">
                <span className="w-6 h-6 bg-white/20 border border-white/30 rounded-lg flex items-center justify-center text-white text-xs font-bold">4</span>
                {t.profileFormTitle}
              </h3>
              <span className="text-[9px] font-extrabold uppercase bg-white/20 px-2.5 py-1 rounded-full border border-white/30 shrink-0">
                {profileSubStep === "A" ? t.partA : t.partB}
              </span>
            </div>

            <div className="space-y-4 overflow-y-auto no-scrollbar pb-4 flex-1 pr-1">

              {profileSubStep === "A" ? (
                /* SUB-STEP A */
                <div className="space-y-4 animate-scaleUp">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-textsecondary uppercase tracking-wide">
                      {t.fullName} <span className="text-danger font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder={t.placeholderName}
                      value={profileForm.name}
                      onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))}
                      className="w-full text-xs p-3.5 bg-white border border-gray-300 rounded-2xl text-textprimary font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                    />
                    {formErrors.name && (
                      <p className="text-[10px] text-danger font-bold flex items-center gap-1 mt-1">
                        ⚠️ {formErrors.name}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-textsecondary uppercase tracking-wide">
                      {t.age} <span className="text-danger font-bold">*</span>
                    </label>
                    <input
                      type="number"
                      placeholder={t.placeholderAge}
                      value={profileForm.age}
                      onChange={e => setProfileForm(p => ({ ...p, age: e.target.value }))}
                      className="w-full text-xs p-3.5 bg-white border border-gray-300 rounded-2xl text-textprimary font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                    />
                    {formErrors.age && (
                      <p className="text-[10px] text-danger font-bold flex items-center gap-1 mt-1">
                        ⚠️ {formErrors.age}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-textsecondary uppercase tracking-wide block">
                      {t.gender} <span className="text-danger font-bold">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {["Male", "Female", "Other"].map(g => (
                        <button
                          type="button"
                          key={g}
                          onClick={() => setProfileForm(p => ({ ...p, gender: g }))}
                          className={`py-3 px-1 rounded-full text-xs font-bold border transition-all ${
                            profileForm.gender === g
                              ? "bg-violet-600 border-violet-600 text-white shadow-soft"
                              : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {g === "Male" ? t.male : g === "Female" ? t.female : t.other}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-textsecondary uppercase tracking-wide">
                      {t.phone} <span className="text-danger font-bold">*</span>
                    </label>
                    <div className="flex items-center bg-white border border-gray-300 rounded-2xl focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500 transition-all relative">
                      {/* Country code selector (Fix 2) */}
                      <div className="relative" ref={onboardCountryRef}>
                        <button
                          type="button"
                                    className="text-xs text-violet-600 bg-violet-50 py-3.5 px-3 font-bold border-r border-gray-300 flex items-center gap-1 hover:bg-violet-100 transition-colors whitespace-nowrap rounded-l-2xl"
                        >
                          <span>{countryCodes.find(c => c.code === selectedCountryCode)?.flag}</span>
                          <span>{selectedCountryCode}</span>
                          <ChevronDown className="w-3 h-3 text-violet-600" />
                        </button>
                        {showCountryDropdown && (
                          <div id="onboard-country-listbox" role="listbox" aria-labelledby="onboard-country-btn" className="absolute top-full left-0 mt-1.5 w-64 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 max-h-48 overflow-hidden flex flex-col">
                            <div className="p-2 border-b border-slate-100 bg-slate-50">
                              <div className="flex items-center bg-white rounded-lg px-2 border border-slate-200">
                                <Search className="w-3 h-3 text-textsecondary" />
                                <input
                                  type="text"
                                  placeholder="Search country..."
                                  value={countrySearch}
                                  onChange={e => setCountrySearch(e.target.value)}
                                  className="w-full text-[10px] p-1.5 bg-transparent text-textprimary focus:outline-none placeholder-textsecondary"
                                  autoFocus
                                  style={{ caretColor: '#7C3AED' }}
                                />
                              </div>
                            </div>
                            <div className="overflow-y-auto max-h-36 bg-white">
                              {countryCodes.filter(c =>
                                c.country.toLowerCase().includes(countrySearch.toLowerCase()) ||
                                c.code.includes(countrySearch)
                              ).map(c => (
                                <button
                                  key={c.code}
                                  type="button"
                                  role="option"
                                  aria-selected={selectedCountryCode === c.code}
                                  onClick={(e) => {
                                    setSelectedCountryCode(c.code);
                                    safeSetItem("saathi_country_code", c.code);
                                    setShowCountryDropdown(false);
                                    setCountrySearch("");
                                    const trigger = e.currentTarget.closest('.relative')?.firstElementChild as HTMLElement;
                                    if (trigger && typeof trigger.focus === "function") {
                                      trigger.focus();
                                    }
                                  }}
                                  className={`w-full text-left px-3 py-2.5 text-[10px] font-semibold flex items-center gap-2 hover:bg-slate-50 transition-colors ${
                                    selectedCountryCode === c.code ? "bg-violet-100 text-violet-750 font-bold" : "text-textsecondary"
                                  }`}
                                >
                                  <span>{c.flag}</span>
                                  <span className="flex-1 text-textprimary">{c.country}</span>
                                  <span className="text-violet-600 font-bold">{c.code}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <input
                        type="tel"
                        maxLength={15}
                        placeholder={t.placeholderPhone}
                        value={profileForm.phone}
                        onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value.replace(/\D/g, "") }))}
                        className="w-full text-xs p-3.5 bg-transparent text-textprimary font-semibold focus:outline-none rounded-r-2xl h-[48px]"
                      />
                    </div>
                    {formErrors.phone && (
                      <p className="text-[10px] text-danger font-bold flex items-center gap-1 mt-1">
                        ⚠️ {formErrors.phone}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                /* SUB-STEP B */
                <div className="space-y-4 animate-scaleUp">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-textsecondary uppercase tracking-wide block">
                      {t.conditions}
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { key: "Diabetes", label: t.condDiabetes },
                        { key: "High Blood Pressure", label: t.condHighBP },
                        { key: "Heart Disease", label: t.condHeartDisease },
                        { key: "Asthma/Respiratory", label: t.condAsthma },
                        { key: "Thyroid", label: t.condThyroid },
                        { key: "Kidney Disease", label: t.condKidney },
                        { key: "Anemia", label: t.condAnemia },
                        { key: "Other", label: t.condOther },
                        { key: "None", label: t.condNone }
                      ].map(c => {
                        const isSelected = profileForm.conditions.includes(c.key);
                        return (
                          <button
                            type="button"
                            key={c.key}
                            onClick={() => handleConditionClick(c.key)}
                            className={`py-2 px-3.5 rounded-full text-[10px] font-bold border transition-all ${
                              isSelected
                                ? "bg-violet-600 border-violet-600 text-white shadow-soft"
                                : "bg-violet-50 border-violet-200 text-violet-700 hover:bg-violet-100"
                            }`}
                          >
                            {c.label}
                          </button>
                        );
                      })}
                    </div>

                    {profileForm.conditions.includes("Other") && (
                      <div className="space-y-1 mt-2 animate-fadeIn">
                        <label className="text-[10px] font-bold text-textsecondary uppercase tracking-wide">
                          {t.specifyOtherCondition}
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Acid Reflux"
                          value={profileForm.otherCondition}
                          onChange={e => setProfileForm(p => ({ ...p, otherCondition: e.target.value }))}
                          className="w-full text-xs p-3.5 bg-white border border-gray-300 rounded-2xl text-textprimary font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500"
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-textsecondary uppercase tracking-wide block">
                        {t.bloodGroup}
                      </label>
                      <select
                        value={profileForm.bloodGroup}
                        onChange={e => setProfileForm(p => ({ ...p, bloodGroup: e.target.value }))}
                        className="w-full text-xs p-3 rounded-2xl bg-white border border-gray-300 text-textprimary font-bold focus:outline-none focus:ring-2 focus:ring-violet-500 h-[48px]"
                      >
                        {["Unknown", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(bg => (
                          <option key={bg} value={bg}>{bg}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-textsecondary uppercase tracking-wide">
                        {t.allergies}
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Peanuts, Penicillin"
                        value={profileForm.allergies}
                        onChange={e => setProfileForm(p => ({ ...p, allergies: e.target.value }))}
                        className="w-full text-xs p-3 bg-white border border-gray-300 text-textprimary font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500 h-[48px]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-textsecondary uppercase tracking-wide">
                      {t.medications}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Metformin 500mg daily"
                      value={profileForm.medications}
                      onChange={e => setProfileForm(p => ({ ...p, medications: e.target.value }))}
                      className="w-full text-xs p-3.5 bg-white border border-gray-300 rounded-2xl text-textprimary font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-textsecondary uppercase tracking-wide">
                      {t.abhaNumberOptional}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 12-3456-7890-1234"
                      value={formatABHA(profileForm.abha)}
                      onChange={e => {
                        const raw = e.target.value.replace(/\D/g, "").slice(0, 14);
                        setProfileForm(p => ({ ...p, abha: raw }));
                      }}
                      className="w-full text-xs p-3.5 bg-white border border-gray-300 rounded-2xl text-textprimary font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                    <p className="text-[9px] text-textsecondary font-semibold mt-0.5">
                      {t.abhaSubtext}
                    </p>
                    {formErrors.abha && (
                      <p className="text-[10px] text-danger font-bold flex items-center gap-1 mt-1">
                        ⚠️ {formErrors.abha}
                      </p>
                    )}
                  </div>

                  <div className="border-t border-slate-100 pt-3 mt-1 space-y-3">
                    <span className="text-[10px] font-bold text-textsecondary uppercase tracking-wider block">
                      {t.emergencyContactOptional}
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-textsecondary uppercase">
                          {t.emergencyName}
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Sunita Sharma"
                          value={profileForm.emergencyName}
                          onChange={e => setProfileForm(p => ({ ...p, emergencyName: e.target.value }))}
                          className="w-full text-xs p-3 bg-white border border-gray-300 text-textprimary font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500 h-[48px]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-textsecondary uppercase">
                          {t.emergencyPhone}
                        </label>
                        <input
                          type="tel"
                          maxLength={10}
                          placeholder="10-digit number"
                          value={profileForm.emergencyPhone}
                          onChange={e => setProfileForm(p => ({ ...p, emergencyPhone: e.target.value.replace(/\D/g, "") }))}
                          className="w-full text-xs p-3 bg-white border border-gray-300 text-textprimary font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500 h-[48px]"
                        />
                      </div>
                    </div>
                    {formErrors.emergencyPhone && (
                      <p className="text-[10px] text-danger font-bold flex items-center gap-1 mt-1">
                        ⚠️ {formErrors.emergencyPhone}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Actions for Profile Step 4 */}
            <div className="flex justify-between items-center gap-3 z-10 pt-4 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (profileSubStep === "B") {
                    setProfileSubStep("A");
                    setFormErrors({});
                  } else {
                    setOnboardStep(3);
                  }
                }}
                className="py-3 px-5 rounded-full bg-white hover:bg-slate-50 border border-gray-300 text-xs font-bold transition-all text-textsecondary shadow-soft active:scale-[0.98]"
              >
                {t.back}
              </button>

              {profileSubStep === "A" ? (
                <button
                  type="button"
                  onClick={() => {
                    if (validateSubStepA()) {
                      setProfileSubStep("B");
                    }
                  }}
                  className="py-3 px-6 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-750 text-xs font-bold text-white shadow-soft transition-all active:scale-[0.98] flex items-center gap-1.5"
                >
                  <span>{t.nextDetails}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  className="py-3 px-6 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-750 hover:to-purple-750 text-xs font-bold text-white shadow-soft transition-all active:scale-[0.98] flex items-center gap-1.5"
                >
                  <span>{t.finishSetup}</span>
                  <Check className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderProfileModal = () => {
    if (!showProfileModal) return null;

    return (
      <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-md z-[60] flex items-end md:items-center justify-center p-0 md:p-4 animate-fadeIn text-left">
        <div className="bg-white/95 rounded-t-[32px] md:rounded-[32px] p-6 sm:p-8 border-t md:border border-slate-100 shadow-soft w-full max-w-full md:max-w-lg max-h-[85vh] md:max-h-[90vh] overflow-y-auto space-y-5 animate-slideUp md:animate-scaleUp no-scrollbar backdrop-blur-md pb-[calc(1.5rem+env(safe-area-inset-bottom))] md:pb-8">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <Heart className="w-4 h-4 text-primary fill-primary/20 animate-pulse" />
              </div>
              <h3 className="text-sm font-extrabold tracking-wide text-textprimary">
                {t.healthProfile}
              </h3>
            </div>
            <button
              onClick={() => {
                setShowProfileModal(false);
                setFormErrors({});
              }}
              className="p-1.5 rounded-full hover:bg-slate-50 text-textsecondary hover:text-textprimary transition-colors border border-slate-100 shadow-soft"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Section 1: Basic Info */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-textsecondary uppercase tracking-widest block">
                {t.basicInformation}
              </span>
              
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-textsecondary uppercase tracking-wide">
                  {t.fullName} <span className="text-danger font-bold">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Aarav Sharma"
                  value={profileForm.name}
                  onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full text-xs p-3 input-premium text-textprimary font-semibold focus:outline-none h-[44px]"
                />
                {formErrors.name && (
                  <p className="text-[9px] text-danger font-bold">⚠️ {formErrors.name}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-textsecondary uppercase tracking-wide">
                    {t.age} <span className="text-danger font-bold">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 28"
                    value={profileForm.age}
                    onChange={e => setProfileForm(p => ({ ...p, age: e.target.value }))}
                    className="w-full text-xs p-3 input-premium text-textprimary font-semibold focus:outline-none h-[44px]"
                  />
                  {formErrors.age && (
                    <p className="text-[9px] text-danger font-bold">⚠️ {formErrors.age}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-textsecondary uppercase tracking-wide block">
                    {t.gender} <span className="text-danger font-bold">*</span>
                  </label>
                  <select
                    value={profileForm.gender}
                    onChange={e => setProfileForm(p => ({ ...p, gender: e.target.value }))}
                    className="w-full text-xs p-3 rounded-2xl border border-slate-200 bg-slate-50 text-textprimary font-bold focus:outline-none focus:border-primary h-[44px]"
                  >
                    <option value="Male">{t.male}</option>
                    <option value="Female">{t.female}</option>
                    <option value="Other">{t.other}</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-textsecondary uppercase tracking-wide">
                  {t.phone} <span className="text-danger font-bold">*</span>
                </label>
                <div className="flex items-center border border-slate-200 bg-slate-50 rounded-2xl focus-within:border-primary focus-within:bg-white focus-within:ring-4 focus-within:ring-primary/10 transition-all relative">
                  {/* Country code selector in edit profile modal */}
                  <div className="relative" ref={profileCountryRef}>
                    <button
                      type="button"
                      id="profile-country-btn"
                      aria-haspopup="listbox"
                      aria-expanded={showCountryDropdown}
                      aria-controls="profile-country-listbox"
                      onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                      className="text-xs text-primary bg-slate-100 py-3.5 px-3 font-bold border-r border-slate-200 flex items-center gap-1 hover:bg-slate-200 transition-colors whitespace-nowrap rounded-l-2xl h-[44px]"
                    >
                      <span>{countryCodes.find(c => c.code === selectedCountryCode)?.flag}</span>
                      <span>{selectedCountryCode}</span>
                      <ChevronDown className="w-3 h-3 text-primary" />
                    </button>
                    {showCountryDropdown && (
                      <div id="profile-country-listbox" role="listbox" aria-labelledby="profile-country-btn" className="absolute top-full left-0 mt-1.5 w-64 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 max-h-48 overflow-hidden flex flex-col">
                        <div className="p-2 border-b border-slate-100 bg-slate-50">
                          <div className="flex items-center bg-white border border-slate-200 rounded-lg px-2">
                            <Search className="w-3 h-3 text-textsecondary" />
                            <input
                              type="text"
                              placeholder="Search country..."
                              value={countrySearch}
                              onChange={e => setCountrySearch(e.target.value)}
                              className="w-full text-[10px] p-1.5 bg-transparent text-textprimary focus:outline-none placeholder-textsecondary"
                              autoFocus
                            />
                          </div>
                        </div>
                        <div className="overflow-y-auto max-h-36 bg-white">
                          {countryCodes.filter(c =>
                            c.country.toLowerCase().includes(countrySearch.toLowerCase()) ||
                            c.code.includes(countrySearch)
                          ).map(c => (
                            <button
                              key={c.code}
                              type="button"
                              role="option"
                              aria-selected={selectedCountryCode === c.code}
                              onClick={(e) => {
                                setSelectedCountryCode(c.code);
                                safeSetItem("saathi_country_code", c.code);
                                setShowCountryDropdown(false);
                                setCountrySearch("");
                                const trigger = e.currentTarget.closest('.relative')?.firstElementChild as HTMLElement;
                                if (trigger && typeof trigger.focus === "function") {
                                  trigger.focus();
                                }
                              }}
                              className={`w-full text-left px-3 py-2.5 text-[10px] font-semibold flex items-center gap-2 hover:bg-slate-50 transition-colors ${
                                selectedCountryCode === c.code ? "bg-primary/10 text-primary font-bold" : "text-textsecondary"
                              }`}
                            >
                              <span>{c.flag}</span>
                              <span className="flex-1 text-textprimary">{c.country}</span>
                              <span className="text-primary font-bold">{c.code}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <input
                    type="tel"
                    maxLength={15}
                    placeholder="Phone number"
                    value={profileForm.phone}
                    onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value.replace(/\D/g, "") }))}
                    className="w-full text-xs p-3 bg-transparent text-textprimary font-semibold focus:outline-none rounded-r-2xl h-[44px]"
                  />
                </div>
                {formErrors.phone && (
                  <p className="text-[9px] text-danger font-bold">⚠️ {formErrors.phone}</p>
                )}
              </div>
            </div>

            {/* Section 2: Health Background */}
            <div className="space-y-3 border-t border-slate-100 pt-3">
              <span className="text-[10px] font-bold text-textsecondary uppercase tracking-widest block">
                {t.healthDetails}
              </span>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-textsecondary uppercase tracking-wide block">
                  {t.conditions}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { key: "Diabetes", label: t.condDiabetes },
                    { key: "High Blood Pressure", label: t.condHighBP },
                    { key: "Heart Disease", label: t.condHeartDisease },
                    { key: "Asthma/Respiratory", label: t.condAsthma },
                    { key: "Thyroid", label: t.condThyroid },
                    { key: "Kidney Disease", label: t.condKidney },
                    { key: "Anemia", label: t.condAnemia },
                    { key: "Other", label: t.condOther },
                    { key: "None", label: t.condNone }
                  ].map(c => {
                    const isSelected = profileForm.conditions.includes(c.key);
                    return (
                      <button
                        type="button"
                        key={c.key}
                        onClick={() => handleConditionClick(c.key)}
                        className={`py-1.5 px-3 rounded-full text-[9px] font-bold border transition-all ${
                          isSelected
                            ? "bg-primary border-primary text-white shadow-soft"
                            : "bg-slate-50 border-slate-200 text-textsecondary hover:bg-slate-100"
                        }`}
                      >
                        {c.label}
                      </button>
                    );
                  })}
                </div>

                {profileForm.conditions.includes("Other") && (
                  <div className="space-y-1 mt-2">
                    <label className="text-[9px] font-bold text-textsecondary uppercase">
                      {t.specifyOtherCondition}
                    </label>
                    <input
                      type="text"
                      placeholder="Specify..."
                      value={profileForm.otherCondition}
                      onChange={e => setProfileForm(p => ({ ...p, otherCondition: e.target.value }))}
                      className="w-full text-xs p-3 rounded-2xl border border-slate-200 bg-slate-50 font-semibold focus:outline-none focus:border-primary h-[44px]"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-textsecondary uppercase block">
                    {t.bloodGroup}
                  </label>
                  <select
                    value={profileForm.bloodGroup}
                    onChange={e => setProfileForm(p => ({ ...p, bloodGroup: e.target.value }))}
                    className="w-full text-xs p-3 rounded-2xl border border-slate-200 bg-slate-50 font-bold focus:outline-none focus:border-primary h-[44px]"
                  >
                    {["Unknown", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-textsecondary uppercase">
                    {t.allergies}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Penicillin"
                    value={profileForm.allergies}
                    onChange={e => setProfileForm(p => ({ ...p, allergies: e.target.value }))}
                    className="w-full text-xs p-3 rounded-2xl border border-slate-200 bg-slate-50 font-semibold focus:outline-none focus:border-primary h-[44px]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-textsecondary uppercase">
                  {t.medications}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Aspirin 75mg"
                  value={profileForm.medications}
                  onChange={e => setProfileForm(p => ({ ...p, medications: e.target.value }))}
                  className="w-full text-xs p-3 rounded-2xl border border-slate-200 bg-slate-50 font-semibold focus:outline-none focus:border-primary h-[44px]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-textsecondary uppercase">
                  {t.abhaNumberOptional}
                </label>
                <input
                  type="text"
                  placeholder="e.g. 12-3456-7890-1234"
                  value={formatABHA(profileForm.abha)}
                  onChange={e => {
                    const raw = e.target.value.replace(/\D/g, "").slice(0, 14);
                    setProfileForm(p => ({ ...p, abha: raw }));
                  }}
                  className="w-full text-xs p-3 rounded-2xl border border-slate-200 bg-slate-50 font-semibold focus:outline-none focus:border-primary h-[44px]"
                />
                <p className="text-[9px] text-textsecondary font-semibold mt-0.5">
                  {t.abhaSubtext}
                </p>
                {formErrors.abha && (
                  <p className="text-[9px] text-danger font-bold">⚠️ {formErrors.abha}</p>
                )}
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-2">
                <span className="text-[10px] font-bold text-textsecondary uppercase tracking-widest block">
                  {t.emergencyContact}
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-textsecondary uppercase">
                      {t.emergencyName}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Sunita"
                      value={profileForm.emergencyName}
                      onChange={e => setProfileForm(p => ({ ...p, emergencyName: e.target.value }))}
                      className="w-full text-xs p-3 rounded-2xl border border-slate-200 bg-slate-50 font-semibold focus:outline-none focus:border-primary h-[44px]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-textsecondary uppercase">
                      {t.emergencyPhone}
                    </label>
                    <input
                      type="tel"
                      maxLength={10}
                      placeholder="10-digit"
                      value={profileForm.emergencyPhone}
                      onChange={e => setProfileForm(p => ({ ...p, emergencyPhone: e.target.value.replace(/\D/g, "") }))}
                      className="w-full text-xs p-3 rounded-2xl border border-slate-200 bg-slate-50 font-semibold focus:outline-none focus:border-primary h-[44px]"
                    />
                  </div>
                </div>
                {formErrors.emergencyPhone && (
                  <p className="text-[9px] text-danger font-bold">⚠️ {formErrors.emergencyPhone}</p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowProfileModal(false);
                  setFormErrors({});
                }}
                className="flex-1 py-3 px-4 rounded-2xl border border-slate-200 text-textsecondary hover:bg-slate-50 text-xs font-bold text-center transition-all shadow-soft active:scale-[0.98]"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={() => {
                  const isAValid = validateSubStepA();
                  const isBValid = validateSubStepB();
                  if (isAValid && isBValid) {
                    handleSaveProfile();
                  }
                }}
                className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-primary to-secondary hover:shadow-premium text-white text-xs font-bold text-center transition-all shadow-soft active:scale-[0.98]"
              >
                {t.saveChanges}
              </button>
            </div>

            {/* Reset App / Redo Onboarding */}
            <div className="pt-3 border-t border-slate-100 mt-2">
              <button
                type="button"
                onClick={() => {
                  const confirmMsg = t.resetConfirm;
                  if (window.confirm(confirmMsg)) {
                    safeRemoveItem("saathi_onboarding_complete");
                    safeRemoveItem("saathi_user_profile");
                    window.location.reload();
                  }
                }}
                className="w-full py-3 px-4 rounded-2xl border border-rose-200 text-rose-500 hover:bg-rose-50/50 text-[10px] font-bold text-center uppercase tracking-wider transition-all shadow-soft active:scale-[0.98]"
              >
                {t.resetApp}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Prevent hydration mismatch
  if (!isMounted) {
    return (
      <div className="flex h-screen items-center justify-center bg-white md:bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  // Helper: open profile modal from sidebar
  const openProfileFromSidebar = () => {
    if (userProfile) {
      setProfileForm({
        name: userProfile.name || "",
        age: String(userProfile.age || ""),
        gender: userProfile.gender || "Male",
        phone: userProfile.phone || "",
        conditions: userProfile.conditions || [],
        otherCondition: userProfile.otherCondition || "",
        allergies: userProfile.allergies || "",
        medications: userProfile.medications || "",
        bloodGroup: userProfile.bloodGroup || "Unknown",
        emergencyName: userProfile.emergencyContact?.name || "",
        emergencyPhone: userProfile.emergencyContact?.phone || "",
        abha: userProfile.abha || ""
      });
      setSelectedCountryCode(userProfile.countryCode || "+91");
    }
    setFormErrors({});
    setProfileSubStep("A");
    setShowProfileModal(true);
  };

  // Tab title map for breadcrumb
  const tabTitles: Record<string, string> = {
    home: t.home,
    screen: t.screen,
    vitals: t.vitals,
    talk: t.talk,
    records: t.records,
    medicines: t.medicinesHeader,
  };

  return (
    <>
      {/* FULL-SCREEN ONBOARDING OVERLAY — covers entire viewport on all devices */}
      {showOnboarding && (
        <div className="fixed inset-0 z-[100] w-screen h-[100dvh]">
          {renderOnboarding()}
        </div>
      )}

    <div className="flex w-full min-h-[100dvh] overflow-x-hidden bg-[#F9FAFB] justify-center mx-auto">
      {/* SIDEBAR (md+) — hidden during onboarding */}
      {!showOnboarding && (
        <Sidebar
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          userProfile={userProfile}
          onOpenSettings={() => setShowSettingsModal(true)}
          onOpenProfile={openProfileFromSidebar}
        />
      )}

      {/* MAIN CONTENT COLUMN */}
      <main className="flex-1 flex flex-col h-[100dvh] bg-white relative overflow-hidden w-full lg:max-w-2xl 2xl:max-w-3xl">

      {/* MOBILE HEADER — hidden on md+ (sidebar replaces it) */}
      <header 
        className="md:hidden fixed top-0 left-0 right-0 w-full bg-white border-b border-slate-100 px-4 py-3 shrink-0 shadow-sm flex justify-between items-center z-50 text-left"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div>
          <div className="flex items-center gap-1.5">
            <Heart className="w-5 h-5 fill-purple-650 text-purple-600 animate-pulse" />
            <h1 className="text-lg font-black tracking-tight text-slate-800">{t.appTitle}</h1>
          </div>
          <p className="text-[10px] text-purple-400 font-semibold mt-0.5">{t.tagline}</p>
        </div>

        <div className="flex items-center gap-2">
          {isInstallable && (
            <button
              onClick={handleInstallClick}
              className="bg-purple-50 text-purple-750 border border-purple-100 font-extrabold text-[10px] px-2.5 py-1 rounded-full shadow-sm hover:bg-purple-100/50 transition-all active:scale-95 uppercase tracking-wider flex items-center gap-1 shrink-0 min-h-[44px] min-w-[44px] justify-center"
            >
              <Download className="w-3 h-3" />
              {t.install}
            </button>
          )}

          {ashaModeActive && (
            <span className="bg-emerald-500 text-white font-extrabold text-[9px] px-2 py-0.5 rounded-full border border-emerald-400 shadow-sm flex items-center gap-1 shrink-0 animate-pulse tracking-wide">
              <Users className="w-2.5 h-2.5" />
              <span>ASHA</span>
            </span>
          )}

          {userProfile && (
            <button
              onClick={openProfileFromSidebar}
              className="w-7 h-7 rounded-full bg-purple-100 border border-purple-200 text-purple-800 font-black text-[11px] flex items-center justify-center hover:bg-purple-200/50 transition-all active:scale-95 shrink-0 min-h-[44px] min-w-[44px]"
              title={t.editProfile}
              id="profile-avatar-btn"
            >
              {userProfile.name?.charAt(0)?.toUpperCase() || "U"}
            </button>
          )}

          <button
            onClick={() => setShowSettingsModal(true)}
            className="p-1.5 rounded-full bg-slate-50 border border-slate-200 text-slate-650 hover:text-slate-800 hover:bg-slate-100 transition-all active:scale-95 shrink-0 flex items-center justify-center min-h-[44px] min-w-[44px]"
            title="Settings"
            id="settings-btn"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* DESKTOP/TABLET PAGE TITLE BAR — visible only on md+ */}
      <div className="hidden md:flex items-center px-6 lg:px-10 py-3 border-b border-slate-200 bg-white shrink-0 z-20">
        <h1 className="text-lg lg:text-xl font-bold text-slate-800">{tabTitles[activeTab] || t.home}</h1>
        <div className="ml-3 h-0.5 flex-1 max-w-[80px] bg-violet-500 rounded-full" />
      </div>

      {/* CONTENT AREA */}
      <div className="flex-grow overflow-y-auto no-scrollbar bg-slate-50 pt-[calc(64px+env(safe-area-inset-top))] md:pt-0 pb-[calc(56px+env(safe-area-inset-bottom))] md:pb-0 relative text-left">
        
        {/* PERSISTENT DISCLAIMER BANNER */}
        <div className="bg-amber-50 border-b border-amber-200 px-3 py-2 text-[11px] text-amber-800 flex items-start gap-1.5 shrink-0 z-30 shadow-sm text-left">
          <AlertTriangle className="w-4 h-4 text-amber-605 shrink-0 mt-0.5" />
          <p className="leading-tight font-semibold">
            {t.disclaimer}
          </p>
        </div>

        {/* OFFLINE BANNER */}
        {isOffline && (
          <div className="bg-red-50 border-b border-red-200 px-4 py-2.5 text-[10px] text-red-805 flex items-center gap-2 shrink-0 z-30 animate-fadeIn text-left">
            <WifiOff className="w-4 h-4 text-red-605 shrink-0" />
            <span className="font-extrabold tracking-wide">
              {t.offlineBanner}
            </span>
          </div>
        )}

        <div className="w-full">
        {ashaModeActive && activePatientId && (
          (() => {
            const activePatient = patientsList.find(p => p.id === activePatientId);
            if (!activePatient) return null;
            return (
              <div className="bg-violet-50 border-b border-violet-200 px-4 py-2 flex items-center justify-between z-10 shrink-0 sticky top-0 shadow-sm animate-slideDown text-left">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-violet-600 rounded-full animate-pulse shrink-0" />
                  <div className="text-[10px] text-violet-800 font-bold">
                    Active Patient: <strong className="text-violet-900 font-extrabold">{activePatient.name}</strong> ({activePatient.age}y / {activePatient.gender})
                  </div>
                </div>
                <button
                  onClick={() => selectActivePatientForASHA(null)}
                  className="text-[9px] font-extrabold text-violet-700 bg-violet-100 hover:bg-violet-200 px-2 py-1 rounded-lg"
                >
                  Clear Selection
                </button>
              </div>
            );
          })()
        )}

        {/* Tab-based Conditionally Mounted Render */}
        {activeTab === "home" && (
          ashaModeActive ? (
            <AshaView
              patientsList={patientsList}
              setPatientsList={setPatientsList}
              activePatientId={activePatientId}
              setActivePatientId={setActivePatientId}
              setAshaModeActive={setAshaModeActive}
              setActiveTab={handleTabChange}
              language={language}
            />
          ) : (
            <HomeView
              setActiveTab={handleTabChange}
              setActiveCall={setActiveCall}
              userProfile={userProfile}
              recordsList={recordsList}
              vitalsHistory={vitalsHistory}
              language={language}
              onEditProfile={() => {
                if (userProfile) {
                  setProfileForm({
                    name: userProfile.name || "",
                    age: String(userProfile.age || ""),
                    gender: userProfile.gender || "Male",
                    phone: userProfile.phone || "",
                    conditions: userProfile.conditions || [],
                    otherCondition: userProfile.otherCondition || "",
                    allergies: userProfile.allergies || "",
                    medications: userProfile.medications || "",
                    bloodGroup: userProfile.bloodGroup || "Unknown",
                    emergencyName: userProfile.emergencyContact?.name || "",
                    emergencyPhone: userProfile.emergencyContact?.phone || "",
                    abha: userProfile.abha || ""
                  });
                }
                setFormErrors({});
                setProfileSubStep("A");
                setShowProfileModal(true);
              }}
            />
          )
        )}

        {activeTab === "screen" && (
          <ScreenView
            recordsList={recordsList}
            setRecordsList={setRecordsList}
            activePatientId={activePatientId}
            ashaModeActive={ashaModeActive}
            patientsList={patientsList}
            setPatientsList={setPatientsList}
            activeTab={activeTab}
            userProfile={userProfile}
            language={language}
          />
        )}

        {activeTab === "vitals" && (
          <VitalsView
            vitalsHistory={vitalsHistory}
            setVitalsHistory={setVitalsHistory}
            recordsList={recordsList}
            setRecordsList={setRecordsList}
            attachRecordToActivePatient={attachRecordToActivePatient}
            userProfile={userProfile}
            language={language}
          />
        )}

        {activeTab === "talk" && (
          <TalkView
            recordsList={recordsList}
            setRecordsList={setRecordsList}
            attachRecordToActivePatient={attachRecordToActivePatient}
            setActiveCall={setActiveCall}
            userProfile={userProfile}
            language={language}
          />
        )}

        {activeTab === "records" && (
          <RecordsView
            vitalsHistory={vitalsHistory}
            recordsList={recordsList}
            setRecordsList={setRecordsList}
            triageResult={triageResult}
            screenResults={screenResults}
            userProfile={userProfile}
            onUpdateProfile={handleUpdateProfile}
            language={language}
            onEditProfile={() => {
              if (userProfile) {
                setProfileForm({
                  name: userProfile.name || "",
                  age: String(userProfile.age || ""),
                  gender: userProfile.gender || "Male",
                  phone: userProfile.phone || "",
                  conditions: userProfile.conditions || [],
                  otherCondition: userProfile.otherCondition || "",
                  allergies: userProfile.allergies || "",
                  medications: userProfile.medications || "",
                  bloodGroup: userProfile.bloodGroup || "Unknown",
                  emergencyName: userProfile.emergencyContact?.name || "",
                  emergencyPhone: userProfile.emergencyContact?.phone || "",
                  abha: userProfile.abha || ""
                });
              } else {
                setProfileForm({
                  name: "",
                  age: "",
                  gender: "Male",
                  phone: "",
                  conditions: [],
                  otherCondition: "",
                  allergies: "",
                  medications: "",
                  bloodGroup: "Unknown",
                  emergencyName: "",
                  emergencyPhone: "",
                  abha: ""
                });
              }
              setFormErrors({});
              setShowProfileModal(true);
            }}
          />
        )}

        {activeTab === "medicines" && (
          <MedicinesView
            medicinesList={medicinesList}
            setMedicinesList={setMedicinesList}
            reminderActive={reminderActive}
            setReminderActive={setReminderActive}
            caregiverAlert={caregiverAlert}
            setCaregiverAlert={setCaregiverAlert}
            drugInteractionNote={drugInteractionNote}
            setDrugInteractionNote={setDrugInteractionNote}
            userProfile={userProfile}
            language={language}
          />
        )}
        </div>
      </div>

      {/* Add responsive padding for content area on wider screens */}

      {/* BOTTOM NAVIGATION switcher */}
      <BottomNav activeTab={activeTab} setActiveTab={handleTabChange} language={language} />

      {/* TELEMEDICINE WEB-RTC LOOPBACK OVERLAY */}
      <TelemedicineOverlay
        activeCall={activeCall}
        setActiveCall={setActiveCall}
        triageResult={triageResult}
        screenResults={screenResults}
        symptomsText={transcriptText || ""}
        userProfile={userProfile}
        language={language}
      />

      {/* MEDICINE REMINDER MODAL POPUP */}
      {pendingReminderAlert && (
        <div className="absolute inset-0 md:fixed md:inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl max-w-sm w-full text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center animate-bounce">
              <Bell className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-wide">
                {t.medicineReminder}
              </h3>
              <p className="text-sm font-bold text-violet-600">{pendingReminderAlert.name}</p>
              <p className="text-xs text-slate-500">
                {t.medicineDosageFrequency.replace("{dose}", pendingReminderAlert.dose).replace("{frequency}", pendingReminderAlert.frequency)}
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => setPendingReminderAlert(null)}
                className="w-full bg-gradient-to-r from-violet-600 to-purple-650 hover:from-violet-700 hover:to-purple-700 text-white font-black py-2.5 px-4 rounded-full shadow-md transition-all active:scale-95"
              >
                {t.medicineTaken}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GLOBAL SETTINGS MODAL */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[60] flex items-end md:items-center justify-center p-0 md:p-4 animate-fadeIn text-left">
          <div className="bg-white rounded-t-3xl md:rounded-3xl p-6 border-t md:border border-slate-100 shadow-xl w-full max-w-full md:max-w-sm space-y-5 animate-slideUp md:animate-scaleUp pb-[calc(1.5rem+env(safe-area-inset-bottom))] md:pb-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-800">
                <Settings className="w-5 h-5 text-violet-605 animate-spin-slow" />
                <h3 className="text-sm font-black uppercase tracking-wide">
                  {t.applicationSettings}
                </h3>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-1 rounded-full hover:bg-slate-50 text-slate-400 hover:text-slate-650 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Setting 1: ASHA Worker Mode Toggle */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100/50 transition-all">
                <div className="space-y-0.5 max-w-[70%]">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">
                      {t.ashaWorkerMode}
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-500 leading-normal">
                    {t.ashaWorkerModeDesc}
                  </p>
                </div>
                
                <button
                  onClick={() => {
                    const nextVal = !ashaModeActive;
                    setAshaModeActive(nextVal);
                    safeSetItem("saathi_asha_mode_active", nextVal ? "true" : "false");
                    if (!nextVal) {
                      selectActivePatientForASHA(null);
                    } else {
                      setActiveTab("home");
                    }
                  }}
                  className={`w-11 h-6 rounded-full transition-colors duration-300 relative flex items-center p-1 border ${
                    ashaModeActive 
                      ? "bg-violet-600 border-violet-500" 
                      : "bg-slate-200 border-slate-300"
                  }`}
                  id="asha-toggle-switch"
                >
                  <div className={`w-3.5 h-3.5 bg-white rounded-full shadow-md transition-transform duration-300 transform ${
                    ashaModeActive ? "translate-x-5" : "translate-x-0"
                  }`} />
                </button>
              </div>

              {/* Setting 2: Language Selector inside Settings */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide block">
                  {t.selectLanguage}
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => {
                      setLanguage("en");
                      setShowWorldLangDropdown(false);
                    }}
                    className={`py-2 text-xs font-black rounded-xl transition-all border active:scale-95 ${
                      language === "en" 
                        ? "bg-violet-600 border-violet-600 text-white shadow-md shadow-violet-500/20" 
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-350"
                    }`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => {
                      setLanguage("hi");
                      setShowWorldLangDropdown(false);
                    }}
                    className={`py-2 text-xs font-black rounded-xl transition-all border active:scale-95 ${
                      language === "hi" 
                        ? "bg-violet-600 border-violet-600 text-white shadow-md shadow-violet-500/20" 
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-350"
                    }`}
                  >
                    हिंदी
                  </button>
                  <button
                    onClick={() => {
                      setLanguage("gu");
                      setShowWorldLangDropdown(false);
                    }}
                    className={`py-2 text-xs font-black rounded-xl transition-all border active:scale-95 ${
                      language === "gu" 
                        ? "bg-violet-600 border-violet-600 text-white shadow-md shadow-violet-500/20" 
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-350"
                    }`}
                  >
                    ગુજરાતી
                  </button>
                </div>

                {/* World language selector inside Settings (Fix 3) */}
                <div className="relative pt-1 text-left" ref={settingsLangRef}>
                  <button
                    type="button"
                    id="settings-lang-btn"
                    aria-haspopup="listbox"
                    aria-expanded={showWorldLangDropdown}
                    aria-controls="settings-lang-listbox"
                    onClick={() => setShowWorldLangDropdown(!showWorldLangDropdown)}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs text-left font-bold flex items-center justify-between text-slate-700 hover:bg-slate-100 transition-colors focus:border-violet-400 focus:outline-none"
                  >
                    <div className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-violet-600" />
                      <span className="truncate">
                        {worldLanguages.find(wl => wl.code === language)?.label || 
                         (language !== "en" && language !== "hi" && language !== "gu" ? language : t.otherLanguage)}
                      </span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {showWorldLangDropdown && (
                    <div id="settings-lang-listbox" role="listbox" aria-labelledby="settings-lang-btn" className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden max-h-40 flex flex-col">
                      <div className="p-1.5 border-b border-slate-100 flex items-center gap-1.5 bg-slate-50">
                        <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <input
                          type="text"
                          placeholder="Search language..."
                          value={worldLangSearch}
                          onChange={e => setWorldLangSearch(e.target.value)}
                          className="w-full text-xs bg-transparent text-slate-700 focus:outline-none placeholder-slate-400"
                        />
                      </div>
                      <div className="overflow-y-auto flex-1">
                        {worldLanguages.filter(wl =>
                          wl.label.toLowerCase().includes(worldLangSearch.toLowerCase()) ||
                          wl.code.toLowerCase().includes(worldLangSearch.toLowerCase())
                        ).map(wl => (
                          <button
                            key={wl.code}
                            type="button"
                            role="option"
                            aria-selected={language === wl.code}
                            onClick={(e) => {
                              setLanguage(wl.code);
                              setShowWorldLangDropdown(false);
                              setWorldLangSearch("");
                              const trigger = e.currentTarget.closest('.relative')?.firstElementChild as HTMLElement;
                              if (trigger && typeof trigger.focus === "function") {
                                trigger.focus();
                              }
                            }}
                            className={`w-full text-left px-3 py-2 text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center justify-between ${
                              language === wl.code ? "bg-violet-50 text-violet-700" : "text-slate-600"
                            }`}
                          >
                            <span>{wl.label}</span>
                            {language === wl.code && <Check className="w-3 h-3 text-violet-605" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {language !== "en" && language !== "hi" && language !== "gu" && (
                  <div className="mt-1.5 text-left bg-amber-50 border border-amber-100 text-amber-800 rounded-xl p-2 text-[9px] font-semibold leading-normal animate-fadeIn flex items-start gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-505 shrink-0 mt-0.5" />
                    <span>
                      {t.translatingTo.replace("{lang}", worldLanguages.find(wl => wl.code === language)?.label || language)}
                    </span>
                  </div>
                )}
              </div>

              {/* Setting 3: Caregiver Notifications Alert */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="space-y-0.5 max-w-[70%]">
                  <div className="flex items-center gap-1.5 text-slate-800">
                    <Bell className="w-4 h-4 text-violet-605" />
                    <span className="text-xs font-extrabold uppercase tracking-wide">
                      {t.caregiverAlerts}
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-500 leading-normal">
                    {t.caregiverAlertsDesc}
                  </p>
                </div>
                <button
                  onClick={() => setCaregiverAlert(!caregiverAlert)}
                  className={`w-11 h-6 rounded-full transition-colors duration-300 relative flex items-center p-1 border ${
                    caregiverAlert 
                      ? "bg-violet-600 border-violet-500" 
                      : "bg-slate-200 border-slate-300"
                  }`}
                >
                  <div className={`w-3.5 h-3.5 bg-white rounded-full shadow-md transition-transform duration-300 transform ${
                    caregiverAlert ? "translate-x-5" : "translate-x-0"
                  }`} />
                </button>
              </div>

              {/* Setting 4: Demo Mode Toggle */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100/50 transition-all">
                <div className="space-y-0.5 max-w-[70%]">
                  <div className="flex items-center gap-1.5 text-slate-800">
                    <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                    <span className="text-xs font-extrabold uppercase tracking-wide">
                      {t.demoModeSandbox}
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-500 leading-normal">
                    {t.demoModeDesc}
                  </p>
                </div>
                <button
                  onClick={toggleDemoMode}
                  className={`w-11 h-6 rounded-full transition-colors duration-300 relative flex items-center p-1 border ${
                    demoModeActive 
                      ? "bg-violet-600 border-violet-500" 
                      : "bg-slate-200 border-slate-300"
                  }`}
                  id="demo-mode-toggle-switch"
                >
                  <div className={`w-3.5 h-3.5 bg-white rounded-full shadow-md transition-transform duration-300 transform ${
                    demoModeActive ? "translate-x-5" : "translate-x-0"
                  }`} />
                </button>
              </div>

              {/* Reset Data Section */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className="text-[10px] text-slate-400 font-medium shrink-0">Saathi v2.0 (PWA)</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setResetConfirmPending(true);
                      setResetCountdown(5);
                    }}
                    className="text-[9px] font-black text-rose-500 hover:text-rose-650 uppercase tracking-wider bg-rose-50 hover:bg-rose-100/60 border border-rose-100 px-3 py-1.5 rounded-xl transition-all"
                  >
                    {t.resetAppData}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Factory Reset Confirmation Dialog Modal */}
      {resetConfirmPending && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-fadeIn text-left">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-2xl max-w-sm w-full space-y-4 animate-scaleUp">
            <div className="flex items-center gap-3 text-red-600 border-b border-slate-100 pb-3">
              <AlertTriangle className="w-6 h-6 text-red-500 animate-bounce" />
              <h3 className="text-sm font-black uppercase tracking-wide">
                {t.confirmFactoryReset}
              </h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              {t.factoryResetWarning}
            </p>
            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => {
                  setResetConfirmPending(false);
                  setResetCountdown(5);
                }}
                className="flex-1 bg-slate-105 hover:bg-slate-200 text-slate-700 font-extrabold text-xs py-3 rounded-xl transition-all active:scale-95 min-h-[44px] bg-slate-100 border border-slate-200"
              >
                {t.cancel}
              </button>
              <button
                onClick={() => {
                  safeClear();
                  window.location.reload();
                }}
                disabled={resetCountdown > 0}
                className={`flex-1 text-white font-extrabold text-xs py-3 rounded-xl transition-all min-h-[44px] ${
                  resetCountdown > 0
                    ? "bg-red-300 cursor-not-allowed text-white/80"
                    : "bg-red-600 hover:bg-red-700 active:scale-95 shadow-md animate-pulse"
                }`}
              >
                {resetCountdown > 0
                  ? t.confirmCountdown.replace("{countdown}", resetCountdown.toString())
                  : t.resetNow}
              </button>
            </div>
          </div>
        </div>
      )}

      {renderProfileModal()}

      {welcomeToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-violet-900/95 backdrop-blur-sm border border-violet-500/30 text-purple-205 px-5 py-3 rounded-2xl shadow-xl z-50 flex items-center gap-2 font-black text-xs animate-scaleUp">
          <Heart className="w-4 h-4 text-purple-400 fill-purple-400 animate-pulse" />
          <span>{welcomeToast}</span>
        </div>
      )}
    </main>

      {/* RIGHT PANEL (desktop ≥1200px) — hidden during onboarding */}
      {!showOnboarding && (
        <RightPanel
          userProfile={userProfile}
          recordsList={recordsList}
          vitalsHistory={vitalsHistory}
          setActiveTab={handleTabChange}
        />
      )}
    </div>
    </>
  );
}
