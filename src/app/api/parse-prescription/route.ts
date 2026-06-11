import { NextResponse } from "next/server";
import { groq } from "@/lib/groq";

export async function POST(req: Request) {
  try {
    const { text, language } = await req.json();

    if (!text || !text.trim()) {
      return NextResponse.json({ success: false, error: "No prescription text provided" }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    const isMock = !apiKey || apiKey === "your_key_here" || apiKey.trim() === "";

    if (isMock) {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Simple mock parser: check for common terms or return default list
      const lower = text.toLowerCase();
      const medicines = [];

      if (lower.includes("paracetamol") || lower.includes("crocin") || lower.includes("calpol")) {
        medicines.push({
          name: "Paracetamol",
          dose: "650 mg",
          frequency: "As needed (Max 4/day)",
          duration: "3 days"
        });
      }
      if (lower.includes("amoxicillin") || lower.includes("mox") || lower.includes("antibiotic")) {
        medicines.push({
          name: "Amoxicillin",
          dose: "500 mg",
          frequency: "Thrice a day (1-1-1)",
          duration: "5 days"
        });
      }
      if (lower.includes("metformin") || lower.includes("glycomet") || lower.includes("sugar")) {
        medicines.push({
          name: "Metformin",
          dose: "500 mg",
          frequency: "Twice a day (1-0-1) - After meals",
          duration: "30 days"
        });
      }
      if (lower.includes("pantoprazole") || lower.includes("pan") || lower.includes("gas")) {
        medicines.push({
          name: "Pantoprazole",
          dose: "40 mg",
          frequency: "Once a day (1-0-0) - Empty stomach",
          duration: "7 days"
        });
      }

      // If no matched meds, add default ones to show it works
      if (medicines.length === 0) {
        medicines.push(
          {
            name: "Paracetamol (Mocked)",
            dose: "500 mg",
            frequency: "Twice a day (1-0-1)",
            duration: "5 days"
          },
          {
            name: "Amoxicillin (Mocked)",
            dose: "250 mg",
            frequency: "Thrice a day (1-1-1)",
            duration: "7 days"
          }
        );
      }

      const interactionNote = "No critical interactions found in the mock database. Always check with a certified pharmacist or doctor to verify safety details.";

      return NextResponse.json({
        success: true,
        isMock: true,
        medicines,
        interactionNote
      });
    }

    const systemPrompt = `You are a medical prescription parser assistant. Your task is to extract all prescribed medicines from the OCR-scanned text of a prescription.
    
Extract each medicine with its name, dose (strength, e.g., 500mg, 1 tablet), frequency (e.g., Once daily, 1-0-1, Every 8 hours), and duration (e.g., 5 days, 1 month).

Additionally, evaluate the medicines list and provide a short "interactionNote" (in the user's UI language if possible, else English) outlining any notable safety warnings, drug-drug interactions, or general advice. Label it clearly as informational and advise confirming with a doctor.

Output MUST be a STRICT JSON object only. Do not include markdown wraps or additional text.
The JSON schema MUST match:
{
  "medicines": [
    {
      "name": "Medicine Name",
      "dose": "Dosage/Strength details",
      "frequency": "Frequency instructions",
      "duration": "Duration details"
    }
  ],
  "interactionNote": "A paragraph highlighting safety notes, possible interactions, or informational guidance. Emphasize that the patient must verify with a professional."
}`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Prescription text to parse: "${text}"\nSelected Language Code: "${language || "en"}"` }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0]?.message?.content || "";
    const parsed = JSON.parse(content.trim());

    return NextResponse.json({
      success: true,
      medicines: parsed.medicines || [],
      interactionNote: parsed.interactionNote || ""
    });

  } catch (error) {
    console.error("Prescription API error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({
      success: false,
      error: "Prescription parsing failed: " + errorMessage
    }, { status: 500 });
  }
}
