// components/Production/PlanningTab.jsx
// ─────────────────────────────────────────────────────────
// Planning tab with AI analysis and "Apply to Plan" button.
// AI model config → src/services/aiService.js
// Serving calc logic → src/utils/productionHelpers.js
// ─────────────────────────────────────────────────────────
import { useState, useMemo } from "react";
import { Sparkles, AlertTriangle, TriangleAlert } from "lucide-react";
import { askAI } from "../../services/aiService";
import { calcServings } from "../../utils/productionHelpers";
import { semiFinishedGoods } from "../../data/mockproduction";

// ── Try to extract JSON from AI response, even if wrapped in markdown ─────────
function parseAIResponse(raw) {
  // 1. Strip markdown code fences
  let clean = raw.replace(/```json|```/gi, "").trim();

  // 2. Try parsing directly
  try {
    return { ok: true, data: JSON.parse(clean) };
  } catch {
    // 3. Try to find a JSON object anywhere in the string
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return { ok: true, data: JSON.parse(match[0]) };
      } catch {
        // fall through
      }
    }
    // 4. Return raw text as fallback so we still show something
    return { ok: false, rawText: raw };
  }
}

export default function PlanningTab({ dishes, stock }) {
  const [targets, setTargets] = useState({});
  const [prepTargets, setPrepTargets] = useState(
    Object.fromEntries(semiFinishedGoods.map((sf) => [sf.id, 0]))
  );
  const [aiResult, setAiResult] = useState(null);   // parsed JSON { summary, recommendations }
  const [aiRawText, setAiRawText] = useState("");    // fallback if JSON parse fails
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [appliedAI, setAppliedAI] = useState(false);

  // ── target input handler ──────────────────────────────
  const setTarget = (id, val) => {
    setTargets((p) => ({ ...p, [id]: parseInt(val) || 0 }));
    setAppliedAI(false);
  };

  // ── ingredient usage from current targets ─────────────
  const ingredientUsage = useMemo(() => {
    const usage = {};
    dishes.forEach((d) => {
      const qty = targets[d.id] || 0;
      if (!qty) return;
      d.recipe?.forEach(({ ingredient, qty: perDish, unit }) => {
        if (!usage[ingredient]) usage[ingredient] = { total: 0, unit };
        usage[ingredient].total += perDish * qty;
      });
    });
    return usage;
  }, [targets, dishes]);

  // ── stock conflicts based on current targets ──────────
  const conflicts = useMemo(() => {
    return Object.entries(ingredientUsage).filter(([name, { total }]) => {
      const inv = stock.find((s) => s.name === name);
      return !inv || inv.currentStock < total;
    });
  }, [ingredientUsage, stock]);

  // ── semi-finished prep stock check ───────────────────
  const prepConflicts = useMemo(() => {
    const result = {};
    semiFinishedGoods.forEach((sf) => {
      const batches = prepTargets[sf.id] || 0;
      if (!batches) return;
      const shortfalls = [];
      sf.recipe.forEach(({ ingredient, qty, wasteBuffer }) => {
        const needed = qty * batches * (1 + (wasteBuffer || 0) / 100);
        const inv = stock.find((s) => s.name === ingredient);
        const have = inv?.currentStock ?? 0;
        if (have < needed) shortfalls.push({ ingredient, needed: Math.ceil(needed), have, unit: inv?.unit || "" });
      });
      if (shortfalls.length) result[sf.id] = shortfalls;
    });
    return result;
  }, [prepTargets, stock]);

  // ── stock health context passed to AI ─────────────────
  const stockContext = useMemo(() => {
    const low = stock
      .filter((s) => s.status === "Low" || s.status === "Out")
      .map((s) => `${s.name}: ${s.currentStock}${s.unit} (${s.status})`);

    const expiring = stock
      .filter((s) => s.expiryDate)
      .map((s) => {
        const days = Math.ceil((new Date(s.expiryDate) - new Date()) / 86400000);
        return days <= 3 ? `${s.name} (${days}d left)` : null;
      })
      .filter(Boolean);

    const capacity = dishes.map((d) => {
      const { servings, limiter } = calcServings(d, stock);
      return `${d.name}: can make ${servings} (limited by ${limiter || "n/a"})`;
    });

    return { low, expiring, capacity };
  }, [stock, dishes]);

  // ── AI analysis handler ───────────────────────────────
  const handleAI = async () => {
    setAiLoading(true);
    setAiResult(null);
    setAiRawText("");
    setAiError("");

    const dishList = dishes.map((d) => `id:${d.id} "${d.name}"`).join(", ");

    const promptText = [
      `Available dishes: ${dishList}`,
      `Current capacity (max servings from stock): ${stockContext.capacity.join("; ")}`,
      `Low/Out of stock ingredients: ${stockContext.low.length ? stockContext.low.join(", ") : "none"}`,
      `Expiring soon: ${stockContext.expiring.length ? stockContext.expiring.join(", ") : "none"}`,
      "",
      "Rules:",
      "- Prioritize dishes that use expiring ingredients",
      "- Do not recommend more than the max capacity for each dish",
      "- Reduce quantities for dishes with low/out stock ingredients",
      "- Keep quantities realistic for a daily coffee shop run",
      "",
      'Respond ONLY with this JSON format (no markdown, no explanation outside JSON):',
      '{"summary":"one sentence overview of today\'s situation","recommendations":[{"dishId":1,"dishName":"Caramel Latte","qty":10,"reason":"brief reason why this quantity"}]}',
    ].join("\n");

    try {
      const raw = await askAI(promptText);
      const { ok, data, rawText } = parseAIResponse(raw);
      if (ok) {
        setAiResult(data);
      } else {
        // Model returned text instead of JSON — show it as plain text
        setAiRawText(rawText);
      }
    } catch (err) {
      setAiError(
        err?.response?.status === 402
          ? "OpenRouter credits required. Top up at openrouter.ai/credits or switch to a free model in aiService.js."
          : "AI unavailable. Check your connection or API key.",
      );
    }
    setAiLoading(false);
  };

  // ── apply AI recommendation to target inputs ──────────
  const handleApplyRecommendation = () => {
    if (!aiResult?.recommendations) return;
    const newTargets = {};
    aiResult.recommendations.forEach(({ dishId, qty }) => {
      newTargets[dishId] = qty;
    });
    setTargets(newTargets);
    setAppliedAI(true);
  };

  // ── whatsapp purchase request ─────────────────────────
  const handleWhatsApp = () => {
    if (Object.entries(ingredientUsage).length === 0) return;
    const lines = Object.entries(ingredientUsage)
      .map(([name, { total, unit }]) => `- ${name}: ${total} ${unit}`)
      .join("%0A");
    const msg = `*Purchase Request - Kopi Nusantara*%0A%0AIngredient Requirements:%0A${lines}`;
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  // ─────────────────────────────────────────────────────
  return (
    <div className="prod-planning-layout">

      {/* ── Left: target quantity table ── */}
      <div className="prod-card" style={{ flex: 1 }}>
        <div className="inv-card-header">
          <div>
            <h2 className="inv-card-title">Production Planning</h2>
            <p className="inv-card-sub">
              Set target quantities manually, or click <strong>Run AI Analysis</strong> to get a recommendation based on current stock.
            </p>
          </div>
          <button
            className="inv-btn inv-btn--primary"
            onClick={handleAI}
            disabled={aiLoading}
          >
            <Sparkles size={14} />
            {aiLoading ? "Analyzing..." : "Run AI Analysis"}
          </button>
        </div>

        {/* Applied banner */}
        {appliedAI && (
          <div style={{
            margin: "0 1.5rem 1rem",
            padding: "0.6rem 1rem",
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            borderRadius: "8px",
            fontSize: "0.82rem",
            color: "#1d4ed8",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
          }}>
            <Sparkles size={13} /> AI recommendation applied — review and adjust as needed.
          </div>
        )}

        <table className="inv-table">
          <thead>
            <tr>
              <th>Dish</th>
              <th>Target Qty</th>
              <th>Estimated Ingredient Usage</th>
            </tr>
          </thead>
          <tbody>
            {dishes.map((d) => {
              const qty = targets[d.id] || 0;
              const usage =
                d.recipe?.map((r) => `${r.ingredient}: ${r.qty * qty}${r.unit}`).join(", ") || "—";
              const hasConflict = conflicts.some(([name]) =>
                d.recipe?.some((r) => r.ingredient === name),
              );
              return (
                <tr key={d.id} style={hasConflict && qty > 0 ? { background: "#fff7ed" } : {}}>
                  <td className="inv-td-bold">
                    {d.name}
                    {hasConflict && qty > 0 && (
                      <span style={{ marginLeft: 6, color: "#e65100", fontSize: "0.75rem" }}>
                        ⚠ stock conflict
                      </span>
                    )}
                  </td>
                  <td>
                    <input
                      type="number"
                      min={0}
                      value={targets[d.id] || ""}
                      onChange={(e) => setTarget(d.id, e.target.value)}
                      placeholder="0"
                      className="prod-qty-input"
                    />
                  </td>
                  <td className="inv-td-muted" style={{ fontSize: "0.78rem" }}>
                    {qty > 0 ? usage : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* ── Semi-Finished Prep section ── */}
        <div style={{ borderTop: "1px solid #e5e7eb", marginTop: "1.5rem", paddingTop: "1.5rem" }}>
          <div style={{ marginBottom: "0.75rem" }}>
            <h3 className="inv-card-title" style={{ fontSize: "1rem", marginBottom: "0.15rem" }}>
              Semi-Finished Prep
            </h3>
            <p className="inv-card-sub">Plan batch production for prep items (dough, wrappers, sauces).</p>
          </div>
          <table className="inv-table">
            <thead>
              <tr>
                <th>Prep Item</th>
                <th>Yields per Batch</th>
                <th>Batches to Make</th>
                <th>Ingredients Needed</th>
                <th>Stock OK?</th>
              </tr>
            </thead>
            <tbody>
              {semiFinishedGoods.map((sf) => {
                const batches = prepTargets[sf.id] || 0;
                const shortfalls = prepConflicts[sf.id];
                const ingredientSummary = batches > 0
                  ? sf.recipe
                      .map(({ ingredient, qty, wasteBuffer, unit }) => {
                        const total = Math.ceil(qty * batches * (1 + (wasteBuffer || 0) / 100));
                        return `${total}${unit} ${ingredient}`;
                      })
                      .join(", ")
                  : "—";
                return (
                  <tr key={sf.id} style={shortfalls ? { background: "#fff7ed" } : {}}>
                    <td className="inv-td-bold">
                      {sf.name}
                      <span className="prod-cat-badge" style={{ marginLeft: "0.4rem", fontSize: "0.7rem" }}>
                        {sf.category}
                      </span>
                    </td>
                    <td className="inv-td-muted">{sf.yieldQty} {sf.yieldUnit}</td>
                    <td>
                      <input
                        type="number"
                        min={0}
                        value={prepTargets[sf.id] || ""}
                        placeholder="0"
                        className="prod-qty-input"
                        onChange={(e) =>
                          setPrepTargets((p) => ({ ...p, [sf.id]: parseInt(e.target.value) || 0 }))
                        }
                      />
                    </td>
                    <td className="inv-td-muted" style={{ fontSize: "0.78rem" }}>
                      {ingredientSummary}
                    </td>
                    <td>
                      {batches === 0 ? (
                        <span className="inv-td-muted">—</span>
                      ) : shortfalls ? (
                        <span style={{ color: "#991b1b", fontSize: "0.78rem" }}>
                          {shortfalls.map((s) => (
                            <div key={s.ingredient}>
                              ⚠ {s.ingredient}: need {s.needed}{s.unit}, have {s.have}{s.unit}
                            </div>
                          ))}
                        </span>
                      ) : (
                        <span style={{ color: "#166534", fontWeight: 600 }}>✓ Stock OK</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Right: AI sidebar ── */}
      <div className="prod-ai-sidebar">

        {/* Stock warnings — always visible */}
        {(stockContext.low.length > 0 || stockContext.expiring.length > 0) && (
          <div>
            <p className="prod-usage-title">Stock Warnings</p>
            <div className="prod-conflict-list">
              {stockContext.low.map((s) => (
                <div key={s} className="prod-conflict-item">
                  <TriangleAlert size={13} /> {s}
                </div>
              ))}
              {stockContext.expiring.map((s) => (
                <div key={s} className="prod-conflict-item"
                  style={{ background: "#fffbeb", color: "#92400e" }}>
                  <AlertTriangle size={13} /> {s}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ingredient requirements from manual targets */}
        <div className="prod-usage-list">
          <p className="prod-usage-title">Ingredient Requirements</p>
          {Object.entries(ingredientUsage).length === 0 ? (
            <p className="inv-td-muted" style={{ fontSize: "0.82rem" }}>
              Set quantities to see requirements.
            </p>
          ) : (
            Object.entries(ingredientUsage).map(([name, { total, unit }]) => {
              const inv = stock.find((s) => s.name === name);
              const ok = inv && inv.currentStock >= total;
              return (
                <div key={name} className={`prod-usage-item ${ok ? "" : "prod-usage-item--warn"}`}>
                  <span>{name}</span>
                  <span>{total} {unit}</span>
                </div>
              );
            })
          )}
        </div>

        {/* Loading */}
        {aiLoading && (
          <div className="prod-ai-result" style={{ textAlign: "center", color: "#6b7280" }}>
            <Sparkles size={16} style={{ margin: "0 auto 0.4rem", display: "block" }} />
            <p style={{ fontSize: "0.82rem", margin: 0 }}>Analyzing stock & capacity...</p>
          </div>
        )}

        {/* Error */}
        {aiError && (
          <div style={{
            background: "#fee2e2", border: "1px solid #fecaca",
            borderRadius: "8px", padding: "0.75rem",
            fontSize: "0.82rem", color: "#991b1b",
          }}>
            {aiError}
          </div>
        )}

        {/* Structured JSON result — per-dish cards + Apply button */}
        {aiResult && (
          <div className="prod-ai-result">
            <div className="inv-ai-header">
              <Sparkles size={14} className="inv-ai-icon" />
              <span className="inv-ai-title">AI Recommendation</span>
            </div>
            <p className="prod-ai-text" style={{ marginBottom: "0.75rem" }}>
              {aiResult.summary}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", marginBottom: "0.75rem" }}>
              {aiResult.recommendations?.map(({ dishId, dishName, qty, reason }) => (
                <div key={dishId} style={{
                  background: "white", border: "1px solid #bfdbfe",
                  borderRadius: "6px", padding: "0.5rem 0.75rem", fontSize: "0.8rem",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, color: "#1e40af" }}>
                    <span>{dishName}</span>
                    <span>{qty} servings</span>
                  </div>
                  <div style={{ color: "#6b7280", fontSize: "0.75rem", marginTop: "0.15rem" }}>
                    {reason}
                  </div>
                </div>
              ))}
            </div>
            <button
              className="inv-btn inv-btn--primary"
              style={{ width: "100%" }}
              onClick={handleApplyRecommendation}
            >
              <Sparkles size={13} /> Apply to Plan
            </button>
          </div>
        )}

        {/* Fallback: model returned text instead of JSON */}
        {aiRawText && (
          <div className="prod-ai-result">
            <div className="inv-ai-header">
              <Sparkles size={14} className="inv-ai-icon" />
              <span className="inv-ai-title">AI Suggestion</span>
            </div>
            <p className="prod-ai-text" style={{ whiteSpace: "pre-wrap" }}>
              {aiRawText}
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="prod-ai-actions">
          <button className="inv-btn inv-btn--outline" style={{ width: "100%" }}>
            Create Purchase Request
          </button>
          <button
            className="inv-btn inv-btn--whatsapp"
            style={{ width: "100%" }}
            onClick={handleWhatsApp}
          >
            Send via WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}
