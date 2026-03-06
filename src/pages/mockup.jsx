import { useState } from "react";
import axios from "axios";

const products = `
Daftar Produk Kopi Nusantara:

1. Arabica Gayo
   - Harga: Rp75.000
   - Rasa: fruity, acidity medium
   - Roast level: medium

2. Robusta Toraja
   - Harga: Rp65.000
   - Rasa: bold, chocolatey
   - Roast level: dark

3. Cold Brew Bottle
   - Harga: Rp30.000
   - Siap minum
`;

function mockup() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Halo 👋 Ada yang bisa saya bantu seputar produk Kopi Nusantara?",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const response = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model: "openai/gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `
              Kamu adalah assistant resmi Kopi Nusantara.
              Jawab hanya berdasarkan data berikut:

              ${products}

              Jika pertanyaan di luar konteks produk,
              jawab: "Maaf, saya hanya bisa membantu seputar produk kami."
              Gunakan bahasa santai dan ramah.
              `,
            },
            ...messages,
            userMessage,
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:5173",
            "X-Title": "Kopi Nusantara Chat",
          },
        },
      );

      const aiReply = response.data.choices[0].message.content;

      setMessages((prev) => [...prev, { role: "assistant", content: aiReply }]);
    } catch (err) {
      setError("Terjadi kesalahan. Coba lagi ya.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col">
      {/* Header */}
      <div className="bg-black text-white p-4 text-center text-xl font-semibold">
        ☕ Kopi Nusantara Assistant
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`max-w-lg p-4 rounded-2xl shadow-sm ${
              msg.role === "user"
                ? "bg-black text-white ml-auto"
                : "bg-white text-black"
            }`}
          >
            {msg.content}
          </div>
        ))}

        {loading && (
          <div className="bg-white p-4 rounded-2xl shadow-sm w-fit animate-pulse">
            Sedang mengetik...
          </div>
        )}

        {error && <div className="text-red-500 text-sm">{error}</div>}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t flex gap-2">
        <input
          type="text"
          placeholder="Tanya seputar produk kopi..."
          className="flex-1 border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="bg-black text-white px-6 py-2 rounded-xl hover:opacity-90 disabled:opacity-50"
        >
          Kirim
        </button>
      </div>
    </div>
  );
}

export default mockup;
