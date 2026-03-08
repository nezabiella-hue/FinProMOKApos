// components/Production/ReallocateModal.jsx
import { useState } from "react";
import { X } from "lucide-react";
import { calcIngredientAllocations } from "../../utils/productionHelpers";

export default function ReallocateModal({ dish, dishes, stock, salesVolumes, overrides, onConfirm, onClose }) {
  // Find all ingredients that are shared (appear in allocations)
  const allocations = calcIngredientAllocations(dishes, stock, salesVolumes, overrides);
  const sharedIngredients = dish.recipe
    ?.map((r) => r.ingredient)
    .filter((ing) => allocations[ing]) || [];

  const [selectedIng, setSelectedIng] = useState(sharedIngredients[0] || "");

  // transfers: { fromDish: qty } — how much to take from each donor dish
  const [transfers, setTransfers] = useState({});

  const ingAlloc = selectedIng ? allocations[selectedIng] : null;
  const donors = ingAlloc
    ? Object.entries(ingAlloc)
        .filter(([dName]) => dName !== dish.name)
        .map(([dName, allocated]) => ({ name: dName, allocated }))
    : [];

  const handleChange = (fromDish, val) => {
    const donor = donors.find((d) => d.name === fromDish);
    const max = donor ? Math.floor(donor.allocated) : 0;
    const qty = Math.min(max, Math.max(0, parseFloat(val) || 0));
    setTransfers((prev) => ({ ...prev, [fromDish]: qty }));
  };

  const getRemainingAfter = (donor) => {
    const taken = transfers[donor.name] || 0;
    return (donor.allocated - taken).toFixed(1);
  };

  const getGainedForDish = () => {
    return Object.values(transfers).reduce((a, b) => a + b, 0).toFixed(1);
  };

  const handleConfirm = () => {
    const result = Object.entries(transfers)
      .filter(([, qty]) => qty > 0)
      .map(([fromDish, qty]) => ({ fromDish, toDish: dish.name, ingredient: selectedIng, qty }));
    if (result.length > 0) onConfirm(result);
    else onClose();
  };

  const inv = stock.find((s) => s.name === selectedIng);

  return (
    <div className="inv-modal-overlay">
      <div className="inv-modal" style={{ maxWidth: 560 }}>
        <div className="inv-modal-header">
          <h2 className="inv-modal-title">Reallocate Ingredient for {dish.name}</h2>
          <button className="inv-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="inv-modal-body">
          {sharedIngredients.length > 1 && (
            <div className="prod-form-group" style={{ marginBottom: "1rem" }}>
              <label className="prod-label">Ingredient to reallocate</label>
              <select
                className="inv-select"
                style={{ width: "100%", padding: "0.5rem 0.75rem" }}
                value={selectedIng}
                onChange={(e) => { setSelectedIng(e.target.value); setTransfers({}); }}
              >
                {sharedIngredients.map((ing) => <option key={ing}>{ing}</option>)}
              </select>
            </div>
          )}

          {selectedIng && inv && (
            <>
              <p style={{ fontSize: "0.85rem", color: "var(--inv-muted)", marginBottom: "0.75rem" }}>
                Total pool: <strong>{inv.currentStock} {inv.unit}</strong> ·
                Current allocation to <strong>{dish.name}</strong>:{" "}
                <strong>{(ingAlloc?.[dish.name] ?? 0).toFixed(1)} {inv.unit}</strong>
              </p>

              <table className="inv-table">
                <thead>
                  <tr>
                    <th>Donor Dish</th>
                    <th>Their Allocation</th>
                    <th>Give to {dish.name}</th>
                    <th>Remaining After</th>
                  </tr>
                </thead>
                <tbody>
                  {donors.map((donor) => (
                    <tr key={donor.name}>
                      <td className="inv-td-bold">{donor.name}</td>
                      <td className="inv-td-muted">{donor.allocated.toFixed(1)} {inv.unit}</td>
                      <td>
                        <input
                          type="number"
                          className="prod-qty-input"
                          style={{ width: 70 }}
                          min={0}
                          max={Math.floor(donor.allocated)}
                          value={transfers[donor.name] || ""}
                          placeholder="0"
                          onChange={(e) => handleChange(donor.name, e.target.value)}
                        />
                      </td>
                      <td className="inv-td-muted">{getRemainingAfter(donor)} {inv.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {parseFloat(getGainedForDish()) > 0 && (
                <p style={{ marginTop: "0.75rem", fontSize: "0.85rem", color: "#2d7a4f" }}>
                  +{getGainedForDish()} {inv.unit} will be added to {dish.name}'s pool.
                </p>
              )}
            </>
          )}

          {sharedIngredients.length === 0 && (
            <p style={{ fontSize: "0.85rem", color: "var(--inv-muted)" }}>
              No shared ingredients available for reallocation.
            </p>
          )}
        </div>

        <div className="inv-modal-footer">
          <button className="inv-btn inv-btn--ghost" onClick={onClose}>Cancel</button>
          <button
            className="inv-btn inv-btn--primary"
            onClick={handleConfirm}
            disabled={sharedIngredients.length === 0}
          >
            Confirm Reallocation
          </button>
        </div>
      </div>
    </div>
  );
}
