// pages/purchaseorder.jsx
// ─────────────────────────────────────────────────────────
// Three sections:
//   1. Shopping List  — all inventory items + custom items, order by packaging unit
//   2. AI Chatbox     — restock recommendation based on avg sales vs current stock
//   3. Purchase Card  — summary + WhatsApp send
// ─────────────────────────────────────────────────────────
import { useState, useMemo } from "react";
import { Sparkles, ShoppingCart, Send, Plus, Trash2 } from "lucide-react";
import { askAI } from "../services/aiService";
import {
  saleTransactions,
  restockTransactions,
} from "../data/mockTransactions";
import { initialDishes } from "../data/mockproduction";
import "../App.css";

const REORDER_DAYS = 7;

// ── Helpers ───────────────────────────────────────────────

function parseAIResponse(raw) {
  let clean = raw.replace(/```json|```/gi, "").trim();
  try {
    return { ok: true, data: JSON.parse(clean) };
  } catch {}
  const match = clean.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      return { ok: true, data: JSON.parse(match[0]) };
    } catch {}
  }
  return { ok: false, rawText: raw };
}

function calcAvgDailyUsage() {
  const DAYS = 31;
  const dishTotals = {};
  saleTransactions.forEach((tx) => {
    dishTotals[tx.dish] = (dishTotals[tx.dish] || 0) + tx.qty;
  });
  const usage = {};
  initialDishes.forEach((dish) => {
    const avgQty = (dishTotals[dish.name] || 0) / DAYS;
    dish.recipe?.forEach(({ ingredient, qty }) => {
      usage[ingredient] = (usage[ingredient] || 0) + qty * avgQty;
    });
  });
  return usage;
}

function getSupplierAndCost(ingredientName) {
  const hits = restockTransactions.filter(
    (r) => r.ingredient === ingredientName && r.qty > 0,
  );
  if (!hits.length) return { supplier: "—", unitCost: null };
  const latest = hits[hits.length - 1];
  return { supplier: latest.supplier, unitCost: latest.totalCost / latest.qty };
}

// ── Component ─────────────────────────────────────────────

