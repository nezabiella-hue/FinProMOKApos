// components/Production/DishList.jsx
import { useState, useMemo } from "react";
import { Search, ChevronDown, Plus, AlertTriangle, ChevronRight } from "lucide-react";
import { dishCategories, availabilityOptions } from "../../data/mockproduction";
import { calcServings, getServingStatus, getExpiryWarning, getSharedWith } from "../../utils/productionHelpers";

export default function DishList({ dishes, stock, onViewDetail, onCreateDish }) {
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
            <th>Available Servings</th>
            <th>Limiting Ingredient</th>
            <th>Shared With</th>
            <th>Expiry Warning</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((row) => (
            <tr key={row.id} className="prod-row" onClick={() => onViewDetail(row)}>
              <td className="inv-td-bold">{row.name}</td>
              <td><span className="prod-cat-badge">{row.category}</span></td>
              <td>
                <span className={`prod-serving prod-serving--${row.status}`}>
                  {row.servings} serving{row.servings !== 1 ? "s" : ""}
                  {row.missing && <span className="prod-missing-flag"> ⚠ Missing stock</span>}
                </span>
              </td>
              <td className={row.missing ? "prod-limiter--missing" : "inv-td-muted"}>
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
