// services/aiService.js
// ─────────────────────────────────────────────────────────
// Central AI service. Change model or API config here only.
// ─────────────────────────────────────────────────────────
import axios from "axios";

const MODEL = "nousresearch/hermes-3-llama-3.1-405b:free";
const API_URL = "https://openrouter.ai/api/v1/chat/completions";

export async function askAI(prompt) {
  const response = await axios.post(
    API_URL,
    {
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
    },
    {
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": "Kopi Nusantara Production",
      },
    },
  );
  return response.data.choices[0].message.content;
}
