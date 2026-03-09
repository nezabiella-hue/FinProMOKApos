// Components/Inventory/StockDetailDrawer.jsx
import { X, Package } from "lucide-react";
import { getBatchExpiryInfo } from "../../utils/productionHelpers";
import { getErrorRate, getErrorSeverity } from "../../data/mockUsageErrorRate";
import { initialDishes } from "../../data/mockproduction";
import { predictExpiryDate, getExpiryRecord } from "../../data/mockExpiryHistory";

function getStatusClass(status) {
  if (status === "Low") return "inv-badge inv-badge--low";
  if (status === "Out") return "inv-badge inv-badge--out";
  return "inv-badge inv-badge--ok";
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

export default function StockDetailDrawer({ item, liveErrorRates, onClose, onOpenOpname }) {
  const errData = liveErrorRates[item.name] || getErrorRate(item.name);

  return (
    <div className="inv-drawer-overlay" onClick={onClose}>
      <div className="inv-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="inv-drawer-header">
          <div className="inv-drawer-title-wrap">
            <Package size={20} className="inv-drawer-icon" />
            <h2 className="inv-drawer-title">{item.name}</h2>
          </div>
          <button className="inv-modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="inv-drawer-body">
          <section className="inv-drawer-section">
            <h3 className="inv-drawer-section-title">Overview</h3>
            <div className="inv-overview-grid">
              <div className="inv-overview-item">
                <span className="inv-overview-label">Current Stock</span>
                <span className="inv-overview-value">
                  {item.currentStock} {item.unit}
                  {item.packagingUnit && (
                    <span className="inv-drawer-pkg">
                      {" "}≈ {Math.floor(item.currentStock / item.packagingUnit.size)} {item.packagingUnit.label}
                      {item.currentStock % item.packagingUnit.size > 0
                        ? ` + ${Math.round(item.currentStock % item.packagingUnit.size * 100) / 100} ${item.unit} partial`
                        : ""}
                    </span>
                  )}
                </span>
              </div>
              <div className="inv-overview-item">
                <span className="inv-overview-label">Status</span>
                <span className={getStatusClass(item.status)}>{item.status}</span>
              </div>
              <div className="inv-overview-item">
                <span className="inv-overview-label">Expiry</span>
                {(() => {
                  const exp = getBatchExpiryInfo(item);
                  if (exp.length === 0) return <span className="inv-overview-value">Fresh</span>;
                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                      {exp.map((b) => (
                        <span key={b.label} className="inv-expiry--warn" style={{ fontSize: "0.85rem", display: "block" }}>
                          {b.percentage}% {b.status}
                          <span style={{ fontWeight: 400, marginLeft: "0.25rem" }}>
                            ({b.label})
                          </span>
                        </span>
                      ))}
                    </div>
                  );
                })()}
              </div>
              <div className="inv-overview-item">
                <span className="inv-overview-label">Used By</span>
                <span className="inv-overview-value">
                  {item.usedBy.length ? item.usedBy.join(", ") : "—"}
                </span>
              </div>
              {errData?.errorRate !== 0 && (
                <div className="inv-overview-item">
                  <span className="inv-overview-label">Usage Error Rate</span>
                  <div>
                    {renderErrorRate(item.name, liveErrorRates)}
                    <p style={{ fontSize: "0.75rem", color: "#8aab97", margin: "0.15rem 0 0" }}>
                      {errData?.note}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="inv-drawer-section">
            <h3 className="inv-drawer-section-title">Affected Dishes</h3>
            {initialDishes.filter((d) => d.recipe.some((r) => r.ingredient === item.name)).length === 0 ? (
              <p className="inv-td-muted">No dishes use this ingredient.</p>
            ) : (
              <table className="inv-table">
                <thead>
                  <tr>
                    <th>Dish</th>
                    <th>Remaining Servings</th>
                  </tr>
                </thead>
                <tbody>
                  {initialDishes
                    .filter((d) => d.recipe.some((r) => r.ingredient === item.name))
                    .map((dish) => {
                      const recipeEntry = dish.recipe.find((r) => r.ingredient === item.name);
                      const remaining = recipeEntry
                        ? Math.floor(item.currentStock / recipeEntry.qty)
                        : 0;
                      return (
                        <tr key={dish.name}>
                          <td>{dish.name}</td>
                          <td>can make {remaining} more</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            )}
          </section>

          <section className="inv-drawer-section">
            <h3 className="inv-drawer-section-title">Batch / Freshness</h3>
            {item.batches.length === 0 ? (
              <p className="inv-td-muted">No batch data available.</p>
            ) : (() => {
              const expiryRecord = getExpiryRecord(item.name);
              const isAdjusted = expiryRecord?.patternStatus === "confirmed";
              return (
                <div className="inv-batches">
                  {item.batches.map((b) => {
                    const predicted = b.purchaseDate && item.shelfLifeDays
                      ? predictExpiryDate(item.name, b.purchaseDate, item.shelfLifeDays)
                      : null;
                    const expiryWarning = predicted
                      ? (() => {
                          const days = Math.ceil((new Date(predicted) - new Date()) / 86400000);
                          if (days <= 0) return "Expired";
                          if (days <= 3) return `Expires in ${days} day${days > 1 ? "s" : ""}`;
                          return "Fresh";
                        })()
                      : null;
                    const isExpiring = expiryWarning && expiryWarning !== "Fresh";
                    return (
                      <div key={b.label} className="inv-batch-card">
                        <span className="inv-batch-label">{b.label}</span>
                        <span className="inv-batch-amount">{b.amount} {b.unit}</span>
                        <span className="inv-batch-age">{b.age}</span>
                        {b.purchaseDate && (
                          <div style={{ marginTop: "0.35rem", fontSize: "0.75rem", color: "#6b7280" }}>
                            <div>Purchased: <strong>{b.purchaseDate}</strong></div>
                            {predicted && (
                              <div style={{ marginTop: "0.15rem" }}>
                                Expected expiry:{" "}
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
              );
            })()}
          </section>

          <section className="inv-drawer-section">
            <h3 className="inv-drawer-section-title">Verification Actions</h3>
            <div className="inv-drawer-actions">
              <button
                className="inv-btn inv-btn--primary"
                onClick={() => { onClose(); onOpenOpname(); }}
              >
                Upload Stock Opname
              </button>
              <button className="inv-btn inv-btn--outline">Manual Stock Adjustment</button>
              <button className="inv-btn inv-btn--outline">Confirm Discrepancy</button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
