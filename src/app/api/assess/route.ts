import { NextResponse } from "next/server";
import { groq } from "@/lib/groq";
import { getLanguageName } from "@/utils/languageHelper";

export async function POST(req: Request) {
  try {
    const { symptoms, age, temperature, language, userProfile } = await req.json();

    const apiKey = process.env.GROQ_API_KEY;
    const isMock = !apiKey || apiKey === "your_key_here" || apiKey.trim() === "";

    const symptomsList = Object.entries(symptoms)
      .filter((entry) => entry[1])
      .map((entry) => entry[0])
      .join(", ");

    const langName = getLanguageName(language);

    let profileContext = "";
    if (userProfile && typeof userProfile === "object") {
      const { name, age: pAge, gender, conditions, allergies, medications, bloodGroup } = userProfile;
      const conditionStr = conditions && conditions.length > 0 ? conditions.join(", ") : "None";
      profileContext = `Patient Profile Information:
- Name: ${name || "Unknown"}
- Age: ${pAge || age || "Unknown"}
- Gender: ${gender || "Unknown"}
- Chronic Conditions: ${conditionStr}
- Allergies: ${allergies || "None"}
- Current Medications: ${medications || "None"}
- Blood Group: ${bloodGroup || "Unknown"}`;
    }

    // System instruction in English/Hindi/Gujarati depending on selection
    const systemPrompt = `You are Saathi, a friendly and professional AI health screening assistant. 
Provide a health screening assessment in ${langName}. 
The assessment should include:
1. Risk Level Assessment (Low, Medium, or High) based on symptoms.
2. Possible causes or screening information.
3. Helpful home care tips and preventive measures.
4. Actionable next steps (e.g. consult doctor, stay hydrated).

Keep the report concise, compassionate, and easy to read (max 180 words). 
CRITICAL: Include a mandatory disclaimer at the very end: "This is an automated AI screening and NOT a medical diagnosis. If symptoms persist or worsen, please consult a qualified healthcare provider immediately."

${profileContext ? `Factor the following patient profile context into your assessment and recommendations (e.g. mention if symptoms could exacerbate chronic conditions, check for drug allergy risks if suggesting any common home care tips, and address the patient by name if appropriate):\n${profileContext}` : ""}`;

    if (isMock) {
      // Simulate API call for demonstration when no key is configured
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      let mockAssessment = "";
      const pName = userProfile?.name ? userProfile.name.split(" ")[0] : "";
      
      if (language === "hi") {
        mockAssessment = `**जोखिम स्तर: मध्यम**
${pName ? `नमस्ते ${pName}, ` : ""}आपके द्वारा बताए गए लक्षणों (${symptomsList || "कोई नहीं"}) के आधार पर, यह एक सामान्य वायरल संक्रमण या फ्लू हो सकता है। 
${userProfile?.conditions?.length ? `आपके पूर्व-मौजूदा रोग (${userProfile.conditions.join(", ")}) को देखते हुए, विशेष सावधानी बरतें। ` : ""}
**घरेलू उपचार और सलाह:**
- पर्याप्त आराम करें और गुनगुना पानी पिएं।
- यदि बुखार है, तो डॉक्टर की सलाह पर पैरासिटामोल लें। ${userProfile?.allergies ? `कृपया ध्यान दें कि आपको निम्न से एलर्जी है: ${userProfile.allergies}।` : ""}
**अगले कदम:**
लक्षणों पर 24-48 घंटों तक नज़र रखें। यदि सांस लेने में कठिनाई हो या तेज बुखार हो, तो डॉक्टर से संपर्क करें।
*अस्वीकरण: यह एक स्वचालित एआई स्क्रीनिंग है, चिकित्सा निदान नहीं। कृपया डॉक्टर से परामर्श लें।*`;
      } else if (language === "gu") {
        mockAssessment = `**જોખમ સ્તર: મધ્યમ**
${pName ? `નમસ્તે ${pName}, ` : ""}તમારા લક્ષણો (${symptomsList || "કોઈ નહીં"}) ના આધારે, આ સામાન્ય વાયરલ તાવ અથવા ફ્લૂ હોઈ શકે છે.
${userProfile?.conditions?.length ? `તમારી પૂર્વ-અસ્તિત્વમાં રહેલી સ્થિતિઓ (${userProfile.conditions.join(", ")}) ને ધ્યાનમાં રાખીને, વિશેષ કાળજી લો. ` : ""}
**ઘરેલું ઉપચાર અને સલાહ:**
- પૂરતો આરામ કરો અને નવશેકું પાણી પીઓ.
- વરાળ લો અને હળવા ગરમ પાણીમાં મીઠું નાખીને કોગળા કરો. ${userProfile?.allergies ? `કૃપા કરીને નોંધો કે તમને એલર્જી છે: ${userProfile.allergies}.` : ""}
**આગળના પગલાં:**
લક્ષણો પર ૨૪-૪૮ કલાક નજર રાખો. જો શ્વાસ લેવામાં તકલીફ થાય અથવા તાવ વધે, તો તરત જ ડૉક્ટરનો સંપર્ક કરો.
*અસ્વીકરણ: આ એક સ્વયંસંચાલિત AI સ્ક્રીનીંગ છે, તબીબી નિદાન નથી. કૃપા કરીને ડૉક્ટરની સલાહ લો.*`;
      } else {
        mockAssessment = `**Risk Level: Medium**
${pName ? `Hello ${pName}, ` : ""}Based on your symptoms (${symptomsList || "none reported"}) and temperature (${temperature || "Normal"}°F), you may be experiencing a mild viral infection or cold/flu.
${userProfile?.conditions?.length ? `Given your pre-existing conditions (${userProfile.conditions.join(", ")}), extra monitoring is advised. ` : ""}
**Home Care Tips:**
- Get plenty of rest and stay well hydrated.
- Monitor your temperature and consult a doctor for fever medications. ${userProfile?.allergies ? `Note: Ensure safety against your known allergies (${userProfile.allergies}).` : ""}
- Gargle with warm salt water for throat relief.
**Next Steps:**
Monitor your symptoms over the next 24-48 hours. If you experience shortness of breath, high fever, or worsening chest pain, seek immediate medical attention.
*Disclaimer: This is an automated AI screening and NOT a medical diagnosis. Please consult a qualified doctor.*`;
      }

      return NextResponse.json({
        success: true,
        isMock: true,
        assessment: mockAssessment,
      });
    }

    // Call Groq API
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `The user is reporting the following details:
- Symptoms: ${symptomsList || "None reported"}
- Age: ${age || "Not specified"} years old
- Body Temperature: ${temperature || "Not specified"}°F`,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.5,
    });

    const assessment = completion.choices[0]?.message?.content?.trim();

    return NextResponse.json({
      success: true,
      isMock: false,
      assessment,
    });
  } catch (error) {
    console.error("Screening API error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({
      success: false,
      message: "Screening assessment failed.",
      error: errorMessage,
    }, { status: 500 });
  }
}
