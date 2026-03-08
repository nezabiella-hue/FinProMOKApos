// components/Production/DishList.jsx
import { useState, useMemo, useEffect, useRef } from "react";
import { Search, ChevronDown, Plus, AlertTriangle, ChevronRight } from "lucide-react";
import { dishCategories, availabilityOptions } from "../../data/mockproduction";
import {
  calcAllocatedServings,
  calcDishSalesVolumes,
  getExpiryWarning,
  getSharedWith,
} from "../../utils/productionHelpers";
import { saleTransactions } from "../../data/mockTransactions";

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
        const expiry = getExpiryWarning(d, stock);
        const sharedWith = getSharedWith(d, dishes);
        return { ...d, servings, limiter, status, expiry, sharedWith };
      }),
    [dishes, stock, salesVolumes, allocationOverrides],
  );

  // Track warned dishes across re-renders so we only warn once per dish per session
  const warnedDishes = useRef(new Set());

  useEffect(() => {
    const newlyLow = rows
      .filter((r) => r.status === "low" && !warnedDishes.current.has(r.name))
      .map((r) => r.name);

    if (newlyLow.length > 0) {
      newlyLow.forEach((name) => warnedDishes.current.add(name));
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
          <select className="inv-select" value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
            {dishCategories.map((c) => <option key={c}>{c}</option>)}
          </select>
          <ChevronDown size={14} className="inv-select-icon" />
        </div>
        <div className="inv-select-wrap">
          <select className="inv-select" value={availFilter} onChange={(e) => setAvailFilter(e.target.value)}>
            {availabilityOptions.map((a) => <option key={a}>{a}</option>)}
          </select>
          <ChevronDown size={14} className="inv-select-icon" />
        </div>
      </div>

      <table className="inv-table">
        <thead>
          <tr>
            <th>Dish Name</th>
            <th>Category</th>
            <th>Allocated Servings</th>
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
              <td><span className="prod-cat-badge">{row.category}</span></td>
              <td>
                {row.status === "red" && (
                  <span className="prod-serving prod-serving--out">
                    Out of stock
                  </span>
                )}
                {row.status === "yellow" && (
                  <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <span className="prod-serving prod-serving--low">
                      0 — pool available
                    </span>
                    <button
                      className="inv-btn inv-btn--outline"
                      style={{ fontSize: "0.72rem", padding: "0.2rem 0.5rem" }}
                      onClick={(e) => { e.stopPropagation(); onReallocate && onReallocate(row); }}
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
              <td className="inv-td-muted">{row.limiter}</td>
              <td className="inv-td-muted">
                {row.sharedWith.length ? row.sharedWith.join(", ") : "—"}
              </td>
              <td>
                {row.expiry ? (
                  <span className="prod-expiry-warn">
                    <AlertTriangle size={13} /> {row.expiry}
                  </span>
                ) : "—"}
              </td>
              <td><ChevronRight size={16} className="inv-td-muted" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
