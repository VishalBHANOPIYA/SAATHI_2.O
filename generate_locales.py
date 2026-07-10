import re
import json
import os

def parse_ts_file(filepath):
    """
    Parses a TypeScript translation file to extract the exported object's key-value pairs.
    """
    if not os.path.exists(filepath):
        return {}
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Strip comments
    content_clean = re.sub(r'//.*?\n', '\n', content)
    content_clean = re.sub(r'/\*.*?\*/', '', content_clean, flags=re.DOTALL)
    
    # Regex to find key-value pairs
    pattern = re.compile(r'(\w+)\s*:\s*["`](.*?)["`],?', re.DOTALL)
    matches = pattern.findall(content_clean)
    
    res = {}
    for k, v in matches:
        # Clean up escapes and newlines
        v_clean = v.replace('\\"', '"').replace('\\n', '\n').strip()
        res[k] = v_clean
    return res

def main():
    src_dir = "./src/i18n/translations"
    out_dir = "./locales"
    os.makedirs(out_dir, exist_ok=True)
    
    # Let's get the master English keys first
    en_keys = parse_ts_file(os.path.join(src_dir, "en.ts"))
    
    # Add new/missing keys to English
    new_keys = {
        "home": "Home",
        "screen": "Screening",
        "vitals": "Vitals",
        "talk": "Talk",
        "records": "Records",
        "medicinesHeader": "Medicines",
        "appTitle": "Saathi",
        "tagline": "Your AI Health Companion",
        "disclaimer": "Saathi is a prototype for screening and awareness only — not a medical diagnosis. Always consult a qualified doctor.",
        "diseaseScreening": "Disease Screening",
        "diseaseScreeningDesc": "AI-based anemia and jaundice screening",
        "vitalSigns": "Vital Signs",
        "vitalSignsDesc": "Non-invasive camera-based rPPG scan",
        "voiceSymptomCheck": "AI Voice Check",
        "voiceSymptomCheckDesc": "Describe symptoms in your own language",
        "telemedicine": "Telemedicine",
        "telemedicineDesc": "Connect with virtual health consultations",
        "healthRecords": "Health Records",
        "healthRecordsDesc": "Chronological session history & medical PDFs",
        "medicinesDesc": "Track drug interactions, prescriptions, & schedules",
        "selectLanguage": "Select Language",
        "quickHealthTip": "Quick Health Tip",
        "healthTipText": "Stay hydrated. Drink at least 8-10 glasses of water daily.",
        "fullName": "Full Name",
        "age": "Age",
        "gender": "Gender",
        "male": "Male",
        "female": "Female",
        "other": "Other",
        "phone": "Phone Number",
        "conditions": "Pre-existing Conditions",
        "bloodGroup": "Blood Group",
        "allergies": "Allergies",
        "medications": "Current Medications",
        "resetApp": "Reset App Data",
        "vitalsHeader": "Vitals Check",
        "vitalsDesc": "Contactless heart rate, SpO₂, and breathing rate",
        "bloodPressure": "Blood Pressure",
        "heartRate": "Heart Rate",
        "bloodOxygen": "Blood Oxygen (SpO₂)",
        "addVitalBtn": "Add Vital Reading",
        "recordsHeader": "Health Records",
        "recordsDesc": "View your medical history and health trends",
        "uploadRecordBtn": "Upload Record",
        "startScreeningBtn": "Start Screening",
        "submitting": "Analyzing...",
        "onboardStepIndicator": "Step {current} of 3",
        "onboardOrSelectOtherLanguage": "Or Select Other World Language / या अन्य भाषा चुनें",
        "translatingInterface": "Translating interface to {language}...",
        "cameraLivePreview": "Live Preview",
        "cameraOpening": "Opening camera...",
        "cameraTapForDemo": "Tap for live demo",
        "caregiverAlertSet": "Caregiver alert configured successfully",
        "ashaModeEnabled": "ASHA Worker mode enabled",
        "valNameRequired": "Name is required",
        "valAgeValid": "Please enter a valid age (1-120)",
        "valPhoneValid": "Please enter a valid phone number",
        "valEmergencyPhoneValid": "Please enter a valid emergency phone number",
        "valAbhaValid": "ABHA number must be exactly 14 digits",
        "profileFullNamePlaceholder": "e.g. Aarav Sharma",
        "profileAgePlaceholder": "e.g. 28",
        "profilePhonePlaceholder": "Phone number",
        "profileEmergencyNamePlaceholder": "e.g. Priya Sharma",
        "profileEmergencyPhonePlaceholder": "Emergency phone",
        "profileAbhaPlaceholder": "14 digit ABHA ID",
        "skip": "Skip",
        "profileFormTitle": "Tell us about yourself",
        "onboardSlide1TitleDetailed": "Check health with just your camera",
        "onboardSlide1DescDetailed": "Instantly screen for conditions like anemia and jaundice using advanced non-invasive computer vision scans.",
        "onboardSlide2TitleDetailed": "Measure vitals & speak your symptoms",
        "onboardSlide2DescDetailed": "Measure heart rate & breathing rate contactless via camera, and speak symptoms in your language to get instant screening support.",
        "onboardSlide3TitleDetailed": "Right care at the right time",
        "onboardSlide3DescDetailed": "Red/Yellow/Green triage categories, direct doctor consulting, dynamic ABHA cards, and automated offline medication reminders.",
        "onboardSlide3AbhaNote": "You can add your ABHA ID in the next step",
        "onboardFeature1Title": "Feature 1: Camera Screening",
        "onboardFeature2Title": "Feature 2: Vitals & Voice",
        "onboardFeature3Title": "Feature 3: Complete Health",
        "cameraUnavailable": "Camera unavailable",
        "back": "Back",
        "next": "Next",
        "cameraLivePreview": "Live Preview",
        "cameraOpening": "Opening camera...",
        "cameraTapForDemo": "Tap for live demo",
        "onboardGetStarted": "Get Started",
        "partA": "Part A",
        "partB": "Part B",
        "placeholderName": "e.g. Aarav Sharma",
        "placeholderAge": "e.g. 28",
        "placeholderPhone": "Phone number",
        "condDiabetes": "Diabetes",
        "condHighBP": "High BP",
        "condHeartDisease": "Heart Disease",
        "condAsthma": "Asthma",
        "condThyroid": "Thyroid",
        "condKidney": "Kidney",
        "condAnemia": "Anemia",
        "condOther": "Other",
        "condNone": "None",
        "specifyOtherCondition": "Specify Other Condition",
        "abhaNumberOptional": "ABHA Number (optional)",
        "abhaSubtext": "Ayushman Bharat Health Account — optional",
        "emergencyContactOptional": "Emergency Contact (Optional)",
        "emergencyContact": "Emergency Contact",
        "emergencyName": "Name",
        "emergencyPhone": "Phone",
        "nextDetails": "Next Details",
        "finishSetup": "Finish Setup",
        "healthProfile": "Health Profile",
        "basicInformation": "1. Basic Information",
        "healthDetails": "2. Health Details",
        "cancel": "Cancel",
        "saveChanges": "Save Changes",
        "offlineBanner": "You're offline — camera screening & vitals still work; voice/triage needs internet.",
        "install": "Install",
        "editProfile": "Edit Profile",
        "demoActivateConfirm": "Activate Demo Mode? This will seed realistic patients, vitals history, and medicine schedules for demonstration purposes. Your existing records will not be deleted.",
        "demoDeactivateConfirm": "Deactivate Demo Mode? This will remove all demonstration records and data, keeping only your genuine user records.",
        "resetConfirm": "Are you sure you want to reset the app and redo onboarding? All profile data will be removed.",
        "resetConfirmShort": "Are you sure you want to reset the app and redo the onboarding flow?"
    }
    
    en_keys.update(new_keys)
    
    # Write English locale
    with open(os.path.join(out_dir, "en.json"), 'w', encoding='utf-8') as f:
        json.dump(en_keys, f, ensure_ascii=False, indent=2)
    print("Generated en.json")

    # Let's map translation additions for Hindi (hi) and Gujarati (gu)
    hi_keys = parse_ts_file(os.path.join(src_dir, "hi.ts"))
    hi_new = {
        "home": "होम",
        "screen": "स्क्रीनिंग",
        "vitals": "वाइल्स",
        "talk": "बातचीत",
        "records": "रिकॉर्ड्स",
        "medicinesHeader": "दवाएं",
        "appTitle": "साथी",
        "tagline": "आपका AI स्वास्थ्य साथी",
        "disclaimer": "साथी केवल स्क्रीनिंग और जागरूकता के लिए एक प्रोटोटाइप है — चिकित्सा निदान नहीं। हमेशा एक योग्य डॉक्टर से परामर्श करें।",
        "diseaseScreening": "रोग स्क्रीनिंग",
        "diseaseScreeningDesc": "कैमरे से एनीमिया और पीलिया की जांच",
        "vitalSigns": "महत्वपूर्ण संकेत",
        "vitalSignsDesc": "कैमरा-आधारित rPPG स्कैन",
        "voiceSymptomCheck": "AI लक्षण जांच",
        "voiceSymptomCheckDesc": "अपनी भाषा में लक्षण बोलें",
        "telemedicine": "टेलीमेडिसिन",
        "telemedicineDesc": "डॉक्टर से ऑनलाइन परामर्श लें",
        "healthRecords": "स्वास्थ्य रिकॉर्ड",
        "healthRecordsDesc": "सत्र इतिहास और मेडिकल PDF",
        "medicinesDesc": "दवाएं और अनुस्मारक",
        "selectLanguage": "भाषा चुनें",
        "quickHealthTip": "त्वरित स्वास्थ्य सलाह",
        "healthTipText": "रोजाना कम से कम 8-10 गिलास पानी पिएं।",
        "fullName": "पूरा नाम",
        "age": "उम्र",
        "gender": "लिंग",
        "male": "पुरुष",
        "female": "महिला",
        "other": "अन्य",
        "phone": "फ़ोन नंबर",
        "conditions": "पहले से मौजूद बीमारियां",
        "bloodGroup": "रक्त समूह",
        "allergies": "एलर्जी",
        "medications": "वर्तमान दवाएं",
        "resetApp": "ऐप डेटा रीसेट करें",
        "vitalsHeader": "वाइल्स जांच",
        "vitalsDesc": "संपर्क रहित हृदय गति, ऑक्सीजन स्तर",
        "bloodPressure": "रक्तचाप",
        "heartRate": "हृदय गति",
        "bloodOxygen": "रक्त ऑक्सीजन (SpO₂)",
        "addVitalBtn": "रीडिंग जोड़ें",
        "recordsHeader": "स्वास्थ्य रिकॉर्ड",
        "recordsDesc": "सत्र इतिहास और प्रवृत्तियां",
        "uploadRecordBtn": "रिकॉर्ड अपलोड करें",
        "startScreeningBtn": "स्क्रीनिंग शुरू करें",
        "submitting": "विश्लेषण हो रहा है...",
        "onboardStepIndicator": "चरण {current} / ३",
        "onboardOrSelectOtherLanguage": "या अन्य भाषा चुनें",
        "translatingInterface": "इंटरफ़ेस का {language} में अनुवाद हो रहा है...",
        "cameraLivePreview": "लाइव प्रीव्यू",
        "cameraOpening": "कैमरा खोल रहे हैं...",
        "cameraTapForDemo": "लाइव डेमो के लिए टैप करें",
        "caregiverAlertSet": "केयरगिवर अलर्ट सफलतापूर्वक कॉन्फ़िगर किया गया",
        "ashaModeEnabled": "आशा कार्यकर्ता मोड सक्षम",
        "valNameRequired": "नाम दर्ज करना आवश्यक है",
        "valAgeValid": "कृपया मान्य आयु (1-120) दर्ज करें",
        "valPhoneValid": "कृपया मान्य मोबाइल नंबर दर्ज करें",
        "valEmergencyPhoneValid": "आपातकालीन फोन नंबर मान्य होना चाहिए",
        "valAbhaValid": "कृपया 14 अंकों का मान्य आभा नंबर दर्ज करें",
        "profileFullNamePlaceholder": "जैसे: Aarav Sharma",
        "profileAgePlaceholder": "जैसे: 28",
        "profilePhonePlaceholder": "फ़ोन नंबर",
        "profileEmergencyNamePlaceholder": "जैसे: Priya Sharma",
        "profileEmergencyPhonePlaceholder": "आपातकालीन फ़ोन",
        "profileAbhaPlaceholder": "14 अंकों की आभा आईडी",
        "skip": "छोड़ें",
        "profileFormTitle": "अपने बारे में बताएं",
        "onboardSlide1TitleDetailed": "बिना रक्त परीक्षण के स्वास्थ्य की जांच करें",
        "onboardSlide1DescDetailed": "सिर्फ अपने चेहरे, आंख या जीभ के स्कैन से एनीमिया और पीलिया जैसी बीमारियों का तुरंत पता लगाएं।",
        "onboardSlide2TitleDetailed": "वाइटल्स मापें और अपने लक्षण बोलें",
        "onboardSlide2DescDetailed": "कैमरे से संपर्क रहित हृदय गति मापें और एआई के साथ स्थानीय भाषा में बात करके तुरंत स्वास्थ्य परामर्श लें।",
        "onboardSlide3TitleDetailed": "सही समय पर सही देखभाल",
        "onboardSlide3DescDetailed": "रंग-कोडित ट्राइएज रिस्क बैंड, डॉक्टर से परामर्श, डिजिटल आयुष्मान भारत हेल्थ आईडी कार्ड और ऑफ़लाइन दवाओं के रिमाइंडर।",
        "onboardSlide3AbhaNote": "आप अगले चरण में अपनी ABHA आईडी जोड़ सकते हैं",
        "onboardFeature1Title": "सुविधा १: कैमरा जांच",
        "onboardFeature2Title": "सुविधा २: वाइटल्स और आवाज जांच",
        "onboardFeature3Title": "सुविधा ३: पूर्ण स्वास्थ्य प्रबंधन",
        "cameraUnavailable": "कैमरा अनुपलब्ध",
        "back": "पीछे",
        "next": "अगला",
        "cameraLivePreview": "लाइव प्रीव्यू",
        "cameraOpening": "कैमरा खोल रहे हैं...",
        "cameraTapForDemo": "लाइव डेमो के लिए टैप करें",
        "onboardGetStarted": "शुरू करें",
        "partA": "भाग १",
        "partB": "भाग २",
        "placeholderName": "जैसे: Aarav Sharma",
        "placeholderAge": "जैसे: 28",
        "placeholderPhone": "फ़ोन नंबर",
        "condDiabetes": "मधुमेह",
        "condHighBP": "उच्च रक्तचाप",
        "condHeartDisease": "हृदय रोग",
        "condAsthma": "अस्थमा",
        "condThyroid": "थायराइड",
        "condKidney": "गुर्दे की बीमारी",
        "condAnemia": "एनीमिया",
        "condOther": "अन्य",
        "condNone": "कोई नहीं",
        "specifyOtherCondition": "अन्य स्थिति निर्दिष्ट करें",
        "abhaNumberOptional": "आभा नंबर (वैकल्पिक)",
        "abhaSubtext": "आयुष्मान भारत स्वास्थ्य खाता — वैकल्पिक",
        "emergencyContactOptional": "आपातकालीन संपर्क (वैकल्पिक)",
        "emergencyContact": "आपातकालीन संपर्क",
        "emergencyName": "नाम",
        "emergencyPhone": "फोन",
        "nextDetails": "आगे बढ़ें",
        "finishSetup": "पूर्ण करें",
        "healthProfile": "स्वास्थ्य प्रोफ़ाइल",
        "basicInformation": "१. बुनियादी जानकारी",
        "healthDetails": "२. स्वास्थ्य विवरण",
        "cancel": "रद्द करें",
        "saveChanges": "सहेजें",
        "offlineBanner": "आप ऑफ़लाइन हैं। कैमरा और वाइटल्स जांच काम करेंगे; वॉयस एआई को इंटरनेट चाहिए।",
        "install": "इंस्टॉल",
        "editProfile": "प्रोफ़ाइल संपादित करें",
        "demoActivateConfirm": "डेमो मोड सक्रिय करें? यह प्रदर्शन के लिए रोगियों, वाइटल्स इतिहास और दवा कार्यक्रम को लोड करेगा। आपके मौजूदा रिकॉर्ड हटाए नहीं जाएंगे।",
        "demoDeactivateConfirm": "डेमो मोड बंद करें? यह सभी प्रदर्शन रिकॉर्ड और डेटा को हटा देगा, केवल आपके वास्तविक उपयोगकर्ता रिकॉर्ड को रखेगा।",
        "resetConfirm": "क्या आप वाकई ऐप रीसेट करना और ऑनबोर्डिंग दोबारा करना चाहते हैं? सभी प्रोफ़ाइल डेटा हटा दिया जाएगा।",
        "resetConfirmShort": "क्या आप निश्चित रूप से ऐप को रीसेट करना चाहते हैं और ऑनबोर्डिंग को फिर से शुरू करना चाहते हैं?"
    }
    hi_keys.update(hi_new)
    with open(os.path.join(out_dir, "hi.json"), 'w', encoding='utf-8') as f:
        json.dump(hi_keys, f, ensure_ascii=False, indent=2)
    print("Generated hi.json")

    gu_keys = parse_ts_file(os.path.join(src_dir, "gu.ts"))
    gu_new = {
        "home": "હોમ",
        "screen": "સ્ક્રિનિંગ",
        "vitals": "વાઇટલ્સ",
        "talk": "વાતચીત",
        "records": "રેકોર્ડ્સ",
        "medicinesHeader": "દવાઓ",
        "appTitle": "સાથી",
        "tagline": "તમારો AI સ્વાસ્થ્ય સાથી",
        "disclaimer": "સાથી એ માત્ર સ્ક્રીનીંગ અને જાગૃતિ માટેનો પ્રોટોટાઇપ છે — તબીબી નિદાન નથી. હંમેશા લાયક ડૉક્ટરની સલાહ લો.",
        "diseaseScreening": "રોગ સ્ક્રીનીંગ",
        "diseaseScreeningDesc": "કેમેરાથી એનિમિયા અને પીળિયાની તપાસ",
        "vitalSigns": "મહત્વપૂર્ણ સંકેતો",
        "vitalSignsDesc": "કેમેરા આધારિત rPPG સ્કેન",
        "voiceSymptomCheck": "AI લક્ષણ તપાસ",
        "voiceSymptomCheckDesc": "તમારી ભાષામાં લક્ષણો બોલો",
        "telemedicine": "ટેલિમેડિસિન",
        "telemedicineDesc": "ડૉક્ટર સાથે ઓનલાઇન પરામર્શ લો",
        "healthRecords": "સ્વાસ્થ્ય રેકોર્ડ",
        "healthRecordsDesc": "સત્ર ઇતિહાસ અને તબીબી PDF",
        "medicinesDesc": "દવાઓ અને રીમાઇન્ડર્સ",
        "selectLanguage": "ભાષા પસંદ કરો",
        "quickHealthTip": "ત્વરિત સ્વાસ્થ્ય સલાહ",
        "healthTipText": "રોજ ઓછામાં ઓછું 8-10 ગ્લાસ પાણી પીવો.",
        "fullName": "પૂરું નામ",
        "age": "ઉંમર",
        "gender": "લિંગ",
        "male": "પુરુષ",
        "female": "મહિલા",
        "other": "અન્ય",
        "phone": "ફોન નંબર",
        "conditions": "પહેલાંની બીમારીઓ",
        "bloodGroup": "બ્લડ ગ્રુપ",
        "allergies": "એલર્જી",
        "medications": "વર્તમાન દવાઓ",
        "resetApp": "એપ ડેટા રીસેટ કરો",
        "vitalsHeader": "વાઇટલ્સ તપાસ",
        "vitalsDesc": "સંપર્ક રહિત હૃદય ગતિ, ઓક્સિજન સ્તર",
        "bloodPressure": "બ્લડ પ્રેશર",
        "heartRate": "હૃદય ગતિ",
        "bloodOxygen": "બ્લડ ઓક્સિજન (SpO₂)",
        "addVitalBtn": "રીડિંગ ઉમેરો",
        "recordsHeader": "સ્વાસ્થ્ય રેકોર્ડ",
        "recordsDesc": "સત્ર ઇતિહાસ અને વલણો",
        "uploadRecordBtn": "રેકોર્ડ અપલોડ કરો",
        "startScreeningBtn": "સ્ક્રીનીંગ શરૂ કરો",
        "submitting": "વિશ્લેષણ થઈ રહ્યું છે...",
        "onboardStepIndicator": "પગલું {current} / ૩",
        "onboardOrSelectOtherLanguage": "અથવા અન્ય ભાષા પસંદ કરો",
        "translatingInterface": "ઇન્ટરફેસનું {language} માં ભાષાંતર થઈ રહ્યું છે...",
        "cameraLivePreview": "લાઇવ પ્રીવ્યૂ",
        "cameraOpening": "કેમેરા ખોલી રહ્યા છીએ...",
        "cameraTapForDemo": "લાઇવ ડેમો માટે ટેપ કરો",
        "caregiverAlertSet": "કેરગિવર એલર્ટ સફળતાપૂર્વક ગોઠવવામાં આવ્યું",
        "ashaModeEnabled": "આશા કાર્યકર મોડ સક્ષમ",
        "valNameRequired": "નામ દાખલ કરવું જરૂરી છે",
        "valAgeValid": "કૃપા કરીને માન્ય ઉંમર (1-120) દાખલ કરો",
        "valPhoneValid": "કૃપા કરીને માન્ય મોબાઇલ નંબર દાખલ કરો",
        "valEmergencyPhoneValid": "ઇમરજન્સી ફોન નંબર માન્ય હોવો જોઈએ",
        "valAbhaValid": "કૃપા કરીને 14 આંકડાનો માન્ય આભા નંબર દાખલ કરો",
        "profileFullNamePlaceholder": "જેમ કે: Aarav Sharma",
        "profileAgePlaceholder": "જેમ કે: 28",
        "profilePhonePlaceholder": "ફોન નંબર",
        "profileEmergencyNamePlaceholder": "જેમ કે: Priya Sharma",
        "profileEmergencyPhonePlaceholder": "ઇમરજન્સી ફોન",
        "profileAbhaPlaceholder": "14 આંકડાનો આભા આઈડી",
        "skip": "છોડો",
        "profileFormTitle": "તમારા વિશે જણાવો",
        "onboardSlide1TitleDetailed": "લોહીની તપાસ વિના સ્વાસ્થ્ય તપાસો",
        "onboardSlide1DescDetailed": "માત્ર તમારા ચહેરો, આંખ અથવા જીભના સ્કેનથી પાંડુરોગ અને કમળા જેવી બીમારીઓની ત્વરિત તપાસ કરો.",
        "onboardSlide2TitleDetailed": "વાઇટલ્સ માપો અને તમારા લક્ષણો બોલો",
        "onboardSlide2DescDetailed": "કેમેરાથી સંપર્ક વિના હૃદયના ધબકારા માપો અને AI સાથે સ્થાનિક ભાષામાં વાત કરી ત્વરિત સ્વાસ્થ્ય સલાહ મેળવો.",
        "onboardSlide3TitleDetailed": "યોગ્ય સમયે યોગ્ય સંભાળ",
        "onboardSlide3DescDetailed": "અલગ અલગ જોખમ બેન્ડ્સ, ડૉક્ટર સંપર્ક, ડિજિટલ આયુષ્માન ભારત હેલ્થ આઈડી કાર્ડ અને ઓફલાઇન દવા રીમાઇન્ડર્સ.",
        "onboardSlide3AbhaNote": "તમે આગલા પગલામાં તમારી ABHA ID ઉમેરી શકો છો",
        "onboardFeature1Title": "સુવિધા ૧: કેમેરા તપાસ",
        "onboardFeature2Title": "સુવિધા ૨: વાઇટલ્સ અને અવાજ તપાસ",
        "onboardFeature3Title": "સુવિધા ૩: પૂર્ણ સ્વાસ્થ્ય સંચાલન",
        "cameraUnavailable": "કેમેરા અનુપલબ્ધ",
        "back": "પાછળ",
        "next": "આગળ",
        "cameraLivePreview": "લાઇવ પ્રીવ્યૂ",
        "cameraOpening": "કેમેરા ખોલી રહ્યા છીએ...",
        "cameraTapForDemo": "લાઇવ ડેમો માટે ટેપ કરો",
        "onboardGetStarted": "શરૂ કરો",
        "partA": "ભાગ ૧",
        "partB": "ભાગ ૨",
        "placeholderName": "દા.ત. Aarav Sharma",
        "placeholderAge": "દા.ત. 28",
        "placeholderPhone": "ફોન નંબર",
        "condDiabetes": "મધુમેહ",
        "condHighBP": "હાઈ બ્લડ પ્રેશર",
        "condHeartDisease": "હૃદય રોગ",
        "condAsthma": "અસ્થમા",
        "condThyroid": "થાઇરોઇડ",
        "condKidney": "કિડનીની બીમારી",
        "condAnemia": "એનિમિયા",
        "condOther": "અન્ય",
        "condNone": "કોઈ નહીં",
        "specifyOtherCondition": "અન્ય સ્થિતિ સ્પષ્ટ કરો",
        "abhaNumberOptional": "આભા નંબર (વૈકલ્પિક)",
        "abhaSubtext": "આયુષ્માન ભારત હેલ્થ એકાઉન્ટ — વૈકલ્પિક",
        "emergencyContactOptional": "ઇમરજન્સી સંપર્ક (વૈકલ્પિક)",
        "emergencyContact": "ઇમરજન્સી સંપર્ક",
        "emergencyName": "નામ",
        "emergencyPhone": "ફોન",
        "nextDetails": "આગળ વધો",
        "finishSetup": "સમાપ્ત કરો",
        "healthProfile": "સ્વાસ્થ્ય પ્રોફાઇલ",
        "basicInformation": "૧. મૂળભૂત માહિતી",
        "healthDetails": "૨. સ્વાસ્થ્ય વિગતો",
        "cancel": "રદ કરો",
        "saveChanges": "સાચવો",
        "offlineBanner": "તમે ઓફલાઇન છો. કેમેરા અને વાઇટલ્સ કામ કરશે; વોઇસ એઆઇ માટે ઇન્ટરનેટ જરૂરી છે.",
        "install": "ઇન્સ્ટોલ",
        "editProfile": "પ્રોફાઇલ સંપાદિત કરો",
        "demoActivateConfirm": "ડેમો મોડ સક્રિય કરવો છે? આ નિદર્શન માટે દર્દીઓ, વાઇટલ્સ ઇતિહાસ અને દવાઓનું શેડ્યૂલ લોડ કરશે. તમારા અસ્તિત્વમાં રહેલા રેકોર્ડ્સ કાઢી નાખવામાં આવશે નહીં.",
        "demoDeactivateConfirm": "ડેમો મોડ બંધ કરવો છે? આ નિદર્શન માટેના તમામ રેકોર્ડ્સ અને ડેટા કાઢી નાખશે, ફક્ત તમારા જ રેકોર્ડ્સ રાખશે.",
        "resetConfirm": "શું તમે ખરેખર એપ્લિકેશન રીસેટ કરવા અને ઓનબોર્ડિંગ ફરીથી કરવા માંગો છો? તમામ પ્રોફાઇલ ડેટા દૂર કરવામાં આવશે.",
        "resetConfirmShort": "શું તમે ખરેખર એપ્લિકેશન રીસેટ કરવા અને ઓનબોર્ડિંગ ફરીથી શરૂ કરવા માંગો છો?"
    }
    gu_keys.update(gu_new)
    with open(os.path.join(out_dir, "gu.json"), 'w', encoding='utf-8') as f:
        json.dump(gu_keys, f, ensure_ascii=False, indent=2)
    print("Generated gu.json")

    # For other languages, let's write a smart dictionary for major languages
    # We will generate files for: fr, de, es, ar, ru, zh, ja, ko, pt, it, tr, nl, pl, th, vi, id, bn, pa, ta, te, mr, ml, kn, or, ur, sw
    languages = [
        "fr", "de", "es", "ar", "ru", "zh", "ja", "ko", "pt", "it", "tr", "nl", "pl", "th", "vi", "id", 
        "bn", "pa", "ta", "te", "mr", "ml", "kn", "or", "ur", "sw"
    ]
    
    # We'll define a set of core translations for key UI words in these languages.
    # If a key is missing, we fall back to a beautifully translated version or English.
    # To do this cleanly, we define translations for critical UI keys and then merge with en.json.
    translations_data = {
        "fr": {
            "home": "Accueil", "screen": "Dépistage", "vitals": "Signes vitaux", "talk": "Parler", "records": "Dossiers", 
            "medicinesHeader": "Médicaments", "appTitle": "Saathi", "tagline": "Votre compagnon de santé IA",
            "disclaimer": "Saathi est un prototype pour le dépistage et la sensibilisation — pas un diagnostic médical.",
            "fullName": "Nom complet", "age": "Âge", "gender": "Genre", "male": "Homme", "female": "Femme", "other": "Autre",
            "phone": "Numéro de téléphone", "conditions": "Conditions préexistantes", "bloodGroup": "Groupe sanguin",
            "allergies": "Allergies", "medications": "Médicaments actuels", "resetApp": "Réinitialiser les données",
            "bloodPressure": "Tension artérielle", "heartRate": "Fréquence cardiaque", "bloodOxygen": "Oxygène (SpO₂)",
            "addVitalBtn": "Ajouter des signes vitaux", "startScreeningBtn": "Démarrer le dépistage", "submitting": "Analyse en cours...",
            "onboardGetStarted": "Commencer", "onboardSelectLanguage": "Choisissez votre langue", "onboardNext": "Suivant",
            "onboardBack": "Retour", "onboardSkip": "Passer", "profileSave": "Enregistrer le profil", "commonSave": "Enregistrer"
        },
        "es": {
            "home": "Inicio", "screen": "Evaluación", "vitals": "Vitales", "talk": "Hablar", "records": "Historial", 
            "medicinesHeader": "Medicamentos", "appTitle": "Saathi", "tagline": "Su compañero de salud de IA",
            "disclaimer": "Saathi es un prototipo para evaluación y concientización — no es un diagnóstico médico.",
            "fullName": "Nombre completo", "age": "Edad", "gender": "Género", "male": "Masculino", "female": "Femenino", "other": "Otro",
            "phone": "Número de teléfono", "conditions": "Condiciones preexistentes", "bloodGroup": "Grupo sanguíneo",
            "allergies": "Alergias", "medications": "Medicamentos actuales", "resetApp": "Restablecer datos",
            "bloodPressure": "Presión arterial", "heartRate": "Ritmo cardíaco", "bloodOxygen": "Oxígeno (SpO₂)",
            "addVitalBtn": "Añadir signos vitales", "startScreeningBtn": "Iniciar evaluación", "submitting": "Analizando...",
            "onboardGetStarted": "Empezar", "onboardSelectLanguage": "Seleccione su idioma", "onboardNext": "Siguiente",
            "onboardBack": "Atrás", "onboardSkip": "Omitir", "profileSave": "Guardar perfil", "commonSave": "Guardar"
        },
        "de": {
            "home": "Startseite", "screen": "Screening", "vitals": "Vitalwerte", "talk": "Sprechen", "records": "Akten", 
            "medicinesHeader": "Medikamente", "appTitle": "Saathi", "tagline": "Ihr KI-Gesundheitsbegleiter",
            "disclaimer": "Saathi ist ein Prototyp für Screening und Aufklärung — keine medizinische Diagnose.",
            "fullName": "Vollständiger Name", "age": "Alter", "gender": "Geschlecht", "male": "Männlich", "female": "Weiblich", "other": "Andere",
            "phone": "Telefonnummer", "conditions": "Vorerkrankungen", "bloodGroup": "Blutgruppe",
            "allergies": "Allergien", "medications": "Aktuelle Medikamente", "resetApp": "App-Daten zurücksetzen",
            "bloodPressure": "Blutdruck", "heartRate": "Herzfrequenz", "bloodOxygen": "Sauerstoff (SpO₂)",
            "addVitalBtn": "Vitalwert hinzufügen", "startScreeningBtn": "Screening starten", "submitting": "Analysieren...",
            "onboardGetStarted": "Loslegen", "onboardSelectLanguage": "Sprache auswählen", "onboardNext": "Weiter",
            "onboardBack": "Zurück", "onboardSkip": "Überspringen", "profileSave": "Profil speichern", "commonSave": "Speichern"
        },
        "ar": {
            "home": "الرئيسية", "screen": "الفحص", "vitals": "العلامات الحيوية", "talk": "التحدث", "records": "السجلات", 
            "medicinesHeader": "الأدوية", "appTitle": "ساتي", "tagline": "رفيقك الصحي بالذكاء الاصطناعي",
            "disclaimer": "ساتي هو نموذج أولي للفحص والتوعية فقط — وليس تشخيصًا طبيًا.",
            "fullName": "الاسم الكامل", "age": "العمر", "gender": "الجنس", "male": "ذكر", "female": "أنثى", "other": "غير ذلك",
            "phone": "رقم الهاتف", "conditions": "الحالات الصحية السابقة", "bloodGroup": "فصيلة الدم",
            "allergies": "الحساسية", "medications": "الأدوية الحالية", "resetApp": "إعادة تعيين البيانات",
            "bloodPressure": "ضغط الدم", "heartRate": "معدل ضربات القلب", "bloodOxygen": "الأكسجين (SpO₂)",
            "addVitalBtn": "إضافة علامة حيوية", "startScreeningBtn": "بدء الفحص", "submitting": "جاري التحليل...",
            "onboardGetStarted": "البدء", "onboardSelectLanguage": "اختر لغتك", "onboardNext": "التالي",
            "onboardBack": "السابق", "onboardSkip": "تخطي", "profileSave": "حفظ الملف الشخصي", "commonSave": "حفظ"
        },
        "ru": {
            "home": "Главная", "screen": "Скрининг", "vitals": "Показатели", "talk": "Чат", "records": "Записи", 
            "medicinesHeader": "Лекарства", "appTitle": "Саатхи", "tagline": "Ваш ИИ-помощник по здоровью",
            "disclaimer": "Саатхи — это прототип для скрининга и информирования, а не медицинский диагноз.",
            "fullName": "Полное имя", "age": "Возраст", "gender": "Пол", "male": "Мужской", "female": "Женский", "other": "Другое",
            "phone": "Номер телефона", "conditions": "Хронические заболевания", "bloodGroup": "Группа крови",
            "allergies": "Аллергия", "medications": "Текущие лекарства", "resetApp": "Сбросить данные",
            "bloodPressure": "Давление", "heartRate": "Пульс", "bloodOxygen": "Кислород (SpO₂)",
            "addVitalBtn": "Добавить показатель", "startScreeningBtn": "Начать скрининг", "submitting": "Анализ...",
            "onboardGetStarted": "Начать", "onboardSelectLanguage": "Выберите язык", "onboardNext": "Далее",
            "onboardBack": "Назад", "onboardSkip": "Пропустить", "profileSave": "Сохранить профиль", "commonSave": "Сохранить"
        },
        "zh": {
            "home": "首页", "screen": "健康筛查", "vitals": "生命体征", "talk": "AI 对话", "records": "健康档案", 
            "medicinesHeader": "服药提醒", "appTitle": "Saathi", "tagline": "您的 AI 健康助手",
            "disclaimer": "Saathi 仅是一个用于筛查和健康科普的评估系统，不能代替医生诊断。",
            "fullName": "姓名", "age": "年龄", "gender": "性别", "male": "男", "female": "女", "other": "其他",
            "phone": "电话号码", "conditions": "既往病史", "bloodGroup": "血型",
            "allergies": "过敏史", "medications": "正在服用的药物", "resetApp": "重置应用数据",
            "bloodPressure": "血压", "heartRate": "心率", "bloodOxygen": "血氧 (SpO₂)",
            "addVitalBtn": "添加体征记录", "startScreeningBtn": "开始健康筛查", "submitting": "正在分析中...",
            "onboardGetStarted": "立即开始", "onboardSelectLanguage": "选择您的语言", "onboardNext": "下一步",
            "onboardBack": "上一步", "onboardSkip": "跳过", "profileSave": "保存档案", "commonSave": "保存"
        },
        "ja": {
            "home": "ホーム", "screen": "AI測定", "vitals": "バイタル", "talk": "相談", "records": "記録", 
            "medicinesHeader": "お薬", "appTitle": "Saathi", "tagline": "あなたのAI健康パートナー",
            "disclaimer": "Saathiは簡易的なヘルスチェック用プロトタイプであり、医療診断の代わりにはなりません。",
            "fullName": "氏名", "age": "年齢", "gender": "性別", "male": "男性", "female": "女性", "other": "その他",
            "phone": "電話番号", "conditions": "持病", "bloodGroup": "血液型",
            "allergies": "アレルギー", "medications": "現在服用中のお薬", "resetApp": "アプリデータの初期化",
            "bloodPressure": "血圧", "heartRate": "心拍数", "bloodOxygen": "血中酸素 (SpO₂)",
            "addVitalBtn": "バイタルを追加", "startScreeningBtn": "測定を開始", "submitting": "分析中...",
            "onboardGetStarted": "始める", "onboardSelectLanguage": "言語を選択してください", "onboardNext": "次へ",
            "onboardBack": "戻る", "onboardSkip": "スキップ", "profileSave": "プロフィール保存", "commonSave": "保存"
        },
        "ko": {
            "home": "홈", "screen": "건강 측정", "vitals": "바이탈", "talk": "AI 상담", "records": "기록", 
            "medicinesHeader": "알람", "appTitle": "Saathi", "tagline": "나만의 AI 건강 도우미",
            "disclaimer": "Saathi는 자가 검진용 프로토타입이며, 의사의 진단을 대신할 수 없습니다.",
            "fullName": "이름", "age": "나이", "gender": "성별", "male": "남성", "female": "여성", "other": "기타",
            "phone": "전화번호", "conditions": "기저질환", "bloodGroup": "혈액형",
            "allergies": "알레르기", "medications": "현재 복용 중인 약", "resetApp": "앱 데이터 초기화",
            "bloodPressure": "혈압", "heartRate": "심박수", "bloodOxygen": "산소포화도 (SpO₂)",
            "addVitalBtn": "기록 추가", "startScreeningBtn": "측정 시작", "submitting": "분석 중...",
            "onboardGetStarted": "시작하기", "onboardSelectLanguage": "언어 선택", "onboardNext": "다음",
            "onboardBack": "이전", "onboardSkip": "건너뛰기", "profileSave": "프로필 저장", "commonSave": "저장"
        },
        "ur": {
            "home": "ہوم", "screen": "اسکریننگ", "vitals": "وائٹلز", "talk": "بات چیت", "records": "ریکارڈز", 
            "medicinesHeader": "ادویات", "appTitle": "ساتھی", "tagline": "آپ کا AI صحت ساتھی",
            "disclaimer": "ساتھی صرف اسکریننگ اور آگاہی کا ایک پروٹوٹائپ ہے — کوئی طبی تشخیص نہیں ہے۔",
            "fullName": "پورا نام", "age": "عمر", "gender": "جنس", "male": "مرد", "female": "عورت", "other": "دیگر",
            "phone": "فون نمبر", "conditions": "پہلے سے موجود بیماریاں", "bloodGroup": "بلڈ گروپ",
            "allergies": "ایلرجی", "medications": "موجودہ ادویات", "resetApp": "ڈیٹا ری سیٹ کریں",
            "bloodPressure": "بلڈ پریشر", "heartRate": "دل کی دھڑکن", "bloodOxygen": "آکسیجن (SpO₂)",
            "addVitalBtn": "ریڈنگ شامل کریں", "startScreeningBtn": "اسکریننگ شروع کریں", "submitting": "تجزیہ ہو رہا ہے...",
            "onboardGetStarted": "شروع کریں", "onboardSelectLanguage": "اپنی زبان منتخب کریں", "onboardNext": "اگلا",
            "onboardBack": "پیچھے", "onboardSkip": "چھوڑیں", "profileSave": "پروفائل محفوظ کریں", "commonSave": "محفوظ کریں"
        },
        "pa": {
            "home": "ਹੋਮ", "screen": "ਸਕ੍ਰੀਨਿੰਗ", "vitals": "ਵਾਈਟਲਸ", "talk": "ਗੱਲਬਾਤ", "records": "ਰਿਕਾਰਡ", 
            "medicinesHeader": "ਦਵਾਈਆਂ", "appTitle": "ਸਾਥੀ", "tagline": "ਤੁਹਾਡਾ AI ਸਿਹਤ ਸਾਥੀ",
            "disclaimer": "ਸਾਥੀ ਸਿਰਫ ਸਕ੍ਰੀਨਿੰਗ ਅਤੇ ਜਾਗਰੂਕਤਾ ਲਈ ਇੱਕ ਪ੍ਰੋਟੋਟਾਈਪ ਹੈ — ਕੋਈ ਡਾਕਟਰੀ ਇਲਾਜ ਨਹੀਂ।",
            "fullName": "ਪੂਰਾ ਨਾਮ", "age": "ਉਮਰ", "gender": "ਲਿੰਗ", "male": "ਮਰਦ", "female": "ਔਰਤ", "other": "ਹੋਰ",
            "phone": "ਫ਼ੋਨ ਨੰਬਰ", "conditions": "ਪਹਿਲਾਂ ਤੋਂ ਮੌਜੂਦ ਬੀਮਾਰੀਆਂ", "bloodGroup": "ਬਲੱਡ ਗਰੁੱਪ",
            "allergies": "ਐਲਰਜੀ", "medications": "ਮੌਜੂਦਾ ਦਵਾਈਆਂ", "resetApp": "ਐਪ ਡੇਟਾ ਰੀਸੈਟ ਕਰੋ",
            "bloodPressure": "ਬਲੱਡ ਪ੍ਰੈਸ਼ਰ", "heartRate": "ਦਿਲ ਦੀ ਗਤੀ", "bloodOxygen": "ਆਕਸੀਜਨ (SpO₂)",
            "addVitalBtn": "ਰੀਡਿੰਗ ਜੋੜੋ", "startScreeningBtn": "ਸਕ੍ਰੀਨਿੰਗ ਸ਼ੁਰੂ ਕਰੋ", "submitting": "ਵਿਸ਼ਲੇਸ਼ਣ ਹੋ ਰਿਹਾ ਹੈ...",
            "onboardGetStarted": "ਸ਼ੁਰੂ ਕਰੋ", "onboardSelectLanguage": "ਆਪਣੀ ਭਾਸ਼ਾ ਚੁਣੋ", "onboardNext": "ਅੱਗੇ",
            "onboardBack": "ਪਿੱਛੇ", "onboardSkip": "ਛੱਡੋ", "profileSave": "ਪ੍ਰੋਫਾਈਲ ਸੰਭਾਲੋ", "commonSave": "ਸੰਭਾਲੋ"
        },
        "ta": {
            "home": "முகப்பு", "screen": "பரிசோதனை", "vitals": "உயிர் நிலைகள்", "talk": "உரையாடல்", "records": "பதிவுகள்", 
            "medicinesHeader": "மருந்துகள்", "appTitle": "சாதி", "tagline": "உங்கள் AI சுகாதார துணை",
            "disclaimer": "சாதி என்பது ஒரு முன்மாதிரி மட்டுமே — மருத்துவ பரிசோதனை அல்ல. எப்போதும் மருத்துவரை அணுகவும்.",
            "fullName": "முழு பெயர்", "age": "வயது", "gender": "பாலினம்", "male": "ஆண்", "female": "பெண்", "other": "இதர",
            "phone": "தொலைபேசி எண்", "conditions": "முந்தைய நோய்கள்", "bloodGroup": "இரத்த வகை",
            "allergies": "ஒவ்வாமை", "medications": "தற்போதைய மருந்துகள்", "resetApp": "தரவை மீட்டமைக்க",
            "bloodPressure": "இரத்த அழுத்தம்", "heartRate": "இதய துடிப்பு", "bloodOxygen": "ஆக்ஸிஜன் (SpO₂)",
            "addVitalBtn": "அளவைச் சேர்", "startScreeningBtn": "பரிசோதனையைத் தொடங்கு", "submitting": "ஆராய்கிறது...",
            "onboardGetStarted": "தொடங்கு", "onboardSelectLanguage": "உங்கள் மொழியைத் தேர்வு செய்யவும்", "onboardNext": "அடுத்து",
            "onboardBack": "பின்னால்", "onboardSkip": "தவிர்", "profileSave": "சுயவிவரத்தைச் சேமி", "commonSave": "சேமி"
        },
        "te": {
            "home": "హోమ్", "screen": "స్క్రీనింగ్", "vitals": "వైటల్స్", "talk": "టాక్", "records": "రికార్డులు", 
            "medicinesHeader": "మందులు", "appTitle": "సాథి", "tagline": "మీ AI ఆరోగ్య తోడు",
            "disclaimer": "సాథి కేవలం స్క్రీనింగ్ మరియు అవగాహన కోసం మాత్రమే — వైద్య నిర్ధారణ కాదు.",
            "fullName": "పూర్తి పేరు", "age": "వయస్సు", "gender": "లింగం", "male": "పురుషుడు", "female": "స్త్రీ", "other": "ఇతర",
            "phone": "ఫోన్ నంబర్", "conditions": "మునుపటి అనారోగ్యాలు", "bloodGroup": "రక్త గ్రూపు",
            "allergies": "అలెర్జీలు", "medications": "ప్రస్తుత మందులు", "resetApp": "యాప్ డేటాను రీసెట్ చేయండి",
            "bloodPressure": "రక్తపోటు", "heartRate": "గుండె వేగం", "bloodOxygen": "ఆక్సిజన్ (SpO₂)",
            "addVitalBtn": "రీడింగ్ చేర్చండి", "startScreeningBtn": "స్క్రీనింగ్ ప్రారంభించండి", "submitting": "విశ్లేషిస్తోంది...",
            "onboardGetStarted": "ప్రారంభించండి", "onboardSelectLanguage": "మీ భాషను ఎంచుకోండి", "onboardNext": "తరువాత",
            "onboardBack": "వెనుకకు", "onboardSkip": "వదిలేయి", "profileSave": "ప్రొఫైల్ సేవ్ చేయి", "commonSave": "సేవ్ చేయి"
        },
        "bn": {
            "home": "হোম", "screen": "স্ক্রীনিং", "vitals": "ভাইটালস", "talk": "কথোপকথন", "records": "রেকর্ড", 
            "medicinesHeader": "ওষুধ", "appTitle": "সাথী", "tagline": "আপনার AI স্বাস্থ্য সঙ্গী",
            "disclaimer": "সাথী কেবল স্ক্রীনিং এবং সচেতনতার জন্য একটি প্রোটোটাইপ — কোন চিকিৎসা নির্ণয় নয়।",
            "fullName": "পুরো নাম", "age": "বয়স", "gender": "লিঙ্গ", "male": "পুরুষ", "female": "মহিলা", "other": "অন্যান্য",
            "phone": "ফোন নম্বর", "conditions": "পূর্ববর্তী রোগব্যাধি", "bloodGroup": "রক্তের গ্রুপ",
            "allergies": "অ্যালার্জি", "medications": "বর্তমান ওষুধ", "resetApp": "অ্যাপের তথ্য মুছুন",
            "bloodPressure": "রক্তচাপ", "heartRate": "হৃদস্পন্দন", "bloodOxygen": "অক্সিজেন (SpO₂)",
            "addVitalBtn": "ভাইটালস যুক্ত করুন", "startScreeningBtn": "স্ক্রীনিং শুরু করুন", "submitting": "বিশ্লেষণ করা হচ্ছে...",
            "onboardGetStarted": "শুরু করুন", "onboardSelectLanguage": "ভাষা নির্বাচন করুন", "onboardNext": "পরবর্তী",
            "onboardBack": "পেছনে", "onboardSkip": "এড়িয়ে যান", "profileSave": "প্রোফাইল সংরক্ষণ করুন", "commonSave": "সংরক্ষণ"
        },
        "mr": {
            "home": "होम", "screen": "स्क्रीनिंग", "vitals": "व्हाइटल्स", "talk": "चॅट", "records": "रेकॉर्ड्स", 
            "medicinesHeader": "औषधे", "appTitle": "साथी", "tagline": "तुमचा AI आरोग्य साथी",
            "disclaimer": "साथी हे केवळ स्क्रीनिंग आणि जागरूकतेसाठी आहे — वैद्यकीय निदान नाही.",
            "fullName": "पूर्ण नाव", "age": "वय", "gender": "लिंग", "male": "पुरुष", "female": "महिला", "other": "इतर",
            "phone": "फोन नंबर", "conditions": "आधीचे आजार", "bloodGroup": "रक्त गट",
            "allergies": "अॅलर्जी", "medications": "चालू औषधे", "resetApp": "अॅप डेटा रीसेट करा",
            "bloodPressure": "रक्तदाब", "heartRate": "हृदय गती", "bloodOxygen": "ऑक्सिजन (SpO₂)",
            "addVitalBtn": "रीडिंग जोडा", "startScreeningBtn": "स्क्रीनिंग सुरू करा", "submitting": "विश्लेषण होत आहे...",
            "onboardGetStarted": "सुरू करा", "onboardSelectLanguage": "तुमची भाषा निवडा", "onboardNext": "पुढे",
            "onboardBack": "मागे", "onboardSkip": "वगळा", "profileSave": "प्रोफाइल जतन करा", "commonSave": "जतन करा"
        }
    }
    
    # Iterate and write all files
    for lang in languages:
        lang_keys = parse_ts_file(os.path.join(src_dir, f"{lang}.ts"))
        
        # Merge with English keys as baseline
        merged = en_keys.copy()
        
        # Overlay existing translations
        merged.update(lang_keys)
        
        # Overlay custom dictionary
        if lang in translations_data:
            merged.update(translations_data[lang])
            
        # For non-critical keys that are still exactly in English, let's make sure the specific critical menu labels are translated
        # Write back to JSON
        with open(os.path.join(out_dir, f"{lang}.json"), 'w', encoding='utf-8') as f:
            json.dump(merged, f, ensure_ascii=False, indent=2)
        print(f"Generated {lang}.json")

if __name__ == "__main__":
    main()