export default function PurchaseOrder({ stock }) {
  const [orderQty, setOrderQty] = useState({});
  const [customItems, setCustomItems] = useState([]);
  const [newItem, setNewItem] = useState({ name: "", qty: "", unit: "pcs" });

  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiResult, setAiResult] = useState(null);
  const [appliedAI, setAppliedAI] = useState(false);

  // ── Derived data ─────────────────────────────────────────

  const avgDailyUsage = useMemo(() => calcAvgDailyUsage(), []);

  const enrichedStock = useMemo(() => {
    return stock.map((item) => {
      const daily = avgDailyUsage[item.name] || 0;
      const daysOfStock =
        daily > 0 ? Math.round((item.currentStock / daily) * 10) / 10 : null;
      const { supplier, unitCost } = getSupplierAndCost(item.name);
      return { ...item, daily, daysOfStock, supplier, unitCost };
    });
  }, [stock, avgDailyUsage]);

  const orderLines = useMemo(() => {
    const lines = [];
    enrichedStock.forEach((item) => {
      const qty = orderQty[item.name] || 0;
      if (!qty) return;
      const pkgSize = item.packagingUnit?.size ?? 1;
      const pkgLabel = item.packagingUnit?.label ?? item.unit;
      const totalBase = qty * pkgSize;
      const estCost = item.unitCost
        ? Math.round(totalBase * item.unitCost)
        : null;
      lines.push({
        name: item.name,
        qty,
        pkgLabel,
        totalBase,
        unit: item.unit,
        supplier: item.supplier,
        estCost,
      });
    });
    customItems.forEach((ci) => {
      if (parseFloat(ci.qty) > 0) {
        lines.push({
          name: ci.name,
          qty: parseFloat(ci.qty),
          pkgLabel: ci.unit,
          totalBase: parseFloat(ci.qty),
          unit: ci.unit,
          supplier: "—",
          estCost: null,
          isCustom: true,
        });
      }
    });
    return lines;
  }, [orderQty, enrichedStock, customItems]);

  const totalEstimate = orderLines.reduce((s, l) => s + (l.estCost || 0), 0);

  // ── AI prompt ─────────────────────────────────────────────

  const buildPrompt = (followUp = null) => {
    const stockLines = enrichedStock
      .filter((item) => item.daily > 0)
      .map((item) => {
        const days = item.daysOfStock !== null ? `${item.daysOfStock}d` : "N/A";
        const pkg = item.packagingUnit;
        const pkgInfo = pkg
          ? ` | pkg: ${pkg.label} = ${pkg.size}${pkg.unitLabel}`
          : "";
        return `${item.name}: ${item.currentStock}${item.unit}, ~${item.daily.toFixed(1)}${item.unit}/day, stock for ${days}${pkgInfo}`;
      });
    const urgent = enrichedStock
      .filter(
        (item) => item.daysOfStock !== null && item.daysOfStock < REORDER_DAYS,
      )
      .map((item) => `${item.name} (${item.daysOfStock}d left)`);

    const base = [
      "Current inventory vs estimated daily consumption (from March 2024 sales):",
      ...stockLines,
      "",
      `Items with < ${REORDER_DAYS} days of stock: ${urgent.length ? urgent.join(", ") : "none"}`,
      "",
      "Rules:",
      `- Recommend restock only for items with fewer than ${REORDER_DAYS} days of stock remaining`,
      "- Express quantity in PACKAGING UNITS (bags, cartons, bottles, etc.) not base units",
      "- Set urgency: high (< 3d), medium (3–7d), low (suggested top-up)",
      "- Keep recommendations realistic and concise",
      "",
      "Respond ONLY with this JSON (no markdown, no text outside JSON):",
      '{"summary":"one sentence situation overview","recommendations":[{"ingredient":"Fresh Milk","recommendedPackages":6,"packagingUnit":"carton","urgency":"high","reason":"brief reason"}]}',
    ].join("\n");

    return followUp ? `${base}\n\nUser follow-up: "${followUp}"` : base;
  };

  // ── AI handlers ───────────────────────────────────────────

  const handleRunAI = async () => {
    setAiLoading(true);
    setAiResult(null);
    setAiError("");
    setAppliedAI(false);
    setMessages([
      {
        role: "user",
        content:
          "Run restock analysis based on current inventory and sales data.",
      },
    ]);
    try {
      const raw = await askAI(buildPrompt());
      const { ok, data, rawText } = parseAIResponse(raw);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: rawText || "", parsed: ok ? data : null },
      ]);
      if (ok) setAiResult(data);
    } catch (err) {
      setAiError(
        err?.response?.status === 402
          ? "OpenRouter credits required. Top up at openrouter.ai or switch model in aiService.js."
          : "AI unavailable. Check your connection or API key.",
      );
    }
    setAiLoading(false);
  };

  const handleSendChat = async () => {
    const text = chatInput.trim();
    if (!text || aiLoading) return;
    setChatInput("");
    setAiLoading(true);
    setAiError("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    try {
      const raw = await askAI(buildPrompt(text));
      const { ok, data, rawText } = parseAIResponse(raw);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: rawText || "", parsed: ok ? data : null },
      ]);
      if (ok) setAiResult(data);
    } catch {
      setAiError("AI unavailable. Check connection or API key.");
    }
    setAiLoading(false);
  };

  const handleApply = () => {
    if (!aiResult?.recommendations) return;
    const next = { ...orderQty };
    aiResult.recommendations.forEach((rec) => {
      next[rec.ingredient] = rec.recommendedPackages;
    });
    setOrderQty(next);
    setAppliedAI(true);
  };

  const handleAddCustom = () => {
    if (!newItem.name.trim() || !newItem.qty) return;
    setCustomItems((prev) => [...prev, { ...newItem, id: Date.now() }]);
    setNewItem({ name: "", qty: "", unit: "pcs" });
  };

  const handleWhatsApp = () => {
    if (orderLines.length === 0) return;
    const lines = orderLines
      .map((l) => `- ${l.name}: ${l.qty} ${l.pkgLabel}`)
      .join("%0A");
    const total =
      totalEstimate > 0
        ? `%0A%0AEst. Total: Rp ${totalEstimate.toLocaleString("id-ID")}`
        : "";
    const msg = `*Purchase Order - Kopi Nusantara*%0A%0AItems to Restock:%0A${lines}${total}`;
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  // ── Render ────────────────────────────────────────────────

  return (
    <div className="inv-wrap">
      <div className="inv-page-header">
        <h1 className="inv-page-title">Purchase Order</h1>
        <div className="inv-tabs">
          <button className="inv-tab inv-tab--active">Restock</button>
        </div>
      </div>

      <div className="prod-planning-layout">
        {/* ── Part 1: Shopping List ─────────────────────── */}
        <div className="inv-card" style={{ flex: "1 1 0", minWidth: 0 }}>
          <div className="inv-card-header">
            <div>
              <h2 className="inv-card-title">Shopping List</h2>
              <p className="inv-card-sub">
                Enter packages to order. Rows highlighted in amber are running
                low (&lt;{REORDER_DAYS}d of stock).
              </p>
            </div>
            {appliedAI && (
              <span className="po-applied-badge">
                <Sparkles size={12} /> AI applied
              </span>
            )}
          </div>

          <table className="inv-table">
            <thead>
              <tr>
                <th>Ingredient</th>
                <th>Current Stock</th>
                <th>Days of Stock</th>
                <th>Order Qty</th>
                <th>Est. Cost</th>
              </tr>
            </thead>
            <tbody>
              {enrichedStock.map((item) => {
                const qty = orderQty[item.name] || 0;
                const pkgLabel = item.packagingUnit?.label ?? item.unit;
                const isUrgent =
                  item.daysOfStock !== null && item.daysOfStock < REORDER_DAYS;
                const isOut = item.status === "Out";
                const totalBase = qty * (item.packagingUnit?.size ?? 1);
                const estCost =
                  item.unitCost && qty > 0
                    ? Math.round(totalBase * item.unitCost)
                    : null;
                return (
                  <tr
                    key={item.id}
                    style={
                      isOut
                        ? { background: "#fef2f2" }
                        : isUrgent
                          ? { background: "#fffbeb" }
                          : {}
                    }
                  >
                    <td className="inv-td-bold">
                      {item.name}
                      <div className="inv-pkg-count">{item.category}</div>
                    </td>
                    <td>
                      <div>
                        <span className="inv-stock-num">
                          {item.currentStock}
                        </span>
                        <span className="inv-stock-unit"> {item.unit}</span>
                      </div>
                      {item.packagingUnit && (
                        <div className="inv-pkg-count">
                          ~
                          {Math.floor(
                            item.currentStock / item.packagingUnit.size,
                          )}{" "}
                          {pkgLabel}
                        </div>
                      )}
                    </td>
                    <td>
                      {item.daysOfStock !== null ? (
                        <span
                          className={
                            item.daysOfStock < 3
                              ? "po-days po-days--critical"
                              : item.daysOfStock < 7
                                ? "po-days po-days--warn"
                                : "po-days po-days--ok"
                          }
                        >
                          {item.daysOfStock}d
                        </span>
                      ) : (
                        <span className="inv-td-muted">—</span>
                      )}
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={qty || ""}
                        onChange={(e) =>
                          setOrderQty((prev) => ({
                            ...prev,
                            [item.name]: parseInt(e.target.value) || 0,
                          }))
                        }
                        className="prod-qty-input"
                      />
                      <span className="inv-stock-unit"> {pkgLabel}</span>
                    </td>
                    <td>
                      {estCost ? (
                        <span className="po-cost">
                          Rp {estCost.toLocaleString("id-ID")}
                        </span>
                      ) : (
                        <span className="inv-td-muted">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Add custom item */}
          <div className="po-custom-section">
            <p className="prod-usage-title">Add Item Not in Inventory</p>
            <div className="po-custom-row">
              <input
                placeholder="Item name"
                value={newItem.name}
                onChange={(e) =>
                  setNewItem((p) => ({ ...p, name: e.target.value }))
                }
                onKeyDown={(e) => e.key === "Enter" && handleAddCustom()}
                className="po-custom-input po-custom-input--wide"
              />
              <input
                type="number"
                placeholder="Qty"
                min="0"
                value={newItem.qty}
                onChange={(e) =>
                  setNewItem((p) => ({ ...p, qty: e.target.value }))
                }
                className="po-custom-input po-custom-input--sm"
              />
              <input
                placeholder="Unit"
                value={newItem.unit}
                onChange={(e) =>
                  setNewItem((p) => ({ ...p, unit: e.target.value }))
                }
                className="po-custom-input po-custom-input--sm"
              />
              <button
                className="inv-btn inv-btn--outline"
                onClick={handleAddCustom}
              >
                <Plus size={14} /> Add
              </button>
            </div>
            {customItems.length > 0 && (
              <div className="po-custom-list">
                {customItems.map((ci) => (
                  <div key={ci.id} className="prod-usage-item">
                    <span className="inv-td-bold">{ci.name}</span>
                    <span className="inv-td-muted">
                      {ci.qty} {ci.unit}
                    </span>
                    <button
                      className="po-remove-btn"
                      onClick={() =>
                        setCustomItems((p) => p.filter((x) => x.id !== ci.id))
                      }
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right column ──────────────────────────────── */}
        <div className="po-sidebar">
          {/* ── Part 2: AI Chatbox ── */}
          <div className="prod-ai-sidebar">
            <div>
              <div className="inv-ai-header">
                <Sparkles size={14} className="inv-ai-icon" />
                <span className="inv-ai-title">AI Restock Recommendation</span>
              </div>
              <p className="prod-usage-title" style={{ marginTop: "0.35rem" }}>
                Based on avg daily sales (March 2024) vs current stock
              </p>
            </div>

            {/* Chat area */}
            <div className="po-chat-box">
              {messages.length === 0 && !aiLoading && (
                <p className="po-chat-empty">
                  Click "Run AI Analysis" to get restocking recommendations.
                </p>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`po-chat-msg po-chat-msg--${msg.role}`}>
                  {msg.role === "user" ? (
                    <span>{msg.content}</span>
                  ) : msg.parsed ? (
                    <div>
                      <p
                        className="prod-ai-text"
                        style={{ marginBottom: "0.5rem" }}
                      >
                        {msg.parsed.summary}
                      </p>
                      <div className="po-rec-list">
                        {msg.parsed.recommendations?.map((rec) => (
                          <div key={rec.ingredient} className="po-rec-card">
                            <div className="po-rec-header">
                              <strong>{rec.ingredient}</strong>
                              <span
                                className={`po-urgency po-urgency--${rec.urgency}`}
                              >
                                {rec.urgency}
                              </span>
                            </div>
                            <div className="po-rec-qty">
                              Order:{" "}
                              <strong>
                                {rec.recommendedPackages} {rec.packagingUnit}
                              </strong>
                            </div>
                            <div className="po-rec-reason">{rec.reason}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <span className="prod-ai-text">{msg.content}</span>
                  )}
                </div>
              ))}
              {aiLoading && (
                <div className="po-chat-loading">
                  <Sparkles size={13} /> Analyzing inventory and sales data...
                </div>
              )}
              {aiError && <div className="po-chat-error">{aiError}</div>}
            </div>

            {/* Follow-up input */}
            {messages.length > 0 && (
              <div className="po-chat-follow">
                <input
                  placeholder="Ask a follow-up or adjust..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                  className="po-chat-input"
                  disabled={aiLoading}
                />
                <button
                  className="inv-btn inv-btn--primary po-send-btn"
                  onClick={handleSendChat}
                  disabled={aiLoading || !chatInput.trim()}
                >
                  <Send size={14} />
                </button>
              </div>
            )}

            <div className="prod-ai-actions">
              <button
                className="inv-btn inv-btn--primary"
                onClick={handleRunAI}
                disabled={aiLoading}
                style={{ width: "100%" }}
              >
                <Sparkles size={14} />
                {aiLoading ? "Analyzing..." : "Run AI Analysis"}
              </button>
              {aiResult && (
                <button
                  className="inv-btn inv-btn--outline"
                  onClick={handleApply}
                  style={{ width: "100%" }}
                >
                  Apply to Shopping List
                </button>
              )}
            </div>
          </div>

          {/* ── Part 3: Create Purchase Request ── */}
          <div className="prod-ai-sidebar">
            <div className="inv-ai-header">
              <ShoppingCart size={14} className="inv-ai-icon" />
              <span className="inv-ai-title">Create Purchase Request</span>
            </div>

            {orderLines.length === 0 ? (
              <p className="inv-td-muted" style={{ fontSize: "0.82rem" }}>
                No items selected. Enter quantities or apply AI recommendation.
              </p>
            ) : (
              <div className="prod-usage-list">
                {orderLines.map((line, i) => (
                  <div key={i} className="prod-usage-item">
                    <span>
                      <span
                        className="inv-td-bold"
                        style={{ fontSize: "0.83rem" }}
                      >
                        {line.name}
                      </span>
                      <span className="inv-stock-unit">
                        {" "}
                        {line.qty} {line.pkgLabel}
                      </span>
                    </span>
                    <span
                      className="inv-td-muted"
                      style={{ fontSize: "0.78rem", flexShrink: 0 }}
                    >
                      {line.estCost
                        ? `Rp ${line.estCost.toLocaleString("id-ID")}`
                        : "—"}
                    </span>
                  </div>
                ))}
                {totalEstimate > 0 && (
                  <div className="po-total-row">
                    <span>Est. Total</span>
                    <span>Rp {totalEstimate.toLocaleString("id-ID")}</span>
                  </div>
                )}
              </div>
            )}

            <div className="prod-ai-actions">
              <button
                className="inv-btn inv-btn--outline"
                style={{ width: "100%" }}
              >
                Save as Draft
              </button>
              <button
                className="inv-btn inv-btn--whatsapp"
                style={{ width: "100%" }}
                onClick={handleWhatsApp}
                disabled={orderLines.length === 0}
              >
                📲 Send via WhatsApp
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
