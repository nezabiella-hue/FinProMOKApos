// components/Production/IngredientPools.jsx
import { useState, useMemo } from "react";
import { ChevronRight } from "lucide-react";

export default function IngredientPools({ dishes, stock }) {
  const [selected, setSelected] = useState(null);

  const pools = useMemo(() => {
    const map = {};
    dishes.forEach((d) => {
      d.recipe?.forEach(({ ingredient, qty, unit }) => {
        if (!map[ingredient]) map[ingredient] = { dishes: [], unit };
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
      };
    });
  }, [dishes, stock]);

  return (
    <div className="prod-card">
      <div className="inv-card-header">
        <div>
          <h2 className="inv-card-title">Ingredient Allocation</h2>
          <p className="inv-card-sub">Shared ingredients used across multiple dishes.</p>
        </div>
      </div>
      <table className="inv-table">
        <thead>
          <tr>
            <th>Ingredient</th><th>Total Stock</th><th>Used By Dishes</th><th>Usage / Serving</th><th></th>
          </tr>
        </thead>
        <tbody>
          {pools.map((p) => (
            <tr key={p.name} className="prod-row" onClick={() => setSelected(selected?.name === p.name ? null : p)}>
              <td className="inv-td-bold">{p.name}</td>
              <td><span className="inv-stock-num">{p.totalStock}</span> <span className="inv-stock-unit">{p.unit}</span></td>
              <td className="inv-td-muted">{p.usedBy.map((d) => d.name).join(", ")}</td>
              <td className="inv-td-muted">{p.totalUsed} {p.unit}</td>
              <td>
                <ChevronRight size={16} className={`inv-td-muted ${selected?.name === p.name ? "prod-chevron-open" : ""}`} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selected && (
        <div className="prod-pool-expand">
          <h3 className="inv-drawer-section-title">{selected.name} — Allocation Breakdown</h3>
          <table className="inv-table">
            <thead><tr><th>Dish</th><th>Usage per Serving</th></tr></thead>
            <tbody>
              {selected.usedBy.map((d) => (
                <tr key={d.name}><td>{d.name}</td><td>{d.qty} {selected.unit}</td></tr>
              ))}
              <tr className="prod-pool-remaining">
                <td className="inv-td-bold">Total Stock Available</td>
                <td className="inv-td-bold">{selected.totalStock} {selected.unit}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
