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
  Info
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface MedicinesViewProps {
  medicinesList: any[];
  setMedicinesList: React.Dispatch<React.SetStateAction<any[]>>;
  reminderActive: boolean;
  setReminderActive: (active: boolean) => void;
  caregiverAlert: boolean;
  setCaregiverAlert: (active: boolean) => void;
  drugInteractionNote: string | null;
  setDrugInteractionNote: (note: string | null) => void;
}

export const MedicinesView: React.FC<MedicinesViewProps> = React.memo(({
  medicinesList,
  setMedicinesList,
  reminderActive,
  setReminderActive,
  caregiverAlert,
  setCaregiverAlert,
  drugInteractionNote,
  setDrugInteractionNote
}) => {
  const { language, t } = useLanguage();

  const [ocrProgress, setOcrProgress] = useState("");
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [isParsingPrescription, setIsParsingPrescription] = useState(false);
  const [caregiverContact, setCaregiverContact] = useState("");

  useEffect(() => {
    const contact = localStorage.getItem("saathi_caregiver_contact") || "";
    setCaregiverContact(contact);
  }, []);

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

  const handlePrescriptionUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
            <div className="absolute inset-0 bg-white/90 rounded-xl flex flex-col items-center justify-center gap-2 z-10">
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
                  className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors text-slate-400"
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
                    className="text-xs font-extrabold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-b focus:border-teal-500 bg-transparent flex-1 h-[28px]"
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
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2 focus:outline-none focus:border-teal-500 text-slate-700 h-[32px] border-slate-200"
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
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2 focus:outline-none focus:border-teal-500 text-slate-700 h-[32px] border-slate-200"
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
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2 focus:outline-none focus:border-teal-500 text-slate-700 h-[32px] border-slate-200"
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
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1 px-2 focus:outline-none focus:border-teal-500 text-slate-700 font-bold h-[32px] border-slate-200"
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
            className={`text-[9px] font-extrabold px-3 py-1.5 rounded-full transition-colors flex items-center gap-1 shrink-0 h-[32px] ${
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
              {language === "hi" ? "केयरगिवर अलर्ट (Mock)" : language === "gu" ? "કેરગિવर એલર્ટ (Mock)" : "Caregiver Alerts (Mock Prototype)"}
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
          <div className="bg-slate-50 border border-slate-200/50 rounded-xl p-3 text-[10px] space-y-2 animate-fadeIn border-slate-200">
            <div className="space-y-1">
              <span className="text-slate-500 font-bold uppercase tracking-wider block">Caregiver Contact Detail</span>
              <input
                type="text"
                placeholder="e.g. Rahul Sharma (+91 98765 43210)"
                value={caregiverContact}
                onChange={(e) => {
                  setCaregiverContact(e.target.value);
                  localStorage.setItem("saathi_caregiver_contact", e.target.value);
                }}
                className="w-full bg-white border border-slate-200 rounded-lg py-1 px-2 focus:outline-none focus:border-teal-500 text-slate-700 h-[32px]"
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
        <div className="bg-amber-50 border border-amber-105 rounded-2xl p-4 space-y-2 border-amber-200">
          <div className="flex items-center gap-1.5 text-amber-800">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <h4 className="text-[11px] font-black uppercase tracking-wider">
              {language === "hi" ? "सुरक्षा एवं ड्रग इंटरेक्शन नोट" : language === "gu" ? "આરોગ્ય અને ડ્રગ ઇન્ટરેક્શન નોંધ" : "Safety & Drug Interaction Note"}
            </h4>
          </div>
          <p className="text-[10px] text-slate-650 leading-relaxed font-medium text-slate-750">
            {drugInteractionNote}
          </p>
          <div className="text-[9px] text-amber-700 font-extrabold uppercase border-t border-amber-200/60 pt-2 tracking-wide">
            ⚠️ {language === "hi" ? "सूचनात्मक उद्देश्य के लिए: हमेशा एक चिकित्सक से पुष्टि करें।" : language === "gu" ? "માહિતીના હેતુ માટે: હંમેશા તબીબ અથવા ફાર્માસિસ્ટ સાથે પુષ્ટિ કરો." : "Informational Only: Always confirm medical plans with a pharmacist or doctor."}
          </div>
        </div>
      )}
    </div>
  );
});

MedicinesView.displayName = "MedicinesView";
