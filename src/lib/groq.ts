import Groq from "groq-sdk";

if (!process.env.GROQ_API_KEY) {
  console.warn("Warning: GROQ_API_KEY is not defined in environment variables.");
}

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "",
});
