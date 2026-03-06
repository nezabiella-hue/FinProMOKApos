import axios from "axios";
const MODEL = "stepfun/step-3.5-flash:free";
const API_URL = "https://openrouter.ai/api/v1/chat/completions";

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
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": "Kopi Nusantara Production",
      },
    },
  );
  return response.data.choices[0].message.content;
}
