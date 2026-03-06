// components/Production/DishDetail.jsx
import { AlertTriangle } from "lucide-react";
import { calcServings, getServingStatus, getExpiryWarning, getSharedWith } from "../../utils/productionHelpers";

export default function DishDetail({ dish, stock, allDishes, onBack }) {
  const { servings, limiter } = calcServings(dish, stock);
  const expiry = getExpiryWarning(dish, stock);
  const sharedWith = getSharedWith(dish, allDishes);

  return (
    <div className="prod-card">
      <div className="inv-card-header">
        <div>
          <button className="prod-back-btn" onClick={onBack}>← Back to Dish List</button>
          <h2 className="inv-card-title" style={{ marginTop: "0.5rem" }}>{dish.name}</h2>
          <p className="inv-card-sub">{dish.category} · {dish.yieldUnit}</p>
        </div>
      </div>

      <div className="prod-detail-body">
        <section className="inv-drawer-section">
          <h3 className="inv-drawer-section-title">Overview</h3>
          <div className="inv-overview-grid">
            <div className="inv-overview-item">
              <span className="inv-overview-label">Available Servings</span>
              <span className={`prod-serving prod-serving--${getServingStatus(servings)}`}>
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
                <span className="prod-expiry-warn"><AlertTriangle size={13} /> {expiry}</span>
              </div>
            )}
            {sharedWith.length > 0 && (
              <div className="inv-overview-item">
                <span className="inv-overview-label">Shared With</span>
                <span className="inv-overview-value">{sharedWith.join(", ")}</span>
              </div>
            )}
          </div>
        </section>

        <section className="inv-drawer-section">
          <h3 className="inv-drawer-section-title">Recipe</h3>
          <table className="inv-table">
            <thead>
              <tr>
                <th>Ingredient</th><th>Qty per Dish</th><th>Unit</th><th>In Stock</th>
              </tr>
            </thead>
            <tbody>
              {dish.recipe.map((r) => {
                const inv = stock.find((s) => s.name === r.ingredient);
                const missing = !inv || inv.currentStock === 0;
                return (
                  <tr key={r.ingredient}>
                    <td className={missing ? "prod-limiter--missing inv-td-bold" : "inv-td-bold"}>
                      {r.ingredient}{missing && " ⚠"}
                    </td>
                    <td>{r.qty}</td>
                    <td className="inv-td-muted">{r.unit}</td>
                    <td className={missing ? "prod-limiter--missing" : "inv-td-muted"}>
                      {inv ? `${inv.currentStock} ${inv.unit}` : "Not in inventory"}
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
              const consumers = allDishes.filter((d) => d.recipe?.some((r) => r.ingredient === ing));
              return (
                <div key={ing} className="prod-pool-card">
                  <div className="prod-pool-header">
                    <span className="prod-pool-name">{ing} Pool</span>
                    <span className="prod-pool-total">Total: {inv.currentStock} {inv.unit}</span>
                  </div>
                  <table className="inv-table">
                    <thead><tr><th>Dish</th><th>Usage per Serving</th></tr></thead>
                    <tbody>
                      {consumers.map((c) => {
                        const r = c.recipe.find((ri) => ri.ingredient === ing);
                        return <tr key={c.id}><td>{c.name}</td><td>{r?.qty} {r?.unit}</td></tr>;
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
