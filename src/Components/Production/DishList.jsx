// components/Production/DishList.jsx
import { useState, useMemo, useEffect, useRef } from "react";
import { Search, ChevronDown, Plus, AlertTriangle, ChevronRight, X } from "lucide-react";
import { dishCategories, availabilityOptions } from "../../data/mockproduction";
import {
  calcAllocatedServings,
  calcDishSalesVolumes,
} from "../../utils/productionHelpers";
import { predictExpiryDate } from "../../data/mockExpiryHistory";
import { saleTransactions } from "../../data/mockTransactions";

const DAYS_IN_PERIOD = 31;
const TARGET_DAYS = 7; // bar max = 7 days of stock (gives meaningful fill %)
const MAX_BARS = 3;

// ── Helpers ───────────────────────────────────────────────

// For each recipe ingredient, compute:
//   maxNeeded = avg daily servings of this dish × effective qty per serving
//   fillPct   = current stock / maxNeeded (capped visually at 100%)
// Returns array sorted by fillPct ascending (worst first)
function calcStockBars(dish, stock, totalMonthlySales) {
  const avgServingsPerDay = totalMonthlySales / DAYS_IN_PERIOD;
  return dish.recipe
    .map(({ ingredient, qty, wasteBuffer }) => {
      const inv = stock.find((s) => s.name === ingredient);
      if (!inv) return null;
      const effectiveQty = qty * (1 + (wasteBuffer || 0) / 100);
      const maxNeeded = avgServingsPerDay * effectiveQty * TARGET_DAYS;
      const fillPct = maxNeeded > 0 ? inv.currentStock / maxNeeded : 1;
      return {
        ingredient,
        currentStock: inv.currentStock,
        maxNeeded,
        fillPct,
        unit: inv.unit,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.fillPct - b.fillPct); // worst first
}

// Scan each ingredient's batches for ones expiring within 3 days.
// Returns [{ ingredient, daysLeft, pct }] — pct = expiring amount / currentStock
function calcDetailedExpiry(dish, stock) {
  const warnings = [];
  const today = new Date();

  for (const { ingredient } of dish.recipe) {
    const inv = stock.find((s) => s.name === ingredient);
    if (!inv?.batches?.length || !inv.shelfLifeDays) continue;

    let expiringAmount = 0;
    let minDaysLeft = Infinity;

    for (const batch of inv.batches) {
      const dateRef = batch.madeDate || batch.purchaseDate;
      if (!dateRef) continue;
      const predicted = predictExpiryDate(ingredient, dateRef, inv.shelfLifeDays);
      const daysLeft = Math.ceil((new Date(predicted) - today) / 86400000);
      // Only flag if within the final 25% of shelf life AND <= 3 days.
      // This prevents short-shelf-life items (e.g. Ice Cubes: 1d) from
      // showing false "expiring" warnings when they're simply fresh same-day stock.
      const warningThreshold = inv.shelfLifeDays * 0.25;
      if (daysLeft > 0 && daysLeft <= 3 && daysLeft <= warningThreshold) {
        expiringAmount += batch.amount;
        minDaysLeft = Math.min(minDaysLeft, daysLeft);
      }
    }

    if (expiringAmount > 0 && inv.currentStock > 0) {
      const pct = Math.round((expiringAmount / inv.currentStock) * 100);
      warnings.push({ ingredient, daysLeft: minDaysLeft, pct });
    }
  }

  return warnings;
}

function barColor(fillPct) {
  if (fillPct < 0.30) return "#ef4444"; // < 30% → red
  if (fillPct < 0.70) return "#f59e0b"; // 30–69% → amber
  return "#22c55e";                     // ≥ 70% → green
}

function fmtQty(n) {
  return n >= 10 ? Math.round(n) : parseFloat(n.toFixed(1));
}

// ── Component ─────────────────────────────────────────────

export default function DishList({
  dishes,
  stock,
  allocationOverrides = {},
  onViewDetail,
  onCreateDish,
  onReallocate,
  onLowServingWarn,
}) {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [availFilter, setAvailFilter] = useState("All");
  // ingSort: { ingredient, topDishId } | null
  const [ingSort, setIngSort] = useState(null);

  const salesVolumes = useMemo(() => calcDishSalesVolumes(saleTransactions), []);

  const rows = useMemo(
    () =>
      dishes.map((d) => {
        const { servings, limiter, status } = calcAllocatedServings(
          d,
          dishes,
          stock,
          salesVolumes,
          allocationOverrides,
        );
        const bars = calcStockBars(d, stock, salesVolumes[d.name] || 0);
        const expiryWarnings = calcDetailedExpiry(d, stock);
        return { ...d, servings, limiter, status, bars, expiryWarnings };
      }),
    [dishes, stock, salesVolumes, allocationOverrides],
  );

  // Warn once per session when a dish goes low
  const warnedDishes = useRef(new Set());
  useEffect(() => {
    const newlyLow = rows
      .filter((r) => r.status === "low" && !warnedDishes.current.has(r.name))
      .map((r) => r.name);
    if (newlyLow.length > 0) {
      newlyLow.forEach((n) => warnedDishes.current.add(n));
      if (onLowServingWarn) onLowServingWarn(newlyLow);
    }
  }, [rows, onLowServingWarn]);

  const filtered = rows.filter((r) => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === "All" || r.category === catFilter;
    const matchAvail =
      availFilter === "All" ||
      (availFilter === "Available" && r.status === "ok") ||
      (availFilter === "Low" && r.status === "yellow") ||
      (availFilter === "Out of Stock" && r.status === "red");
    return matchSearch && matchCat && matchAvail;
  });

  // Apply ingredient sort: clicked dish first, then all dishes sharing that
  // ingredient sorted by lowest fill% of that ingredient, then the rest
  const finalRows = useMemo(() => {
    if (!ingSort) return filtered;
    const { ingredient, topDishId } = ingSort;
    const top = filtered.find((r) => r.id === topDishId);
    const sharing = filtered
      .filter(
        (r) =>
          r.id !== topDishId &&
          r.recipe.some((rec) => rec.ingredient === ingredient),
      )
      .sort((a, b) => {
        const fa = a.bars.find((bar) => bar.ingredient === ingredient)?.fillPct ?? 1;
        const fb = b.bars.find((bar) => bar.ingredient === ingredient)?.fillPct ?? 1;
        return fa - fb;
      });
    const rest = filtered.filter(
      (r) =>
        r.id !== topDishId &&
        !r.recipe.some((rec) => rec.ingredient === ingredient),
    );
    return [top, ...sharing, ...rest].filter(Boolean);
  }, [filtered, ingSort]);

  const handleIngClick = (e, dishId, ingredient) => {
    e.stopPropagation();
    setIngSort((prev) =>
      prev?.ingredient === ingredient && prev?.topDishId === dishId
        ? null
        : { ingredient, topDishId: dishId },
    );
  };

  return (
    <div className="prod-card">
      <div className="inv-card-header">
        <div>
          <h2 className="inv-card-title">Dish Production</h2>
          <p className="inv-card-sub">
            Allocated servings distributed proportionally by sales volume.
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

      {/* Active ingredient sort chip */}
      {ingSort && (
        <div className="prod-sort-chip-row">
          <span className="prod-sort-chip">
            Sorted by:{" "}
            <strong>{ingSort.ingredient}</strong>
            <button
              className="prod-sort-chip-clear"
              onClick={() => setIngSort(null)}
              title="Clear sort"
            >
              <X size={11} />
            </button>
          </span>
        </div>
      )}

      <table className="inv-table">
        <thead>
          <tr>
            <th>Dish Name</th>
            <th>Category</th>
            <th>Allocated Servings</th>
            <th>Ingredients</th>
            <th>Expiry Warning</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {finalRows.map((row) => {
            const topBars = row.bars.slice(0, MAX_BARS);
            const extraCount = row.bars.length - MAX_BARS;
            const isIngSortTop =
              ingSort?.topDishId === row.id;

            return (
              <tr
                key={row.id}
                className={`prod-row${isIngSortTop ? " prod-row--sort-top" : ""}`}
                onClick={() => onViewDetail(row)}
              >
                <td className="inv-td-bold">{row.name}</td>
                <td>
                  <span className="prod-cat-badge">{row.category}</span>
                </td>
                <td>
                  {row.status === "red" && (
                    <span className="prod-serving prod-serving--out">
                      Out of stock
                    </span>
                  )}
                  {row.status === "yellow" && (
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.4rem",
                      }}
                    >
                      <span className="prod-serving prod-serving--low">
                        0 — pool available
                      </span>
                      <button
                        className="inv-btn inv-btn--outline"
                        style={{ fontSize: "0.72rem", padding: "0.2rem 0.5rem" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onReallocate && onReallocate(row);
                        }}
                      >
                        Reallocate
                      </button>
                    </span>
                  )}
                  {row.status === "low" && (
                    <span className="prod-serving prod-serving--low">
                      {row.servings} serving{row.servings !== 1 ? "s" : ""} ⚠
                    </span>
                  )}
                  {row.status === "ok" && (
                    <span className="prod-serving prod-serving--ok">
                      {row.servings} serving{row.servings !== 1 ? "s" : ""}
                    </span>
                  )}
                </td>

                {/* Stock bars */}
                <td>
                  <div className="prod-bars-cell">
                    {topBars.map((bar) => {
                      const pct = Math.min(100, bar.fillPct * 100);
                      const color = barColor(bar.fillPct);
                      const isActive = ingSort?.ingredient === bar.ingredient;
                      return (
                        <div key={bar.ingredient} className="prod-bar-wrap">
                          <div className="prod-bar-header">
                            <button
                              className={`prod-ing-btn${isActive ? " prod-ing-btn--active" : ""}`}
                              onClick={(e) =>
                                handleIngClick(e, row.id, bar.ingredient)
                              }
                              title="Click to sort by this ingredient"
                            >
                              {bar.ingredient}
                            </button>
                            <span className="prod-bar-fraction">
                              {fmtQty(bar.currentStock)}/
                              {fmtQty(bar.maxNeeded)}
                              {bar.unit}
                            </span>
                          </div>
                          <div className="prod-bar-track">
                            <div
                              className="prod-bar-fill"
                              style={{
                                width: `${pct.toFixed(1)}%`,
                                background: color,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                    {extraCount > 0 && (
                      <button
                        className="prod-bar-more"
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewDetail(row);
                        }}
                      >
                        +{extraCount} more
                      </button>
                    )}
                  </div>
                </td>

                {/* Detailed expiry */}
                <td>
                  {row.expiryWarnings.length > 0 ? (
                    <div className="prod-expiry-stack">
                      {row.expiryWarnings.map((w) => (
                        <span key={w.ingredient} className="prod-expiry-warn">
                          <AlertTriangle size={11} />
                          {w.ingredient} · {w.daysLeft}d left · {w.pct}%
                          expiring
                        </span>
                      ))}
                    </div>
                  ) : (
                    "—"
                  )}
                </td>

                <td>
                  <ChevronRight size={16} className="inv-td-muted" />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
