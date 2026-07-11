import { NextResponse } from "next/server";
import { groq } from "@/lib/groq";
import { getLanguageName } from "@/utils/languageHelper";

export async function POST(req: Request) {
  try {
    const { symptoms, triage, screeningResults, language, profile } = await req.json();

    const langName = getLanguageName(language || "en");

    const apiKey = process.env.GROQ_API_KEY;
    const isMock = !apiKey || apiKey === "your_key_here" || apiKey.trim() === "";

    if (isMock) {
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const complaint = symptoms || "Not specified";
      const signals = screeningResults 
        ? `Pulse/Vitals indices or image scan results: ${JSON.stringify(screeningResults)}`
        : "Standard symptom self-reporting; no objective photo-analysis conducted.";
      
      const suggested = triage === "RED"
        ? "Evaluate immediately for cardiorespiratory distress, severe infections, or critical pathology."
        : triage === "YELLOW"
        ? "Examine for underlying infections, chronic condition flare-up, or local inflammation."
        : "Perform standard diagnostic review; monitor symptoms for self-limiting patterns.";

      let demographicHeader = "";
      if (profile) {
        demographicHeader = `### Patient Demographics\n` +
          `- **Name:** ${profile.name || "N/A"}\n` +
          `- **Age:** ${profile.age || "N/A"} years\n` +
          `- **Gender:** ${profile.gender || "N/A"}\n` +
          `- **Blood Group:** ${profile.bloodGroup || "N/A"}\n` +
          `- **Pre-existing Conditions:** ${profile.conditions?.join(", ") || "None"}\n\n`;
      }

      const summaryText = demographicHeader + `### Clinical Intake Summary\n\n` +
        `**Chief Complaint:** ${complaint}\n\n` +
        `**Triage Urgency:** ${triage || "GREEN"}\n\n` +
        `**Screening Signals:** ${signals}\n\n` +
        `**Suggested Diagnostic Focus:** ${suggested}`;

      return NextResponse.json({
        success: true,
        isMock: true,
        summary: {
          chief_complaint: complaint,
          screening_signals: signals,
          triage_level: triage || "GREEN",
          suggested_focus: suggested,
          formatted_summary: summaryText
        }
      });
    }

    const systemPrompt = `You are a professional medical coordinator. Your task is to review the patient's demographics, self-reported symptoms, objective screening results (if any), and triage status, and generate a highly structured, concise, clinical-style summary for an attending doctor.
    
Write in a professional, objective medical tone. Do not use conversational text or greetings.

IMPORTANT: Write the ENTIRE summary in ${langName} language. Do not use English unless ${langName} is English.

The output MUST be a valid JSON object matching the following schema:
{
  "chief_complaint": "Concise statement of the patient's primary symptoms and duration",
  "screening_signals": "Summary of any objective vitals or image screening risks provided, or a statement if none were uploaded",
  "triage_level": "GREEN | YELLOW | RED",
  "suggested_focus": "Specific clinical focus area or urgent diagnostics recommended for the doctor's immediate review",
  "formatted_summary": "A clean, formatted markdown string combining a 'Patient Demographics' section (derived from the demographics provided) and all the above sections professionally for quick reading"
}

Ensure the JSON is well-formed. Output ONLY JSON, nothing else.`;

    const profileDetails = profile 
      ? `\n- Name: ${profile.name || "N/A"}\n- Age: ${profile.age || "N/A"} years\n- Gender: ${profile.gender || "N/A"}\n- Blood Group: ${profile.bloodGroup || "N/A"}\n- Pre-existing Conditions: ${profile.conditions?.join(", ") || "None"}`
      : "Not provided";

    const userContent = `Patient Demographics: ${profileDetails}
Patient Details:
- Symptoms reported: "${symptoms || "None provided"}"
- Screening signals / details: ${JSON.stringify(screeningResults || "No photo screening results recorded")}
- Calculated Triage Priority: "${triage || "GREEN"}"
- Patient UI Language: "${language || "en"}"`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0]?.message?.content || "";
    const parsed = JSON.parse(content.trim());

    return NextResponse.json({
      success: true,
      summary: parsed
    });

  } catch (error) {
    console.error("Summary API error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({
      success: false,
      error: "Failed to generate doctor summary: " + errorMessage
    }, { status: 500 });
  }
}
