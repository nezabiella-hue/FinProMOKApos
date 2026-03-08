// Components/Inventory/StockDetailDrawer.jsx
import { X, Package } from "lucide-react";
import { getExpiryStatus } from "../../data/mockinventory";
import { getErrorRate, getErrorSeverity } from "../../data/mockUsageErrorRate";
import { initialDishes } from "../../data/mockproduction";

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
                </span>
              </div>
              <div className="inv-overview-item">
                <span className="inv-overview-label">Status</span>
                <span className={getStatusClass(item.status)}>{item.status}</span>
              </div>
              <div className="inv-overview-item">
                <span className="inv-overview-label">Expiry</span>
                <span className={getExpiryStatus(item.expiryDate) !== "Fresh" ? "inv-expiry--warn" : "inv-overview-value"}>
                  {getExpiryStatus(item.expiryDate)}
                </span>
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
            ) : (
              <div className="inv-batches">
                {item.batches.map((b) => (
                  <div key={b.label} className="inv-batch-card">
                    <span className="inv-batch-label">{b.label}</span>
                    <span className="inv-batch-amount">{b.amount} {b.unit}</span>
                    <span className="inv-batch-age">{b.age}</span>
                  </div>
                ))}
              </div>
            )}
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
