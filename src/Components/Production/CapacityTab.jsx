// components/Production/CapacityTab.jsx
import { useMemo } from "react";
import { ChevronRight } from "lucide-react";
import { calcServings, getServingStatus, getSharedWith } from "../../utils/productionHelpers";

export function CapacityTab({ dishes, stock, onViewDetail }) {
  const rows = useMemo(
    () => dishes.map((d) => {
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
          <p className="inv-card-sub">Servings available from current stock levels.</p>
        </div>
      </div>
      <table className="inv-table">
        <thead>
          <tr>
            <th>Dish</th><th>Available Servings</th><th>Limiting Ingredient</th><th>Shared Ingredient</th><th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="prod-row" onClick={() => onViewDetail(row)}>
              <td className="inv-td-bold">{row.name}</td>
              <td>
                <span className={`prod-serving prod-serving--${getServingStatus(row.servings)}`}>
                  {row.servings} servings
                </span>
              </td>
              <td className={row.missing ? "prod-limiter--missing" : "inv-td-muted"}>{row.limiter}</td>
              <td className="inv-td-muted">{row.sharedWith.length ? row.sharedWith.join(", ") : "—"}</td>
              <td><ChevronRight size={16} className="inv-td-muted" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
