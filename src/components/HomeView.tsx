import React from "react";
import {
  Heart,
  ChevronRight,
  ShieldAlert,
  Activity,
  Mic,
  Video,
  FileText,
  Pill,
  Sparkles,
  Pencil,
  Phone
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface HomeViewProps {
  setActiveTab: (tab: string) => void;
  setActiveCall: (active: boolean) => void;
  userProfile: any;
  onEditProfile: () => void;
}

export const HomeView: React.FC<HomeViewProps> = React.memo(({
  setActiveTab,
  setActiveCall,
  userProfile,
  onEditProfile
}) => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="p-4 space-y-5 animate-fadeIn">
      {/* User Health Profile Card */}
      {userProfile ? (
        <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl p-4 border border-teal-100 shadow-sm text-left">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-teal-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-md shrink-0">
                {userProfile.name?.charAt(0)?.toUpperCase() || "S"}
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-800 leading-tight">
                  {language === "hi" ? `नमस्ते, ${userProfile.name?.split(" ")[0]}!` : language === "gu" ? `નમસ્તે, ${userProfile.name?.split(" ")[0]}!` : `Namaste, ${userProfile.name?.split(" ")[0]}!`}
                </h2>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                  {userProfile.age}{language === "hi" ? " वर्ष" : language === "gu" ? " વર્ષ" : "y"} • {userProfile.gender === "Male" ? (language === "hi" ? "पुरुष" : language === "gu" ? "પુરુષ" : "Male") : userProfile.gender === "Female" ? (language === "hi" ? "महिला" : language === "gu" ? "સ્ત્રી" : "Female") : (language === "hi" ? "अन्य" : language === "gu" ? "અન્ય" : "Other")}
                  {userProfile.bloodGroup && userProfile.bloodGroup !== "Unknown" ? ` • ${userProfile.bloodGroup}` : ""}
                </p>
              </div>
            </div>
            <button
              onClick={onEditProfile}
              className="p-2 rounded-xl bg-white border border-teal-200 text-teal-600 hover:bg-teal-50 transition-all active:scale-95 shrink-0"
              title="Edit Profile"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Conditions & Quick Info chips */}
          {userProfile.conditions && userProfile.conditions.length > 0 && !userProfile.conditions.includes("None") && (
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {userProfile.conditions.map((c: string) => (
                <span key={c} className="text-[9px] font-bold bg-white border border-teal-200 text-teal-700 px-2 py-0.5 rounded-full">
                  {c === "Other" && userProfile.otherCondition ? userProfile.otherCondition : c}
                </span>
              ))}
            </div>
          )}

          {/* Emergency contact row */}
          {userProfile.emergencyContact?.name && (
            <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-semibold bg-white/60 border border-slate-100 rounded-lg px-2.5 py-1.5 mt-1">
              <Phone className="w-3 h-3 text-teal-500 shrink-0" />
              <span>
                {language === "hi" ? "आपातकालीन:" : language === "gu" ? "ઇમરજન્સી:" : "Emergency:"} {userProfile.emergencyContact.name}
                {userProfile.emergencyContact.phone ? ` (+91 ${userProfile.emergencyContact.phone})` : ""}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl p-5 border border-teal-100 flex items-center justify-between shadow-sm">
          <div className="space-y-1 text-left">
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
            <Heart className="w-6 h-6 fill-white text-teal-600 border-none" stroke="none" />
          </div>
        </div>
      )}

      {/* Grid of feature cards */}
      <div className="text-left">
        <h3 className="text-sm font-semibold text-slate-700 mb-3 px-1 uppercase tracking-wider">
          {language === "hi" ? "प्रमुख सुविधाएं" : language === "gu" ? "મુખ્ય વિશેષતાઓ" : "Key Screenings & Services"}
        </h3>
        <div className="grid grid-cols-1 gap-3.5">
          {/* Card 1: Disease Screening */}
          <button
            onClick={() => setActiveTab("screen")}
            className="w-full text-left bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-teal-100 transition-all flex items-start gap-4 active:scale-[0.99]"
          >
            <div className="bg-teal-50 text-teal-600 p-3 rounded-xl shrink-0">
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
            <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl shrink-0">
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
            <div className="bg-blue-50 text-blue-600 p-3 rounded-xl shrink-0">
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
            <div className="bg-purple-50 text-purple-600 p-3 rounded-xl shrink-0">
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
            <div className="bg-orange-50 text-orange-600 p-3 rounded-xl shrink-0">
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
            <div className="bg-rose-50 text-rose-600 p-3 rounded-xl shrink-0">
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
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm text-left">
        <h4 className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
          {t.selectLanguage} / भाषा बदलें / ભાષા બદલો
        </h4>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setLanguage("en")}
            className={`py-2 px-1 text-[11px] font-bold rounded-lg border text-center transition-all ${
              language === "en"
                ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
            }`}
          >
            🇺🇸 English
          </button>
          <button
            onClick={() => setLanguage("hi")}
            className={`py-2 px-1 text-[11px] font-bold rounded-lg border text-center transition-all ${
              language === "hi"
                ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
            }`}
          >
            🇮🇳 हिंदी (Hindi)
          </button>
          <button
            onClick={() => setLanguage("gu")}
            className={`py-2 px-1 text-[11px] font-bold rounded-lg border text-center transition-all ${
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
      <div className="bg-teal-50 border border-teal-100/50 rounded-2xl p-4 shadow-inner flex gap-3 text-left">
        <div className="text-teal-600 shrink-0">
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
});

HomeView.displayName = "HomeView";
