// Components/Inventory/StockTable.jsx
import { useState } from "react";
import { Search, ChevronDown } from "lucide-react";
import {
  categories,
  statusOptions,
  expiryOptions,
} from "../../data/mockinventory";
import { getBatchExpiryInfo, hasExpiringBatch } from "../../utils/productionHelpers";
import { getErrorRate, getErrorSeverity } from "../../data/mockUsageErrorRate";
import { liveSteps } from "../../data/mockLiveUpdate";

function getStatusClass(status) {
  if (status === "Low") return "inv-badge inv-badge--low";
  if (status === "Out") return "inv-badge inv-badge--out";
  return "inv-badge inv-badge--ok";
}

function getPackageCount(item) {
  if (!item.packagingUnit) return null;
  const full = Math.floor(item.currentStock / item.packagingUnit.size);
  const remainder = Math.round((item.currentStock % item.packagingUnit.size) * 100) / 100;
  return { full, remainder, label: item.packagingUnit.label };
}

function renderErrorRate(ingredientName, liveErrorRates) {
  const live = liveErrorRates[ingredientName];
  const baseline = getErrorRate(ingredientName);
  const err = live || baseline;
  if (!err || err.errorRate === 0) return <span className="inv-td-muted">—</span>;
  const severity = getErrorSeverity(err.errorRate);
  const color =
    err.direction === "under"
      ? "#2563eb"
      : severity === "high"
        ? "#991b1b"
        : severity === "medium"
          ? "#e65100"
          : "#6b7280";
  const label =
    err.direction === "under"
      ? `${err.errorRate}% under-used`
      : `+${err.errorRate}% over-used`;
  return (
    <span style={{ fontWeight: 700, color, fontSize: "0.85rem" }}>
      {label}
      {live?.isLive && (
        <span style={{ fontSize: "0.7rem", marginLeft: 4, color: "#2563eb" }}>
          ↑ updated
        </span>
      )}
    </span>
  );
}

export default function StockTable({
  stock,
  liveStep,
  liveErrorRates,
  onViewDetail,
  onLiveUpdate,
  onOpenOpname,
}) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [expiryFilter, setExpiryFilter] = useState("All Expiry");

  const filtered = stock.filter((item) => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory =
      categoryFilter === "All Categories" || item.category === categoryFilter;
    const matchStatus =
      statusFilter === "All Status" || item.status === statusFilter;
    const matchExpiry =
      expiryFilter === "All Expiry" ||
      (expiryFilter === "Fresh" && !hasExpiringBatch(item)) ||
      (expiryFilter === "Expiring Soon" && hasExpiringBatch(item));
    return matchSearch && matchCategory && matchStatus && matchExpiry;
  });

  return (
    <div className="inv-card">
      <div className="inv-card-header">
        <div>
          <h2 className="inv-card-title">Stock Status</h2>
          <p className="inv-card-sub">
            See exact ingredient-level details behind production shortages or expiry risks.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          {liveStep < liveSteps.length ? (
            <button
              className="inv-btn inv-btn--outline"
              onClick={onLiveUpdate}
              title={`Apply: ${liveSteps[liveStep].label}`}
            >
              ▶ Live Update ({liveSteps[liveStep].time} – {liveSteps[liveStep].label})
            </button>
          ) : (
            <button className="inv-btn inv-btn--outline" disabled>
              ✓ Day Simulation Complete
            </button>
          )}
          <button className="inv-btn inv-btn--primary" onClick={onOpenOpname}>
            Upload Stock Opname
          </button>
        </div>
      </div>

      <div className="inv-toolbar">
        <div className="inv-select-wrap">
          <select
            className="inv-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
          <ChevronDown size={14} className="inv-select-icon" />
        </div>
        <div className="inv-select-wrap">
          <select
            className="inv-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {statusOptions.map((s) => <option key={s}>{s}</option>)}
          </select>
          <ChevronDown size={14} className="inv-select-icon" />
        </div>
        <div className="inv-select-wrap">
          <select
            className="inv-select"
            value={expiryFilter}
            onChange={(e) => setExpiryFilter(e.target.value)}
          >
            {expiryOptions.map((e) => <option key={e}>{e}</option>)}
          </select>
          <ChevronDown size={14} className="inv-select-icon" />
        </div>
        <div className="inv-search-wrap">
          <Search size={14} className="inv-search-icon" />
          <input
            className="inv-search"
            placeholder="Search ingredient..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <table className="inv-table">
        <thead>
          <tr>
            <th>Ingredient</th>
            <th>Current Stock</th>
            <th>Status</th>
            <th>Expiry / Stale Risk</th>
            <th>Usage Error Rate</th>
            <th>Last Opname</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 && (
            <tr>
              <td colSpan={7} className="inv-empty">No ingredients found.</td>
            </tr>
          )}
          {filtered.map((item) => {
            const pkg = getPackageCount(item);
            return (
            <tr key={item.id}>
              <td className="inv-td-bold">{item.name}</td>
              <td>
                <div>
                  <span className="inv-stock-num">{item.currentStock}</span>
                  <span className="inv-stock-unit"> {item.unit}</span>
                </div>
                {pkg && (
                  <div className="inv-pkg-count">
                    ~{pkg.full} {pkg.label}{pkg.remainder > 0 ? ` + ${pkg.remainder} ${item.unit}` : ""}
                  </div>
                )}
              </td>
              <td>
                <span className={getStatusClass(item.status)}>{item.status}</span>
              </td>
              <td>
                {(() => {
                  const exp = getBatchExpiryInfo(item);
                  if (exp.length === 0) return <span className="inv-td-muted">Fresh</span>;
                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                      {exp.map((b) => (
                        <span key={b.label} className="inv-expiry--warn" style={{ fontSize: "0.82rem", display: "block" }}>
                          {b.percentage}% {b.status}
                          <span style={{ fontWeight: 400, color: "#92400e", marginLeft: "0.25rem" }}>
                            ({b.label}: {b.amount} {b.unit})
                          </span>
                        </span>
                      ))}
                    </div>
                  );
                })()}
              </td>
              <td>{renderErrorRate(item.name, liveErrorRates)}</td>
              <td className="inv-td-muted">{item.lastOpname}</td>
              <td>
                <button className="inv-link" onClick={() => onViewDetail(item)}>
                  View Detail
                </button>
              </td>
            </tr>
          );
          })}
        </tbody>
      </table>
    </div>
  );
}
