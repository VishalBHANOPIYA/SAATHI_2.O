import { NextResponse } from "next/server";
import { groq } from "@/lib/groq";
import { getLanguageName } from "@/utils/languageHelper";

export async function POST(req: Request) {
  try {
    const { messages, language } = await req.json();

    const apiKey = process.env.GROQ_API_KEY;
    const isMock = !apiKey || apiKey === "your_key_here" || apiKey.trim() === "";

    const langName = getLanguageName(language);

    if (isMock) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const lastMessage = messages[messages.length - 1]?.content || "";
      let reply = "";

      if (language === "hi") {
        reply = `नमस्ते! मैं आपका स्वास्थ्य साथी हूं। मैंने आपका लक्षण सुना: "${lastMessage}". मैं एक प्रोटोटाइप हूं, इसलिए मैं वास्तविक चिकित्सा सलाह नहीं दे सकता, लेकिन मैं स्वास्थ्य संबंधी सामान्य जानकारी साझा कर सकता हूं। क्या आप मुझे अपने लक्षणों के बारे में विस्तार से बताएंगे?`;
      } else if (language === "gu") {
        reply = `નમસ્તે! હું તમારો સ્વાસ્થ્ય સાથી છું. મેં તમારો સંદેશ સાંભળ્યો: "${lastMessage}". હું એક પ્રોટોટાઇપ છું, તેથી હું વાસ્તવિક તબીબી સલાહ આપી શકતો નથી, પરંતુ હું સામાન્ય સ્વાસ્થ્ય માહિતી શેર કરી શકું છું. શું તમે તમારા લક્ષણો વિશે વધુ વિગતો આપી શકશો?`;
      } else {
        reply = `Hello! I am Saathi, your health companion. I received your message: "${lastMessage}". Since I am running in demo mode, I can help screen general symptoms, but I cannot provide official diagnoses. Please tell me more about how you are feeling!`;
      }

      return NextResponse.json({
        success: true,
        isMock: true,
        reply,
      });
    }

    const systemPrompt = {
      role: "system",
      content: `You are Saathi, a friendly, compassionate, and helpful AI health companion. Respond to the user in ${langName}. 
Help answer general health questions, explain common medical terms, suggest home remedies, and assist with symptom screening.
CRITICAL guidelines:
1. Always maintain a compassionate, warm tone.
2. Keep replies concise, under 100 words, since this is a mobile chat app.
3. Remind the user that Saathi is for screening and awareness, not a medical diagnosis. If symptoms are severe, tell them to see a doctor immediately.`
    };

    // Filter messages to match ChatCompletionMessageParam type
    const formattedMessages = messages.map((m: { role: "user" | "assistant" | "system"; content: string }) => ({
      role: m.role,
      content: m.content,
    }));

    const completion = await groq.chat.completions.create({
      messages: [systemPrompt, ...formattedMessages],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 250,
    });

    const reply = completion.choices[0]?.message?.content?.trim();

    return NextResponse.json({
      success: true,
      isMock: false,
      reply,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({
      success: false,
      message: "Chat failed.",
      error: errorMessage,
    }, { status: 500 });
  }
}
