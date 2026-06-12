import { NextResponse } from "next/server";
import { groq } from "@/lib/groq";

export async function POST(req: Request) {
  try {
    const { transcript, history, language, userProfile } = await req.json();

    if (!transcript || !transcript.trim()) {
      return NextResponse.json({ success: false, error: "No transcript provided" }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    const isMock = !apiKey || apiKey === "your_key_here" || apiKey.trim() === "";

    const langName = language === "hi" ? "Hindi" : language === "gu" ? "Gujarati" : "English";

    // Count assistant messages in history to track number of follow-up questions asked
    const assistantQuestionCount = history
      ? history.filter((msg: any) => msg.role === "assistant" && msg.content).length
      : 0;

    // Check emergency red flags directly in transcript text for early detection
    const lowerText = transcript.toLowerCase();
    const hasEmergencyKeywords = 
      lowerText.includes("chest pain") || 
      lowerText.includes("chest pressure") || 
      lowerText.includes("difficulty breathing") || 
      lowerText.includes("shortness of breath") || 
      lowerText.includes("bleeding") || 
      lowerText.includes("seizure") || 
      lowerText.includes("unconscious") || 
      lowerText.includes("stroke") ||
      lowerText.includes("सीना") || 
      lowerText.includes("सांस") || 
      lowerText.includes("શ્વાસ") || 
      lowerText.includes("છાતી");

    if (isMock) {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock follow-up if we haven't asked questions yet and it's not a severe emergency keywords match
      if (assistantQuestionCount < 2 && !hasEmergencyKeywords) {
        let question = "How long have you had these symptoms, and are they accompanied by any pain?";
        if (language === "hi") {
          question = "आपको ये लक्षण कब से हैं, और क्या इनके साथ कोई दर्द भी हो रहा है?";
        } else if (language === "gu") {
          question = "તમને આ લક્ષણો ક્યારથી છે, અને શું તેની સાથે કોઈ દુખાવો થાય છે?";
        }
        return NextResponse.json({
          success: true,
          isMock: true,
          follow_up_question: question,
          triageResult: null
        });
      }

      // Mock final triage result
      let triage: "GREEN" | "YELLOW" | "RED" = "GREEN";
      let reason = "";
      let advice = "";
      let concerns: string[] = [];

      if (hasEmergencyKeywords) {
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
      } else {
        triage = "YELLOW";
        if (language === "hi") {
          reason = "लक्षणों का डॉक्टर द्वारा मूल्यांकन किया जाना चाहिए।";
          advice = "कृपया अगले 24-48 घंटों के भीतर किसी योग्य चिकित्सक से परामर्श लें।";
          concerns = ["वायरल संक्रमण", "श्वसन नली में संक्रमण"];
        } else if (language === "gu") {
          reason = "તમારા લક્ષણોની ડૉક્ટર દ્વારા તપાસ કરાવવી જરૂરી છે.";
          advice = "કૃપા કરીને આગામી ૨૪ થી ૧૮ કલાકમાં લાયક ડૉક્ટરની સલાહ લો.";
          concerns = ["વાયરલ ઇન્ફેક્શન", "શ્વાસનળીમાં ઇન્ફેક્શન"];
        } else {
          reason = "Persistent symptoms warrant a medical evaluation to rule out secondary infections.";
          advice = "Consult a primary care physician within 24-48 hours. Keep hydrated and take rest.";
          concerns = ["Viral Infection", "Upper Respiratory Infection"];
        }
      }

      // Heuristic Confidence for mock
      const userResponsesLength = history
        ? history.filter((h: any) => h.role === "user").reduce((acc: number, val: any) => acc + val.content.length, 0)
        : transcript.length;
      const confidence = hasEmergencyKeywords ? "HIGH" : userResponsesLength > 50 ? "HIGH" : userResponsesLength > 20 ? "MEDIUM" : "LOW";

      return NextResponse.json({
        success: true,
        isMock: true,
        follow_up_question: null,
        triageResult: {
          possible_concerns: concerns,
          triage,
          reason,
          advice,
          see_doctor: (triage as string) !== "GREEN",
          confidence
        }
      });
    }

    // Call Groq API with LLama-3.3-70b-versatile
    const systemPrompt = `You are a cautious AI health-screening assistant (Saathi companion). Your job is to analyze the user's symptoms and decide whether to ask a clarifying question or classify the situation into one of three triage levels:
- GREEN (Self-care is likely fine for now)
- YELLOW (Non-urgent, but should see a doctor soon)
- RED (Urgent or medical emergency - seek immediate care now)

CRITICAL RED-FLAG Emergency Symptoms (Forces triage to "RED" immediately, DO NOT ask clarifying questions if any match):
- Chest pain, chest pressure, or chest tightness
- Severe difficulty breathing or shortness of breath
- Uncontrolled or heavy bleeding
- Sudden weakness, numbness, face droop, or slurred speech (stroke signs)
- Seizure or convulsion
- Unresponsiveness or loss of consciousness
- Severe dehydration in a child (sunken eyes, no tears, lethargic)
- High fever >103°F with a stiff neck
- Pregnancy accompanied by bleeding or severe pain

Clarifying Questions Guidelines:
- If there are fewer than 2 follow-up questions from the assistant in the conversation history, you must ask exactly 1 short, clarifying question (e.g., about duration, severity, age group) in the user's language (${langName}) and output it in the 'follow_up_question' field, leaving the other fields as null.
- If there are 2 or more follow-up questions in the history, OR if there is a RED-FLAG emergency symptom, you must proceed to the final triage. Set 'follow_up_question' to null and populate the other fields.

You MUST return a STRICT JSON object only. Do not include any markdown styling, comments, or extra text.

The output JSON structure MUST be exactly:
{
  "follow_up_question": "Short clarifying question in ${langName} (string or null)",
  "possible_concerns": ["possible concern 1", "possible concern 2"] (array of strings or null),
  "triage": "GREEN" | "YELLOW" | "RED" (string or null),
  "reason": "Explanation in ${langName} of why this triage level was chosen (string or null)",
  "advice": "Precise, cautious next steps and self-care tips in ${langName} (string or null)",
  "see_doctor": true | false (boolean or null)
}

Few-Shot Examples:

Example 1 (Clarifying Question needed):
User complaint: "My head hurts today."
Output:
{
  "follow_up_question": "How severe is the headache on a scale of 1-10, and have you had it before?",
  "possible_concerns": null,
  "triage": null,
  "reason": null,
  "advice": null,
  "see_doctor": null
}

Example 2 (Final Triage - GREEN):
User: "I feel very tired after working a long shift, no fever or pain."
Output:
{
  "follow_up_question": null,
  "possible_concerns": ["Exhaustion", "Lack of rest"],
  "triage": "GREEN",
  "reason": "Symptoms suggest general fatigue from physical exertion without red flags.",
  "advice": "Ensure adequate rest, hydration, and 7-8 hours of sleep.",
  "see_doctor": false
}

Example 3 (Final Triage - YELLOW):
User: "I have a mild fever of 100.5F and cough for 3 days."
Output:
{
  "follow_up_question": null,
  "possible_concerns": ["Mild viral infection", "Upper respiratory tract infection"],
  "triage": "YELLOW",
  "reason": "Persistent mild fever and cough suggest a mild infection that should be monitored.",
  "advice": "Rest, drink warm fluids, and monitor temperature. Consult a doctor if it persists beyond 5 days.",
  "see_doctor": true
}

Example 4 (Final Triage - RED because of red-flag match):
User: "I have sudden heavy pressure in my chest and it hurts to breathe."
Output:
{
  "follow_up_question": null,
  "possible_concerns": ["Cardiac emergency", "Angina"],
  "triage": "RED",
  "reason": "Heavy chest pressure radiating to other areas is a critical cardiac warning sign.",
  "advice": "Call emergency services or go to the nearest emergency room immediately.",
  "see_doctor": true
}`;

    let profileContext = "";
    if (userProfile && typeof userProfile === "object") {
      const { name, age, gender, conditions, allergies, medications, bloodGroup } = userProfile;
      const conditionStr = conditions && conditions.length > 0 ? conditions.join(", ") : "None";
      profileContext = `User Profile Information:
- Name: ${name || "Unknown"}
- Age: ${age || "Unknown"}
- Gender: ${gender || "Unknown"}
- Chronic Conditions: ${conditionStr}
- Allergies: ${allergies || "None"}
- Current Medications: ${medications || "None"}
- Blood Group: ${bloodGroup || "Unknown"}

Please factor this patient profile details into your health assessment, risk categorization, and recommendations.`;
    }

    const messages: any[] = [
      { role: "system", content: systemPrompt }
    ];

    if (profileContext) {
      messages.push({ role: "system", content: profileContext });
    }

    if (history && Array.isArray(history) && history.length > 0) {
      for (const msg of history) {
        messages.push({
          role: msg.role === "assistant" ? "assistant" : "user",
          content: msg.content
        });
      }
    } else {
      messages.push({
        role: "user",
        content: `User's reported symptoms: "${transcript}"`
      });
    }

    // Guidance injection based on the count of assistant questions
    if (hasEmergencyKeywords) {
      messages.push({
        role: "system",
        content: "EMERGENCY WARNING: Red-flags matched! Immediately output final triage RED. Do not ask follow-up questions."
      });
    } else if (assistantQuestionCount < 2) {
      messages.push({
        role: "system",
        content: `You have asked ${assistantQuestionCount} clarifying questions. You MUST ask exactly one short clarifying question in ${langName} about duration, severity, or age group. Set 'follow_up_question' to that string and all other fields to null.`
      });
    } else {
      messages.push({
        role: "system",
        content: `You have already asked ${assistantQuestionCount} questions. You MUST provide the final triage level (GREEN, YELLOW, or RED). Set 'follow_up_question' to null.`
      });
    }

    let completion = await groq.chat.completions.create({
      messages,
      model: "llama-3.3-70b-versatile",
      temperature: 0.2,
      response_format: { type: "json_object" }
    });

    let content = completion.choices[0]?.message?.content || "";
    let parsed: any;
    let isValid = false;

    // Server-side validation function
    const validateSchema = (data: any) => {
      if (!data || typeof data !== "object") return false;
      const hasFollowUp = "follow_up_question" in data;
      const hasConcerns = "possible_concerns" in data;
      const hasTriage = "triage" in data;
      const hasReason = "reason" in data;
      const hasAdvice = "advice" in data;
      const hasSeeDoctor = "see_doctor" in data;

      if (!hasFollowUp || !hasConcerns || !hasTriage || !hasReason || !hasAdvice || !hasSeeDoctor) {
        return false;
      }

      // If triage is finished, it must be valid enum
      if (data.triage !== null) {
        if (!["GREEN", "YELLOW", "RED"].includes(data.triage)) {
          return false;
        }
      }
      return true;
    };

    try {
      parsed = JSON.parse(content.trim());
      isValid = validateSchema(parsed);
    } catch (e) {
      isValid = false;
    }

    // Retry once if invalid
    if (!isValid) {
      console.warn("Invalid JSON response on first attempt. Retrying with Groq...");
      messages.push({
        role: "system",
        content: "CRITICAL: Your previous output did not match the JSON schema or was malformed. You MUST return ONLY a valid JSON object matching the exact schema."
      });

      try {
        completion = await groq.chat.completions.create({
          messages,
          model: "llama-3.3-70b-versatile",
          temperature: 0.2,
          response_format: { type: "json_object" }
        });
        content = completion.choices[0]?.message?.content || "";
        parsed = JSON.parse(content.trim());
        isValid = validateSchema(parsed);
      } catch (retryError) {
        isValid = false;
      }
    }

    // Safe fallback if still invalid after retry
    if (!isValid) {
      console.error("Failed to get valid triage JSON after retry. Using safe fallback.");
      let reasonFallback = "We were unable to automatically categorize your symptoms. A doctor should evaluate them.";
      let adviceFallback = "Please consult a health professional for proper medical evaluation.";
      let concernsFallback = ["Unclassified symptoms"];

      if (language === "hi") {
        reasonFallback = "हम आपके लक्षणों को स्वचालित रूप से वर्गीकृत करने में असमर्थ रहे। डॉक्टर को इनका मूल्यांकन करना चाहिए।";
        adviceFallback = "कृपया उचित चिकित्सा मूल्यांकन के लिए स्वास्थ्य पेशेवर से परामर्श लें।";
        concernsFallback = ["अवर्गीकृत लक्षण"];
      } else if (language === "gu") {
        reasonFallback = "અમે તમારા લક્ષણોનું આપમેળે વર્ગીકરણ કરવામાં અસમર્થ રહ્યા છીએ. ડૉક્ટરે તેનું મૂલ્યાંકન કરવું જોઈએ.";
        adviceFallback = "કૃપા કરીને યોગ્ય તબીબી મૂલ્યાંકન માટે ડૉક્ટરની સલાહ લો.";
        concernsFallback = ["અવર્ગીકૃત લક્ષણો"];
      }

      parsed = {
        follow_up_question: null,
        possible_concerns: concernsFallback,
        triage: "YELLOW",
        reason: reasonFallback,
        advice: adviceFallback,
        see_doctor: true
      };
    }

    // Heuristic AI Confidence derivation
    // Derived from whether red-flags matched, and the length/completeness of the user's answers
    const userMessages = history
      ? history.filter((msg: any) => msg.role === "user").map((msg: any) => msg.content).join(" ")
      : transcript;
    
    let confidence: "LOW" | "MEDIUM" | "HIGH" = "MEDIUM";
    if (hasEmergencyKeywords) {
      // Direct red flag matches have very clear, deterministic logic
      confidence = "HIGH";
    } else if (userMessages.length < 25) {
      confidence = "LOW";
    } else if (userMessages.length > 80) {
      confidence = "HIGH";
    }

    // Package results
    if (parsed.follow_up_question) {
      return NextResponse.json({
        success: true,
        follow_up_question: parsed.follow_up_question,
        triageResult: null
      });
    } else {
      // Add confidence field to the final triage results
      parsed.confidence = confidence;
      return NextResponse.json({
        success: true,
        follow_up_question: null,
        triageResult: parsed
      });
    }

  } catch (error) {
    console.error("Triage API top-level error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Safety fallback on extreme crash
    return NextResponse.json({
      success: true,
      follow_up_question: null,
      triageResult: {
        follow_up_question: null,
        possible_concerns: ["System Error Fallback"],
        triage: "YELLOW",
        reason: "A system error occurred while parsing symptoms.",
        advice: "Please consult a health professional for proper medical evaluation.",
        see_doctor: true,
        confidence: "LOW"
      }
    });
  }
}
