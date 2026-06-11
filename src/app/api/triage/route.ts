import { NextResponse } from "next/server";
import { groq } from "@/lib/groq";

export async function POST(req: Request) {
  try {
    const { transcript, language } = await req.json();

    if (!transcript || !transcript.trim()) {
      return NextResponse.json({ success: false, error: "No transcript provided" }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    const isMock = !apiKey || apiKey === "your_key_here" || apiKey.trim() === "";

    const langName = language === "hi" ? "Hindi" : language === "gu" ? "Gujarati" : "English";

    if (isMock) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      // Mock result based on keywords
      const lower = transcript.toLowerCase();
      let triage: "GREEN" | "YELLOW" | "RED" = "GREEN";
      let reason = "";
      let advice = "";
      let concerns: string[] = [];

      const isEmergency = lower.includes("chest pain") || lower.includes("breath") || lower.includes("bleeding") || lower.includes("सीना") || lower.includes("सांस") || lower.includes("શ્વાસ") || lower.includes("છાતી") || lower.includes("difficulty") || lower.includes("shortness");
      const isYellow = lower.includes("fever") || lower.includes("cough") || lower.includes("pain") || lower.includes("बुखार") || lower.includes("खांसी") || lower.includes("તાવ") || lower.includes("ખાંસી");

      if (isEmergency) {
        triage = "RED";
        if (language === "hi") {
          reason = "सांस लेने में कठिनाई या छाती में दर्द जैसे लक्षण आपातकालीन चिकित्सा स्थिति का संकेत दे सकते हैं।";
          advice = "तुरंत नजदीकी आपातकालीन चिकित्सा कक्ष (Emergency Room) में जाएं या एम्बुलेंस को कॉल करें।";
          concerns = ["गंभीर श्वसन संकट", "हृदय संबंधी जटिलता"];
        } else if (language === "gu") {
          reason = "શ્વાસ લેવામાં તકલીફ અથવા છાતીમાં દુખાવો તાત્કાલિક તબીબી સારવારની જરૂરિયાત દર્શાવે છે.";
          advice = "કૃપા કરીને તાત્કાલિક નજીકની ઇમરજન્સી હોસ્પિટલમાં જાઓ અથવા એમ્બ્યુલન્સનો સંપર્ક કરો.";
          concerns = ["ગંભીર શ્વસન તકલીફ", "હૃદયની બિમારી"];
        } else {
          reason = "Symptoms such as breathing difficulty or chest pain indicate a potential medical emergency.";
          advice = "Go to the nearest emergency room immediately or call for an ambulance.";
          concerns = ["Acute Respiratory Distress", "Cardiac Event"];
        }
      } else if (isYellow) {
        triage = "YELLOW";
        if (language === "hi") {
          reason = "आपको बुखार और खांसी है जो लगातार बनी हुई है। इसका डॉक्टरों द्वारा मूल्यांकन किया जाना चाहिए।";
          advice = "कृपया अगले 24-48 घंटों के भीतर किसी योग्य चिकित्सक से परामर्श लें। आराम करें और तरल पदार्थ पीते रहें।";
          concerns = ["वायरल संक्रमण", "श्वसन नली में संक्रमण"];
        } else if (language === "gu") {
          reason = "તમને તાવ અને ઉધરસ છે જે ચિંતાજનક હોઈ શકે છે. ડૉક્ટર દ્વારા તપાસ કરાવવી જરૂરી છે.";
          advice = "કૃપા કરીને આગામી ૨૪ થી ૧૮ કલાકમાં લાયક ડૉક્ટરની સલાહ લો. આરામ કરો અને પુષ્કળ પ્રવાહી પીવો.";
          concerns = ["વાયરલ ઇન્ફેક્શન", "શ્વાસનળીમાં ઇન્ફેક્શન"];
        } else {
          reason = "Persistent fever and cough warrant a medical evaluation to rule out secondary infections.";
          advice = "Consult a primary care physician within 24-48 hours. Keep hydrated and take rest.";
          concerns = ["Viral Infection", "Upper Respiratory Infection"];
        }
      } else {
        triage = "GREEN";
        if (language === "hi") {
          reason = "आपके लक्षण हल्के दिख रहे हैं और तत्काल किसी खतरे के संकेत नहीं हैं।";
          advice = "घर पर आराम करें, पर्याप्त पानी पीएं और यदि लक्षण बिगड़ते हैं तो डॉक्टर से सलाह लें।";
          concerns = ["हल्का वायरल बुखार या थकान"];
        } else if (language === "gu") {
          reason = "તમારા લક્ષણો સામાન્ય લાગે છે અને કોઈ તાત્કાલિક જોખમ જણાતું નથી.";
          advice = "ઘરે આરામ કરો, પૂરતું પાણી પીવો અને જો લક્ષણો વધે તો ડૉક્ટરનો સંપર્ક કરો.";
          concerns = ["સામાન્ય થાક અથવા હળવો તાવ"];
        } else {
          reason = "Symptoms appear mild and non-urgent at this stage.";
          advice = "Rest at home, stay hydrated, and monitor your symptoms. Seek medical advice if they worsen.";
          concerns = ["Mild Fatigue or Common Cold"];
        }
      }

      return NextResponse.json({
        success: true,
        isMock: true,
        triageResult: {
          possible_concerns: concerns,
          triage,
          reason,
          advice,
          see_doctor: triage !== "GREEN"
        }
      });
    }

    // Call Groq API with LLama-3.3-70b-versatile
    const systemPrompt = `You are a cautious AI health-screening assistant (Saathi companion). Your job is to analyze the user's symptoms and classify the situation into one of three triage levels:
- GREEN (Self-care is likely fine for now)
- YELLOW (Non-urgent, but should see a doctor soon)
- RED (Urgent or medical emergency - seek immediate care now)

Guidelines:
1. NEVER provide a definitive diagnosis or prescribe specific medications.
2. Recommend professional medical care for anything concerning.
3. Automatically classify emergency signs (such as chest pain, breathing difficulty, severe bleeding, sudden confusion, stroke signs, etc.) as RED.
4. Output the "reason" and "advice" fields in the user's selected language: ${langName}.
5. You MUST return a STRICT JSON object only. Do not include any markdown styling, comments, or extra text.

The output JSON structure MUST be exactly:
{
  "possible_concerns": ["concern 1", "concern 2"],
  "triage": "GREEN" | "YELLOW" | "RED",
  "reason": "Detailed explanation of why this triage level was chosen in ${langName}.",
  "advice": "Precise, cautious next steps and self-care tips in ${langName}.",
  "see_doctor": true | false
}
Ensure the JSON is perfectly valid.`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `User's reported symptoms: "${transcript}"` }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.2,
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0]?.message?.content || "";
    const parsed = JSON.parse(content.trim());

    return NextResponse.json({
      success: true,
      triageResult: parsed
    });

  } catch (error) {
    console.error("Triage API error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({
      success: false,
      error: "Triage analysis failed: " + errorMessage
    }, { status: 500 });
  }
}
