// components/Production/AlertsTab.jsx
import { useMemo } from "react";
import { AlertTriangle } from "lucide-react";
import { calcServings, getExpiryWarning } from "../../utils/productionHelpers";

export default function AlertsTab({ dishes, stock }) {
  const alerts = useMemo(() => {
    const list = [];
    dishes.forEach((d) => {
      const { servings, limiter, missing } = calcServings(d, stock);
      if (servings === 0) {
        list.push({ type: "out", dish: d.name, limiter, message: "Out of stock — cannot produce", missing });
      } else if (servings <= 5) {
        list.push({ type: "low", dish: d.name, limiter, message: `Only ${servings} serving${servings !== 1 ? "s" : ""} remaining`, missing });
      }
      const expiry = getExpiryWarning(d, stock);
      if (expiry) {
        list.push({ type: "expiry", dish: d.name, limiter: expiry, message: "Ingredient expiring soon" });
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
            {alerts.length} active alert{alerts.length !== 1 ? "s" : ""} requiring attention.
          </p>
        </div>
      </div>
      <div className="prod-alerts-list">
        {alerts.length === 0 && (
          <p className="inv-empty">No alerts. All dishes have sufficient stock. ✓</p>
        )}
        {alerts.map((a, i) => (
          <div key={i} className={`prod-alert-card prod-alert-card--${a.type}`}>
            <div className="prod-alert-icon"><AlertTriangle size={18} /></div>
            <div className="prod-alert-body">
              <p className="prod-alert-dish">{a.dish}</p>
              <p className="prod-alert-msg">{a.message}</p>
              <p className="prod-alert-sub">Limited by: {a.limiter}</p>
            </div>
            <div className="prod-alert-actions">
              <button className="inv-btn inv-btn--outline" style={{ fontSize: "0.78rem", padding: "0.3rem 0.75rem" }}>
                View Dish
              </button>
              <button className="inv-btn inv-btn--outline" style={{ fontSize: "0.78rem", padding: "0.3rem 0.75rem" }}>
                Plan Restock
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
