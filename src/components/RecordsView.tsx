"use client";

import React, { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import {
  FileText,
  Share2,
  Plus,
  X,
  CheckCircle,
  Info,
  UploadCloud,
  TrendingUp,
  Calendar,
  Trash2,
  Lock,
  Loader2,
  Copy,
  Download,
  Settings
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts";
import { useLanguage } from "@/context/LanguageContext";
import { useChartHeight } from "@/hooks/useChartHeight";
import { safeGetItem, safeSetItem, safeRemoveItem } from "@/utils/localStorageHelper";
import { checkRateLimit } from "@/utils/rateLimit";
import { calculateBMI } from "../utils/bmiCalculator";

interface RecordsViewProps {
  vitalsHistory: any[];
  recordsList: any[];
  setRecordsList: React.Dispatch<React.SetStateAction<any[]>>;
  triageResult?: any | null;
  screenResults?: any | null;
  userProfile?: any;
  onEditProfile?: () => void;
  onUpdateProfile?: (profile: any) => void;
  language?: string;
}

const conditionLabels = {
  en: {
    diabetes: "Diabetes",
    highBP: "High Blood Pressure",
    heartDisease: "Heart Disease",
    asthma: "Asthma/Respiratory",
    thyroid: "Thyroid",
    kidney: "Kidney Disease",
    anemia: "Anemia",
    other: "Other",
    none: "None"
  },
  hi: {
    diabetes: "मधुमेह (Diabetes)",
    highBP: "उच्च रक्तचाप (High BP)",
    heartDisease: "हृदय रोग (Heart Disease)",
    asthma: "अस्थमा/श्वसन (Asthma)",
    thyroid: "थायराइड (Thyroid)",
    kidney: "गुर्दे की बीमारी (Kidney)",
    anemia: "एनीमिया (Anemia)",
    other: "अन्य (Other)",
    none: "कोई नहीं (None)"
  },
  gu: {
    diabetes: "મધુપ્રમેહ (Diabetes)",
    highBP: "હાઈ બ્લડ પ્રેશર (High BP)",
    heartDisease: "હૃદય રોગ (Heart Disease)",
    asthma: "અસ્થમા/શ્વાસ સંબંધિત",
    thyroid: "થાઇરોઇડ (Thyroid)",
    kidney: "કિડનીની બીમારી (Kidney)",
    anemia: "એનિમિયા (Anemia)",
    other: "અન્ય (Other)",
    none: "કોઈ નહીં (None)"
  }
};

export const RecordsView: React.FC<RecordsViewProps> = React.memo(({
  vitalsHistory,
  recordsList,
  setRecordsList,
  triageResult = null,
  screenResults = null,
  userProfile = null,
  onEditProfile = () => {},
  onUpdateProfile = () => {},
  language: languageProp
}) => {
  const { language, t } = useLanguage();
  const chartHeight = useChartHeight();

  const [abhaNumber, setAbhaNumber] = useState("");
  const [abhaError, setAbhaError] = useState<string | null>(null);
  const [isAbhaLinked, setIsAbhaLinked] = useState(false);

  const [showRecordForm, setShowRecordForm] = useState(false);
  const [newRecord, setNewRecord] = useState({
    title: "",
    category: "Lab Test",
    doctor: "",
    notes: ""
  });

  const [trendMetric, setTrendMetric] = useState<"heartRate" | "bp" | "oxygen" | "anemia">("heartRate");
  const [selectedRecordForDetails, setSelectedRecordForDetails] = useState<any | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportedSummary, setExportedSummary] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (userProfile && userProfile.abha) {
      setAbhaNumber(formatAbha(userProfile.abha));
      setIsAbhaLinked(true);
    } else if (userProfile && !userProfile.abha) {
      setAbhaNumber("");
      setIsAbhaLinked(false);
    } else {
      const savedAbha = safeGetItem("saathi_abha_number");
      const savedAbhaLinked = safeGetItem("saathi_abha_linked") === "true";
      if (savedAbha) setAbhaNumber(savedAbha);
      if (savedAbhaLinked) setIsAbhaLinked(true);
    }
  }, [userProfile]);

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
    safeSetItem("saathi_abha_number", abhaNumber);
    safeSetItem("saathi_abha_linked", "true");
    if (userProfile) {
      onUpdateProfile({ ...userProfile, abha: cleaned });
    }
  };

  const handleUnlinkAbha = () => {
    setIsAbhaLinked(false);
    setAbhaNumber("");
    safeRemoveItem("saathi_abha_number");
    safeRemoveItem("saathi_abha_linked");
    if (userProfile) {
      onUpdateProfile({ ...userProfile, abha: "" });
    }
  };

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
      doctor: newRecord.doctor,
      notes: newRecord.notes
    };

    const nextRecords = [addedItem, ...recordsList];
    setRecordsList(nextRecords);
    safeSetItem("saathi_records", JSON.stringify(nextRecords));
    setNewRecord({ title: "", category: "Lab Test", doctor: "", notes: "" });
    setShowRecordForm(false);
  };

  const deleteRecord = (id: number) => {
    const nextRecords = recordsList.filter(item => item.id !== id);
    setRecordsList(nextRecords);
    safeSetItem("saathi_records", JSON.stringify(nextRecords));
  };

  const downloadHealthCardPDF = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const activeLang = (language === "hi" || language === "gu") ? language : "en";

    const tPdf = {
      en: {
        title: "SAATHI HEALTH CARD",
        tagline: "Your AI Health Companion",
        generated: "Generated",
        profile: "PATIENT HEALTH PROFILE",
        name: "Name",
        ageGender: "Age / Gender",
        bloodGroup: "Blood Group",
        contact: "Contact",
        allergies: "Allergies",
        conditions: "Conditions",
        medications: "Medications",
        vitals: "LATEST VITAL SIGNS (rPPG Camera Scan)",
        heartRate: "Heart Rate",
        oxygen: "Blood Oxygen (SpO2)",
        bp: "Blood Pressure",
        date: "Recorded Date",
        noVitals: "No vital sign readings logged yet.",
        screenings: "LATEST HEALTH SCREENINGS",
        test: "Test/Screening",
        provider: "Provider/Source",
        notes: "Notes",
        noScreenings: "No camera screening or lab records logged yet.",
        medsSchedule: "MEDICATION SCHEDULE",
        medName: "Name",
        medDosage: "Dosage",
        medFrequency: "Frequency",
        medTime: "Time",
        noMeds: "No medications currently scheduled.",
        disclaimerTitle: "CLINICAL DISCLAIMER & WARNING",
        disclaimerText1: "Saathi is an AI-powered health companion prototype. All vital sign estimates, camera screenings,",
        disclaimerText2: "and triage assessments are for educational and awareness purposes only. This report does NOT",
        disclaimerText3: "constitute professional medical advice, diagnosis, or treatment. Consult a licensed doctor for clinical care.",
        height: "Height",
        weight: "Weight",
        bmi: "BMI",
        bmiCategory: "BMI Category"
      },
      hi: {
        title: "साथी स्वास्थ्य कार्ड",
        tagline: "आपका एआई स्वास्थ्य साथी",
        generated: "तैयार किया गया",
        profile: "रोगी स्वास्थ्य प्रोफ़ाइल",
        name: "नाम",
        ageGender: "आयु / लिंग",
        bloodGroup: "रक्त समूह",
        contact: "संपर्क",
        allergies: "एलर्जी",
        conditions: "स्वास्थ्य स्थितियां",
        medications: "वर्तमान दवाएं",
        vitals: "नवीनतम वाइटल्स रीडिंग (rPPG कैमरा स्कैन)",
        heartRate: "हृदय गति (Heart Rate)",
        oxygen: "रक्त ऑक्सीजन (SpO2)",
        bp: "रक्तचाप (Blood Pressure)",
        date: "रिकॉर्डिंग तिथि",
        noVitals: "अभी तक कोई वाइटल्स रीडिंग दर्ज नहीं की गई है।",
        screenings: "नवीनतम स्वास्थ्य स्क्रीनिंग",
        test: "जांच / स्क्रीनिंग",
        provider: "प्रदाता / स्रोत",
        notes: "विवरण",
        noScreenings: "अभी तक कोई कैमरा स्क्रीनिंग या लैब रिकॉर्ड दर्ज नहीं है।",
        medsSchedule: "दवा की अनुसूची",
        medName: "दवा का नाम",
        medDosage: "खुराक",
        medFrequency: "आवृत्ति",
        medTime: "समय",
        noMeds: "वर्तमान में कोई दवा निर्धारित नहीं है।",
        disclaimerTitle: "नैदानिक अस्वीकरण और चेतावनी",
        disclaimerText1: "साथी एक एआई-संचालित स्वास्थ्य साथी प्रोटोटाइप है। सभी वाइटल्स अनुमान, कैमरा स्क्रीनिंग,",
        disclaimerText2: "और ट्राइएज मूल्यांकन केवल शैक्षिक और जागरूकता उद्देश्यों के लिए हैं। यह रिपोर्ट पेशेवर",
        disclaimerText3: "चिकित्सा सलाह, निदान या उपचार का गठन नहीं करती है। नैदानिक देखभाल के लिए डॉक्टर से परामर्श करें।",
        height: "कद (Height)",
        weight: "वजन (Weight)",
        bmi: "बीएमआई (BMI)",
        bmiCategory: "बीएमआई श्रेणी"
      },
      gu: {
        title: "સાથી સ્વાસ્થ્ય કાર્ડ",
        tagline: "તમારો એઆઈ હેલ્થ સાથી",
        generated: "ત્યાર કરેલ",
        profile: "દર્દી સ્વાસ્થ્ય પ્રોફાઇલ",
        name: "નામ",
        ageGender: "ઉંમર / લિંગ",
        bloodGroup: "બ્લડ ગ્રુપ",
        contact: "સંપર્ક",
        allergies: "એલર્જી",
        conditions: "સ્વાસ્થ્ય સ્થિતિઓ",
        medications: "હાલની દવાઓ",
        vitals: "નવીનતમ વાઇટલ્સ રીડીંગ (rPPG કેમેરા સ્કેન)",
        heartRate: "હૃદય ગતિ (Heart Rate)",
        oxygen: "બ્લડ ઓક્સિજન (SpO2)",
        bp: "બ્લડ પ્રેશર",
        date: "રેકોર્ડિંગ તારીખ",
        noVitals: "હજુ સુધી કોઈ વાઇટલ્સ રેકોર્ડ કરેલ નથી.",
        screenings: "નવીનતમ સ્વાસ્થ્ય સ્ક્રીનીંગ",
        test: "ટેસ્ટ / સ્ક્રીનીંગ",
        provider: "પ્રદાતા / સ્ત્રોત",
        notes: "નોંધો",
        noScreenings: "હજુ સુધી કોઈ કેમેરા સ્ક્રીનીંગ અથવા લેબ રેકોર્ડ નથી.",
        medsSchedule: "દવાની અનુસૂચિ",
        medName: "દવાનું નામ",
        medDosage: "માત્રα",
        medFrequency: "આવર્તન",
        medTime: "સમય",
        noMeds: "હાલમાં કોઈ દવાઓ નિર્ધારિત નથી.",
        disclaimerTitle: "ક્લિનિકલ ડિસ્ક્લેમર અને ચેતવણી",
        disclaimerText1: "સાથી એ એક AI-સંચાલિત હેલ્થ સાથી પ્રોટોટાઇપ છે. તમામ વાઇટલ્સ અંદાજ, કેમેરા સ્ક્રીનીંગ,",
        disclaimerText2: "અને ટ્રાયેજ મૂલ્યાંકન ફક્ત શૈક્ષણિક અને જાગૃતિ હેતુ માટે છે. આ અહેવાલ કોઈ પણ રીતે વ્યાવસાયિક",
        disclaimerText3: "તબીબી સલાહ, નિદાન કે સારવાર સમાન નથી. ક્લિનિકલ સંભાળ માટે લાઇસન્સ પ્રાપ્ત ડૉક્ટરની સલાહ લો.",
        height: "ઊંચાઈ (Height)",
        weight: "વજન (Weight)",
        bmi: "બીએમઆઈ (BMI)",
        bmiCategory: "બીએમઆઈ શ્રેણી"
      }
    }[activeLang];

    doc.setFillColor(124, 58, 237); 
    doc.rect(0, 0, 210, 45, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text(tPdf.title, 15, 22);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(tPdf.tagline, 15, 28);
    doc.text(`${tPdf.generated}: ${new Date().toLocaleDateString()}`, 15, 34);

    const profile = userProfile || {
      name: "Vishal Bhanopiya",
      age: 28,
      gender: "Male",
      phone: "+91 9876543210",
      bloodGroup: "O+",
      conditions: ["None"],
      allergies: "None",
      medications: "None"
    };

    const pHeight = profile.heightCm || profile.height || null;
    const pWeight = profile.weightKg || profile.weight || null;
    let pBmi = profile.bmi || null;
    let pBmiCategory = profile.bmiCategory || null;

    if (pHeight && pWeight) {
      const bmiRes = calculateBMI(Number(pWeight), Number(pHeight));
      if (bmiRes) {
        pBmi = bmiRes.bmi;
        const catKey = bmiRes.category.toLowerCase().replace(/[\s\(\)]+/g, "_");
        const catMap: Record<string, string> = {
          severely_underweight: activeLang === "hi" ? "अत्यधिक कम वजन" : activeLang === "gu" ? "ખૂબ જ ઓછું વજન" : "Severely Underweight",
          underweight: activeLang === "hi" ? "कम वजन" : activeLang === "gu" ? "ઓછું વજન" : "Underweight",
          normal: activeLang === "hi" ? "सामान्य वजन" : activeLang === "gu" ? "સામાન્ય વજન" : "Normal Weight",
          overweight: activeLang === "hi" ? "अधिक वजन" : activeLang === "gu" ? "વધુ વજન" : "Overweight",
          obese_1: activeLang === "hi" ? "मोटापा (श्रेणी 1)" : activeLang === "gu" ? "સ્થૂળતા (વર્ગ ૧)" : "Obese (Class I)",
          obese_2: activeLang === "hi" ? "मोटापा (श्रेणी 2)" : activeLang === "gu" ? "સ્થૂળતા (વર્ગ ૨)" : "Obese (Class II)"
        };
        pBmiCategory = catMap[catKey] || bmiRes.label;
      }
    } else if (pBmiCategory) {
      const catKey = pBmiCategory.toLowerCase().replace(/[\s\(\)]+/g, "_");
      const catMap: Record<string, string> = {
        severely_underweight: activeLang === "hi" ? "अत्यधिक कम वजन" : activeLang === "gu" ? "ખૂબ જ ઓછું વજન" : "Severely Underweight",
        underweight: activeLang === "hi" ? "कम वजन" : activeLang === "gu" ? "ઓછું વજન" : "Underweight",
        normal: activeLang === "hi" ? "सामान्य वजन" : activeLang === "gu" ? "સામાન્ય વજન" : "Normal Weight",
        overweight: activeLang === "hi" ? "अधिक वजन" : activeLang === "gu" ? "વધુ વજન" : "Overweight",
        obese_1: activeLang === "hi" ? "मोटापा (श्रेणी 1)" : activeLang === "gu" ? "સ્થૂળતા (વર્ગ ૧)" : "Obese (Class I)",
        obese_class_i: activeLang === "hi" ? "मोटापा (श्रेणी 1)" : activeLang === "gu" ? "સ્થૂળતા (વર્ગ ૧)" : "Obese (Class I)",
        obese_2: activeLang === "hi" ? "मोटापा (श्रेणी 2)" : activeLang === "gu" ? "સ્થૂળતા (વર્ગ ૨)" : "Obese (Class II)",
        obese_class_ii: activeLang === "hi" ? "मोटापा (श्रेणी 2)" : activeLang === "gu" ? "સ્થૂળતા (વર્ગ ૨)" : "Obese (Class II)"
      };
      pBmiCategory = catMap[catKey] || pBmiCategory;
    }

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240); 
    doc.roundedRect(10, 50, 190, 58, 4, 4, "FD");

    doc.setTextColor(124, 58, 237);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(tPdf.profile, 15, 58);

    doc.setTextColor(71, 85, 105);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);

    // Left Column
    doc.text(`${tPdf.name}:`, 15, 66);
    doc.setFont("helvetica", "normal");
    doc.text(`${profile.name || "N/A"}`, 48, 66);

    doc.setFont("helvetica", "bold");
    doc.text(`${tPdf.ageGender}:`, 15, 72);
    doc.setFont("helvetica", "normal");
    doc.text(`${profile.age || "N/A"} yrs / ${profile.gender || "N/A"}`, 48, 72);

    doc.setFont("helvetica", "bold");
    doc.text(`${tPdf.contact}:`, 15, 78);
    doc.setFont("helvetica", "normal");
    doc.text(`${profile.phone || "N/A"}`, 48, 78);

    doc.setFont("helvetica", "bold");
    doc.text(`${tPdf.height}:`, 15, 84);
    doc.setFont("helvetica", "normal");
    doc.text(pHeight ? `${pHeight} cm` : "N/A", 48, 84);

    doc.setFont("helvetica", "bold");
    doc.text(`${tPdf.weight}:`, 15, 90);
    doc.setFont("helvetica", "normal");
    doc.text(pWeight ? `${pWeight} kg` : "N/A", 48, 90);

    // Right Column
    doc.setFont("helvetica", "bold");
    doc.text(`${tPdf.bloodGroup}:`, 110, 66);
    doc.setFont("helvetica", "normal");
    doc.text(`${profile.bloodGroup || "N/A"}`, 148, 66);

    doc.setFont("helvetica", "bold");
    doc.text(`${tPdf.allergies}:`, 110, 72);
    doc.setFont("helvetica", "normal");
    const allergyVal = profile.allergies || "None reported";
    doc.text(allergyVal.length > 22 ? allergyVal.substring(0, 22) + "..." : allergyVal, 148, 72);

    doc.setFont("helvetica", "bold");
    doc.text(`${tPdf.conditions}:`, 110, 78);
    doc.setFont("helvetica", "normal");
    const condsStr = Array.isArray(profile.conditions)
      ? profile.conditions.map((cond: string) => {
          const keyMap: Record<string, string> = {
            "Diabetes": "diabetes",
            "High Blood Pressure": "highBP",
            "Heart Disease": "heartDisease",
            "Asthma/Respiratory": "asthma",
            "Thyroid": "thyroid",
            "Kidney Disease": "kidney",
            "Anemia": "anemia",
            "Other": "other",
            "None": "none"
          };
          const key = keyMap[cond];
          return (key && (conditionLabels as any)[activeLang]?.[key])
            ? (conditionLabels as any)[activeLang][key]
            : cond;
        }).join(", ")
      : "None";
    doc.text(condsStr.length > 22 ? condsStr.substring(0, 22) + "..." : condsStr, 148, 78);

    doc.setFont("helvetica", "bold");
    doc.text(`${tPdf.medications}:`, 110, 84);
    doc.setFont("helvetica", "normal");
    const medsVal = profile.medications || "None";
    doc.text(medsVal.length > 22 ? medsVal.substring(0, 22) + "..." : medsVal, 148, 84);

    doc.setFont("helvetica", "bold");
    doc.text(`${tPdf.bmi}:`, 110, 90);
    doc.setFont("helvetica", "normal");
    doc.text(pBmi ? `${pBmi} kg/m²` : "N/A", 148, 90);

    doc.setFont("helvetica", "bold");
    doc.text(`${tPdf.bmiCategory}:`, 110, 96);
    doc.setFont("helvetica", "normal");
    doc.text(pBmiCategory || "N/A", 148, 96);

    // Vitals Section (shifted y by 8mm)
    doc.roundedRect(10, 112, 190, 34, 4, 4, "FD");
    doc.setTextColor(124, 58, 237);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(tPdf.vitals, 15, 120);

    const latestVital = vitalsHistory && vitalsHistory.length > 0 ? vitalsHistory[vitalsHistory.length - 1] : null;
    doc.setTextColor(71, 85, 105);
    doc.setFontSize(10);
    if (latestVital) {
      doc.setFont("helvetica", "bold");
      doc.text(`${tPdf.heartRate}:`, 15, 128);
      doc.setFont("helvetica", "normal");
      doc.text(`${latestVital.heartRate} bpm`, 58, 128);

      doc.setFont("helvetica", "bold");
      doc.text(`${tPdf.oxygen}:`, 15, 134);
      doc.setFont("helvetica", "normal");
      doc.text(`${latestVital.oxygen}%`, 58, 134);

      doc.setFont("helvetica", "bold");
      doc.text(`${tPdf.bp}:`, 110, 128);
      doc.setFont("helvetica", "normal");
      doc.text(`${latestVital.systolic || 120}/${latestVital.diastolic || 80} mmHg`, 148, 128);

      doc.setFont("helvetica", "bold");
      doc.text(`${tPdf.date}:`, 110, 134);
      doc.setFont("helvetica", "normal");
      doc.text(`${latestVital.date || "N/A"}`, 148, 134);
    } else {
      doc.setFont("helvetica", "normal");
      doc.text(tPdf.noVitals, 15, 130);
    }

    // Screenings Section (shifted y by 4mm)
    doc.roundedRect(10, 150, 190, 36, 4, 4, "FD");
    doc.setTextColor(124, 58, 237);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(tPdf.screenings, 15, 158);

    const latestScreening = [...recordsList]
      .filter(r => r.category === "AI Screen" || r.category === "Lab Test")
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0] || null;
    doc.setTextColor(71, 85, 105);
    doc.setFontSize(10);
    if (latestScreening) {
      doc.setFont("helvetica", "bold");
      doc.text(`${tPdf.test}:`, 15, 164);
      doc.setFont("helvetica", "normal");
      doc.text(`${latestScreening.title}`, 48, 164);

      doc.setFont("helvetica", "bold");
      doc.text(`${tPdf.provider}:`, 15, 170);
      doc.setFont("helvetica", "normal");
      doc.text(`${latestScreening.doctor}`, 48, 170);

      doc.setFont("helvetica", "bold");
      doc.text(`${tPdf.notes}:`, 15, 176);
      doc.setFont("helvetica", "normal");
      const truncatedNotes = latestScreening.notes.length > 80 ? latestScreening.notes.substring(0, 80) + "..." : latestScreening.notes;
      doc.text(`${truncatedNotes}`, 48, 176);
    } else {
      doc.setFont("helvetica", "normal");
      doc.text(tPdf.noScreenings, 15, 166);
    }

    doc.roundedRect(10, 190, 190, 52, 4, 4, "FD");
    doc.setTextColor(124, 58, 237);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(tPdf.medsSchedule, 15, 198);

    let meds: any[] = [];
    try {
      const savedMeds = safeGetItem("saathi_medicines");
      if (savedMeds) meds = JSON.parse(savedMeds);
    } catch (e) {}

    doc.setTextColor(71, 85, 105);
    doc.setFontSize(9);
    if (meds && meds.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.text(tPdf.medName, 15, 206);
      doc.text(tPdf.medDosage, 75, 206);
      doc.text(tPdf.medFrequency, 110, 206);
      doc.text(tPdf.medTime, 165, 206);
      doc.line(15, 208, 195, 208);

      doc.setFont("helvetica", "normal");
      meds.slice(0, 4).forEach((med, idx) => {
        const yPos = 214 + idx * 6;
        doc.text(`${med.name}`, 15, yPos);
        doc.text(`${med.dose || "As directed"}`, 75, yPos);
        doc.text(`${med.frequency || "Once daily"}`, 110, yPos);
        doc.text(`${med.reminderTime || "08:00"}`, 165, yPos);
      });
    } else {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(tPdf.noMeds, 15, 208);
    }

    doc.setFillColor(254, 242, 242); 
    doc.setDrawColor(254, 205, 205); 
    doc.roundedRect(10, 248, 190, 32, 4, 4, "FD");

    doc.setTextColor(153, 27, 27); 
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(tPdf.disclaimerTitle, 15, 255);

    doc.setTextColor(185, 28, 28); 
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(tPdf.disclaimerText1, 15, 261);
    doc.text(tPdf.disclaimerText2, 15, 266);
    doc.text(tPdf.disclaimerText3, 15, 271);

    const filename = `${profile.name ? profile.name.toLowerCase().replace(/\s+/g, "_") : "patient"}_health_card.pdf`;
    doc.save(filename);
  };

  const handleExportSummary = async () => {
    setIsExporting(true);
    setExportedSummary(null);
    setShowExportModal(true);

    try {
      const { allowed } = checkRateLimit("summary", 4, 30000);
      if (!allowed) {
        throw new Error("RateLimitExceeded");
      }

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
          language,
          profile: userProfile
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
      const isRateLimit = err instanceof Error && err.message === "RateLimitExceeded";
      
      const rateLimitMsg = language === "hi"
        ? `*नोट: सिस्टम व्यस्त है - ऑफ़लाइन स्थानीय फ़ॉलबैक मोड में चल रहा है।*`
        : language === "gu"
        ? `*નોંધ: સિસ્ટમ વ્યસ્ત છે - ઑફલાઇન સ્થાનિક ફૉલબેક મોડમાં ચાલે છે.*`
        : `*Note: System busy - running local rate-limit fallback summary.*`;

      const fallbackReport = language === "hi"
        ? `### साथी रोगी स्वास्थ्य निर्यात (ऑफ़लाइन फ़ॉलबैक)\n\n` +
          `**दिनांक:** ${new Date().toLocaleDateString()}\n\n` +
          `${isRateLimit ? rateLimitMsg + "\n\n" : ""}` +
          `**नवीनतम वाइटल्स लॉग:**\n` + vitalsHistory.map(v => `- ${v.date}: HR ${v.heartRate} bpm, BP ${v.systolic}/${v.diastolic}, SpO2 ${v.oxygen}%`).join("\n") + `\n\n` +
          `**सहेजे गए रिकॉर्ड्स:**\n` + recordsList.map(r => `- ${r.date}: ${r.title} (${r.category})`).join("\n") + `\n\n` +
          `*नोट: एआई संकलन अनुपलब्ध है। डॉक्टर के साथ परामर्श करते समय इन विवरणों को दिखाएं।*`
        : language === "gu"
        ? `### સાથી દર્દી આરોગ્ય નિકાસ (ઑફલાઇન ફૉલબેક)\n\n` +
          `**તારીખ:** ${new Date().toLocaleDateString()}\n\n` +
          `${isRateLimit ? rateLimitMsg + "\n\n" : ""}` +
          `**વાઇટલ્સ લૉગ:**\n` + vitalsHistory.map(v => `- ${v.date}: HR ${v.heartRate} bpm, BP ${v.systolic}/${v.diastolic}, SpO2 ${v.oxygen}%`).join("\n") + `\n\n` +
          `**સાચવેલ રેકોર્ડ્સ:**\n` + recordsList.map(r => `- ${r.date}: ${r.title} (${r.category})`).join("\n") + `\n\n` +
          `*નોંધ: AI સારાંશ ઉપલબ્ધ નથી. ડૉક્ટર સાથે આ વિગતો શેર કરો.*`
        : `### Saathi Patient Health Export (Fallback Mode)\n\n` +
          `**Generated on:** ${new Date().toLocaleDateString()}\n\n` +
          `${isRateLimit ? rateLimitMsg + "\n\n" : ""}` +
          `**Vitals Log:**\n` + vitalsHistory.map(v => `- ${v.date}: HR ${v.heartRate} bpm, BP ${v.systolic}/${v.diastolic}, SpO2 ${v.oxygen}%`).join("\n") + `\n\n` +
          `**Saved Diagnostic Sessions:**\n` + recordsList.map(r => `- ${r.date}: ${r.title} (${r.category})`).join("\n") + `\n\n` +
          `*Note: LLM summary failed to compile. Reconnect to the internet or check Groq API configuration.*`;
      setExportedSummary(fallbackReport);
    } finally {
      setIsExporting(false);
    }
  };

  const renderTrendChart = () => {
    if (!isMounted) return <div className="h-40 bg-slate-50/50 animate-pulse rounded-2xl" />;

    let chartData: any[] = [];
    let strokeColor = "#8b5cf6";
    let yKey = "value";
    let yName = "Value";

    if (trendMetric === "heartRate") {
      chartData = vitalsHistory.length > 0 
        ? vitalsHistory.map(v => ({ date: v.date.split("-").slice(1).join("/"), value: v.heartRate }))
        : [
            { date: "06/01", value: 72 },
            { date: "06/05", value: 78 },
            { date: "06/10", value: 74 },
          ];
      yKey = "value";
      yName = language === "hi" ? "धड़कन (bpm)" : language === "gu" ? "ધબકારા (bpm)" : "Pulse (bpm)";
      strokeColor = "#8b5cf6";
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
      strokeColor = "#8b5cf6";
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
      <div className="w-full pt-2">
        <ResponsiveContainer width="100%" height={chartHeight}>
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={strokeColor} stopOpacity={0.25}/>
                <stop offset="95%" stopColor={strokeColor} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0/40" />
            <XAxis dataKey="date" tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={trendMetric === 'oxygen' ? [90, 100] : ['auto', 'auto']} />
            <Tooltip 
              contentStyle={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255, 255, 255, 0.5)', borderRadius: 16, fontSize: 10, fontWeight: 700, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' }}
              labelStyle={{ fontWeight: 800, color: '#1e293b' }}
            />
            {trendMetric === "bp" ? (
              <>
                <Area type="monotone" name="Systolic" dataKey="systolic" stroke="#ec4899" fill="rgba(236, 72, 153, 0.06)" strokeWidth={2.5} />
                <Area type="monotone" name="Diastolic" dataKey="diastolic" stroke="#8b5cf6" fill="rgba(139, 92, 246, 0.04)" strokeWidth={2.5} />
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
    <div className="p-4 space-y-4 animate-fadeIn overflow-y-auto flex-1 h-full pb-24 text-left">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div className="space-y-1">
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center">
              <FileText className="w-4.5 h-4.5 text-violet-600" />
            </div>
            {t.recordsHeader}
          </h2>
          <p className="text-xs text-slate-500 leading-normal">{t.recordsDesc}</p>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={downloadHealthCardPDF}
            className="w-10 h-10 rounded-xl bg-white/60 backdrop-blur-md border border-white/40 flex items-center justify-center text-slate-500 shadow-soft hover:bg-white hover:scale-105 active:scale-95 transition-all"
            title={language === "hi" ? "हेल्थ कार्ड डाउनलोड करें (PDF)" : language === "gu" ? "હેલ્થ કાર્ડ ડાઉનલોડ કરો (PDF)" : "Download Health Card (PDF)"}
          >
            <Download className="w-4 h-4 text-violet-600" />
          </button>
          <button
            onClick={handleExportSummary}
            className="w-10 h-10 rounded-xl bg-white/60 backdrop-blur-md border border-white/40 flex items-center justify-center text-slate-500 shadow-soft hover:bg-white hover:scale-105 active:scale-95 transition-all"
            title="Export Summary"
          >
            <Share2 className="w-4 h-4 text-violet-600" />
          </button>
          <button
            onClick={() => setShowRecordForm(!showRecordForm)}
            className="w-10 h-10 rounded-xl bg-violet-600 hover:bg-violet-700 text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all"
          >
            {showRecordForm ? <X className="w-4.5 h-4.5" /> : <Plus className="w-4.5 h-4.5" />}
          </button>
        </div>
      </div>

      {/* PROFILE CARD */}
      {userProfile && (
        <div className="glass-card p-5 space-y-4 relative">
          <div className="flex justify-between items-start flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary text-white font-black flex items-center justify-center text-base shadow-primary-glow">
                {userProfile.name ? userProfile.name.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="space-y-0.5">
                <h3 className="font-extrabold text-slate-800 text-base">{userProfile.name}</h3>
                <p className="text-[11px] text-slate-400 font-semibold">
                  {userProfile.age} yrs / {userProfile.gender === "Male" ? (language === "hi" ? "पुरुष" : language === "gu" ? "પુરુષ" : "Male") : userProfile.gender === "Female" ? (language === "hi" ? "महिला" : language === "gu" ? "મહિલા" : "Female") : (language === "hi" ? "अन्य" : language === "gu" ? "અન્ય" : "Other")} | {language === "hi" ? "रक्त समूह" : language === "gu" ? "બ્લડ ગ્રુપ" : "Blood"}: {userProfile.bloodGroup || "N/A"}
                </p>
                {(() => {
                  const h = userProfile.heightCm || userProfile.height;
                  const w = userProfile.weightKg || userProfile.weight;
                  if (!h || !w) return null;
                  const res = calculateBMI(Number(w), Number(h));
                  if (!res) return null;
                  return (
                    <div className="mt-1.5 flex flex-wrap gap-1.5 items-center">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                        {language === "hi" ? "कद" : language === "gu" ? "ઊંચાઈ" : "Height"}: {h} cm
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                        {language === "hi" ? "वजन" : language === "gu" ? "વજન" : "Weight"}: {w} kg
                      </span>
                      <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full text-white tracking-wide shadow-sm flex items-center gap-1" style={{ backgroundColor: res.colorHex }}>
                        <span>{res.emoji}</span>
                        <span>BMI: {res.bmi} ({
                          res.category === "severely_underweight" ? (language === "hi" ? "अत्यधिक कम वजन" : language === "gu" ? "ખૂબ જ ઓછું વજન" : "Severely Underweight") :
                          res.category === "underweight" ? (language === "hi" ? "कम वजन" : language === "gu" ? "ઓછું વજન" : "Underweight") :
                          res.category === "normal" ? (language === "hi" ? "सामान्य वजन" : language === "gu" ? "સામાન્ય વજન" : "Normal Weight") :
                          res.category === "overweight" ? (language === "hi" ? "अधिक वजन" : language === "gu" ? "વધુ વજન" : "Overweight") :
                          res.category === "obese_1" ? (language === "hi" ? "मोटापा (श्रेणी 1)" : language === "gu" ? "સ્થૂળતા (વર્ગ ૧)" : "Obese (Class I)") :
                          (language === "hi" ? "मोटापा (श्रेणी 2)" : language === "gu" ? "સ્થૂળતા (વર્ગ ૨)" : "Obese (Class II)")
                        })</span>
                      </span>
                    </div>
                  );
                })()}
              </div>
            </div>
            <button
              onClick={onEditProfile}
              className="text-xs font-bold text-violet-650 hover:text-violet-800 bg-violet-50 hover:bg-violet-100/60 px-3.5 py-2 rounded-xl transition-all active:scale-95 flex items-center gap-1.5"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>{language === "hi" ? "संपादित करें" : language === "gu" ? "ફેરફાર કરો" : "Edit"}</span>
            </button>
          </div>

          {userProfile.conditions && userProfile.conditions.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {language === "hi" ? "स्वास्थ्य स्थितियां" : language === "gu" ? "આરોગ્ય સ્થિતિઓ" : "Medical Conditions"}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {userProfile.conditions.map((cond: string, idx: number) => {
                  let label = cond;
                  const keyMap: Record<string, string> = {
                    "Diabetes": "diabetes",
                    "High Blood Pressure": "highBP",
                    "Heart Disease": "heartDisease",
                    "Asthma/Respiratory": "asthma",
                    "Thyroid": "thyroid",
                    "Kidney Disease": "kidney",
                    "Anemia": "anemia",
                    "Other": "other",
                    "None": "none"
                  };
                  const key = keyMap[cond];
                  if (key && (conditionLabels as any)[language]?.[key]) {
                    label = (conditionLabels as any)[language][key];
                  }
                  return (
                    <span
                      key={idx}
                      className="text-[10px] font-extrabold px-3 py-1 bg-white/50 border border-slate-200/50 text-slate-600 rounded-full"
                    >
                      {label}
                      {cond === "Other" && userProfile.otherCondition ? `: ${userProfile.otherCondition}` : ""}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ABHA HEALTH ID CARD (ABDM) */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-5 text-white shadow-lg relative overflow-hidden border border-blue-500/10 animate-float">
        <div className="absolute right-[-10px] top-[-10px] w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className="text-[9px] uppercase tracking-wider font-extrabold text-blue-200 block">National Health Authority</span>
            <h4 className="text-sm font-extrabold flex items-center gap-1.5 mt-0.5">
              {language === "hi" ? "ABHA स्वास्थ्य पहचान पत्र" : language === "gu" ? "ABHA સ્વાસ્થ્ય આઈડી" : "ABHA Health ID"}
            </h4>
          </div>
          {isAbhaLinked ? (
            <span className="bg-emerald-500 text-white text-[8px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm uppercase tracking-wider border border-emerald-400/30">
              <CheckCircle className="w-2.5 h-2.5 fill-white text-emerald-500" />
              Linked
            </span>
          ) : (
            <span className="bg-amber-500 text-white text-[8px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider border border-amber-400/30">
              Unlinked
            </span>
          )}
        </div>

        {isAbhaLinked ? (
          <div className="space-y-3">
            <div className="bg-white/10 px-3.5 py-2.5 rounded-2xl border border-white/10 backdrop-blur-md">
              <div className="text-[9px] text-blue-200 font-bold uppercase tracking-wider">Ayushman Bharat Health Account</div>
              <div className="font-mono text-base font-extrabold tracking-widest mt-1">{abhaNumber}</div>
            </div>
            <div className="flex justify-between items-center text-[10px] pt-1">
              <span className="text-blue-100 font-bold">Holder: {userProfile?.name || "Vishal Bhanopiya"}</span>
              <button 
                onClick={handleUnlinkAbha}
                className="text-red-200 hover:text-red-100 underline font-extrabold transition-colors active:scale-95"
              >
                Unlink ID
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3.5">
            <p className="text-[10px] text-blue-100 leading-relaxed font-semibold">
              {language === "hi" 
                ? "डिजिटल स्वास्थ्य मिशन के अंतर्गत अपने 14-अंकों के ABHA कार्ड को जोड़ें।"
                : language === "gu"
                ? "ડિજિટલ હેલ્થ મિશન અંતર્ગત તમારા 14-આંકડાના ABHA કાર્ડને કનેક્ટ કરો."
                : "Link your 14-digit National ABHA Health ID to synchronize diagnostic records across facilities."}
            </p>
            <div className="space-y-1.5">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. 12-3456-7890-1234"
                  value={abhaNumber}
                  onChange={handleAbhaChange}
                  className="flex-1 text-xs p-3 rounded-xl border border-white/20 bg-white/10 font-bold placeholder-white/40 text-white focus:outline-none focus:border-white focus:bg-white/15 tracking-wider h-[44px]"
                />
                <button
                  onClick={handleLinkAbha}
                  className="bg-white text-blue-700 font-extrabold text-xs px-5 rounded-xl hover:bg-slate-50 transition-all active:scale-95 shadow-md min-h-[44px]"
                >
                  Link
                </button>
              </div>
              {abhaError && (
                <div className="text-[10px] text-red-350 font-bold px-1">{abhaError}</div>
              )}
            </div>
            <div className="text-[8px] text-blue-200/90 leading-relaxed border-t border-white/5 pt-2 flex items-start gap-1">
              <Info className="w-2.5 h-2.5 shrink-0 mt-0.5" />
              <span><strong>ABDM Prototype:</strong> Real integrations require ABDM sandbox access keys. Card linking is simulated here.</span>
            </div>
          </div>
        )}
      </div>

      {/* Upload Record Form */}
      {showRecordForm && (
        <form onSubmit={handleAddRecord} className="glass-card p-5 space-y-4 animate-scaleUp">
          <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <UploadCloud className="w-4 h-4 text-violet-600 animate-pulse" />
            {language === "hi" ? "दस्तावेज़ अपलोड करें" : language === "gu" ? "દસ્તાવેજ અપલોડ કરો" : "Upload Report / Prescription"}
          </h3>
          <div className="space-y-3.5">
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Document Title</label>
              <input
                type="text"
                placeholder="e.g. Blood Sugar Report"
                value={newRecord.title}
                onChange={e => setNewRecord(prev => ({ ...prev, title: e.target.value }))}
                className="w-full text-xs p-3 rounded-xl border border-slate-200/60 bg-slate-55/30 font-semibold focus:outline-none focus:border-violet-500 focus:bg-white h-[40px]"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Category</label>
                <select
                  value={newRecord.category}
                  onChange={e => setNewRecord(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full text-xs px-2.5 py-2 rounded-xl border border-slate-200/60 bg-slate-55/30 font-semibold focus:outline-none focus:border-violet-500 focus:bg-white h-[40px] cursor-pointer"
                >
                  <option value="Lab Test">Lab Test</option>
                  <option value="Prescription">Prescription</option>
                  <option value="Imaging">Imaging</option>
                  <option value="Vaccine">Vaccine Card</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Physician / Lab</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Ray"
                  value={newRecord.doctor}
                  onChange={e => setNewRecord(prev => ({ ...prev, doctor: e.target.value }))}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200/60 bg-slate-55/30 font-semibold focus:outline-none focus:border-violet-500 focus:bg-white h-[40px]"
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Notes / Summary</label>
              <textarea
                placeholder="Paste report summary, values, or prescriptions here..."
                value={newRecord.notes}
                onChange={e => setNewRecord(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full h-20 text-xs p-3 rounded-xl border border-slate-200/60 bg-slate-55/30 font-medium focus:outline-none focus:border-violet-500 focus:bg-white resize-none"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md active:scale-95 min-h-[44px]"
          >
            {t.uploadRecordBtn}
          </button>
        </form>
      )}

      {/* TRENDS CHART DASHBOARD */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex justify-between items-center gap-3">
          <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-violet-650 animate-pulse" />
            {language === "hi" ? "वाइटल्स एवं स्वास्थ्य रुझान" : language === "gu" ? "વાઇટલ્સ અને સ્વાસ્થ્ય વલણો" : "Vitals & Health Trends"}
          </h3>
          <select
            value={trendMetric}
            onChange={e => setTrendMetric(e.target.value as any)}
            className="text-[10px] font-bold text-slate-500 bg-white/50 border border-slate-200/60 rounded-lg px-2 py-1.5 focus:outline-none cursor-pointer focus:border-violet-500 h-[32px]"
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
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider px-0.5">
          {language === "hi" ? "कालानुक्रमिक सत्र इतिहास" : language === "gu" ? "ક્રમબદ્ધ સત્ર ઇતિહાસ" : "Chronological Session History"}
        </h3>
        {recordsList.length === 0 ? (
          <div className="glass-card p-8 text-center text-slate-400 text-xs font-medium">
            No health records saved. Click &quot;+&quot; to add reports.
          </div>
        ) : (
          <div className="space-y-2.5">
            {recordsList.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedRecordForDetails(item)}
                className="glass-card p-4 flex items-start justify-between gap-3 hover:border-violet-350 cursor-pointer transition-all active:scale-[0.99] hover:shadow-glass"
              >
                <div className="bg-violet-50 p-2.5 rounded-xl text-violet-600 shrink-0">
                  <FileText className="w-4.5 h-4.5" />
                </div>
                <div className="flex-grow space-y-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-extrabold text-slate-700 text-xs truncate">{item.title}</span>
                    <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider border ${
                      item.category === "Prescription" 
                        ? "bg-purple-50 text-purple-650 border-purple-100" 
                        : item.category === "Imaging" 
                          ? "bg-blue-50 text-blue-650 border-blue-100" 
                          : "bg-violet-50 text-violet-650 border-violet-100"
                    }`}>
                      {item.category}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-bold flex items-center gap-2.5 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
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
                  className="text-slate-350 hover:text-red-500 p-1.5 transition-all self-center active:scale-90 hover:scale-105"
                  title="Delete Record"
                >
                  <Trash2 className="w-4.5 h-4.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cloud Backup status */}
      <div className="bg-gradient-to-r from-violet-500/[0.04] to-purple-500/[0.04] border border-violet-500/10 rounded-2xl p-4 flex items-center justify-between text-[10px] text-violet-850 gap-4 flex-wrap">
        <span className="font-bold flex items-center gap-1.5 text-slate-650">
          <Lock className="w-4 h-4 text-violet-600 animate-float" />
          End-to-End Encrypted Cloud Storage Active
        </span>
        <span className="font-extrabold text-violet-600 underline cursor-pointer hover:text-violet-700">Manage Vault</span>
      </div>

      {/* DETAILS OVERLAY MODAL */}
      {selectedRecordForDetails && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4 animate-fadeIn">
          <div className="bg-white/95 backdrop-blur-md rounded-t-3xl md:rounded-3xl w-full max-w-full md:max-w-sm p-6 space-y-4 border-t md:border border-white/50 shadow-glass-lg animate-slideUp md:animate-scaleUp pb-[calc(1.5rem+env(safe-area-inset-bottom))] md:pb-6">
            <div className="flex justify-between items-start">
              <div className="space-y-0.5">
                <span className="text-[9px] uppercase tracking-wider font-extrabold text-violet-650 bg-violet-50 border border-violet-100 px-2 py-0.5 rounded-full">
                  {selectedRecordForDetails.category}
                </span>
                <h3 className="font-extrabold text-slate-800 text-sm mt-1">{selectedRecordForDetails.title}</h3>
              </div>
              <button 
                onClick={() => setSelectedRecordForDetails(null)} 
                className="bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-700 p-1.5 rounded-xl transition-all active:scale-90"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
              <div className="flex justify-between">
                <span className="font-bold text-slate-400">Date Recorded:</span>
                <span className="font-bold text-slate-800">{selectedRecordForDetails.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-slate-400">Provider / Lab:</span>
                <span className="font-bold text-slate-800">{selectedRecordForDetails.doctor}</span>
              </div>
              <div className="space-y-1.5 pt-2 border-t border-slate-100/80">
                <span className="font-bold text-slate-400 block uppercase text-[9px] tracking-wider">Detailed breakdown / Notes</span>
                <div className="bg-slate-50 border border-slate-200/65 p-3 rounded-2xl text-[10px] font-medium leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap text-slate-750 font-sans">
                  {selectedRecordForDetails.notes || "No additional records notes entered."}
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedRecordForDetails(null)}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs py-3 rounded-xl transition-all shadow-md active:scale-95 min-h-[44px]"
            >
              Close Details
            </button>
          </div>
        </div>
      )}

      {/* EXPORT OVERLAY MODAL */}
      {showExportModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4 animate-fadeIn">
          <div className="bg-white/95 backdrop-blur-md rounded-t-3xl md:rounded-3xl w-full max-w-full md:max-w-sm p-6 space-y-4 border-t md:border border-white/50 shadow-glass-lg animate-slideUp md:animate-scaleUp flex flex-col max-h-[85vh] pb-[calc(1.5rem+env(safe-area-inset-bottom))] md:pb-6">
            <div className="flex justify-between items-start shrink-0">
              <div className="space-y-0.5">
                <span className="text-[9px] uppercase tracking-wider font-extrabold text-blue-650 bg-blue-50 border border-blue-105 px-2 py-0.5 rounded-full">
                  Health Summary Report
                </span>
                <h3 className="font-extrabold text-slate-800 text-sm mt-1">Export Clinical Records</h3>
              </div>
              <button 
                onClick={() => setShowExportModal(false)} 
                className="bg-slate-100 text-slate-450 hover:bg-slate-200 p-1.5 rounded-xl transition-all active:scale-90"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isExporting ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12 space-y-3">
                <Loader2 className="w-8 h-8 text-violet-605 animate-spin" />
                <p className="text-[10px] font-extrabold text-slate-500 text-center max-w-[200px] uppercase tracking-wider animate-pulse leading-normal">
                  Compiling clinical database summary via Groq Llama 3.3...
                </p>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto bg-slate-50 border border-slate-200/65 p-3.5 rounded-2xl text-[10px] font-medium leading-relaxed prose prose-slate max-h-72">
                  {exportedSummary ? (
                    <div className="space-y-2 whitespace-pre-wrap font-sans text-slate-705">
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
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-95 min-h-[44px]"
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
                    className="bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95 min-h-[44px]"
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
});

RecordsView.displayName = "RecordsView";
