"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { safeGetItem, safeSetItem } from "@/utils/localStorageHelper";

export type Language = "en" | "hi" | "gu" | string;

export const translations = {
  en: {
    appTitle: "Saathi",
    tagline: "Your AI Health Companion",
    disclaimer: "Saathi is a prototype for screening and awareness only — not a medical diagnosis. Always consult a qualified doctor.",
    home: "Home",
    screen: "Screen",
    vitals: "Vitals",
    talk: "Talk",
    records: "Records",
    welcome: "Welcome to Saathi",
    selectLanguage: "Select Language",
    vitalSigns: "Vital Signs",
    diseaseScreening: "Disease Screening",
    voiceSymptomCheck: "Voice Symptom Check",
    telemedicine: "Telemedicine",
    healthRecords: "Health Records",
    diseaseScreeningDesc: "Pre-screen for common health risks and disease conditions using AI assistance.",
    vitalSignsDesc: "Track and visualize your vitals like blood pressure, pulse, and oxygen levels.",
    voiceSymptomCheckDesc: "Speak your symptoms in your language and get instant analysis.",
    telemedicineDesc: "Connect with virtual health consultants or get AI triage recommendations.",
    healthRecordsDesc: "Store and analyze your prescriptions, lab reports, and medical history.",
    screeningHeader: "AI Disease Screening",
    screeningDesc: "Answer the questions below to receive an AI screening assessment. This is not a diagnosis.",
    startScreeningBtn: "Start Assessment",
    submitting: "Analyzing symptoms...",
    vitalsHeader: "Vitals Tracker",
    vitalsDesc: "Monitor your health patterns over time. Log your metrics below.",
    addVitalBtn: "Log Vital Metric",
    bloodPressure: "Blood Pressure",
    heartRate: "Heart Rate (BPM)",
    bloodOxygen: "Blood Oxygen (SpO2)",
    talkHeader: "AI Symptom Talk",
    talkDesc: "Speak or type your symptoms. Our AI companion will help screen and guide you.",
    tapToSpeak: "Tap to Speak",
    listening: "Listening...",
    recordsHeader: "Health Records",
    recordsDesc: "Manage and keep track of your clinical files and reports.",
    uploadRecordBtn: "Upload Report/Prescription",
    medicines: "Meds",
    medicinesDesc: "Scan your prescriptions using OCR, manage dosage lists, and configure reminder alarms.",
    medicinesHeader: "Meds",
    quickHealthTip: "Quick Health Tip",
    healthTipText: "Drinking sufficient water and maintaining 150 minutes of moderate activity weekly helps keep cardiovascular vitals in optimal range.",
    onboardingWelcome: "Welcome to Saathi",
    onboardingTagline: "Your AI Health Companion",
    profileFormTitle: "Tell us about yourself",
    fullName: "Full Name",
    age: "Age",
    gender: "Gender",
    male: "Male",
    female: "Female",
    other: "Other",
    phone: "Phone Number",
    conditions: "Pre-existing Conditions",
    allergies: "Allergies (optional)",
    medications: "Current Medications (optional)",
    bloodGroup: "Blood Group",
    emergencyContactName: "Emergency Contact Name",
    emergencyContactPhone: "Emergency Contact Phone",
    finish: "Finish",
    next: "Next",
    back: "Back",
    skip: "Skip",
    resetApp: "Reset App / Redo Onboarding",
    welcomeToast: "Namaste",
    onboardingCameraFlip: "Flip Camera",
    onboardingCameraFlipDesc: "Toggles between front and back camera for screening vs vitals",
    nuskheTitle: "Nani-Dadi Ke Nuskhe",
    nuskheSubtitle: "Traditional home remedies for mild symptoms",
    nuskheFooter: "These traditional remedies are supportive care only. If symptoms persist beyond 2-3 days, consult a doctor.",
    nuskheYellowWarning: "These are gentle supportive remedies only. Please also consult a doctor for your symptoms.",
  },
  hi: {
    appTitle: "साथी",
    tagline: "आपका एआई स्वास्थ्य साथी",
    disclaimer: "साथी केवल स्क्रीनिंग और जागरूकता के लिए एक प्रोटोटाइप है - कोई चिकित्सा निदान नहीं। हमेशा एक योग्य डॉक्टर से परामर्श करें।",
    home: "होम",
    screen: "जांच",
    vitals: "वाइल्स",
    talk: "बातचीत",
    records: "रिकॉर्ड्स",
    welcome: "साथी में आपका स्वागत है",
    selectLanguage: "भाषा चुनें",
    vitalSigns: "महत्वपूर्ण संकेत",
    diseaseScreening: "रोग स्क्रीनिंग",
    voiceSymptomCheck: "आवाज लक्षण जांच",
    telemedicine: "टेलीमेडिसिन",
    healthRecords: "स्वास्थ्य रिकॉर्ड",
    diseaseScreeningDesc: "एआई सहायता का उपयोग करके सामान्य स्वास्थ्य जोखिमों और बीमारियों की पूर्व-जांच करें।",
    vitalSignsDesc: "रक्तचाप, पल्स और ऑक्सीजन स्तर जैसे अपने महत्वपूर्ण संकेतों को ट्रैक और विज़ुअलाइज़ करें।",
    voiceSymptomCheckDesc: "अपनी भाषा में अपने लक्षण बोलें और तुरंत विश्लेषण प्राप्त करें।",
    telemedicineDesc: "वर्चुअल स्वास्थ्य सलाहकारों से जुड़ें या एआई ट्राइएज सिफारिशें प्राप्त करें।",
    healthRecordsDesc: "अपने नुस्खे, लैब रिपोर्ट और चिकित्सा इतिहास को सहेजें और उनका विश्लेषण करें।",
    screeningHeader: "एआई रोग स्क्रीनिंग",
    screeningDesc: "एआई स्क्रीनिंग मूल्यांकन प्राप्त करने के लिए नीचे दिए गए प्रश्नों के उत्तर दें। यह कोई निदान नहीं है।",
    startScreeningBtn: "मूल्यांकन शुरू करें",
    submitting: "लक्षणों का विश्लेषण किया जा रहा है...",
    vitalsHeader: "वाइल्स ट्रैकर",
    vitalsDesc: "समय के साथ अपने स्वास्थ्य पैटर्न की निगरानी करें। नीचे अपने मेट्रिक्स लॉग करें।",
    addVitalBtn: "वाइटल लॉग करें",
    bloodPressure: "रक्तचाप (BP)",
    heartRate: "हृदय गति (BPM)",
    bloodOxygen: "रक्त ऑक्सीजन (SpO2)",
    talkHeader: "एआई लक्षण बातचीत",
    talkDesc: "अपने लक्षण बोलें या टाइप करें। हमारा एआई साथी स्क्रीनिंग और मार्गदर्शन में मदद करेगा।",
    tapToSpeak: "बोलने के लिए टैप करें",
    listening: "सुन रहा हूँ...",
    recordsHeader: "स्वास्थ्य रिकॉर्ड",
    recordsDesc: "अपनी नैदानिक ​​फाइलों और रिपोर्टों को प्रबंधित करें और उन पर नज़र रखें।",
    uploadRecordBtn: "रिपोर्ट/पर्चा अपलोड करें",
    medicines: "दवाएं",
    medicinesDesc: "ओसीआर का उपयोग करके अपने पर्चे को स्कैन करें, दवाओं की सूची प्रबंधित करें और अनुस्मारक अलार्म सेट करें।",
    medicinesHeader: "दवाएं",
    quickHealthTip: "त्वरित स्वास्थ्य सलाह",
    healthTipText: "पर्याप्त पानी पीना और साप्ताहिक रूप से 150 मिनट की मध्यम गतिविधि बनाए रखना हृदय संबंधी महत्वपूर्ण अंगों को इष्टतम सीमा में रखने में मदद करता है।",
    onboardingWelcome: "साथी में आपका स्वागत है",
    onboardingTagline: "आपका एआई स्वास्थ्य साथी",
    profileFormTitle: "अपने बारे में बताएं",
    fullName: "पूरा नाम",
    age: "उम्र",
    gender: "लिंग",
    male: "पुरुष",
    female: "महिला",
    other: "अन्य",
    phone: "फ़ोन नंबर",
    conditions: "पहले से मौजूद बीमारियां",
    allergies: "एलर्जी (वैकल्पिक)",
    medications: "वर्तमान दवाएं (वैकल्पिक)",
    bloodGroup: "रक्त समूह",
    emergencyContactName: "आपातकालीन संपर्क नाम",
    emergencyContactPhone: "आपातकालीन संपर्क फ़ोन",
    finish: "समाप्त करें",
    next: "अगला",
    back: "पीछे",
    skip: "छोड़ें",
    resetApp: "ऐप रीसेट करें / ऑनबोर्डिंग दोबारा करें",
    welcomeToast: "नमस्ते",
    onboardingCameraFlip: "कैमरा पलटें",
    onboardingCameraFlipDesc: "स्क्रीनिंग बनाम वाइटल्स के लिए फ्रंट और बैक कैमरे के बीच स्विच करता है",
    nuskheTitle: "नानी-दादी के नुस्खे",
    nuskheSubtitle: "हल्के लक्षणों के लिए पारंपरिक घरेलू उपाय",
    nuskheFooter: "ये पारंपरिक नुस्खे सहायक देखभाल के लिए हैं। यदि लक्षण 2-3 दिनों से अधिक बने रहें तो डॉक्टर से मिलें।",
    nuskheYellowWarning: "ये हल्के सहायक उपाय हैं। कृपया डॉक्टर से भी मिलें।",
  },
  gu: {
    appTitle: "સાથી",
    tagline: "તમારો AI સ્વાસ્થ્ય સાથી",
    disclaimer: "સાથી માત્ર સ્ક્રીનીંગ અને જાગૃતિ માટેનો એક પ્રોટોટાઇપ છે - તબીબી નિદાન નથી. હંમેશા લાયક ડૉક્ટરની સલાહ લો.",
    home: "હોમ",
    screen: "તપાસ",
    vitals: "વાઇટલ્સ",
    talk: "વાતચીત",
    records: "રેકોર્ડ્સ",
    welcome: "સાથીમાં આપનું સ્વાગત છે",
    selectLanguage: "ભાષા પસંદ કરો",
    vitalSigns: "મહત્વપૂર્ણ સંકેતો",
    diseaseScreening: "રોગ સ્ક્રીનીંગ",
    voiceSymptomCheck: "વોઇસ લક્ષણ તપાસ",
    telemedicine: "ટેલિમેડિસિન",
    healthRecords: "સ્વાસ્થ્ય રેકોર્ડ",
    diseaseScreeningDesc: "AI સહાયનો ઉપયોગ કરીને સામાન્ય આરોગ્ય જોખમો અને રોગની સ્થિતિ માટે પૂર્વ-સ્ક્રીન કરો.",
    vitalSignsDesc: "બ્લડ પ્રેશર, પલ્સ અને ઓક્સિજન સ્તર જેવા તમારા વાઇટલ્સને ટ્રેક અને વિઝ્યુઅલાઈઝ કરો.",
    voiceSymptomCheckDesc: "તમારી ભાષામાં તમારા લક્ષણો બોલો અને ત્વરિત વિશ્લેષણ મેળવો.",
    telemedicineDesc: "વર્ચ્યુઅલ હેલ્થ કન્સલ્ટન્ટ્સ સાથે કનેક્ટ થાઓ અથવા AI ટ્રાયેજ ભલામણો મેળવો.",
    healthRecordsDesc: "તમારા પ્રિસ્ક્રિપ્શન, લેબ રિપોર્ટ્સ અને તબીબી ઇતિહાસ સંગ્રહિત કરો અને તેનું વિશ્લેષણ કરો.",
    screeningHeader: "AI રોગ સ્ક્રીનીંગ",
    screeningDesc: "AI સ્ક્રીનીંગ મૂલ્યાંકન મેળવવા માટે નીચેના પ્રશ્નોના જવાબ આપો. આ કોઈ નિદાન નથી.",
    startScreeningBtn: "મૂલ્યાંકન શરૂ કરો",
    submitting: "લક્ષણોનું વિશ્લેષણ કરી રહ્યું છે...",
    vitalsHeader: "વાઇટલ્સ ટ્રેકર",
    vitalsDesc: "સમય જતાં તમારા સ્વાસ્થ્ય પેટર્નનું નિરીક્ષણ કરો. નીચે તમારા મેટ્રિક્સ લોગ કરો.",
    addVitalBtn: "વાઇટલ લોગ કરો",
    bloodPressure: "બ્લડ પ્રેશર",
    heartRate: "હૃદયના ધબકારા (BPM)",
    bloodOxygen: "બ્લડ ઓક્સિજન (SpO2)",
    talkHeader: "AI લક્ષણ વાતચીત",
    talkDesc: "તમારા લક્ષણો બોલો અથવા ટાઇપ કરો. અમારો AI સાથી સ્ક્રીનિંગ અને માર્ગદર્શનમાં મદદ કરશે.",
    tapToSpeak: "બોલવા માટે ટેપ કરો",
    listening: "સાંભળી રહ્યા છીએ...",
    recordsHeader: "સ્વાસ્થ્ય રેકોર્ડ્સ",
    recordsDesc: "તમારી ક્લિનિકલ ફાઇલો અને રિપોર્ટ્સ મેનેજ કરો અને તેનો ટ્રૅક રાખો.",
    uploadRecordBtn: "રિપોર્ટ/પ્રિસ્ક્રિપ્શન અપલોડ કરો",
    medicines: "દવાઓ",
    medicinesDesc: "OCR નો ઉપયોગ કરીને તમારા પ્રિસ્ક્રિપ્શનને સ્કેન કરો, દવાઓની સૂચિ સંચાલિત કરો અને રીમાઇન્ડર એલાર્મ સેટ કરો.",
    medicinesHeader: "દવાઓ",
    quickHealthTip: "ત્વરિત આરોગ્ય ટીપ",
    healthTipText: "પૂરતું પાણી પીવું અને સાપ્તાહિક 150 મિનિટ મધ્યમ પ્રવૃત્તિ જાળવી રાખવાથી હૃદય સંબંધિત વાઇટલ્સ યોગ્ય શ્રેણીમાં રહે છે.",
    onboardingWelcome: "સાથીમાં આપનું સ્વાગત છે",
    onboardingTagline: "તમારો AI સ્વાસ્થ્ય સાથી",
    profileFormTitle: "તમારા વિશે કહો",
    fullName: "પૂરું નામ",
    age: "અંમર",
    gender: "જાતિ",
    male: "પુરષ",
    female: "મહિલા",
    other: "અન્ય",
    phone: "ફોન નંબર",
    conditions: "પહેલાંથી રહેલી બીમારીઓ",
    allergies: "એલર્જી (વૈકલ્પિક)",
    medications: "વર્તમાન દવાઓ (વૈકલ્પિક)",
    bloodGroup: "બ્લડ ગ્રુપ",
    emergencyContactName: "ઇમરજન્સી સંપર્ક નામ",
    emergencyContactPhone: "ઇમરજન્સી સંપર્ક ફોન",
    finish: "સમાપ્ત કરો",
    next: "આગળ",
    back: "પાછળ",
    skip: "છોડો",
    resetApp: "એપ્લિકેશન રીસેટ કરો / ઓનબોર્ડિંગ ફરીથી કરો",
    welcomeToast: "નમસ્તે",
    onboardingCameraFlip: "કેમેરા ફ્લિપ કરો",
    onboardingCameraFlipDesc: "સ્ક્રિનિંગ વિરુદ્ધ વાઇટલ્સ માટે આગળ અને પાછળના કેમેરા વચ્ચે સ્વિચ કરે છે",
    nuskheTitle: "નાની-દાદીના નુસ્ખા",
    nuskheSubtitle: "હળવા લક્ષણો માટે પરંપરાગત ઘરેલું ઉપાય",
    nuskheFooter: "આ પરંપરાગત નુસ્ખા સહાયક સંભાળ માટે છે। જો લક્ષણો ૨-૩ દિવસથી વધુ રહે તો ડૉક્ટરને મળો।",
    nuskheYellowWarning: "આ હળવા સહાયક ઉપાય છે। કૃપા કરી ડૉક્ટરની સલાહ પણ લો.",
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations.en;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  // Load language from localStorage if available
  useEffect(() => {
    const saved = safeGetItem("saathi_lang");
    if (saved) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    safeSetItem("saathi_lang", lang);
  };

  const t = translations[language as "en" | "hi" | "gu"] || translations.en;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
