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
  Check,
  Camera,
  FileText,
  Trash2,
  Sparkles
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
      let confirmMsg = "Activate Demo Mode? This will seed realistic patients, vitals history, and medicine schedules for demonstration purposes. Your existing records will not be deleted.";
      if (language === "hi") {
        confirmMsg = "डेमो मोड सक्रिय करें? यह प्रदर्शन के लिए रोगियों, वाइटल्स इतिहास और दवा कार्यक्रम को लोड करेगा। आपके मौजूदा रिकॉर्ड हटाए नहीं जाएंगे।";
      } else if (language === "gu") {
        confirmMsg = "ડેમો મોડ સક્રિય કરવો છે? આ નિદર્શન માટે દર્દીઓ, વાઇટલ્સ ઇતિહાસ અને દવાઓનું શેડ્યૂલ લોડ કરશે. તમારા અસ્તિત્વમાં રહેલા રેકોર્ડ્સ કાઢી નાખવામાં આવશે નહીં.";
      }

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
      let confirmMsg = "Deactivate Demo Mode? This will remove all demonstration records and data, keeping only your genuine user records.";
      if (language === "hi") {
        confirmMsg = "डेमो मोड बंद करें? यह सभी प्रदर्शन रिकॉर्ड और डेटा को हटा देगा, केवल आपके वास्तविक उपयोगकर्ता रिकॉर्ड को रखेगा।";
      } else if (language === "gu") {
        confirmMsg = "ડેમો મોડ બંધ કરવો છે? આ નિદર્શન માટેના તમામ રેકોર્ડ્સ અને ડેટા કાઢી નાખશે, ફક્ત તમારા જ રેકોર્ડ્સ રાખશે.";
      }

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
      errors.name = language === "hi" ? "नाम दर्ज करना आवश्यक है" : language === "gu" ? "નામ દાખલ કરવું જરૂરી છે" : "Name is required";
    }
    const ageNum = Number(profileForm.age);
    if (!profileForm.age || isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
      errors.age = language === "hi" ? "कृपया मान्य आयु (1-120) दर्ज करें" : language === "gu" ? "કૃપા કરીને માન્ય ઉંમર (1-120) દાખલ કરો" : "Please enter a valid age (1-120)";
    }
    const phoneTrim = profileForm.phone.trim();
    if (!phoneTrim || phoneTrim.length !== 10 || !/^\d+$/.test(phoneTrim)) {
      errors.phone = language === "hi" ? "कृपया 10-अंकों का मोबाइल नंबर दर्ज करें" : language === "gu" ? "કૃપા કરીને 10-આંકડાનો મોબાઇલ નંબર દાખલ કરો" : "Please enter a valid 10-digit phone number";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateSubStepB = () => {
    const errors: { [key: string]: string } = {};
    const emergencyPhone = profileForm.emergencyPhone.trim();
    if (emergencyPhone && (emergencyPhone.length !== 10 || !/^\d+$/.test(emergencyPhone))) {
      errors.emergencyPhone = language === "hi" ? "आपातकालीन फोन 10 अंकों का होना चाहिए" : language === "gu" ? "ઇમરજન્સી ફોન 10 આંકડાનો હોવો જોઈએ" : "Emergency phone must be 10 digits";
    }
    const abhaTrim = profileForm.abha.replace(/\D/g, "");
    if (abhaTrim && abhaTrim.length !== 14) {
      errors.abha = language === "hi" ? "कृपया 14 अंकों का मान्य आभा नंबर दर्ज करें" : language === "gu" ? "કૃપા કરીને 14 આંકડાનો માન્ય આભા નંબર દાખલ કરો" : "ABHA number must be exactly 14 digits";
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
      const toastMsg = language === "hi" ? `नमस्ते, ${firstName}!` : language === "gu" ? `નમસ્તે, ${firstName}!` : `Namaste, ${firstName}!`;
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
      language === "hi" 
        ? "क्या आप निश्चित रूप से ऐप को रीसेट करना चाहते हैं और ऑनबोर्डिंग को फिर से शुरू करना चाहते हैं?" 
        : language === "gu" 
        ? "શું તમે ખરેખર એપ્લિકેશન રીસેટ કરવા અને ઓનબોર્ડિંગ ફરીથી શરૂ કરવા માંગો છો?" 
        : "Are you sure you want to reset the app and redo the onboarding flow?"
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
      <div className="absolute inset-0 bg-gradient-to-br from-teal-900 via-teal-950 to-emerald-950 text-white z-50 flex flex-col font-sans p-6 sm:p-10 md:p-16 justify-between select-none animate-fadeIn items-center">
        {/* Decorative background blurs */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-teal-500/20 rounded-full blur-3xl pointer-events-none -translate-x-1/4 translate-y-1/4" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none translate-x-1/4 -translate-y-1/4" />

        {/* Top Header */}
        <div className="flex justify-between items-center z-10 shrink-0 w-full max-w-lg">
          <div className="flex items-center gap-1.5">
            <Heart className="w-5 h-5 text-emerald-400 fill-emerald-400 animate-pulse" />
            <span className="font-black text-lg tracking-tight bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">Saathi</span>
          </div>
          {onboardStep >= 1 && onboardStep <= 3 && (
            <span className="text-[10px] font-black text-teal-355 uppercase tracking-widest bg-teal-500/10 px-2 py-0.5 rounded-full border border-teal-400/20">
              {language === "hi" ? `चरण ${onboardStep} / ३` : language === "gu" ? `પગલું ${onboardStep} / ૩` : `Step ${onboardStep} of 3`}
            </span>
          )}
        </div>

        {/* STEP 0: Welcome & Language selection */}
        {onboardStep === 0 && (
          <div className="flex-1 flex flex-col justify-center space-y-6 z-10 animate-scaleUp text-center w-full max-w-lg">
            <div className="space-y-2">
              <div className="w-20 h-20 bg-teal-550/20 rounded-3xl flex items-center justify-center mx-auto border border-teal-400/20 animate-pulse">
                <Heart className="w-10 h-10 text-teal-300 fill-teal-400/20" />
              </div>
              <h2 className="text-3xl font-black tracking-tight mt-4 bg-gradient-to-r from-teal-200 to-emerald-300 bg-clip-text text-transparent">
                Saathi
              </h2>
              <p className="text-xs text-teal-200 max-w-xs mx-auto leading-relaxed font-semibold">
                Your AI Health Companion
              </p>
            </div>

            <div className="space-y-3 pt-6 w-full">
              <span className="text-[10px] font-bold text-teal-300 uppercase tracking-wider block">
                Select Your Language / भाषा चुनें / ભાષા પસંદ કરો
              </span>
              <div className="flex flex-col gap-2.5">
                {[
                  { code: "en", label: "English" },
                  { code: "hi", label: "हिंदी (Hindi)" },
                  { code: "gu", label: "ગુજરાતી (Gujarati)" }
                ].map((l) => (
                  <button
                    key={l.code}
                    onClick={() => setLanguage(l.code as any)}
                    className={`py-3 px-4 rounded-2xl text-xs font-black border transition-all flex items-center justify-between ${
                      language === l.code
                        ? "bg-teal-600 border-teal-450 text-white shadow-lg scale-[1.02]"
                        : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                    }`}
                  >
                    <span>{l.label}</span>
                    {language === l.code && <Check className="w-4 h-4 text-emerald-405" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={() => setOnboardStep(1)}
                className="w-full py-3.5 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-xs font-black shadow-lg transition-all text-white flex items-center justify-center gap-1.5 mx-auto"
              >
                <span>{language === "hi" ? "शुरू करें" : language === "gu" ? "શરૂ કરો" : "Get Started"}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Slide 1 */}
        {onboardStep === 1 && (
          <div className="flex-1 flex flex-col justify-center space-y-6 z-10 animate-slide-in text-left w-full max-w-lg">
            <div className="flex justify-between items-center shrink-0">
              <span className="text-[10px] font-black uppercase text-teal-355 tracking-widest">
                {language === "hi" ? "सुविधा १: कैमरा जांच" : language === "gu" ? "સુવિધા ૧: કેમેરા તપાસ" : "Feature 1: Camera Screening"}
              </span>
              <button 
                onClick={() => setOnboardStep(4)} 
                className="text-xs font-bold text-teal-300 hover:text-white transition-colors uppercase tracking-wider"
              >
                {t.skip}
              </button>
            </div>
            
            <div className="flex-1 flex flex-col justify-center space-y-6">
              {/* Tappable Live Camera Demo Box */}
              <div
                className="w-full aspect-video bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center relative overflow-hidden group shrink-0 cursor-pointer active:scale-[0.98] transition-transform"
                onClick={async () => {
                  if (onboardCamStream || onboardCamLoading) return;
                  setOnboardCamLoading(true);
                  try {
                    const stream = await navigator.mediaDevices.getUserMedia({
                      video: { facingMode: "environment", width: { ideal: 480 }, height: { ideal: 360 } }
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
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-emerald-400/70 animate-scan pointer-events-none z-20" />
                    <span className="absolute top-2 right-2 bg-emerald-500/90 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider z-20 animate-pulse">
                      {language === "hi" ? "लाइव प्रीव्यू" : language === "gu" ? "લાઇવ પ્રીવ્યૂ" : "Live Preview"}
                    </span>
                  </>
                ) : onboardCamErr ? (
                  /* Animated fallback illustration (permission denied) */
                  <>
                    <div className="absolute inset-0 bg-gradient-to-tr from-teal-500/10 to-emerald-500/10" />
                    <div className="relative z-10 flex flex-col items-center gap-2">
                      <div className="relative">
                        <Camera className="w-14 h-14 text-teal-300 animate-onboard-cam-pulse" />
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-ping" />
                        <div className="absolute -bottom-1 -left-2 w-2 h-2 bg-teal-300 rounded-full animate-onboard-float-dot" />
                        <div className="absolute top-1/2 right-[-14px] w-2.5 h-2.5 bg-emerald-300 rounded-full animate-onboard-float-dot2" />
                      </div>
                      <span className="text-[9px] text-teal-200 font-bold">
                        {language === "hi" ? "कैमरा अनुपलब्ध" : language === "gu" ? "કેમેરા અનુપલબ્ધ" : "Camera unavailable"}
                      </span>
                    </div>
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-emerald-400/50 animate-scan pointer-events-none" />
                  </>
                ) : (
                  /* Default: tap to activate */
                  <>
                    <div className="absolute inset-0 bg-gradient-to-tr from-teal-500/10 to-emerald-500/10" />
                    {onboardCamLoading ? (
                      <div className="relative z-10 flex flex-col items-center gap-2">
                        <div className="w-10 h-10 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
                        <span className="text-[9px] text-teal-200 font-bold">
                          {language === "hi" ? "कैमरा खोल रहे हैं..." : language === "gu" ? "કેમેરા ખોલી રહ્યા છીએ..." : "Opening camera..."}
                        </span>
                      </div>
                    ) : (
                      <div className="relative z-10 flex flex-col items-center gap-2">
                        <Camera className="w-14 h-14 text-teal-300 animate-onboard-cam-pulse" />
                        <span className="text-[10px] text-teal-200 font-bold bg-white/10 px-3 py-1 rounded-full">
                          {language === "hi" ? "लाइव डेमो के लिए टैप करें" : language === "gu" ? "લાઇવ ડેમો માટે ટેપ કરો" : "Tap for live demo"}
                        </span>
                      </div>
                    )}
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-emerald-400/50 animate-scan pointer-events-none" />
                  </>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-black text-white leading-tight">
                  {language === "hi" ? "बिना रक्त परीक्षण के स्वास्थ्य की जांच करें" : language === "gu" ? "લોહીની તપાસ વિના સ્વાસ્થ્ય તપાસો" : "Check health with just your camera"}
                </h3>
                <p className="text-xs text-teal-200 leading-relaxed font-medium">
                  {language === "hi" 
                    ? "सिर्फ अपने चेहरे, आंख या जीभ के स्कैन से एनीमिया और पीलिया जैसी बीमारियों का तुरंत पता लगाएं।" 
                    : language === "gu" 
                    ? "માત્ર તમારા ચહેરો, આંખ અથવા જીભના સ્કેનથી પાંડુરોગ અને કમળા જેવી બીમારીઓની ત્વરિત તપાસ કરો." 
                    : "Instantly screen for conditions like anemia and jaundice using advanced non-invasive computer vision scans."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Slide 2 */}
        {onboardStep === 2 && (
          <div className="flex-1 flex flex-col justify-center space-y-6 z-10 animate-slide-in text-left w-full max-w-lg">
            <div className="flex justify-between items-center shrink-0">
              <span className="text-[10px] font-black uppercase text-teal-355 tracking-widest">
                {language === "hi" ? "सुविधा २: वाइटल्स और आवाज जांच" : language === "gu" ? "સુવિધા ૨: વાઇટલ્સ અને અવાજ તપાસ" : "Feature 2: Vitals & Voice"}
              </span>
              <button 
                onClick={() => setOnboardStep(4)} 
                className="text-xs font-bold text-teal-300 hover:text-white transition-colors uppercase tracking-wider"
              >
                {t.skip}
              </button>
            </div>
            
            <div className="flex-1 flex flex-col justify-center space-y-6">
              <div className="w-full aspect-video bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center relative overflow-hidden shrink-0">
                <div className="absolute inset-0 bg-gradient-to-tr from-pink-500/10 to-teal-500/10" />
                <div className="flex flex-col items-center gap-3 relative z-10">
                  <div className="flex items-center gap-3">
                    <Heart className="w-10 h-10 text-pink-400 fill-pink-500/20 animate-onboard-heartbeat" />
                    <span className="text-xs font-bold text-slate-300">72 BPM</span>
                  </div>
                  {/* Animated Heartbeat Waveform SVG */}
                  <svg viewBox="0 0 200 40" className="w-48 h-8" preserveAspectRatio="none">
                    <polyline
                      points="0,20 20,20 30,20 38,5 46,35 54,10 62,30 70,20 80,20 100,20 110,20 118,5 126,35 134,10 142,30 150,20 160,20 200,20"
                      fill="none"
                      stroke="#f472b6"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="animate-onboard-ecg"
                    />
                  </svg>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-black text-white leading-tight">
                  {language === "hi" ? "वाइटल्स मापें और अपने लक्षण बोलें" : language === "gu" ? "વાઇટલ્સ માપો અને તમારા લક્ષણો બોલો" : "Measure vitals & speak your symptoms"}
                </h3>
                <p className="text-xs text-teal-200 leading-relaxed font-medium">
                  {language === "hi" 
                    ? "कैमरे से संपर्क रहित हृदय गति मापें और एआई के साथ स्थानीय भाषा में बात करके तुरंत स्वास्थ्य परामर्श लें।" 
                    : language === "gu" 
                    ? "કેમેરાથી સંપર્ક વિના હૃદયના ધબકારા માપો અને AI સાથે સ્થાનિક ભાષામાં વાત કરી ત્વરિત સ્વાસ્થ્ય સલાહ મેળવો." 
                    : "Measure heart rate & breathing rate contactless via camera, and speak symptoms in your language to get instant screening support."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Slide 3 */}
        {onboardStep === 3 && (
          <div className="flex-1 flex flex-col justify-center space-y-6 z-10 animate-slide-in text-left w-full max-w-lg">
            <div className="flex justify-between items-center shrink-0">
              <span className="text-[10px] font-black uppercase text-teal-355 tracking-widest">
                {language === "hi" ? "सुविधा ३: पूर्ण स्वास्थ्य प्रबंधन" : language === "gu" ? "સુવિધા ૩: પૂર્ણ સ્વાસ્થ્ય સંચાલન" : "Feature 3: Complete Health"}
              </span>
              <button 
                onClick={() => setOnboardStep(4)} 
                className="text-xs font-bold text-teal-300 hover:text-white transition-colors uppercase tracking-wider"
              >
                {t.skip}
              </button>
            </div>
            
            <div className="flex-1 flex flex-col justify-center space-y-6">
              <div className="w-full aspect-video bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center relative overflow-hidden shrink-0">
                <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 to-teal-500/10" />
                <div className="flex flex-col items-center gap-3 relative z-10 text-center px-4">
                  <div className="flex items-center gap-4">
                    <div className="w-4 h-4 rounded-full bg-red-400 animate-onboard-triage-red shadow-lg shadow-red-400/40" />
                    <div className="w-5 h-5 rounded-full bg-amber-400 animate-onboard-triage-yellow shadow-lg shadow-amber-400/40" />
                    <div className="w-6 h-6 rounded-full bg-emerald-400 animate-onboard-triage-green shadow-lg shadow-emerald-400/40" />
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-300" />
                    <span className="text-[10px] font-black text-slate-350 uppercase tracking-widest">ABDM ABHA Health ID</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-black text-white leading-tight">
                  {language === "hi" ? "सही समय पर सही देखभाल" : language === "gu" ? "યોગ્ય સમયે યોગ્ય સંભાળ" : "Right care at the right time"}
                </h3>
                <p className="text-xs text-teal-200 leading-relaxed font-medium">
                  {language === "hi" 
                    ? "रंग-कोडित ट्राइएज रिस्क बैंड, डॉक्टर से परामर्श, डिजिटल आयुष्मान भारत हेल्थ आईडी कार्ड और ऑफ़लाइन दवाओं के रिमाइंडर।" 
                    : language === "gu" 
                    ? "અલગ અલગ જોખમ બેન્ડ્સ, ડૉક્ટર સંપર્ક, ડિજિટલ આયુષ્માન ભારત હેલ્થ આઈડી કાર્ડ અને ઓફલાઇન દવા રીમાઇન્ડર્સ." 
                    : "Red/Yellow/Green triage categories, direct doctor consulting, dynamic ABHA cards, and automated offline medication reminders."}
                </p>
                <p className="text-[10px] text-emerald-400 font-bold italic mt-1 animate-pulse">
                  {language === "hi" 
                    ? "आप अगले चरण में अपनी ABHA आईडी जोड़ सकते हैं" 
                    : language === "gu" 
                    ? "તમે આગલા પગલામાં તમારી ABHA ID ઉમેરી શકો છો" 
                    : "You can add your ABHA ID in the next step"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Slide navigation controls */}
        {onboardStep >= 1 && onboardStep <= 3 && (
          <div className="flex justify-between items-center gap-3 z-10 pt-4 border-t border-white/10 shrink-0 w-full max-w-lg">
            <button
              onClick={() => setOnboardStep(prev => prev - 1)}
              className="py-3 px-5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold transition-all text-slate-350"
            >
              {language === "hi" ? "पीछे" : language === "gu" ? "પાછળ" : "Back"}
            </button>

            {/* Dots */}
            <div className="flex items-center gap-1.5">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    onboardStep === step ? "w-4 bg-emerald-450" : "w-1.5 bg-white/30"
                  }`}
                />
              ))}
            </div>

            <button
              onClick={() => setOnboardStep(prev => prev + 1)}
              className="py-3 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-xs font-black shadow-lg transition-all text-white flex items-center gap-1.5"
            >
              <span>{language === "hi" ? "अगला" : language === "gu" ? "આગળ" : "Next"}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* STEP 4: Profile intake form */}
        {onboardStep === 4 && (
          <div className="flex-1 flex flex-col justify-between z-10 text-left h-full overflow-hidden w-full max-w-lg">
            <div className="space-y-4 overflow-y-auto no-scrollbar pb-4 flex-1 pr-1">
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <h3 className="text-md font-black tracking-tight text-white flex items-center gap-2">
                  <span className="w-6 h-6 bg-teal-500/20 border border-teal-400/30 rounded-lg flex items-center justify-center text-teal-350 text-xs font-bold">4</span>
                  {t.profileFormTitle}
                </h3>
                <span className="text-[9px] font-extrabold text-teal-350 uppercase bg-teal-500/10 px-2.5 py-1 rounded-full border border-teal-400/20 shrink-0">
                  {profileSubStep === "A" 
                    ? (language === "hi" ? "भाग १" : language === "gu" ? "ભાગ ૧" : "Part A") 
                    : (language === "hi" ? "भाग २" : language === "gu" ? "ભાગ ૨" : "Part B")}
                </span>
              </div>

              {profileSubStep === "A" ? (
                /* SUB-STEP A */
                <div className="space-y-4 animate-scaleUp">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-teal-200 uppercase tracking-wide">
                      {t.fullName} <span className="text-red-405 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder={language === "hi" ? "जैसे: Aarav Sharma" : "e.g. Aarav Sharma"}
                      value={profileForm.name}
                      onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))}
                      className="w-full text-xs p-3.5 rounded-2xl bg-white/5 border border-white/10 text-white font-semibold focus:outline-none focus:border-teal-400 focus:bg-white/10"
                    />
                    {formErrors.name && (
                      <p className="text-[10px] text-red-405 font-bold flex items-center gap-1 mt-1">
                        ⚠️ {formErrors.name}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-teal-200 uppercase tracking-wide">
                      {t.age} <span className="text-red-405 font-bold">*</span>
                    </label>
                    <input
                      type="number"
                      placeholder={language === "hi" ? "जैसे: 28" : "e.g. 28"}
                      value={profileForm.age}
                      onChange={e => setProfileForm(p => ({ ...p, age: e.target.value }))}
                      className="w-full text-xs p-3.5 rounded-2xl bg-white/5 border border-white/10 text-white font-semibold focus:outline-none focus:border-teal-400 focus:bg-white/10"
                    />
                    {formErrors.age && (
                      <p className="text-[10px] text-red-405 font-bold flex items-center gap-1 mt-1">
                        ⚠️ {formErrors.age}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-teal-200 uppercase tracking-wide block">
                      {t.gender} <span className="text-red-405 font-bold">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {["Male", "Female", "Other"].map(g => (
                        <button
                          type="button"
                          key={g}
                          onClick={() => setProfileForm(p => ({ ...p, gender: g }))}
                          className={`py-3.5 px-1 rounded-2xl text-xs font-black border transition-all ${
                            profileForm.gender === g
                              ? "bg-teal-600 border-teal-450 text-white shadow-lg"
                              : "bg-white/5 border-white/10 text-slate-350 hover:bg-white/10"
                          }`}
                        >
                          {g === "Male" ? t.male : g === "Female" ? t.female : t.other}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-teal-200 uppercase tracking-wide">
                      {t.phone} <span className="text-red-405 font-bold">*</span>
                    </label>
                    <div className="flex items-center bg-white/5 border border-white/10 rounded-2xl overflow-hidden focus-within:border-teal-400">
                      <span className="text-xs text-teal-300 bg-white/5 py-3.5 px-4 font-bold border-r border-white/10">+91</span>
                      <input
                        type="tel"
                        maxLength={10}
                        placeholder={language === "hi" ? "10 अंकों का नंबर" : "10-digit number"}
                        value={profileForm.phone}
                        onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value.replace(/\D/g, "") }))}
                        className="w-full text-xs p-3.5 bg-transparent text-white font-semibold focus:outline-none"
                      />
                    </div>
                    {formErrors.phone && (
                      <p className="text-[10px] text-red-405 font-bold flex items-center gap-1 mt-1">
                        ⚠️ {formErrors.phone}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                /* SUB-STEP B */
                <div className="space-y-4 animate-scaleUp">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-teal-200 uppercase tracking-wide block">
                      {t.conditions}
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { key: "Diabetes", label: language === "hi" ? "मधुमेह" : language === "gu" ? "મધુમેહ" : "Diabetes" },
                        { key: "High Blood Pressure", label: language === "hi" ? "उच्च रक्तचाप" : language === "gu" ? "હાઈ બ્લડ પ્રેશર" : "High BP" },
                        { key: "Heart Disease", label: language === "hi" ? "हृदय रोग" : language === "gu" ? "હૃદય રોગ" : "Heart Disease" },
                        { key: "Asthma/Respiratory", label: language === "hi" ? "अस्थमा" : language === "gu" ? "અસ્થમા" : "Asthma" },
                        { key: "Thyroid", label: language === "hi" ? "थायराइड" : language === "gu" ? "થાઇરોઇડ" : "Thyroid" },
                        { key: "Kidney Disease", label: language === "hi" ? "गुर्दे की बीमारी" : language === "gu" ? "કિડનીની બીમારી" : "Kidney" },
                        { key: "Anemia", label: language === "hi" ? "एनीमिया" : language === "gu" ? "એનિમિયા" : "Anemia" },
                        { key: "Other", label: language === "hi" ? "अन्य" : language === "gu" ? "અન્ય" : "Other" },
                        { key: "None", label: language === "hi" ? "कोई नहीं" : language === "gu" ? "કોઈ નહીં" : "None" }
                      ].map(c => {
                        const isSelected = profileForm.conditions.includes(c.key);
                        return (
                          <button
                            type="button"
                            key={c.key}
                            onClick={() => handleConditionClick(c.key)}
                            className={`py-2 px-3 rounded-full text-[10px] font-bold border transition-all ${
                              isSelected
                                ? "bg-emerald-500/20 border-emerald-450 text-white font-extrabold shadow-sm"
                                : "bg-white/5 border-white/10 text-slate-350 hover:bg-white/10"
                            }`}
                          >
                            {c.label}
                          </button>
                        );
                      })}
                    </div>

                    {profileForm.conditions.includes("Other") && (
                      <div className="space-y-1 mt-2 animate-fadeIn">
                        <label className="text-[10px] font-bold text-teal-200 uppercase tracking-wide">
                          {language === "hi" ? "अन्य स्थिति निर्दिष्ट करें" : language === "gu" ? "અન્ય સ્થિતિ સ્પષ્ટ કરો" : "Specify Other Condition"}
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Acid Reflux"
                          value={profileForm.otherCondition}
                          onChange={e => setProfileForm(p => ({ ...p, otherCondition: e.target.value }))}
                          className="w-full text-xs p-3.5 rounded-2xl bg-white/5 border border-white/10 text-white font-semibold focus:outline-none focus:border-teal-400 focus:bg-white/10"
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-teal-200 uppercase tracking-wide block">
                        {t.bloodGroup}
                      </label>
                      <select
                        value={profileForm.bloodGroup}
                        onChange={e => setProfileForm(p => ({ ...p, bloodGroup: e.target.value }))}
                        className="w-full text-xs p-3 rounded-2xl bg-teal-950 border border-white/10 text-teal-150 font-bold focus:outline-none focus:border-teal-400 h-[44px]"
                      >
                        {["Unknown", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(bg => (
                          <option key={bg} value={bg}>{bg}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-teal-200 uppercase tracking-wide">
                        {t.allergies}
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Peanuts, Penicillin"
                        value={profileForm.allergies}
                        onChange={e => setProfileForm(p => ({ ...p, allergies: e.target.value }))}
                        className="w-full text-xs p-3 rounded-2xl bg-white/5 border border-white/10 text-white font-semibold focus:outline-none focus:border-teal-400 focus:bg-white/10 h-[44px]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-teal-200 uppercase tracking-wide">
                      {t.medications}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Metformin 500mg daily"
                      value={profileForm.medications}
                      onChange={e => setProfileForm(p => ({ ...p, medications: e.target.value }))}
                      className="w-full text-xs p-3.5 rounded-2xl bg-white/5 border border-white/10 text-white font-semibold focus:outline-none focus:border-teal-400 focus:bg-white/10"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-teal-200 uppercase tracking-wide">
                      {language === "hi" ? "आभा नंबर (वैकल्पिक)" : language === "gu" ? "આભા નંબર (વૈકલ્પિક)" : "ABHA Number (optional)"}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 12-3456-7890-1234"
                      value={formatABHA(profileForm.abha)}
                      onChange={e => {
                        const raw = e.target.value.replace(/\D/g, "").slice(0, 14);
                        setProfileForm(p => ({ ...p, abha: raw }));
                      }}
                      className="w-full text-xs p-3.5 rounded-2xl bg-white/5 border border-white/10 text-white font-semibold focus:outline-none focus:border-teal-400 focus:bg-white/10"
                    />
                    <p className="text-[9px] text-teal-300 font-semibold mt-0.5">
                      {language === "hi" 
                        ? "आयुष्मान भारत स्वास्थ्य खाता — वैकल्पिक" 
                        : language === "gu" 
                        ? "આયુષ્માન ભારત હેલ્થ એકાઉન્ટ — વૈકલ્પિક" 
                        : "Ayushman Bharat Health Account — optional"}
                    </p>
                    {formErrors.abha && (
                      <p className="text-[10px] text-red-405 font-bold flex items-center gap-1 mt-1">
                        ⚠️ {formErrors.abha}
                      </p>
                    )}
                  </div>

                  <div className="border-t border-white/10 pt-3 mt-1 space-y-3">
                    <span className="text-[10px] font-bold text-teal-300 uppercase tracking-wider block">
                      {language === "hi" ? "आपातकालीन संपर्क (वैकल्पिक)" : language === "gu" ? "ઇમરજન્સી સંપર્ક (વૈકલ્પિક)" : "Emergency Contact (Optional)"}
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-teal-250 uppercase">
                          {language === "hi" ? "नाम" : language === "gu" ? "નામ" : "Name"}
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Sunita Sharma"
                          value={profileForm.emergencyName}
                          onChange={e => setProfileForm(p => ({ ...p, emergencyName: e.target.value }))}
                          className="w-full text-xs p-3 rounded-2xl bg-white/5 border border-white/10 text-white font-semibold focus:outline-none focus:border-teal-400 focus:bg-white/10 h-[44px]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-teal-250 uppercase">
                          {language === "hi" ? "फोन" : language === "gu" ? "ફોન" : "Phone"}
                        </label>
                        <input
                          type="tel"
                          maxLength={10}
                          placeholder="10-digit number"
                          value={profileForm.emergencyPhone}
                          onChange={e => setProfileForm(p => ({ ...p, emergencyPhone: e.target.value.replace(/\D/g, "") }))}
                          className="w-full text-xs p-3 rounded-2xl bg-white/5 border border-white/10 text-white font-semibold focus:outline-none focus:border-teal-400 focus:bg-white/10 h-[44px]"
                        />
                      </div>
                    </div>
                    {formErrors.emergencyPhone && (
                      <p className="text-[10px] text-red-405 font-bold flex items-center gap-1 mt-1">
                        ⚠️ {formErrors.emergencyPhone}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Actions for Profile Step 4 */}
            <div className="flex justify-between items-center gap-3 z-10 pt-4 border-t border-white/10 shrink-0">
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
                className="py-3 px-5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold transition-all text-slate-350"
              >
                {language === "hi" ? "पीछे" : language === "gu" ? "પાછળ" : "Back"}
              </button>

              {profileSubStep === "A" ? (
                <button
                  type="button"
                  onClick={() => {
                    if (validateSubStepA()) {
                      setProfileSubStep("B");
                    }
                  }}
                  className="py-3 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-xs font-black shadow-lg transition-all text-white flex items-center gap-1.5"
                >
                  <span>{language === "hi" ? "आगे बढ़ें" : language === "gu" ? "આગળ વધો" : "Next Details"}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  className="py-3 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-xs font-black shadow-lg transition-all text-white flex items-center gap-1.5"
                >
                  <span>{language === "hi" ? "पूर्ण करें" : language === "gu" ? "સમાપ્ત કરો" : "Finish Setup"}</span>
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
      <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fadeIn text-left">
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl max-w-sm md:max-w-lg w-full max-h-[85vh] md:max-h-[90vh] overflow-y-auto space-y-4 animate-scaleUp no-scrollbar">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-slate-800">
              <Heart className="w-5 h-5 text-teal-600 fill-teal-50 animate-pulse" />
              <h3 className="text-sm font-black uppercase tracking-wide">
                {language === "hi" ? "स्वास्थ्य प्रोफ़ाइल" : language === "gu" ? "સ્વાસ્થ્ય પ્રોફાઇલ" : "Health Profile"}
              </h3>
            </div>
            <button
              onClick={() => {
                setShowProfileModal(false);
                setFormErrors({});
              }}
              className="p-1.5 rounded-full hover:bg-slate-50 text-slate-400 hover:text-slate-655 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Section 1: Basic Info */}
            <div className="space-y-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                {language === "hi" ? "१. बुनियादी जानकारी" : language === "gu" ? "૧. મૂળભૂત માહિતી" : "1. Basic Information"}
              </span>
              
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-650 uppercase tracking-wide">
                  {t.fullName} <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Aarav Sharma"
                  value={profileForm.name}
                  onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full text-xs p-3 rounded-2xl border border-slate-200 bg-slate-50 font-semibold focus:outline-none focus:border-teal-555 h-[44px]"
                />
                {formErrors.name && (
                  <p className="text-[9px] text-red-500 font-bold">⚠️ {formErrors.name}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-650 uppercase tracking-wide">
                    {t.age} <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 28"
                    value={profileForm.age}
                    onChange={e => setProfileForm(p => ({ ...p, age: e.target.value }))}
                    className="w-full text-xs p-3 rounded-2xl border border-slate-200 bg-slate-50 font-semibold focus:outline-none focus:border-teal-555 h-[44px]"
                  />
                  {formErrors.age && (
                    <p className="text-[9px] text-red-500 font-bold">⚠️ {formErrors.age}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-650 uppercase tracking-wide block">
                    {t.gender} <span className="text-red-500 font-bold">*</span>
                  </label>
                  <select
                    value={profileForm.gender}
                    onChange={e => setProfileForm(p => ({ ...p, gender: e.target.value }))}
                    className="w-full text-xs p-3 rounded-2xl border border-slate-200 bg-slate-50 font-bold focus:outline-none focus:border-teal-555 h-[44px]"
                  >
                    <option value="Male">{t.male}</option>
                    <option value="Female">{t.female}</option>
                    <option value="Other">{t.other}</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-650 uppercase tracking-wide">
                  {t.phone} <span className="text-red-500 font-bold">*</span>
                </label>
                <div className="flex items-center border border-slate-200 bg-slate-50 rounded-2xl overflow-hidden focus-within:border-teal-555">
                  <span className="text-xs text-slate-600 bg-slate-100 py-3 px-4 font-bold border-r border-slate-200">+91</span>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="10-digit number"
                    value={profileForm.phone}
                    onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value.replace(/\D/g, "") }))}
                    className="w-full text-xs p-3 bg-transparent text-slate-800 font-semibold focus:outline-none"
                  />
                </div>
                {formErrors.phone && (
                  <p className="text-[9px] text-red-500 font-bold">⚠️ {formErrors.phone}</p>
                )}
              </div>
            </div>

            {/* Section 2: Health Background */}
            <div className="space-y-3 border-t border-slate-100 pt-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                {language === "hi" ? "२. स्वास्थ्य विवरण" : language === "gu" ? "૨. સ્વાસ્થ્ય વિગતો" : "2. Health Details"}
              </span>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-650 uppercase tracking-wide block">
                  {t.conditions}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { key: "Diabetes", label: language === "hi" ? "मधुमेह" : language === "gu" ? "મધુમેહ" : "Diabetes" },
                    { key: "High Blood Pressure", label: language === "hi" ? "उच्च रक्तचाप" : language === "gu" ? "હાઈ બ્લડ પ્રેશર" : "High BP" },
                    { key: "Heart Disease", label: language === "hi" ? "हृदय रोग" : language === "gu" ? "હૃદય રોગ" : "Heart Disease" },
                    { key: "Asthma/Respiratory", label: language === "hi" ? "अस्थमा" : language === "gu" ? "અસ્થમા" : "Asthma" },
                    { key: "Thyroid", label: language === "hi" ? "थायराइड" : language === "gu" ? "થાઇરોઇડ" : "Thyroid" },
                    { key: "Kidney Disease", label: language === "hi" ? "गुर्दे की बीमारी" : language === "gu" ? "કિડનીની બીમારી" : "Kidney" },
                    { key: "Anemia", label: language === "hi" ? "एनीमिया" : language === "gu" ? "એનિમિયા" : "Anemia" },
                    { key: "Other", label: language === "hi" ? "अन्य" : language === "gu" ? "અન્ય" : "Other" },
                    { key: "None", label: language === "hi" ? "कोई नहीं" : language === "gu" ? "કોઈ નહીં" : "None" }
                  ].map(c => {
                    const isSelected = profileForm.conditions.includes(c.key);
                    return (
                      <button
                        type="button"
                        key={c.key}
                        onClick={() => handleConditionClick(c.key)}
                        className={`py-1.5 px-2.5 rounded-full text-[9px] font-bold border transition-all ${
                          isSelected
                            ? "bg-teal-50 border-teal-600 text-teal-800 font-extrabold"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {c.label}
                      </button>
                    );
                  })}
                </div>

                {profileForm.conditions.includes("Other") && (
                  <div className="space-y-1 mt-2">
                    <label className="text-[9px] font-bold text-slate-650 uppercase">
                      {language === "hi" ? "अन्य स्थिति निर्दिष्ट करें" : language === "gu" ? "અન્ય સ્થિતિ સ્પષ્ટ કરો" : "Specify Other Condition"}
                    </label>
                    <input
                      type="text"
                      placeholder="Specify..."
                      value={profileForm.otherCondition}
                      onChange={e => setProfileForm(p => ({ ...p, otherCondition: e.target.value }))}
                      className="w-full text-xs p-3 rounded-2xl border border-slate-200 bg-slate-50 font-semibold focus:outline-none focus:border-teal-555 h-[44px]"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-650 uppercase block">
                    {t.bloodGroup}
                  </label>
                  <select
                    value={profileForm.bloodGroup}
                    onChange={e => setProfileForm(p => ({ ...p, bloodGroup: e.target.value }))}
                    className="w-full text-xs p-3 rounded-2xl border border-slate-200 bg-slate-50 font-bold focus:outline-none focus:border-teal-555 h-[44px]"
                  >
                    {["Unknown", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-650 uppercase">
                    {t.allergies}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Penicillin"
                    value={profileForm.allergies}
                    onChange={e => setProfileForm(p => ({ ...p, allergies: e.target.value }))}
                    className="w-full text-xs p-3 rounded-2xl border border-slate-200 bg-slate-50 font-semibold focus:outline-none focus:border-teal-555 h-[44px]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-650 uppercase">
                  {t.medications}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Aspirin 75mg"
                  value={profileForm.medications}
                  onChange={e => setProfileForm(p => ({ ...p, medications: e.target.value }))}
                  className="w-full text-xs p-3 rounded-2xl border border-slate-200 bg-slate-50 font-semibold focus:outline-none focus:border-teal-555 h-[44px]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-650 uppercase">
                  {language === "hi" ? "आभा नंबर (वैकल्पिक)" : language === "gu" ? "આભા નંબર (વૈકલ્પિક)" : "ABHA Number (optional)"}
                </label>
                <input
                  type="text"
                  placeholder="e.g. 12-3456-7890-1234"
                  value={formatABHA(profileForm.abha)}
                  onChange={e => {
                    const raw = e.target.value.replace(/\D/g, "").slice(0, 14);
                    setProfileForm(p => ({ ...p, abha: raw }));
                  }}
                  className="w-full text-xs p-3 rounded-2xl border border-slate-200 bg-slate-50 font-semibold focus:outline-none focus:border-teal-555 h-[44px]"
                />
                <p className="text-[9px] text-slate-400 font-semibold mt-0.5">
                  {language === "hi" 
                    ? "आयुष्मान भारत स्वास्थ्य खाता — वैकल्पिक" 
                    : language === "gu" 
                    ? "આયુષ્માન ભારત હેલ્થ એકાઉન્ટ — વૈકલ્પિક" 
                    : "Ayushman Bharat Health Account — optional"}
                </p>
                {formErrors.abha && (
                  <p className="text-[9px] text-red-500 font-bold">⚠️ {formErrors.abha}</p>
                )}
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                  {language === "hi" ? "आपातकालीन संपर्क" : language === "gu" ? "ઇમરજન્સી સંપર્ક" : "Emergency Contact"}
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-650 uppercase">
                      {language === "hi" ? "नाम" : language === "gu" ? "નામ" : "Name"}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Sunita"
                      value={profileForm.emergencyName}
                      onChange={e => setProfileForm(p => ({ ...p, emergencyName: e.target.value }))}
                      className="w-full text-xs p-3 rounded-2xl border border-slate-200 bg-slate-50 font-semibold focus:outline-none focus:border-teal-555 h-[44px]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-650 uppercase">
                      {language === "hi" ? "फोन" : language === "gu" ? "ફોન" : "Phone"}
                    </label>
                    <input
                      type="tel"
                      maxLength={10}
                      placeholder="10-digit"
                      value={profileForm.emergencyPhone}
                      onChange={e => setProfileForm(p => ({ ...p, emergencyPhone: e.target.value.replace(/\D/g, "") }))}
                      className="w-full text-xs p-3 rounded-2xl border border-slate-200 bg-slate-50 font-semibold focus:outline-none focus:border-teal-555 h-[44px]"
                    />
                  </div>
                </div>
                {formErrors.emergencyPhone && (
                  <p className="text-[9px] text-red-500 font-bold">⚠️ {formErrors.emergencyPhone}</p>
                )}
              </div>
            </div>

            {/* Reset App button inside Profile Modal */}
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleResetApp}
                className="w-full py-2.5 px-4 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold text-center flex items-center justify-center gap-1.5 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t.resetApp}</span>
              </button>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowProfileModal(false);
                  setFormErrors({});
                }}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 text-xs font-bold text-center"
              >
                {language === "hi" ? "रद्द करें" : language === "gu" ? "રદ કરો" : "Cancel"}
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
                className="flex-1 py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold text-center shadow-md"
              >
                {language === "hi" ? "सहेजें" : language === "gu" ? "સાચવો" : "Save Changes"}
              </button>
            </div>

            {/* Reset App / Redo Onboarding */}
            <div className="pt-3 border-t border-slate-100 mt-2">
              <button
                type="button"
                onClick={() => {
                  const confirmMsg = language === "hi"
                    ? "क्या आप वाकई ऐप रीसेट करना और ऑनबोर्डिंग दोबारा करना चाहते हैं? सभी प्रोफ़ाइल डेटा हटा दिया जाएगा।"
                    : language === "gu"
                    ? "શું તમે ખરેખર એપ્લિકેશન રીસેટ કરવા અને ઓનબોર્ડિંગ ફરીથી કરવા માંગો છો? તમામ પ્રોફાઇલ ડેટા દૂર કરવામાં આવશે."
                    : "Are you sure you want to reset the app and redo onboarding? All profile data will be removed.";
                  if (window.confirm(confirmMsg)) {
                    safeRemoveItem("saathi_onboarding_complete");
                    safeRemoveItem("saathi_user_profile");
                    window.location.reload();
                  }
                }}
                className="w-full py-2 px-4 rounded-xl border border-rose-200 text-rose-500 hover:bg-rose-50 text-[10px] font-extrabold text-center uppercase tracking-wider transition-all"
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
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-600"></div>
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

    <div className="flex w-full min-h-[100dvh] overflow-x-hidden">
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
      <main className="flex-1 flex flex-col h-[100dvh] bg-white relative overflow-hidden">

      {/* PERSISTENT DISCLAIMER BANNER */}
      <div className="bg-amber-50 border-b border-amber-200 px-3 py-2 text-[11px] text-amber-800 flex items-start gap-1.5 shrink-0 z-35 shadow-sm text-left">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="leading-tight font-semibold">
          {t.disclaimer}
        </p>
      </div>

      {/* OFFLINE BANNER */}
      {isOffline && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2.5 text-[10px] text-red-805 flex items-center gap-2 shrink-0 z-30 animate-fadeIn text-left">
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

      {/* MOBILE HEADER — hidden on md+ (sidebar replaces it) */}
      <header className="md:hidden bg-gradient-to-r from-teal-600 to-emerald-600 text-white px-4 py-3 shrink-0 shadow-md flex justify-between items-center z-20 text-left">
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
              className="bg-white text-teal-700 font-extrabold text-[10px] px-2.5 py-1 rounded-full shadow-sm hover:bg-slate-50 transition-all active:scale-95 uppercase tracking-wider flex items-center gap-1 shrink-0 min-h-[44px] min-w-[44px] justify-center"
            >
              <Download className="w-3 h-3" />
              {language === "hi" ? "इंस्टॉल" : language === "gu" ? "ઇન્સ્ટોલ" : "Install"}
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
              className="w-7 h-7 rounded-full bg-white/20 border border-white/30 text-white font-black text-[11px] flex items-center justify-center hover:bg-white/30 transition-all active:scale-95 shrink-0 min-h-[44px] min-w-[44px]"
              title={language === "hi" ? "प्रोफ़ाइल संपादित करें" : language === "gu" ? "પ્રોફાઇલ સંપાદિત કરો" : "Edit Profile"}
              id="profile-avatar-btn"
            >
              {userProfile.name?.charAt(0)?.toUpperCase() || "U"}
            </button>
          )}

          <button
            onClick={() => setShowSettingsModal(true)}
            className="p-1.5 rounded-full bg-teal-700/50 border border-teal-500/25 text-teal-100 hover:text-white hover:bg-teal-700/70 transition-all active:scale-95 shrink-0 flex items-center justify-center min-h-[44px] min-w-[44px]"
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
        <div className="ml-3 h-0.5 flex-1 max-w-[80px] bg-teal-500 rounded-full" />
      </div>

      {/* CONTENT AREA */}
      <div className="flex-grow overflow-y-auto no-scrollbar bg-slate-50 pb-20 md:pb-6 relative">
        <div className="w-full md:px-6 lg:px-10 md:max-w-3xl md:mx-auto">
        {ashaModeActive && activePatientId && (
          (() => {
            const activePatient = patientsList.find(p => p.id === activePatientId);
            if (!activePatient) return null;
            return (
              <div className="bg-teal-50 border-b border-teal-200 px-4 py-2 flex items-center justify-between z-10 shrink-0 sticky top-0 shadow-sm animate-slideDown text-left">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-teal-600 rounded-full animate-pulse shrink-0" />
                  <div className="text-[10px] text-teal-800 font-bold">
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
            />
          ) : (
            <HomeView
              setActiveTab={handleTabChange}
              setActiveCall={setActiveCall}
              userProfile={userProfile}
              recordsList={recordsList}
              vitalsHistory={vitalsHistory}
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
          />
        )}

        {activeTab === "talk" && (
          <TalkView
            recordsList={recordsList}
            setRecordsList={setRecordsList}
            attachRecordToActivePatient={attachRecordToActivePatient}
            setActiveCall={setActiveCall}
            userProfile={userProfile}
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
          />
        )}
        </div>
      </div>

      {/* Add responsive padding for content area on wider screens */}

      {/* BOTTOM NAVIGATION switcher */}
      <BottomNav activeTab={activeTab} setActiveTab={handleTabChange} />

      {/* TELEMEDICINE WEB-RTC LOOPBACK OVERLAY */}
      <TelemedicineOverlay
        activeCall={activeCall}
        setActiveCall={setActiveCall}
        triageResult={triageResult}
        screenResults={screenResults}
        symptomsText={transcriptText || ""}
        userProfile={userProfile}
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

      {/* GLOBAL SETTINGS MODAL */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fadeIn text-left">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl max-w-sm w-full space-y-5 animate-scaleUp">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-800">
                <Settings className="w-5 h-5 text-teal-650 animate-spin-slow" />
                <h3 className="text-sm font-black uppercase tracking-wide">
                  {language === "hi" ? "साधन सेटिंग्स" : language === "gu" ? "સાધન સેટિંગ્સ" : "Application Settings"}
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
                      {language === "hi" ? "आशा कार्यकर्ता मोड" : language === "gu" ? "આશા કાર્યકર મોડ" : "ASHA Worker Mode"}
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-500 leading-normal">
                    {language === "hi" 
                      ? "एक साथ कई मरीजों की स्क्रीनिंग, प्रोफाइल प्रबंधन और स्वास्थ्य डैशबोर्ड सक्षम करें।"
                      : language === "gu" 
                      ? "એકસાથે બહુવિધ દર્દીઓનું સ્ક્રિનિંગ, પ્રોફાઇલ સંચાલન અને આરોગ્ય ડેશબોર્ડ સક્ષમ કરો." 
                      : "Enable screening of multiple patient profiles, records history, and a community dashboard."}
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
                  className={`w-11 h-6 rounded-full transition-all relative flex items-center p-0.5 border ${
                    ashaModeActive 
                      ? "bg-emerald-500 border-emerald-400 justify-end" 
                      : "bg-slate-200 border-slate-300 justify-start"
                  }`}
                  id="asha-toggle-switch"
                >
                  <div className="w-4 h-4 bg-white rounded-full shadow-md transition-all" />
                </button>
              </div>

              {/* Setting 2: Language Selector inside Settings */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide block">
                  {language === "hi" ? "भाषा बदलें" : language === "gu" ? "ભાષા બદલો" : "Select Language"}
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setLanguage("en")}
                    className={`py-2 text-xs font-bold rounded-xl transition-all border ${
                      language === "en" 
                        ? "bg-teal-650 border-teal-500 text-white shadow-sm" 
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => setLanguage("hi")}
                    className={`py-2 text-xs font-bold rounded-xl transition-all border ${
                      language === "hi" 
                        ? "bg-teal-650 border-teal-500 text-white shadow-sm" 
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    हिंदी
                  </button>
                  <button
                    onClick={() => setLanguage("gu")}
                    className={`py-2 text-xs font-bold rounded-xl transition-all border ${
                      language === "gu" 
                        ? "bg-teal-650 border-teal-500 text-white shadow-sm" 
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    ગુજરાતી
                  </button>
                </div>
              </div>

              {/* Setting 3: Caregiver Notifications Alert */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="space-y-0.5 max-w-[70%]">
                  <div className="flex items-center gap-1.5 text-slate-800">
                    <Bell className="w-4 h-4 text-teal-650" />
                    <span className="text-xs font-extrabold uppercase tracking-wide">
                      {language === "hi" ? "अभिभावक अलर्ट" : language === "gu" ? "વાલી ચેતવણીઓ" : "Caregiver Alerts"}
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-500 leading-normal">
                    {language === "hi" 
                      ? "उच्च जोखिम स्क्रीनिंग परिणाम या छूटी हुई दवाओं के मामले में रिश्तेदारों को एसएमएस भेजें।" 
                      : language === "gu" 
                      ? "ઉચ્ચ જોખમ સ્ક્રિનિંગ પરિણામ અથવા ચુકી ગયેલ દવાઓના કિસ્સામાં સંબંધીઓને એસએમએસ મોકલો."
                      : "Trigger automatic alerts to configured primary caregivers on high-risk vital readings."}
                  </p>
                </div>
                <button
                  onClick={() => setCaregiverAlert(!caregiverAlert)}
                  className={`w-11 h-6 rounded-full transition-all relative flex items-center p-0.5 border ${
                    caregiverAlert 
                      ? "bg-teal-650 border-teal-500 justify-end" 
                      : "bg-slate-200 border-slate-300 justify-start"
                  }`}
                >
                  <div className="w-4 h-4 bg-white rounded-full shadow-md transition-all" />
                </button>
              </div>

              {/* Setting 4: Demo Mode Toggle */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100/50 transition-all">
                <div className="space-y-0.5 max-w-[70%]">
                  <div className="flex items-center gap-1.5 text-slate-800">
                    <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                    <span className="text-xs font-extrabold uppercase tracking-wide">
                      {language === "hi" ? "डेमो मोड (सैंडबॉक्स)" : language === "gu" ? "ડેમો મોડ (સેન્ડબોક્સ)" : "Demo Mode (Sandbox)"}
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-500 leading-normal">
                    {language === "hi" 
                      ? "प्रदर्शन के लिए वास्तविक रोगियों, वाइटल्स इतिहास और दवा कार्यक्रम को लोड करें।" 
                      : language === "gu" 
                      ? "નિદર્શન માટે વાસ્તવિક દર્દીઓ, વાઇટલ્સ ઇતિહાસ અને દવાઓ લોડ કરો."
                      : "Seed realistic demonstration patient records, vitals history, and medicine schedules."}
                  </p>
                </div>
                <button
                  onClick={toggleDemoMode}
                  className={`w-11 h-6 rounded-full transition-all relative flex items-center p-0.5 border ${
                    demoModeActive 
                      ? "bg-amber-500 border-amber-400 justify-end" 
                      : "bg-slate-200 border-slate-300 justify-start"
                  }`}
                  id="demo-mode-toggle-switch"
                >
                  <div className="w-4 h-4 bg-white rounded-full shadow-md transition-all" />
                </button>
              </div>

              {/* Reset Data Section */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-medium">Saathi v2.0 (PWA)</span>
                <button
                  onClick={() => {
                    if (window.confirm(language === "hi" ? "क्या आप वाकई सभी सेव किया डेटा हटाना चाहते हैं?" : "Are you sure you want to reset all local patient and vital records?")) {
                      safeClear();
                      window.location.reload();
                    }
                  }}
                  className="text-[9px] font-black text-rose-500 hover:text-rose-650 uppercase tracking-wider bg-rose-50 hover:bg-rose-100/60 border border-rose-100 px-3 py-1.5 rounded-xl transition-all"
                >
                  {language === "hi" ? "डेटा रीसेट करें" : language === "gu" ? "ડેટા રીસેટ કરો" : "Reset App Data"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {renderProfileModal()}

      {welcomeToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-teal-900/95 backdrop-blur-sm border border-teal-500/30 text-emerald-300 px-5 py-3 rounded-2xl shadow-xl z-50 flex items-center gap-2 font-black text-xs animate-scaleUp">
          <Heart className="w-4 h-4 text-emerald-400 fill-emerald-400 animate-pulse" />
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
