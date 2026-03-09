// components/Production/PlanningTab.jsx
// ─────────────────────────────────────────────────────────
// Semi-Finished Prep only.
// - AI sidebar matches PurchaseOrder style
// - Create / Edit / Detail modals for prep items
// ─────────────────────────────────────────────────────────
import { useState, useMemo } from "react";
import {
  Sparkles, AlertTriangle, TriangleAlert,
  Plus, Pencil, Eye, Trash2, X, Package,
} from "lucide-react";
import { askAI } from "../../services/aiService";
import { semiFinishedGoods as initialSFG } from "../../data/mockproduction";
import { predictExpiryDate, getExpiryRecord } from "../../data/mockExpiryHistory";
import { getExpiryStatus } from "../../data/mockinventory";

// ── JSON parser ───────────────────────────────────────────
function parseAIResponse(raw) {
  let clean = raw.replace(/```json|```/gi, "").trim();
  try { return { ok: true, data: JSON.parse(clean) }; } catch {}
  const match = clean.match(/\{[\s\S]*\}/);
  if (match) { try { return { ok: true, data: JSON.parse(match[0]) }; } catch {} }
  return { ok: false, rawText: raw };
}

// ─────────────────────────────────────────────────────────
// ── PrepDetailDrawer ──────────────────────────────────────
// ─────────────────────────────────────────────────────────
function PrepDetailDrawer({ item, stock, onClose }) {
  const invEntry    = stock.find((s) => s.name === item.name);
  const expiryRecord = invEntry ? getExpiryRecord(invEntry.name) : null;
  const isAdjusted  = expiryRecord?.patternStatus === "confirmed";

  const ingredientRows = item.recipe.map(({ ingredient, qty, unit, wasteBuffer }) => {
    const inv  = stock.find((s) => s.name === ingredient);
    const have = inv?.currentStock ?? 0;
    return { ingredient, qty, unit, wasteBuffer, have, invUnit: inv?.unit ?? unit, status: inv?.status ?? "—" };
  });

  return (
    <div className="inv-drawer-overlay" onClick={onClose}>
      <div className="inv-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="inv-drawer-header">
          <div className="inv-drawer-title-wrap">
            <Package size={20} className="inv-drawer-icon" />
            <h2 className="inv-drawer-title">{item.name}</h2>
          </div>
          <button className="inv-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="inv-drawer-body">

          {/* Overview */}
          <section className="inv-drawer-section">
            <h3 className="inv-drawer-section-title">Overview</h3>
            <div className="inv-overview-grid">
              <div className="inv-overview-item">
                <span className="inv-overview-label">Category</span>
                <span className="inv-overview-value">{item.category}</span>
              </div>
              <div className="inv-overview-item">
                <span className="inv-overview-label">Yield per Batch</span>
                <span className="inv-overview-value">{item.yieldQty} {item.yieldUnit}</span>
              </div>
              {item.shelfLifeDays && (
                <div className="inv-overview-item">
                  <span className="inv-overview-label">Shelf Life</span>
                  <span className="inv-overview-value">{item.shelfLifeDays} days from prep</span>
                </div>
              )}
              {invEntry && (
                <div className="inv-overview-item">
                  <span className="inv-overview-label">Current Stock</span>
                  <span className="inv-overview-value">{invEntry.currentStock} {invEntry.unit}</span>
                </div>
              )}
              {invEntry && (
                <div className="inv-overview-item">
                  <span className="inv-overview-label">Status</span>
                  <span className={
                    invEntry.status === "Low" ? "inv-badge inv-badge--low"
                    : invEntry.status === "Out" ? "inv-badge inv-badge--out"
                    : "inv-badge inv-badge--ok"
                  }>{invEntry.status}</span>
                </div>
              )}
            </div>
          </section>

          {/* Recipe ingredients */}
          <section className="inv-drawer-section">
            <h3 className="inv-drawer-section-title">Recipe Ingredients</h3>
            <table className="inv-table">
              <thead>
                <tr>
                  <th>Ingredient</th>
                  <th>Per Batch</th>
                  <th>Waste Buffer</th>
                  <th>In Stock</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {ingredientRows.map((r) => (
                  <tr key={r.ingredient} style={r.have < r.qty ? { background: "#fff7ed" } : {}}>
                    <td className="inv-td-bold">{r.ingredient}</td>
                    <td className="inv-td-muted">{r.qty} {r.unit}</td>
                    <td className="inv-td-muted">{r.wasteBuffer ? `${r.wasteBuffer}%` : "—"}</td>
                    <td className="inv-td-muted">{r.have} {r.invUnit}</td>
                    <td>
                      {r.have < r.qty
                        ? <span style={{ color: "#991b1b", fontSize: "0.78rem" }}>⚠ Low</span>
                        : <span style={{ color: "#166534", fontWeight: 600 }}>✓ OK</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Batch / Freshness */}
          {invEntry?.batches?.length > 0 && (
            <section className="inv-drawer-section">
              <h3 className="inv-drawer-section-title">Batch / Freshness</h3>
              <div className="inv-batches">
                {invEntry.batches.map((b) => {
                  const dateRef  = b.madeDate || b.purchaseDate;
                  const shelfDays = item.shelfLifeDays || invEntry.shelfLifeDays;
                  const predicted = dateRef && shelfDays
                    ? predictExpiryDate(invEntry.name, dateRef, shelfDays)
                    : null;
                  const expiryWarning = predicted ? getExpiryStatus(predicted) : null;
                  const isExpiring    = expiryWarning && expiryWarning !== "Fresh";

                  return (
                    <div key={b.label} className="inv-batch-card">
                      <span className="inv-batch-label">{b.label}</span>
                      <span className="inv-batch-amount">{b.amount} {b.unit}</span>
                      <span className="inv-batch-age">{b.age}</span>
                      {dateRef && (
                        <div style={{ marginTop: "0.35rem", fontSize: "0.75rem", color: "#6b7280" }}>
                          <div>{b.madeDate ? "Made:" : "Purchased:"} <strong>{dateRef}</strong></div>
                          {predicted && (
                            <div style={{ marginTop: "0.15rem" }}>
                              Use by:{" "}
                              <strong style={{ color: isExpiring ? "#b45309" : "#1a3c2e" }}>
                                {predicted}
                              </strong>
                              {isAdjusted && (
                                <span style={{ marginLeft: "0.35rem", fontSize: "0.7rem", color: "#d97706", fontStyle: "italic" }}>
                                  (adjusted ↓{expiryRecord.baselineShelfLife - expiryRecord.adjustedShelfLife}d)
                                </span>
                              )}
                              {isExpiring && (
                                <span style={{ marginLeft: "0.35rem", color: "#b45309" }}>· {expiryWarning}</span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {item.shelfLifeDays && (
                <p style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: "0.5rem" }}>
                  Shelf life based on prep/roast date. Use within {item.shelfLifeDays} days for peak quality.
                </p>
              )}
            </section>
          )}

          {!invEntry && (
            <section className="inv-drawer-section">
              <p className="inv-td-muted" style={{ fontSize: "0.82rem" }}>
                No inventory entry found for "{item.name}". Add it to mockinventory.js to track batches and expiry here.
              </p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// ── PrepFormModal (Create & Edit) ─────────────────────────
// ─────────────────────────────────────────────────────────
const EMPTY_ROW = () => ({ ingredient: "", qty: 0, unit: "g", wasteBuffer: 0 });
const CATEGORIES = ["Pastry Base", "Food Base", "Sauce Base", "Coffee Base", "Other"];

function PrepFormModal({ existing, stock, onClose, onSave }) {
  const isEdit = !!existing;
  const [name, setName]           = useState(existing?.name ?? "");
  const [category, setCategory]   = useState(existing?.category ?? "Pastry Base");
  const [yieldQty, setYieldQty]   = useState(existing?.yieldQty ?? 12);
  const [yieldUnit, setYieldUnit] = useState(existing?.yieldUnit ?? "pcs");
  const [shelfLife, setShelfLife] = useState(existing?.shelfLifeDays ?? "");
  const [recipe, setRecipe]       = useState(existing?.recipe?.map((r) => ({ ...r })) ?? [EMPTY_ROW()]);
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [aiLoading, setAiLoading]       = useState(false);

  const addRow    = () => setRecipe((p) => [...p, EMPTY_ROW()]);
  const removeRow = (i) => setRecipe((p) => p.filter((_, idx) => idx !== i));
  const updateRow = (i, field, val) =>
    setRecipe((p) => p.map((r, idx) =>
      idx === i ? { ...r, [field]: field === "qty" ? parseFloat(val) || 0 : val } : r
    ));

  const handleAI = async () => {
    if (!name) return;
    setAiLoading(true);
    setAiSuggestion("");
    const ingList = stock.map((s) => `${s.name} (${s.unit})`).join(", ");
    const recStr  = recipe.filter((r) => r.ingredient)
      .map((r) => `${r.ingredient}: ${r.qty}${r.unit}`).join(", ");
    const prompt = `You are a coffee shop kitchen assistant.
Prep item: "${name}", category: "${category}", yields ${yieldQty} ${yieldUnit} per batch.
Current recipe: ${recStr || "none yet"}.
Available inventory: ${ingList}.
Suggest: 1) Recommended waste buffer % per ingredient, 2) Realistic shelf life in days from prep date, 3) Any missing key ingredients for a typical ${name}. Be brief (max 80 words).`;
    try {
      const result = await askAI(prompt);
      setAiSuggestion(result);
    } catch {
      setAiSuggestion("AI unavailable.");
    }
    setAiLoading(false);
  };

  const missingIngredients = recipe.filter(
    (r) => r.ingredient && !stock.find((s) => s.name === r.ingredient)
  );

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      id: existing?.id ?? `sf_custom_${Date.now()}`,
      name: name.trim(),
      category,
      yieldQty: Number(yieldQty) || 1,
      yieldUnit,
      shelfLifeDays: shelfLife ? Number(shelfLife) : undefined,
      recipe: recipe.filter((r) => r.ingredient && r.qty > 0),
      isCustom: true,
    });
    onClose();
  };

  return (
    <div className="inv-modal-overlay">
      <div className="inv-modal" style={{ maxWidth: 660 }}>
        <div className="inv-modal-header">
          <h2 className="inv-modal-title">{isEdit ? "Edit Prep Item" : "Create Prep Item"}</h2>
          <button className="inv-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="inv-modal-body">
          <div className="prod-form-row">
            <div className="prod-form-group">
              <label className="prod-label">Prep Item Name</label>
              <input className="prod-input" placeholder="e.g. House Blend" value={name}
                onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="prod-form-group">
              <label className="prod-label">Category</label>
              <select className="inv-select" style={{ width: "100%", padding: "0.5rem 0.75rem" }}
                value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="prod-form-row">
            <div className="prod-form-group">
              <label className="prod-label">Yield per Batch</label>
              <div style={{ display: "flex", gap: "0.4rem" }}>
                <input type="number" className="prod-qty-input" style={{ width: "80px" }}
                  value={yieldQty} min={1} onChange={(e) => setYieldQty(e.target.value)} />
                <input className="prod-input" style={{ flex: 1 }} placeholder="pcs / ml / g"
                  value={yieldUnit} onChange={(e) => setYieldUnit(e.target.value)} />
              </div>
            </div>
            <div className="prod-form-group">
              <label className="prod-label">Shelf Life (days from prep)</label>
              <input type="number" className="prod-qty-input" style={{ width: "100%" }}
                placeholder="e.g. 2" value={shelfLife} min={1}
                onChange={(e) => setShelfLife(e.target.value)} />
            </div>
          </div>

          <div className="prod-form-group">
            <label className="prod-label">Recipe Ingredients</label>
            <table className="inv-table">
              <thead>
                <tr><th>Ingredient</th><th>Qty</th><th>Unit</th><th>Waste %</th><th></th></tr>
              </thead>
              <tbody>
                {recipe.map((r, i) => (
                  <tr key={i}>
                    <td>
                      <select className="inv-select" style={{ width: "100%" }} value={r.ingredient}
                        onChange={(e) => updateRow(i, "ingredient", e.target.value)}>
                        <option value="">Select ingredient...</option>
                        {stock.map((s) => <option key={s.name}>{s.name}</option>)}
                        <option value="__custom__">+ Type custom name</option>
                      </select>
                      {r.ingredient === "__custom__" && (
                        <input className="prod-input" placeholder="Custom ingredient name"
                          style={{ marginTop: "0.25rem" }}
                          onChange={(e) => updateRow(i, "ingredient", e.target.value)} />
                      )}
                    </td>
                    <td>
                      <input type="number" className="prod-qty-input" value={r.qty || ""} min={0}
                        onChange={(e) => updateRow(i, "qty", e.target.value)} />
                    </td>
                    <td>
                      <select className="inv-select" value={r.unit}
                        onChange={(e) => updateRow(i, "unit", e.target.value)}>
                        {["g", "ml", "pcs", "kg", "l", "tbsp", "tsp"].map((u) => <option key={u}>{u}</option>)}
                      </select>
                    </td>
                    <td>
                      <input type="number" className="prod-qty-input" value={r.wasteBuffer || ""}
                        min={0} max={50} placeholder="0"
                        onChange={(e) => updateRow(i, "wasteBuffer", e.target.value)} />
                    </td>
                    <td>
                      <button className="prod-remove-btn" onClick={() => removeRow(i)}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button className="prod-add-ingredient-btn" onClick={addRow}>
              <Plus size={14} /> Add Ingredient
            </button>
          </div>

          {missingIngredients.length > 0 && (
            <div className="prod-missing-warning">
              <AlertTriangle size={14} />
              <span>
                Not in inventory: <strong>{missingIngredients.map((r) => r.ingredient).join(", ")}</strong>.
                Add to mockinventory.js for stock checks to work.
              </span>
            </div>
          )}

          <div className="inv-ai-panel">
            <div className="inv-ai-header">
              <Sparkles size={16} className="inv-ai-icon" />
              <span className="inv-ai-title">AI Assistance</span>
              <button className="inv-btn inv-btn--outline"
                style={{ marginLeft: "auto", fontSize: "0.75rem", padding: "0.25rem 0.65rem" }}
                onClick={handleAI} disabled={aiLoading}>
                {aiLoading ? "Thinking..." : "Ask AI"}
              </button>
            </div>
            {aiSuggestion ? (
              <p className="prod-ai-text" style={{ marginTop: "0.5rem" }}>{aiSuggestion}</p>
            ) : (
              <ul className="inv-ai-list">
                <li>Suggested waste buffer % per ingredient</li>
                <li>Realistic shelf life from prep date</li>
                <li>Missing key ingredients for this prep item</li>
              </ul>
            )}
          </div>
        </div>

        <div className="inv-modal-footer">
          <button className="inv-btn inv-btn--ghost" onClick={onClose}>Cancel</button>
          <button className="inv-btn inv-btn--primary" onClick={handleSave} disabled={!name.trim()}>
            {isEdit ? "Save Changes" : "Create Prep Item"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// ── PlanningTab (main) ────────────────────────────────────
// ─────────────────────────────────────────────────────────
export default function PlanningTab({ dishes, stock }) {
  const [sfGoods, setSfGoods]           = useState(initialSFG);
  const [showCreate, setShowCreate]     = useState(false);
  const [editTarget, setEditTarget]     = useState(null);
  const [detailTarget, setDetailTarget] = useState(null);
  const [prepTargets, setPrepTargets]   = useState(
    Object.fromEntries(initialSFG.map((sf) => [sf.id, 0]))
  );
  const [messages, setMessages]   = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError]     = useState("");
  const [aiResult, setAiResult]   = useState(null);
  const [appliedAI, setAppliedAI] = useState(false);

  // CRUD handlers
  const handleCreate = (item) => {
    setSfGoods((p) => [...p, item]);
    setPrepTargets((p) => ({ ...p, [item.id]: 0 }));
  };
  const handleEdit   = (updated) => setSfGoods((p) => p.map((sf) => sf.id === updated.id ? updated : sf));
  const handleDelete = (id) => {
    if (!window.confirm("Delete this prep item?")) return;
    setSfGoods((p) => p.filter((sf) => sf.id !== id));
    setPrepTargets((p) => { const n = { ...p }; delete n[id]; return n; });
  };

  // Stock conflict
  const prepConflicts = useMemo(() => {
    const result = {};
    sfGoods.forEach((sf) => {
      const batches = prepTargets[sf.id] || 0;
      if (!batches) return;
      const shortfalls = [];
      sf.recipe.forEach(({ ingredient, qty, wasteBuffer }) => {
        const needed = qty * batches * (1 + (wasteBuffer || 0) / 100);
        const inv    = stock.find((s) => s.name === ingredient);
        const have   = inv?.currentStock ?? 0;
        if (have < needed)
          shortfalls.push({ ingredient, needed: Math.ceil(needed), have, unit: inv?.unit || "" });
      });
      if (shortfalls.length) result[sf.id] = shortfalls;
    });
    return result;
  }, [prepTargets, stock, sfGoods]);

  // AI context
  const stockContext = useMemo(() => {
    const low = stock.filter((s) => s.status === "Low" || s.status === "Out")
      .map((s) => `${s.name}: ${s.currentStock}${s.unit} (${s.status})`);
    const expiring = stock.filter((s) => s.expiryDate).map((s) => {
      const days = Math.ceil((new Date(s.expiryDate) - new Date()) / 86400000);
      return days <= 3 ? `${s.name} (${days}d left)` : null;
    }).filter(Boolean);
    const prepCapacity = sfGoods.map((sf) => {
      let max = Infinity;
      sf.recipe.forEach(({ ingredient, qty, wasteBuffer }) => {
        const needed = qty * (1 + (wasteBuffer || 0) / 100);
        const inv    = stock.find((s) => s.name === ingredient);
        const have   = inv?.currentStock ?? 0;
        if (needed > 0) max = Math.min(max, Math.floor(have / needed));
      });
      return `${sf.name}: can make ${max === Infinity ? 0 : max} batches (yields ${sf.yieldQty} ${sf.yieldUnit} each)`;
    });
    return { low, expiring, prepCapacity };
  }, [stock, sfGoods]);

  // AI run
  const handleRunAI = async () => {
    setAiLoading(true);
    setAiError("");
    const prepList = sfGoods.map((sf) =>
      `id:${sf.id} "${sf.name}" (yields ${sf.yieldQty} ${sf.yieldUnit}/batch)`).join(", ");
    const promptText = [
      `Semi-finished prep items: ${prepList}`,
      `Current batch capacity from stock: ${stockContext.prepCapacity.join("; ")}`,
      `Low/Out of stock ingredients: ${stockContext.low.length ? stockContext.low.join(", ") : "none"}`,
      `Expiring soon: ${stockContext.expiring.length ? stockContext.expiring.join(", ") : "none"}`,
      "",
      "Rules:",
      "- Recommend how many batches to make for each prep item today",
      "- Do not recommend more than the max capacity from stock",
      "- Prioritize items using expiring ingredients",
      "- Keep quantities realistic for a daily coffee shop operation",
      "",
      'Respond ONLY with this JSON (no markdown, no extra text):',
      '{"summary":"one sentence overview","recommendations":[{"prepId":"sf1","prepName":"Croissant Dough","batches":2,"reason":"brief reason"}]}',
    ].join("\n");
    try {
      const raw = await askAI(promptText);
      const { ok, data, rawText } = parseAIResponse(raw);
      if (ok) {
        setAiResult(data);
        setMessages((prev) => [...prev, {
          role: "assistant", content: raw,
          parsed: {
            summary: data.summary,
            recommendations: data.recommendations?.map((r) => ({
              ingredient: r.prepName,
              recommendedPackages: r.batches,
              reason: r.reason,
              _prepId: r.prepId,
            })),
          },
        }]);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: rawText }]);
      }
    } catch (err) {
      setAiError(
        err?.response?.status === 402
          ? "OpenRouter credits required. Top up at openrouter.ai/credits or switch to a free model in aiService.js."
          : "AI unavailable. Check your connection or API key."
      );
    }
    setAiLoading(false);
  };

  const handleApply = () => {
    if (!aiResult?.recommendations) return;
    const newTargets = {};
    aiResult.recommendations.forEach(({ _prepId, batches }) => {
      if (_prepId) newTargets[_prepId] = batches;
    });
    setPrepTargets((prev) => ({ ...prev, ...newTargets }));
    setAppliedAI(true);
  };

  return (
    <>
      <div className="prod-planning-layout">

        {/* ── Left: Semi-Finished Prep table ── */}
        <div className="prod-card" style={{ flex: 1 }}>
          <div className="inv-card-header">
            <div>
              <h2 className="inv-card-title">Semi-Finished Prep</h2>
              <p className="inv-card-sub">
                Plan batch production for prep items. Run AI Analysis for recommendations based on current stock.
              </p>
            </div>
            <button className="inv-btn inv-btn--outline" onClick={() => setShowCreate(true)}>
              <Plus size={14} /> Add Prep Item
            </button>
          </div>

          {appliedAI && (
            <div style={{
              margin: "0 1.5rem 1rem", padding: "0.6rem 1rem",
              background: "#eff6ff", border: "1px solid #bfdbfe",
              borderRadius: "8px", fontSize: "0.82rem", color: "#1d4ed8",
              display: "flex", alignItems: "center", gap: "0.4rem",
            }}>
              <Sparkles size={13} /> AI recommendation applied — review and adjust as needed.
            </div>
          )}

          <table className="inv-table">
            <thead>
              <tr>
                <th>Prep Item</th>
                <th>Yields / Batch</th>
                <th>Batches to Make</th>
                <th>Ingredients Needed</th>
                <th>Stock OK?</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sfGoods.map((sf) => {
                const batches    = prepTargets[sf.id] || 0;
                const shortfalls = prepConflicts[sf.id];
                const summary    = batches > 0
                  ? sf.recipe.map(({ ingredient, qty, wasteBuffer, unit }) => {
                      const total = Math.ceil(qty * batches * (1 + (wasteBuffer || 0) / 100));
                      return `${total}${unit} ${ingredient}`;
                    }).join(", ")
                  : "—";
                return (
                  <tr key={sf.id} style={shortfalls ? { background: "#fff7ed" } : {}}>
                    <td>
                      <span className="inv-td-bold">{sf.name}</span>
                      <span className="prod-cat-badge" style={{ marginLeft: "0.4rem", fontSize: "0.7rem" }}>
                        {sf.category}
                      </span>
                      {sf.shelfLifeDays && (
                        <span style={{ marginLeft: "0.4rem", fontSize: "0.7rem", color: "#9ca3af" }}>
                          · {sf.shelfLifeDays}d shelf life
                        </span>
                      )}
                    </td>
                    <td className="inv-td-muted">{sf.yieldQty} {sf.yieldUnit}</td>
                    <td>
                      <input type="number" min={0} value={prepTargets[sf.id] || ""}
                        placeholder="0" className="prod-qty-input"
                        onChange={(e) => setPrepTargets((p) => ({
                          ...p, [sf.id]: parseInt(e.target.value) || 0
                        }))} />
                    </td>
                    <td className="inv-td-muted" style={{ fontSize: "0.78rem" }}>{summary}</td>
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
                    <td>
                      <div style={{ display: "flex", gap: "0.3rem" }}>
                        <button className="inv-btn inv-btn--ghost" style={{ padding: "0.25rem 0.45rem" }}
                          title="View details" onClick={() => setDetailTarget(sf)}>
                          <Eye size={14} />
                        </button>
                        <button className="inv-btn inv-btn--ghost" style={{ padding: "0.25rem 0.45rem" }}
                          title="Edit" onClick={() => setEditTarget(sf)}>
                          <Pencil size={14} />
                        </button>
                        {sf.isCustom && (
                          <button className="inv-btn inv-btn--ghost"
                            style={{ padding: "0.25rem 0.45rem", color: "#dc2626" }}
                            title="Delete" onClick={() => handleDelete(sf.id)}>
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── Right: AI sidebar ── */}
        <div className="po-sidebar">
          <div className="prod-ai-sidebar">
            <div>
              <div className="inv-ai-header">
                <Sparkles size={14} className="inv-ai-icon" />
                <span className="inv-ai-title">AI Prep Recommendation</span>
              </div>
              <p className="prod-usage-title" style={{ marginTop: "0.35rem" }}>
                Based on current stock levels &amp; expiry dates
              </p>
            </div>

            {(stockContext.low.length > 0 || stockContext.expiring.length > 0) && (
              <div className="prod-conflict-list">
                {stockContext.low.map((s) => (
                  <div key={s} className="prod-conflict-item"><TriangleAlert size={13} /> {s}</div>
                ))}
                {stockContext.expiring.map((s) => (
                  <div key={s} className="prod-conflict-item"
                    style={{ background: "#fffbeb", color: "#92400e" }}>
                    <AlertTriangle size={13} /> {s}
                  </div>
                ))}
              </div>
            )}

            <div className="po-chat-box">
              {messages.length === 0 && !aiLoading && (
                <p className="po-chat-empty">Click "Run AI Analysis" to get batch prep recommendations.</p>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`po-chat-msg po-chat-msg--${msg.role}`}>
                  {msg.parsed ? (
                    <div>
                      <p className="prod-ai-text" style={{ marginBottom: "0.5rem" }}>{msg.parsed.summary}</p>
                      <div className="po-rec-list">
                        {msg.parsed.recommendations?.map((rec) => (
                          <div key={rec.ingredient} className="po-rec-card">
                            <div className="po-rec-header"><strong>{rec.ingredient}</strong></div>
                            <div className="po-rec-qty">Batches: <strong>{rec.recommendedPackages}</strong></div>
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
                  <Sparkles size={13} /> Analyzing stock &amp; prep capacity...
                </div>
              )}
              {aiError && <div className="po-chat-error">{aiError}</div>}
            </div>

            <div className="prod-ai-actions">
              <button className="inv-btn inv-btn--primary" onClick={handleRunAI}
                disabled={aiLoading} style={{ width: "100%" }}>
                <Sparkles size={14} />
                {aiLoading ? "Analyzing..." : "Run AI Analysis"}
              </button>
              {aiResult && (
                <button className="inv-btn inv-btn--outline" onClick={handleApply} style={{ width: "100%" }}>
                  Apply to Prep Plan
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals & Drawer */}
      {showCreate && (
        <PrepFormModal stock={stock} onClose={() => setShowCreate(false)} onSave={handleCreate} />
      )}
      {editTarget && (
        <PrepFormModal existing={editTarget} stock={stock}
          onClose={() => setEditTarget(null)} onSave={handleEdit} />
      )}
      {detailTarget && (
        <PrepDetailDrawer item={detailTarget} stock={stock} onClose={() => setDetailTarget(null)} />
      )}
    </>
  );
}
