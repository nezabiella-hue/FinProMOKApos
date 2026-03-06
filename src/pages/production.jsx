import { useState, useMemo } from "react";
import axios from "axios";
import {
  Search,
  ChevronDown,
  X,
  Plus,
  Trash2,
  Sparkles,
  AlertTriangle,
  ChevronRight,
  TriangleAlert,
} from "lucide-react";
import {
  initialDishes,
  dishCategories,
  availabilityOptions,
} from "../data/mockproduction";
import "../App.css";

// ── helpers ──────────────────────────────────────────────────────────────────

function calcServings(dish, stock) {
  if (!dish.recipe || dish.recipe.length === 0)
    return { servings: 0, limiter: "No recipe" };
  let min = Infinity;
  let limiter = "";
  let missingIngredients = [];

  dish.recipe.forEach(({ ingredient, qty, wasteBuffer }) => {
    const inv = stock.find((s) => s.name === ingredient);
    if (!inv || inv.currentStock === 0) {
      missingIngredients.push(ingredient);
      min = 0;
      limiter = ingredient;
      return;
    }
    const effectiveQty = qty * (1 + (wasteBuffer || 0) / 100);
    const possible = Math.floor(inv.currentStock / effectiveQty);
    if (possible < min) {
      min = possible;
      limiter = ingredient;
    }
  });

  if (missingIngredients.length > 0 && min === 0) {
    return { servings: 0, limiter: missingIngredients[0], missing: true };
  }
  return { servings: min === Infinity ? 0 : min, limiter, missing: false };
}

function getServingStatus(servings) {
  if (servings === 0) return "out";
  if (servings <= 5) return "low";
  return "ok";
}

function getExpiryStatus(expiryDate) {
  if (!expiryDate) return "Fresh";
  const days = Math.ceil((new Date(expiryDate) - new Date()) / 86400000);
  if (days <= 0) return "Expired";
  if (days <= 3) return `Expires in ${days} day${days > 1 ? "s" : ""}`;
  return "Fresh";
}

function getExpiryWarning(dish, stock) {
  for (const { ingredient } of dish.recipe) {
    const inv = stock.find((s) => s.name === ingredient);
    if (inv && inv.expiryDate) {
      const status = getExpiryStatus(inv.expiryDate);
      if (status !== "Fresh") return `${ingredient} expiring`;
    }
  }
  return null;
}

function getSharedWith(dish, allDishes) {
  const sharedNames = new Set();
  dish.sharedIngredients?.forEach((ing) => {
    allDishes.forEach((d) => {
      if (d.id !== dish.id && d.recipe?.some((r) => r.ingredient === ing)) {
        sharedNames.add(d.name);
      }
    });
  });
  return [...sharedNames];
}

