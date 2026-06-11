import { NextResponse } from "next/server";
import { groq } from "@/lib/groq";

export async function POST(req: Request) {
  try {
    const { image, text, language } = await req.json();

    const apiKey = process.env.GROQ_API_KEY;
    const isMock = !apiKey || apiKey === "your_key_here" || apiKey.trim() === "";

    if (isMock) {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Simple mock parser based on text search or default
      const lower = text ? text.toLowerCase() : "";
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
      if (lower.includes("pantoprazole") || lower.includes("pan") || lower.includes("gas")) {
        medicines.push({
          name: "Pantoprazole",
          dose: "40 mg",
          frequency: "Once a day (1-0-0) - Empty stomach",
          duration: "7 days"
        });
      }

      if (medicines.length === 0) {
        medicines.push(
          {
            name: "Paracetamol (Mocked Vision)",
            dose: "500 mg",
            frequency: "Twice a day (1-0-1)",
            duration: "5 days"
          },
          {
            name: "Pantoprazole (Mocked Vision)",
            dose: "40 mg",
            frequency: "Once daily before breakfast",
            duration: "7 days"
          }
        );
      }

      return NextResponse.json({
        success: true,
        isMock: true,
        medicines,
        interactionNote: "Mock Vision OCR: No drug-drug interactions detected. Confirm safety with your doctor."
      });
    }

    let parsedResult: any = null;
    let parseSource = "vision";

    // 1. Try calling Groq Vision API first
    if (image && image.trim().startsWith("data:image/")) {
      try {
        console.log("Calling Groq Vision model meta-llama/llama-4-scout-17b-16e-instruct...");
        const visionCompletion = await groq.chat.completions.create({
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `You are a medical prescription parser assistant. Your task is to extract all prescribed medicines from this prescription image.
                  
For each medicine, extract:
- name: The brand or generic name of the medicine
- dose: Strength/dosage (e.g. 500mg, 1 tablet, 10ml)
- frequency: How often to take (e.g. Once daily, 1-0-1, Every 8 hours, Empty stomach)
- duration: Duration of the course (e.g. 5 days, 1 month, Ongoing)

Additionally, provide a short paragraph in "notes" highlighting any safety guidelines, general advice, or drug-drug interactions. Emphasize that the patient must verify with a professional.

Output MUST be a STRICT JSON object only. Do not include markdown wraps or extra text.
The JSON schema MUST match:
{
  "medicines": [
    {
      "name": "Medicine Name",
      "dose": "Dosage details",
      "frequency": "Frequency instructions",
      "duration": "Duration details"
    }
  ],
  "notes": "Safety warning and pharmacist guidance paragraph."
}`
                },
                {
                  type: "image_url",
                  image_url: {
                    url: image
                  }
                }
              ]
            }
          ],
          model: "meta-llama/llama-4-scout-17b-16e-instruct",
          temperature: 0.1,
          response_format: { type: "json_object" }
        });

        const visionContent = visionCompletion.choices[0]?.message?.content || "";
        parsedResult = JSON.parse(visionContent.trim());
      } catch (visionErr) {
        console.error("Groq Vision OCR failed, falling back to Tesseract text LLM parse:", visionErr);
        parsedResult = null;
      }
    }

    // 2. Fallback: Parse Tesseract OCR Text using LLama-3.3-70b-versatile if vision failed/omitted
    if (!parsedResult && text && text.trim().length > 0) {
      try {
        console.log("Calling Groq Text model llama-3.3-70b-versatile on OCR text fallback...");
        parseSource = "ocr_fallback";
        const systemPrompt = `You are a medical prescription parser assistant. Your task is to extract all prescribed medicines from the OCR-scanned text of a prescription.

Extract each medicine with its name, dose (strength, e.g. 500mg), frequency, and duration.
Additionally, provide a short paragraph under "notes" outlining safety warnings, interactions, or general advice.

Output MUST be a STRICT JSON object only. The JSON schema MUST match:
{
  "medicines": [
    {
      "name": "Medicine Name",
      "dose": "Dosage details",
      "frequency": "Frequency instructions",
      "duration": "Duration details"
    }
  ],
  "notes": "Safety warnings and pharmacist guidance."
}`;

        const textCompletion = await groq.chat.completions.create({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Prescription text to parse: "${text}"` }
          ],
          model: "llama-3.3-70b-versatile",
          temperature: 0.1,
          response_format: { type: "json_object" }
        });

        const textContent = textCompletion.choices[0]?.message?.content || "";
        parsedResult = JSON.parse(textContent.trim());
      } catch (textErr) {
        console.error("OCR Text fallback parser failed:", textErr);
        parsedResult = null;
      }
    }

    // 3. Validation & Normalization
    if (parsedResult && typeof parsedResult === "object") {
      const medicines = Array.isArray(parsedResult.medicines) ? parsedResult.medicines : [];
      const interactionNote = parsedResult.notes || parsedResult.interactionNote || "Verify all medicines and instructions with your doctor.";

      // Normalize fields to string
      const normalizedMeds = medicines.map((m: any) => ({
        name: String(m.name || "").trim() || "Unspecified Medicine",
        dose: String(m.dose || "").trim() || "As directed",
        frequency: String(m.frequency || "").trim() || "Once daily",
        duration: String(m.duration || "").trim() || "Ongoing"
      }));

      return NextResponse.json({
        success: true,
        parseSource,
        medicines: normalizedMeds,
        interactionNote
      });
    }

    throw new Error("Unable to parse prescription image or fallback text.");

  } catch (error) {
    console.error("Prescription API crash:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({
      success: false,
      error: "Prescription parsing failed: " + errorMessage
    }, { status: 500 });
  }
}
