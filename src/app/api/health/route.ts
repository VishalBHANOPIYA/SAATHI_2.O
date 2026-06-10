import { NextResponse } from "next/server";
import { groq } from "@/lib/groq";

export async function GET() {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey === "your_key_here" || apiKey.trim() === "") {
      return NextResponse.json({
        success: false,
        message: "Groq API key is not configured or is the default placeholder.",
        status: "unconfigured"
      }, { status: 400 });
    }

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: "Respond with only one word: success.",
        },
      ],
      model: "llama-3.3-70b-versatile",
    });

    const reply = completion.choices[0]?.message?.content?.trim();

    return NextResponse.json({
      success: true,
      message: "Groq key works!",
      reply: reply
    });
  } catch (error) {
    console.error("Groq API error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({
      success: false,
      message: "Groq API call failed.",
      error: errorMessage
    }, { status: 500 });
  }
}
