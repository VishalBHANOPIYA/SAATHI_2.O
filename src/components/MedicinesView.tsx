import React, { useState, useEffect } from "react";
import {
  Pill,
  Plus,
  Camera,
  UploadCloud,
  Loader2,
  Trash2,
  Bell,
  CheckCircle,
  Info,
  X
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { safeGetItem, safeSetItem } from "@/utils/localStorageHelper";
import { checkRateLimit } from "@/utils/rateLimit";
import ImagePickerModal from "./ImagePickerModal";

interface MedicinesViewProps {
  medicinesList: any[];
  setMedicinesList: React.Dispatch<React.SetStateAction<any[]>>;
  reminderActive: boolean;
  setReminderActive: (active: boolean) => void;
  caregiverAlert: boolean;
  setCaregiverAlert: (active: boolean) => void;
  drugInteractionNote: string | null;
  setDrugInteractionNote: (note: string | null) => void;
  userProfile?: any;
  language?: string;
}

export const MedicinesView: React.FC<MedicinesViewProps> = React.memo(({
  medicinesList,
  setMedicinesList,
  reminderActive,
  setReminderActive,
  caregiverAlert,
  setCaregiverAlert,
  drugInteractionNote,
  setDrugInteractionNote,
  userProfile,
  language: languageProp
}) => {
  const { language, t } = useLanguage();

  const [ocrProgress, setOcrProgress] = useState("");
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [isParsingPrescription, setIsParsingPrescription] = useState(false);
  const [caregiverContact, setCaregiverContact] = useState("");
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [prescriptionImage, setPrescriptionImage] = useState<File | null>(null);

  useEffect(() => {
    // Prefill caregiver contact from profile emergency contact if available and not already set
    const savedContact = safeGetItem("saathi_caregiver_contact") || "";
    if (!savedContact && userProfile?.emergencyContact?.name) {
      const prefilled = `${userProfile.emergencyContact.name}${userProfile.emergencyContact.phone ? ` (${userProfile.countryCode || "+91"} ${userProfile.emergencyContact.phone})` : ""}`;
      setCaregiverContact(prefilled);
      safeSetItem("saathi_caregiver_contact", prefilled);
    } else {
      setCaregiverContact(savedContact);
    }
  }, [userProfile]);

  const resizeImage = (file: File, maxWidth = 1024, maxHeight = 1024, quality = 0.8): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Canvas context is not available"));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", quality);
          resolve(dataUrl);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

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

  const handleParsePrescriptionImageAndText = async (imageBase64: string, ocrText: string) => {
    setIsParsingPrescription(true);
    try {
      const { allowed } = checkRateLimit("parse-prescription", 3, 30000);
      if (!allowed) {
        throw new Error("RateLimitExceeded");
      }

      const response = await fetch("/api/parse-prescription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: imageBase64,
          text: ocrText,
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
        safeSetItem("saathi_medicines", JSON.stringify(medsWithId));
        if (data.interactionNote) {
          safeSetItem("saathi_drug_interactions", data.interactionNote);
        }
      } else {
        throw new Error(data.error || "Failed to parse prescription.");
      }
    } catch (error) {
      console.error("Parse error:", error);
      const isRateLimit = error instanceof Error && error.message === "RateLimitExceeded";
      const fallbackMeds = [
        { id: "f1", name: "Paracetamol", dose: "500 mg", frequency: "Twice daily (1-0-1)", duration: "5 days", reminderTime: "08:00" },
        { id: "f2", name: "Amoxicillin", dose: "250 mg", frequency: "Thrice daily (1-1-1)", duration: "7 days", reminderTime: "13:00" }
      ];
      setMedicinesList(fallbackMeds);
      
      const rateLimitMsg = language === "hi"
        ? "नोट: सिस्टम व्यस्त है - ऑफ़लाइन लोकल फ़ॉलबैक दवा शेड्यूल का उपयोग किया जा रहा है। कृपया दवाओं की जांच स्वयं करें।"
        : language === "gu"
        ? "નોંધ: સિસ્ટમ વ્યસ્ત છે - ઑફલાઇન સ્થાનિક ફૉલબેક દવાની સૂચિ ઉપયોગમાં છે. કૃપા કરીને તપાસી લો."
        : "Note: System busy - running offline fallback medicine schedule. Please review and adjust the medicine schedules manually.";

      const genericMsg = "Note: AI parser failed or is in offline fallback mode. Please review and adjust the medicine schedules manually.";

      const interactionMsg = isRateLimit ? rateLimitMsg : genericMsg;

      setDrugInteractionNote(interactionMsg);
      safeSetItem("saathi_medicines", JSON.stringify(fallbackMeds));
      safeSetItem("saathi_drug_interactions", interactionMsg);
    } finally {
      setIsParsingPrescription(false);
      setIsOcrLoading(false);
      setOcrProgress("");
    }
  };

  const processPrescriptionFile = async (file: File) => {
    setIsOcrLoading(true);
    setOcrProgress("Downscaling and compressing image...");
    try {
      // 1. Downscale the image and get base64
      const resizedBase64 = await resizeImage(file, 1024, 1024, 0.8);

      // 2. Perform client-side Tesseract OCR in parallel or background as a fallback
      setOcrProgress("Scanning prescription with fallback Tesseract OCR...");
      let ocrText = "";
      try {
        // DYNAMICALLY IMPORT tesseract.js inside the OCR handler only!
        const { createWorker } = await import("tesseract.js");
        const worker = await createWorker("eng");
        const ret = await worker.recognize(file);
        ocrText = ret.data.text;
        await worker.terminate();
      } catch (ocrErr) {
        console.warn("Client-side Tesseract OCR failed, proceeding with image only", ocrErr);
      }

      // 3. Call the parse API with both base64 image and fallback OCR text
      setOcrProgress("Analyzing prescription with Groq Vision AI...");
      await handleParsePrescriptionImageAndText(resizedBase64, ocrText);

    } catch (err) {
      console.error("Prescription processing error:", err);
      alert(err instanceof Error ? err.message : "Failed to process prescription image. Please check the image and try again.");
      setIsOcrLoading(false);
      setOcrProgress("");
    }
  };

  return (
    <div className="p-4 space-y-4 animate-fadeIn overflow-y-auto flex-1 h-full pb-24 text-left">
      {/* Header Info */}
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center">
              <Pill className="w-4.5 h-4.5 text-violet-605 animate-float" />
            </div>
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
            safeSetItem("saathi_medicines", JSON.stringify(updated));
          }}
          className="bg-gradient-to-r from-violet-600 to-purple-650 text-white p-2.5 rounded-full hover:from-violet-700 hover:to-purple-700 transition-all flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 shrink-0"
          title="Add Medicine Manually"
        >
          <Plus className="w-4.5 h-4.5" />
        </button>
      </div>

      {/* OCR Scan Card */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-violet-50 text-violet-605 rounded-xl">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider">
              {language === "hi" ? "पर्चा स्कैन करें (AI)" : language === "gu" ? "પ્રિસ્ક્રિપ્શન સ્કેન કરો (AI)" : "Scan Prescription (AI)"}
            </h3>
            <p className="text-[10px] text-slate-455 leading-relaxed">
              {language === "hi" ? "फोटो खींचें या अपलोड करें। ओसीआर और एआई दवाओं की सूची बना देंगे।" : language === "gu" ? "ફોટો ખેંચો અથવા અપલોડ કરો. ઓસીઆર અને એઆઈ દવાઓની યાદી બનાવશે." : "Take a photo or upload to automatically extract and parse medication schedules."}
            </p>
          </div>
        </div>

        <div className="border-2 border-dashed border-violet-300 rounded-2xl p-6 text-center bg-violet-50/50 hover:bg-violet-50 transition-colors relative">
          {isOcrLoading && (
            <div className="absolute inset-0 bg-white/95 rounded-2xl flex flex-col items-center justify-center gap-2 z-10">
              <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
              <span className="text-[10px] font-extrabold text-violet-750 uppercase tracking-wider animate-pulse">{ocrProgress}</span>
            </div>
          )}

          {/* Preview if image selected */}
          {prescriptionImage ? (
            <div className="space-y-3">
              <img
                src={URL.createObjectURL(prescriptionImage)}
                alt="Prescription"
                className="w-full max-h-48 object-contain rounded-xl border border-gray-200"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowImagePicker(true)}
                  className="flex-1 py-2 text-sm text-violet-600 border border-violet-300 rounded-xl hover:bg-violet-50"
                  disabled={isOcrLoading}
                >
                  Change Image
                </button>
                <button
                  onClick={() => {
                    setPrescriptionImage(null);
                  }}
                  className="px-3 py-2 text-sm text-red-500 border border-red-200 rounded-xl hover:bg-red-50"
                  disabled={isOcrLoading}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* No image yet — show picker trigger */
            <button
              onClick={() => setShowImagePicker(true)}
              className="w-full space-y-3 active:scale-[0.98] transition-transform"
              disabled={isOcrLoading}
            >
              <div className="w-14 h-14 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto">
                <UploadCloud className="w-7 h-7 text-violet-500" />
              </div>
              <div>
                <p className="font-semibold text-violet-700">
                  Add Prescription
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Tap to upload from gallery or take a photo
                </p>
              </div>
              {/* Show both options as chips */}
              <div className="flex gap-2 justify-center flex-wrap">
                <span className="flex items-center gap-1 text-[10px] bg-white border border-gray-205 rounded-full px-3 py-1 text-gray-600">
                  <UploadCloud className="w-3 h-3 text-violet-500" />
                  Gallery
                </span>
                <span className="flex items-center gap-1 text-[10px] bg-white border border-gray-205 rounded-full px-3 py-1 text-gray-600">
                  <Camera className="w-3 h-3 text-purple-500" />
                  Camera
                </span>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Medicines List Grid */}
      <div className="space-y-3">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider px-1">
          {language === "hi" ? "आपकी दवाएं" : language === "gu" ? "તમારી દવાઓ" : "Medication Schedule"}
        </h3>
        {medicinesList.length === 0 ? (
          <div className="glass-card p-8 text-center text-slate-400 text-xs">
            {language === "hi" ? "कोई दवाएं सेट नहीं हैं। कृपया एक पर्चा स्कैन करें या मैन्युअल रूप से जोड़ें।" : language === "gu" ? "કોઈ દવાઓ સેટ નથી. કૃપા કરીને પ્રિસ્ક્રિપ્શન સ્કેન કરો અથવા મેન્યુઅલી ઉમેરો." : "No medications configured. Scan a prescription or tap '+' to add manually."}
          </div>
        ) : (
          <div className="space-y-3">
            {medicinesList.map((med, index) => (
              <div key={med.id} className="bg-white border-l-4 border-violet-500 shadow-sm p-4.5 space-y-4 relative group animate-fadeIn rounded-r-2xl border-y border-r border-gray-150">
                <button
                  onClick={() => {
                    const updated = medicinesList.filter(m => m.id !== med.id);
                    setMedicinesList(updated);
                    safeSetItem("saathi_medicines", JSON.stringify(updated));
                  }}
                  className="absolute top-4.5 right-4.5 text-slate-350 hover:text-red-500 hover:scale-110 active:scale-95 transition-all"
                >
                  <Trash2 className="w-4.5 h-4.5" />
                </button>

                {/* Header info */}
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <span className="text-[9px] font-black text-violet-700 bg-violet-100 border border-violet-200 px-2.5 py-0.5 rounded-full">
                    #{index + 1}
                  </span>
                  <input
                    type="text"
                    value={med.name}
                    onChange={(e) => {
                      const updated = [...medicinesList];
                      updated[index].name = e.target.value;
                      setMedicinesList(updated);
                      safeSetItem("saathi_medicines", JSON.stringify(updated));
                    }}
                    placeholder="Medicine Name (e.g. Paracetamol)"
                    className="text-xs font-extrabold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-b focus:border-violet-500 bg-transparent flex-1 h-[28px]"
                  />
                </div>

                {/* Grid details */}
                <div className="grid grid-cols-2 gap-3 text-[10px]">
                  <div className="space-y-1">
                    <span className="text-slate-400 uppercase font-bold tracking-wider">Dose / Strength</span>
                    <input
                      type="text"
                      value={med.dose}
                      onChange={(e) => {
                        const updated = [...medicinesList];
                        updated[index].dose = e.target.value;
                        setMedicinesList(updated);
                        safeSetItem("saathi_medicines", JSON.stringify(updated));
                      }}
                      placeholder="e.g. 500 mg / 1 tab"
                      className="w-full bg-slate-50/50 border border-slate-200/60 rounded-xl py-2 px-2.5 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 focus:bg-white text-slate-700 h-[34px]"
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
                        safeSetItem("saathi_medicines", JSON.stringify(updated));
                      }}
                      placeholder="e.g. 1-0-1 / Twice daily"
                      className="w-full bg-slate-50/50 border border-slate-200/60 rounded-xl py-2 px-2.5 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 focus:bg-white text-slate-700 h-[34px]"
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
                        safeSetItem("saathi_medicines", JSON.stringify(updated));
                      }}
                      placeholder="e.g. 5 days / Ongoing"
                      className="w-full bg-slate-50/50 border border-slate-200/60 rounded-xl py-2 px-2.5 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 focus:bg-white text-slate-700 h-[34px]"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1">
                      <Bell className="w-3.5 h-3.5 text-rose-500" />
                      Reminder Time
                    </span>
                    <input
                      type="time"
                      value={med.reminderTime}
                      onChange={(e) => {
                        const updated = [...medicinesList];
                        updated[index].reminderTime = e.target.value;
                        setMedicinesList(updated);
                        safeSetItem("saathi_medicines", JSON.stringify(updated));
                      }}
                      className="w-full bg-slate-50/50 border border-slate-200/60 rounded-xl py-1.5 px-2.5 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 focus:bg-white text-slate-700 font-bold h-[34px]"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reminder settings config */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h4 className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wide">
              {language === "hi" ? "सक्रिय अलार्म अनुस्मारक" : language === "gu" ? "સક્રિય રીમાઇન્ડર એલાર્મ" : "Active Alarm Reminders"}
            </h4>
            <p className="text-[9px] text-slate-450 leading-relaxed">
              {language === "hi" ? "निर्धारित समय पर दवाएं लेने के लिए अलार्म चालू करें।" : language === "gu" ? "નિયત સમય પર દવા લેવા માટે એલાર્મ ચાલુ કરો." : "Use browser Notification API to alert you of due doses."}
            </p>
          </div>
          <button
            onClick={requestNotificationPermission}
            className={`text-[10px] font-extrabold px-3.5 py-2 rounded-full transition-all flex items-center gap-1.5 shrink-0 hover:scale-[1.02] active:scale-95 ${
              reminderActive 
                ? "bg-emerald-50 text-emerald-705 border border-emerald-100" 
                : "bg-gradient-to-r from-violet-600 to-purple-650 hover:from-violet-700 hover:to-purple-700 text-white shadow-md"
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            {reminderActive ? (language === "hi" ? "सक्रिय" : language === "gu" ? "સક્રિય" : "Enabled") : (language === "hi" ? "सक्रिय करें" : language === "gu" ? "सक्रिय કરો" : "Enable")}
          </button>
        </div>

        {/* CAREGIVER TOGGLE */}
        <div className="border-t border-slate-100 pt-4 flex items-start justify-between gap-4">
          <div className="space-y-0.5">
            <h4 className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wide">
              {language === "hi" ? "केयरगिवर अलर्ट (Mock)" : language === "gu" ? "કેરગિવર એલર્ટ (Mock)" : "Caregiver Alerts (Mock Prototype)"}
            </h4>
            <p className="text-[9px] text-slate-455 leading-relaxed">
              {language === "hi" ? "दवा छूटने पर केयरगिवर को एसएमएस/अलर्ट भेजें।" : language === "gu" ? "દવા ચુકી જવા પર કેરગીવરને SMS/એલર્ટ મોકલો." : "Notify family or caregiver if a reminder is missed."}
            </p>
          </div>
          <button
            onClick={() => {
              const updated = !caregiverAlert;
              setCaregiverAlert(updated);
              safeSetItem("saathi_caregiver_alert", String(updated));
            }}
            className={`w-10 h-6 rounded-full p-1 transition-all duration-300 shrink-0 ${
              caregiverAlert ? "bg-violet-600 flex justify-end" : "bg-slate-200 flex justify-start"
            }`}
          >
            <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
          </button>
        </div>

        {caregiverAlert && (
          <div className="bg-slate-50/60 border border-slate-200/50 rounded-xl p-3.5 text-[10px] space-y-2 animate-fadeIn">
            <div className="space-y-1">
              <span className="text-slate-450 font-bold uppercase tracking-wider block">Caregiver Contact Detail</span>
              <input
                type="text"
                placeholder="e.g. Rahul Sharma (+91 98765 43210)"
                value={caregiverContact}
                onChange={(e) => {
                  setCaregiverContact(e.target.value);
                  safeSetItem("saathi_caregiver_contact", e.target.value);
                }}
                className="w-full bg-white border border-slate-200/60 rounded-xl py-2 px-3 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 focus:bg-white text-slate-700 h-[34px]"
              />
            </div>
            <div className="text-[9.5px] text-violet-700 bg-violet-50/50 px-2.5 py-1.5 rounded-lg border border-violet-100/50 leading-relaxed font-semibold">
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
        <div className="bg-amber-50/50 border border-amber-250 rounded-2xl p-4.5 space-y-2.5">
          <div className="flex items-center gap-1.5 text-amber-800">
            <Info className="w-4 h-4 text-amber-600 shrink-0 animate-pulse" />
            <h4 className="text-[11px] font-black uppercase tracking-wider">
              {language === "hi" ? "सुरक्षा एवं ड्रग इंटरेक्शन नोट" : language === "gu" ? "આરોગ્ય અને ડ્રગ ઇન્ટરેક્શન નોંધ" : "Safety & Drug Interaction Note"}
            </h4>
          </div>
          <p className="text-[10px] text-slate-600 leading-relaxed font-medium">
            {drugInteractionNote}
          </p>
          <div className="text-[9px] text-amber-600 font-extrabold uppercase border-t border-amber-200/55 pt-2 tracking-wide">
            ⚠️ {language === "hi" ? "सूचनात्मक उद्देश्य के लिए: हमेशा एक चिकित्सक से पुष्टि करें।" : language === "gu" ? "માહિતીના હેતુ માટે: હંમેશા તબીબ અથવા ફાર્માસિસ્ટ સાથે પુષ્ટિ કરો." : "Informational Only: Always confirm medical plans with a pharmacist or doctor."}
          </div>
        </div>
      )}
      {/* Image Picker Modal */}
      <ImagePickerModal
        isOpen={showImagePicker}
        onClose={() => setShowImagePicker(false)}
        onImageSelected={(file) => {
          setPrescriptionImage(file);
          setShowImagePicker(false);
          processPrescriptionFile(file);
        }}
        title="Add Prescription"
        subtitle="Upload an existing photo or take a new one"
      />
    </div>
  );
});

MedicinesView.displayName = "MedicinesView";
