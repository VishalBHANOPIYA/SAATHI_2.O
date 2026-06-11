import { NextResponse } from "next/server";
import { groq } from "@/lib/groq";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    const isMock = !apiKey || apiKey === "your_key_here" || apiKey.trim() === "";

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const language = formData.get("language") as string; // 'hi', 'gu', 'en'

    if (!file) {
      return NextResponse.json({ success: false, error: "No audio file received" }, { status: 400 });
    }

    if (isMock) {
      // Return a simulated transcription for testing if key is mock
      await new Promise((resolve) => setTimeout(resolve, 1500));
      let mockText = "";
      if (language === "hi") {
        mockText = "मुझे पिछले दो दिनों से तेज़ बुखार, सूखी खाँसी और सांस लेने में कठिनाई हो रही है।";
      } else if (language === "gu") {
        mockText = "મને છેલ્લા બે દિવસથી ખૂબ તાવ, સૂકી ઉધરસ અને શ્વાસ લેવામાં તકલીફ છે.";
      } else {
        mockText = "I have a high fever, dry cough, and mild shortness of breath for the last two days.";
      }
      return NextResponse.json({ success: true, text: mockText, isMock: true });
    }

    // Set medical domain prompt to bias decoder vocabulary
    const medicalPrompt = language === "hi" 
      ? "Medical symptoms description and patient health complaints in Hindi (जैसे: बुखार, खांसी, छाती में दर्द, सांस लेने में तकलीफ, सिरदर्द, उल्टी)."
      : language === "gu"
      ? "Medical symptoms description and patient health complaints in Gujarati (જેમ કે: તાવ, ઉધરસ, છાતીમાં દુખાવો, શ્વાસ લેવામાં તકલીફ, માથાનો દુખાવો, ઊલટી)."
      : "Medical symptoms description and patient health complaints in English (such as: fever, cough, chest pain, shortness of breath, headache, vomiting).";

    // Call Groq Whisper API with temperature 0 and language hints
    const transcription = await groq.audio.transcriptions.create({
      file: file,
      model: "whisper-large-v3-turbo",
      language: language || "en", // 'hi', 'gu', or 'en'
      response_format: "json",
      temperature: 0,
      prompt: medicalPrompt
    });

    return NextResponse.json({
      success: true,
      text: transcription.text,
    });
  } catch (error) {
    console.error("Transcription API error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({
      success: false,
      error: "Transcription failed: " + errorMessage,
    }, { status: 500 });
  }
}