// ── AI helper via OpenRouter ──────────────────────────────────────────────────
async function askAI(prompt) {
  const response = await axios.post(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      model: "nousresearch/hermes-3-llama-3.1-405b:free",
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

// ── Sub-pages ─────────────────────────────────────────────────────────────────

function DishList({ dishes, stock, onViewDetail, onCreateDish }) {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [availFilter, setAvailFilter] = useState("All");

  const rows = useMemo(
    () =>
      dishes.map((d) => {
        const { servings, limiter, missing } = calcServings(d, stock);
        const status = getServingStatus(servings);
        const expiry = getExpiryWarning(d, stock);
        const sharedWith = getSharedWith(d, dishes);
        return { ...d, servings, limiter, missing, status, expiry, sharedWith };
      }),
    [dishes, stock],
  );

  const filtered = rows.filter((r) => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === "All" || r.category === catFilter;
    const matchAvail =
      availFilter === "All" ||
      (availFilter === "Available" && r.status === "ok") ||
      (availFilter === "Low" && r.status === "low") ||
      (availFilter === "Out of Stock" && r.status === "out");
    return matchSearch && matchCat && matchAvail;
  });

  return (
    <div className="prod-card">
      <div className="inv-card-header">
        <div>
          <h2 className="inv-card-title">Dish Production</h2>
          <p className="inv-card-sub">
            Available servings calculated from current inventory stock.
          </p>
        </div>
        <button className="inv-btn inv-btn--primary" onClick={onCreateDish}>
          <Plus size={15} /> Create Dish
        </button>
      </div>

      <div className="inv-toolbar">
        <div className="inv-search-wrap" style={{ maxWidth: 300 }}>
          <Search size={14} className="inv-search-icon" />
          <input
            className="inv-search"
            placeholder="Search dishes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="inv-select-wrap">
          <select
            className="inv-select"
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
          >
            {dishCategories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <ChevronDown size={14} className="inv-select-icon" />
        </div>
        <div className="inv-select-wrap">
          <select
            className="inv-select"
            value={availFilter}
            onChange={(e) => setAvailFilter(e.target.value)}
          >
            {availabilityOptions.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
          <ChevronDown size={14} className="inv-select-icon" />
        </div>
      </div>

      <table className="inv-table">
        <thead>
          <tr>
            <th>Dish Name</th>
            <th>Category</th>
            <th>Available Servings</th>
            <th>Limiting Ingredient</th>
            <th>Shared With</th>
            <th>Expiry Warning</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((row) => (
            <tr
              key={row.id}
              className="prod-row"
              onClick={() => onViewDetail(row)}
            >
              <td className="inv-td-bold">{row.name}</td>
              <td>
                <span className="prod-cat-badge">{row.category}</span>
              </td>
              <td>
                <span className={`prod-serving prod-serving--${row.status}`}>
                  {row.servings} serving{row.servings !== 1 ? "s" : ""}
                  {row.missing && (
                    <span className="prod-missing-flag"> ⚠ Missing stock</span>
                  )}
                </span>
              </td>
              <td
                className={
                  row.missing ? "prod-limiter--missing" : "inv-td-muted"
                }
              >
                {row.limiter}
              </td>
              <td className="inv-td-muted">
                {row.sharedWith.length ? row.sharedWith.join(", ") : "—"}
              </td>
              <td>
                {row.expiry ? (
                  <span className="prod-expiry-warn">
                    <AlertTriangle size={13} /> {row.expiry}
                  </span>
                ) : (
                  "—"
                )}
              </td>
              <td>
                <ChevronRight size={16} className="inv-td-muted" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DishDetail({ dish, stock, allDishes, onBack }) {
  const { servings, limiter } = calcServings(dish, stock);
  const expiry = getExpiryWarning(dish, stock);
  const sharedWith = getSharedWith(dish, allDishes);

  return (
    <div className="prod-card">
      <div className="inv-card-header">
        <div>
          <button className="prod-back-btn" onClick={onBack}>
            ← Back to Dish List
          </button>
          <h2 className="inv-card-title" style={{ marginTop: "0.5rem" }}>
            {dish.name}
          </h2>
          <p className="inv-card-sub">
            {dish.category} · {dish.yieldUnit}
          </p>
        </div>
      </div>
      <div className="prod-detail-body">
        <section className="inv-drawer-section">
          <h3 className="inv-drawer-section-title">Overview</h3>
          <div className="inv-overview-grid">
            <div className="inv-overview-item">
              <span className="inv-overview-label">Available Servings</span>
              <span
                className={`prod-serving prod-serving--${getServingStatus(servings)}`}
              >
                {servings} servings
              </span>
            </div>
            <div className="inv-overview-item">
              <span className="inv-overview-label">Limited by</span>
              <span className="inv-overview-value">{limiter}</span>
            </div>
            {expiry && (
              <div className="inv-overview-item">
                <span className="inv-overview-label">Expiry Warning</span>
                <span className="prod-expiry-warn">
                  <AlertTriangle size={13} /> {expiry}
                </span>
              </div>
            )}
            {sharedWith.length > 0 && (
              <div className="inv-overview-item">
                <span className="inv-overview-label">Shared With</span>
                <span className="inv-overview-value">
                  {sharedWith.join(", ")}
                </span>
              </div>
            )}
          </div>
        </section>

        <section className="inv-drawer-section">
          <h3 className="inv-drawer-section-title">Recipe</h3>
          <table className="inv-table">
            <thead>
              <tr>
                <th>Ingredient</th>
                <th>Qty per Dish</th>
                <th>Unit</th>
                <th>In Stock</th>
              </tr>
            </thead>
            <tbody>
              {dish.recipe.map((r) => {
                const inv = stock.find((s) => s.name === r.ingredient);
                const missing = !inv || inv.currentStock === 0;
                return (
                  <tr key={r.ingredient}>
                    <td
                      className={
                        missing
                          ? "prod-limiter--missing inv-td-bold"
                          : "inv-td-bold"
                      }
                    >
                      {r.ingredient}
                      {missing && " ⚠"}
                    </td>
                    <td>{r.qty}</td>
                    <td className="inv-td-muted">{r.unit}</td>
                    <td
                      className={
                        missing ? "prod-limiter--missing" : "inv-td-muted"
                      }
                    >
                      {inv
                        ? `${inv.currentStock} ${inv.unit}`
                        : "Not in inventory"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        {sharedWith.length > 0 && (
          <section className="inv-drawer-section">
            <h3 className="inv-drawer-section-title">Ingredient Pools</h3>
            {dish.sharedIngredients?.map((ing) => {
              const inv = stock.find((s) => s.name === ing);
              if (!inv) return null;
              const consumers = allDishes.filter((d) =>
                d.recipe?.some((r) => r.ingredient === ing),
              );
              return (
                <div key={ing} className="prod-pool-card">
                  <div className="prod-pool-header">
                    <span className="prod-pool-name">{ing} Pool</span>
                    <span className="prod-pool-total">
                      Total: {inv.currentStock} {inv.unit}
                    </span>
                  </div>
                  <table className="inv-table">
                    <thead>
                      <tr>
                        <th>Dish</th>
                        <th>Usage per Serving</th>
                      </tr>
                    </thead>
                    <tbody>
                      {consumers.map((c) => {
                        const r = c.recipe.find((ri) => ri.ingredient === ing);
                        return (
                          <tr key={c.id}>
                            <td>{c.name}</td>
                            <td>
                              {r?.qty} {r?.unit}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </section>
        )}
      </div>
    </div>
  );
}

function Capacity({ dishes, stock, onViewDetail }) {
  const rows = useMemo(
    () =>
      dishes.map((d) => {
        const { servings, limiter, missing } = calcServings(d, stock);
        const sharedWith = getSharedWith(d, dishes);
        return { ...d, servings, limiter, missing, sharedWith };
      }),
    [dishes, stock],
  );

  return (
    <div className="prod-card">
      <div className="inv-card-header">
        <div>
          <h2 className="inv-card-title">Production Capacity</h2>
          <p className="inv-card-sub">
            Servings available from current stock levels.
          </p>
        </div>
      </div>
      <table className="inv-table">
        <thead>
          <tr>
            <th>Dish</th>
            <th>Available Servings</th>
            <th>Limiting Ingredient</th>
            <th>Shared Ingredient</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="prod-row"
              onClick={() => onViewDetail(row)}
            >
              <td className="inv-td-bold">{row.name}</td>
              <td>
                <span
                  className={`prod-serving prod-serving--${getServingStatus(row.servings)}`}
                >
                  {row.servings} servings
                </span>
              </td>
              <td
                className={
                  row.missing ? "prod-limiter--missing" : "inv-td-muted"
                }
              >
                {row.limiter}
              </td>
              <td className="inv-td-muted">
                {row.sharedWith.length ? row.sharedWith.join(", ") : "—"}
              </td>
              <td>
                <ChevronRight size={16} className="inv-td-muted" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Planning({ dishes, stock }) {
  const [targets, setTargets] = useState({});
  const [aiResult, setAiResult] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const setTarget = (id, val) =>
    setTargets((p) => ({ ...p, [id]: parseInt(val) || 0 }));

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

  const conflicts = useMemo(() => {
    return Object.entries(ingredientUsage).filter(([name, { total }]) => {
      const inv = stock.find((s) => s.name === name);
      return !inv || inv.currentStock < total;
    });
  }, [ingredientUsage, stock]);

  const handleAI = async () => {
    setAiLoading(true);
    setAiResult("");

    const plan = dishes
      .map((d) => `${d.name}: ${targets[d.id] || 0} servings`)
      .join(", ");

    const lowStock = stock
      .filter((s) => s.status === "Low" || s.status === "Out")
      .map((s) => `${s.name}: ${s.currentStock} ${s.unit} (${s.status})`)
      .join(", ");

    const expiringStock = stock
      .filter((s) => s.expiryDate)
      .map((s) => {
        const days = Math.ceil(
          (new Date(s.expiryDate) - new Date()) / 86400000,
        );
        return days <= 3
          ? `${s.name} expires in ${days} day${days > 1 ? "s" : ""}`
          : null;
      })
      .filter(Boolean)
      .join(", ");

    const conflictStr = conflicts
      .map(([n, { total, unit }]) => {
        const inv = stock.find((s) => s.name === n);
        return `${n} needs ${total}${unit} but only has ${inv?.currentStock || 0}${unit}`;
      })
      .join("; ");

    const promptText = [
      "You are a coffee shop production planner. Give practical recommendations based on current stock.",
      "",
      `Production plan: ${plan || "none set"}.`,
      `Low or out of stock: ${lowStock || "none"}.`,
      `Expiring soon: ${expiringStock || "none"}.`,
      conflictStr ? `Stock conflicts: ${conflictStr}.` : "No stock conflicts.",
      "",
      "Recommendations needed:",
      "1. Which dishes to prioritize TODAY",
      "2. Which ingredients need urgent restocking and how much",
      "3. Any expiring ingredients to use up first",
      "Keep it under 120 words, practical and direct.",
    ].join("\n");

    try {
      const result = await askAI(promptText);
      setAiResult(result);
    } catch {
      setAiResult("AI unavailable. Please check your connection.");
    }
    setAiLoading(false);
  };

  const handleWhatsApp = () => {
    if (Object.entries(ingredientUsage).length === 0) return;
    const lines = Object.entries(ingredientUsage)
      .map(([name, { total, unit }]) => `- ${name}: ${total} ${unit}`)
      .join("%0A");
    const msg = `*Purchase Request - Kopi Nusantara*%0A%0AIngredient Requirements:%0A${lines}`;
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  return (
    <div className="prod-planning-layout">
      <div className="prod-card" style={{ flex: 1 }}>
        <div className="inv-card-header">
          <div>
            <h2 className="inv-card-title">Production Planning</h2>
            <p className="inv-card-sub">
              Set target quantities for today's production run.
            </p>
          </div>
          <button
            className="inv-btn inv-btn--primary"
            onClick={handleAI}
            disabled={aiLoading}
          >
            <Sparkles size={14} /> {aiLoading ? "Analyzing..." : "AI Analysis"}
          </button>
        </div>
        <table className="inv-table">
          <thead>
            <tr>
              <th>Dish</th>
              <th>Target Quantity</th>
              <th>Estimated Usage</th>
            </tr>
          </thead>
          <tbody>
            {dishes.map((d) => {
              const qty = targets[d.id] || 0;
              const usage =
                d.recipe
                  ?.map((r) => `${r.ingredient}: ${r.qty * qty}${r.unit}`)
                  .join(", ") || "—";
              return (
                <tr key={d.id}>
                  <td className="inv-td-bold">{d.name}</td>
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
      </div>

      <div className="prod-ai-sidebar">
        <h3 className="inv-drawer-section-title">AI Summary</h3>
        {conflicts.length > 0 && (
          <div className="prod-conflict-list">
            {conflicts.map(([name, { total, unit }]) => {
              const inv = stock.find((s) => s.name === name);
              return (
                <div key={name} className="prod-conflict-item">
                  <TriangleAlert size={14} /> {name} needs {total}
                  {unit}, has {inv?.currentStock || 0}
                  {unit}
                </div>
              );
            })}
          </div>
        )}

        <div className="prod-usage-list">
          <p className="prod-usage-title">Ingredient Requirements</p>
          {Object.entries(ingredientUsage).length === 0 ? (
            <p className="inv-td-muted" style={{ fontSize: "0.82rem" }}>
              Set quantities above to see requirements.
            </p>
          ) : (
            Object.entries(ingredientUsage).map(([name, { total, unit }]) => {
              const inv = stock.find((s) => s.name === name);
              const ok = inv && inv.currentStock >= total;
              return (
                <div
                  key={name}
                  className={`prod-usage-item ${ok ? "" : "prod-usage-item--warn"}`}
                >
                  <span>{name}</span>
                  <span>
                    {total} {unit}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {aiResult && (
          <div className="prod-ai-result">
            <div className="inv-ai-header">
              <Sparkles size={14} className="inv-ai-icon" />
              <span className="inv-ai-title">AI Suggestion</span>
            </div>
            <p className="prod-ai-text">{aiResult}</p>
          </div>
        )}

        <div className="prod-ai-actions">
          <button
            className="inv-btn inv-btn--outline"
            style={{ width: "100%" }}
          >
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

function IngredientPools({ dishes, stock }) {
  const [selected, setSelected] = useState(null);

  const pools = useMemo(() => {
    const map = {};
    dishes.forEach((d) => {
      d.recipe?.forEach(({ ingredient, qty, unit }) => {
        if (!map[ingredient]) {
          map[ingredient] = { dishes: [], unit };
        }
        map[ingredient].dishes.push({ name: d.name, qty });
      });
    });
    return Object.entries(map).map(([name, { dishes: usedBy, unit }]) => {
      const inv = stock.find((s) => s.name === name);
      const totalUsed = usedBy.reduce((s, d) => s + d.qty, 0);
      return {
        name,
        totalStock: inv?.currentStock || 0,
        unit: inv?.unit || unit,
        usedBy,
        totalUsed,
        remaining: inv?.currentStock || 0,
      };
    });
  }, [dishes, stock]);

  return (
    <div className="prod-card">
      <div className="inv-card-header">
        <div>
          <h2 className="inv-card-title">Ingredient Allocation</h2>
          <p className="inv-card-sub">
            Shared ingredients used across multiple dishes.
          </p>
        </div>
      </div>
      <table className="inv-table">
        <thead>
          <tr>
            <th>Ingredient</th>
            <th>Total Stock</th>
            <th>Used By Dishes</th>
            <th>Usage / Serving</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {pools.map((p) => (
            <tr
              key={p.name}
              className="prod-row"
              onClick={() => setSelected(selected?.name === p.name ? null : p)}
            >
              <td className="inv-td-bold">{p.name}</td>
              <td>
                <span className="inv-stock-num">{p.totalStock}</span>{" "}
                <span className="inv-stock-unit">{p.unit}</span>
              </td>
              <td className="inv-td-muted">
                {p.usedBy.map((d) => d.name).join(", ")}
              </td>
              <td className="inv-td-muted">
                {p.totalUsed} {p.unit}
              </td>
              <td>
                <ChevronRight
                  size={16}
                  className={`inv-td-muted ${selected?.name === p.name ? "prod-chevron-open" : ""}`}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selected && (
        <div className="prod-pool-expand">
          <h3 className="inv-drawer-section-title">
            {selected.name} — Allocation Breakdown
          </h3>
          <table className="inv-table">
            <thead>
              <tr>
                <th>Dish</th>
                <th>Usage per Serving</th>
              </tr>
            </thead>
            <tbody>
              {selected.usedBy.map((d) => (
                <tr key={d.name}>
                  <td>{d.name}</td>
                  <td>
                    {d.qty} {selected.unit}
                  </td>
                </tr>
              ))}
              <tr className="prod-pool-remaining">
                <td className="inv-td-bold">Total Stock Available</td>
                <td className="inv-td-bold">
                  {selected.totalStock} {selected.unit}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Alerts({ dishes, stock }) {
  const alerts = useMemo(() => {
    const list = [];
    dishes.forEach((d) => {
      const { servings, limiter, missing } = calcServings(d, stock);
      if (servings === 0) {
        list.push({
          type: "out",
          dish: d.name,
          limiter,
          message: `Out of stock — cannot produce`,
          missing,
        });
      } else if (servings <= 5) {
        list.push({
          type: "low",
          dish: d.name,
          limiter,
          message: `Only ${servings} serving${servings !== 1 ? "s" : ""} remaining`,
          missing,
        });
      }
      const expiry = getExpiryWarning(d, stock);
      if (expiry) {
        list.push({
          type: "expiry",
          dish: d.name,
          limiter: expiry,
          message: `Ingredient expiring soon`,
        });
      }
    });
    return list;
  }, [dishes, stock]);

  return (
    <div className="prod-card">
      <div className="inv-card-header">
        <div>
          <h2 className="inv-card-title">Production Alerts</h2>
          <p className="inv-card-sub">
            {alerts.length} active alert{alerts.length !== 1 ? "s" : ""}{" "}
            requiring attention.
          </p>
        </div>
      </div>
      <div className="prod-alerts-list">
        {alerts.length === 0 && (
          <p className="inv-empty">
            No alerts. All dishes have sufficient stock. ✓
          </p>
        )}
        {alerts.map((a, i) => (
          <div key={i} className={`prod-alert-card prod-alert-card--${a.type}`}>
            <div className="prod-alert-icon">
              <AlertTriangle size={18} />
            </div>
            <div className="prod-alert-body">
              <p className="prod-alert-dish">{a.dish}</p>
              <p className="prod-alert-msg">{a.message}</p>
              <p className="prod-alert-sub">Limited by: {a.limiter}</p>
            </div>
            <div className="prod-alert-actions">
              <button
                className="inv-btn inv-btn--outline"
                style={{ fontSize: "0.78rem", padding: "0.3rem 0.75rem" }}
              >
                View Dish
              </button>
              <button
                className="inv-btn inv-btn--outline"
                style={{ fontSize: "0.78rem", padding: "0.3rem 0.75rem" }}
              >
                Plan Restock
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Create Dish Modal ─────────────────────────────────────────────────────────

function CreateDishModal({ stock, onClose, onSave }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Coffee");
  const [yieldUnit, setYieldUnit] = useState("cup");
  const [recipe, setRecipe] = useState([
    { ingredient: "", qty: 0, unit: "g", wasteBuffer: 0 },
  ]);
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const addIngredient = () =>
    setRecipe((p) => [
      ...p,
      { ingredient: "", qty: 0, unit: "g", wasteBuffer: 0 },
    ]);
  const removeIngredient = (i) =>
    setRecipe((p) => p.filter((_, idx) => idx !== i));
  const updateIngredient = (i, field, val) =>
    setRecipe((p) =>
      p.map((r, idx) =>
        idx === i
          ? { ...r, [field]: field === "qty" ? parseFloat(val) || 0 : val }
          : r,
      ),
    );

  const handleAI = async () => {
    if (!name) return;
    setAiLoading(true);
    setAiSuggestion("");
    const ingredientList = stock.map((s) => `${s.name} (${s.unit})`).join(", ");
    const recipeStr = recipe
      .filter((r) => r.ingredient)
      .map((r) => `${r.ingredient}: ${r.qty}${r.unit}`)
      .join(", ");
    const prompt = `You are a coffee shop recipe assistant. 
Dish name: "${name}", category: "${category}", yield: 1 ${yieldUnit}.
Current recipe: ${recipeStr || "none yet"}.
Available ingredients: ${ingredientList}.
Suggest: 1) Any unit conversions needed, 2) A recommended waste buffer % for fresh ingredients, 3) Any missing key ingredients for a typical ${name}. Be brief (max 80 words).`;
    try {
      const result = await askAI(prompt);
      setAiSuggestion(result);
    } catch {
      setAiSuggestion("AI unavailable.");
    }
    setAiLoading(false);
  };

  const missingIngredients = recipe.filter(
    (r) => r.ingredient && !stock.find((s) => s.name === r.ingredient),
  );

  const handleSave = () => {
    if (!name.trim()) return;
    const newDish = {
      id: Date.now(),
      name,
      category,
      yieldUnit,
      recipe: recipe.filter((r) => r.ingredient && r.qty > 0),
      sharedIngredients: recipe
        .filter((r) => r.ingredient)
        .map((r) => r.ingredient)
        .filter((ing) => stock.find((s) => s.name === ing)),
    };
    onSave(newDish);
    onClose();
  };

  return (
    <div className="inv-modal-overlay">
      <div className="inv-modal" style={{ maxWidth: 640 }}>
        <div className="inv-modal-header">
          <h2 className="inv-modal-title">Create Dish Recipe</h2>
          <button className="inv-modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="inv-modal-body">
          <div className="prod-form-row">
            <div className="prod-form-group">
              <label className="prod-label">Dish Name</label>
              <input
                className="prod-input"
                placeholder="e.g. Cheese Burger"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="prod-form-group">
              <label className="prod-label">Category</label>
              <select
                className="inv-select"
                style={{ width: "100%", padding: "0.5rem 0.75rem" }}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {["Coffee", "Non-Coffee", "Pastry", "Food", "Beverage"].map(
                  (c) => (
                    <option key={c}>{c}</option>
                  ),
                )}
              </select>
            </div>
          </div>

          <div className="prod-form-group">
            <label className="prod-label">Yield Unit</label>
            <input
              className="prod-input"
              placeholder="e.g. serving / cup / pcs"
              value={yieldUnit}
              onChange={(e) => setYieldUnit(e.target.value)}
            />
          </div>

          <div className="prod-form-group">
            <label className="prod-label">Recipe Elements</label>
            <table className="inv-table">
              <thead>
                <tr>
                  <th>Ingredient</th>
                  <th>Quantity</th>
                  <th>Unit</th>
                  <th>Waste Buffer %</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recipe.map((r, i) => (
                  <tr key={i}>
                    <td>
                      <select
                        className="inv-select"
                        style={{ width: "100%" }}
                        value={r.ingredient}
                        onChange={(e) =>
                          updateIngredient(i, "ingredient", e.target.value)
                        }
                      >
                        <option value="">Select ingredient...</option>
                        {stock.map((s) => (
                          <option key={s.name}>{s.name}</option>
                        ))}
                        <option value="__custom__">+ Type custom name</option>
                      </select>
                      {r.ingredient === "__custom__" && (
                        <input
                          className="prod-input"
                          placeholder="Custom ingredient name"
                          style={{ marginTop: "0.25rem" }}
                          onChange={(e) =>
                            updateIngredient(i, "ingredient", e.target.value)
                          }
                        />
                      )}
                    </td>
                    <td>
                      <input
                        type="number"
                        className="prod-qty-input"
                        value={r.qty || ""}
                        min={0}
                        onChange={(e) =>
                          updateIngredient(i, "qty", e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <select
                        className="inv-select"
                        value={r.unit}
                        onChange={(e) =>
                          updateIngredient(i, "unit", e.target.value)
                        }
                      >
                        {["g", "ml", "pcs", "kg", "l", "tbsp", "tsp"].map(
                          (u) => (
                            <option key={u}>{u}</option>
                          ),
                        )}
                      </select>
                    </td>
                    <td>
                      <input
                        type="number"
                        className="prod-qty-input"
                        value={r.wasteBuffer || ""}
                        min={0}
                        max={50}
                        placeholder="0"
                        onChange={(e) =>
                          updateIngredient(i, "wasteBuffer", e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <button
                        className="prod-remove-btn"
                        onClick={() => removeIngredient(i)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button className="prod-add-ingredient-btn" onClick={addIngredient}>
              <Plus size={14} /> Add Ingredient
            </button>
          </div>

          {missingIngredients.length > 0 && (
            <div className="prod-missing-warning">
              <AlertTriangle size={14} />
              <span>
                These ingredients are not in inventory:{" "}
                <strong>
                  {missingIngredients.map((r) => r.ingredient).join(", ")}
                </strong>
                . Servings will show as 0 until stock is added.
              </span>
            </div>
          )}

          <div className="inv-ai-panel">
            <div className="inv-ai-header">
              <Sparkles size={16} className="inv-ai-icon" />
              <span className="inv-ai-title">AI Assistance</span>
              <button
                className="inv-btn inv-btn--outline"
                style={{
                  marginLeft: "auto",
                  fontSize: "0.75rem",
                  padding: "0.25rem 0.65rem",
                }}
                onClick={handleAI}
                disabled={aiLoading}
              >
                {aiLoading ? "Thinking..." : "Ask AI"}
              </button>
            </div>
            {aiSuggestion ? (
              <p className="prod-ai-text" style={{ marginTop: "0.5rem" }}>
                {aiSuggestion}
              </p>
            ) : (
              <ul className="inv-ai-list">
                <li>Suggested unit conversion based on historical usage</li>
                <li>Suggested waste buffer for fresh ingredients</li>
              </ul>
            )}
          </div>
        </div>

        <div className="inv-modal-footer">
          <button className="inv-btn inv-btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="inv-btn inv-btn--primary"
            onClick={handleSave}
            disabled={!name.trim()}
          >
            Save Dish
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Production Page ──────────────────────────────────────────────────────

const TABS = [
  "Dish List",
  "Capacity",
  "Planning",
  "Ingredient Pools",
  "Alerts",
];

export default function Production({ stock }) {
  const [activeTab, setActiveTab] = useState("Dish List");
  const [dishes, setDishes] = useState(initialDishes);
  const [detailDish, setDetailDish] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  const handleViewDetail = (dish) => {
    setDetailDish(dish);
    setActiveTab("Dish List");
  };

  const handleSaveDish = (newDish) => {
    setDishes((p) => [...p, newDish]);
  };

  return (
    <div className="inv-wrap">
      <div className="inv-page-header">
        <h1 className="inv-page-title">Production</h1>
        <div className="inv-tabs">
          {TABS.map((t) => (
            <button
              key={t}
              className={`inv-tab ${activeTab === t ? "inv-tab--active" : ""}`}
              onClick={() => {
                setActiveTab(t);
                setDetailDish(null);
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "Dish List" && !detailDish && (
        <DishList
          dishes={dishes}
          stock={stock}
          onViewDetail={(d) => setDetailDish(d)}
          onCreateDish={() => setShowCreate(true)}
        />
      )}

      {activeTab === "Dish List" && detailDish && (
        <DishDetail
          dish={detailDish}
          stock={stock}
          allDishes={dishes}
          onBack={() => setDetailDish(null)}
        />
      )}

      {activeTab === "Capacity" && (
        <Capacity
          dishes={dishes}
          stock={stock}
          onViewDetail={(d) => {
            setDetailDish(d);
            setActiveTab("Dish List");
          }}
        />
      )}

      {activeTab === "Planning" && <Planning dishes={dishes} stock={stock} />}
      {activeTab === "Ingredient Pools" && (
        <IngredientPools dishes={dishes} stock={stock} />
      )}
      {activeTab === "Alerts" && <Alerts dishes={dishes} stock={stock} />}

      {showCreate && (
        <CreateDishModal
          stock={stock}
          onClose={() => setShowCreate(false)}
          onSave={handleSaveDish}
        />
      )}
    </div>
  );
}
