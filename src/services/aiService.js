// services/aiService.js
// ─────────────────────────────────────────────────────────
// Central AI service. To swap models, change MODEL only.
//
// Current: stepfun/step-3.5-flash:free
// Free fallbacks:
//   "meta-llama/llama-3.1-8b-instruct:free"
//   "mistralai/mistral-7b-instruct:free"
// ─────────────────────────────────────────────────────────
import axios from "axios";

const MODEL = "stepfun/step-3.5-flash:free";
const API_URL = "https://openrouter.ai/api/v1/chat/completions";

// Works on both localhost and Vercel
const SITE_URL =
  typeof window !== "undefined"
    ? window.location.origin
    : "https://finpromokai.vercel.app/";

const SYSTEM_PROMPT = `
You are a production planning assistant for Kopi Nusantara, a coffee shop.
Your job is to analyze current inventory stock and recommend how many of each dish to produce today.
Always respond in the exact JSON format requested. Never add explanation or markdown outside the JSON.
`.trim();

export async function askAI(userPrompt) {
  const response = await axios.post(
    API_URL,
    {
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": SITE_URL,
        "X-Title": "Kopi Nusantara Production",
      },
    },
  );
  return response.data.choices[0].message.content;
}
