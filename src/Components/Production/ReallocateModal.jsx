// components/Production/ReallocateModal.jsx
// ─────────────────────────────────────────────────────────
// Redesigned reallocation modal:
//   - Input in SERVINGS of the target dish (not raw grams)
//   - Auto-selects the ingredient actually causing 0 servings
//   - Donors sorted by lowest sales first (pull from least profitable)
//   - Pre-fills 1 serving suggestion from lowest-sales donor
//   - Fires onNotify() toast on confirm
// ─────────────────────────────────────────────────────────
import { useState, useMemo } from "react";
import { X } from "lucide-react";
import { calcIngredientAllocations } from "../../utils/productionHelpers";

export default function ReallocateModal({
  dish,
  dishes,
  stock,
  salesVolumes,
  overrides,
  onConfirm,
  onClose,
  onNotify,
}) {
  const allocations = calcIngredientAllocations(dishes, stock, salesVolumes, overrides);

  // Only ingredients that are shared AND at least one donor has allocation > 0
  const sharedIngredients = (dish.recipe || [])
    .filter((r) => {
      const alloc = allocations[r.ingredient];
      if (!alloc) return false;
      return Object.entries(alloc).some(
        ([name, amt]) => name !== dish.name && amt > 0,
      );
    })
    .map((r) => r.ingredient);

  // Auto-select the ingredient with the LOWEST allocated servings — the real bottleneck
  const getServingsForIng = (ing) => {
    const alloc = allocations[ing]?.[dish.name] ?? 0;
    const recipe = dish.recipe.find((r) => r.ingredient === ing);
    const effQty = recipe ? recipe.qty * (1 + (recipe.wasteBuffer || 0) / 100) : 1;
    return Math.floor(alloc / effQty);
  };

  const autoSelectedIng = sharedIngredients.length
    ? sharedIngredients.reduce((worst, ing) =>
        getServingsForIng(ing) < getServingsForIng(worst) ? ing : worst,
      )
    : "";

  const [selectedIng, setSelectedIng] = useState(autoSelectedIng);

  // Build donor rows sorted by lowest sales (pull from least profitable first)
  const donorData = useMemo(() => {
    if (!selectedIng) return [];
    const ingAlloc = allocations[selectedIng] || {};
    const targetRecipe = dish.recipe.find((r) => r.ingredient === selectedIng);
    const targetEffQty = targetRecipe
      ? targetRecipe.qty * (1 + (targetRecipe.wasteBuffer || 0) / 100)
      : 1;

    return Object.entries(ingAlloc)
      .filter(([name, amt]) => name !== dish.name && amt > 0)
      .map(([name, allocated]) => {
        const donorRecipe = dishes
          .find((d) => d.name === name)
          ?.recipe.find((r) => r.ingredient === selectedIng);
        const donorEffQty = donorRecipe
          ? donorRecipe.qty * (1 + (donorRecipe.wasteBuffer || 0) / 100)
          : 1;
        const donorServings = Math.floor(allocated / donorEffQty);
        const maxGiveServings = Math.floor(allocated / targetEffQty);
        const sales = salesVolumes[name] || 0;
        return { name, allocated, donorServings, donorEffQty, targetEffQty, maxGiveServings, sales };
      })
      .sort((a, b) => a.sales - b.sales); // lowest sales donates first
  }, [selectedIng, allocations, dish, dishes, salesVolumes]);

  // Pre-fill: if dish has 0 servings, auto-suggest 1 serving from the lowest-sales donor
  const computeInitTransfers = () => {
    if (!autoSelectedIng || !sharedIngredients.length) return {};
    const ingAlloc = allocations[autoSelectedIng] || {};
    const targetRecipe = dish.recipe.find((r) => r.ingredient === autoSelectedIng);
    const targetEffQty = targetRecipe
      ? targetRecipe.qty * (1 + (targetRecipe.wasteBuffer || 0) / 100)
      : 1;
    const currentServings = Math.floor((ingAlloc[dish.name] ?? 0) / targetEffQty);
    if (currentServings > 0) return {};

    // Sort donors to find the lowest-sales one
    const donors = Object.entries(ingAlloc)
      .filter(([name, amt]) => name !== dish.name && amt > 0)
      .map(([name, allocated]) => ({
        name,
        maxGiveServings: Math.floor(allocated / targetEffQty),
        sales: salesVolumes[name] || 0,
      }))
      .sort((a, b) => a.sales - b.sales);

    if (donors.length && donors[0].maxGiveServings > 0) {
      return { [donors[0].name]: 1 };
    }
    return {};
  };

  const [transfers, setTransfers] = useState(computeInitTransfers);

  const handleIngredientChange = (ing) => {
    setSelectedIng(ing);
    setTransfers({});
  };

  const handleChange = (donorName, val) => {
    const donor = donorData.find((d) => d.name === donorName);
    if (!donor) return;
    const servings = Math.min(
      donor.maxGiveServings,
      Math.max(0, parseInt(val) || 0),
    );
    setTransfers((prev) => ({ ...prev, [donorName]: servings }));
  };

  const totalServingsGained = Object.values(transfers).reduce((a, b) => a + b, 0);

  const handleConfirm = () => {
    const result = Object.entries(transfers)
      .filter(([, s]) => s > 0)
      .map(([fromDish, servings]) => {
        const donor = donorData.find((d) => d.name === fromDish);
        const grams = servings * (donor?.targetEffQty ?? 1);
        return { fromDish, toDish: dish.name, ingredient: selectedIng, qty: grams };
      });

    if (result.length > 0) {
      onConfirm(result);
      if (onNotify) onNotify(dish.name);
    } else {
      onClose();
    }
  };

  const inv = stock.find((s) => s.name === selectedIng);
  const targetRecipe = dish.recipe?.find((r) => r.ingredient === selectedIng);
  const targetEffQty = targetRecipe
    ? targetRecipe.qty * (1 + (targetRecipe.wasteBuffer || 0) / 100)
    : 1;
  const currentTargetServings = Math.floor(
    (allocations[selectedIng]?.[dish.name] ?? 0) / targetEffQty,
  );

  return (
    <div className="inv-modal-overlay">
      <div className="inv-modal" style={{ maxWidth: 580 }}>
        <div className="inv-modal-header">
          <h2 className="inv-modal-title">Reallocate Ingredient for {dish.name}</h2>
          <button className="inv-modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="inv-modal-body">
          {sharedIngredients.length === 0 ? (
            <p style={{ fontSize: "0.85rem", color: "var(--inv-muted)" }}>
              No shared ingredients with available pool for reallocation.
            </p>
          ) : (
            <>
              {sharedIngredients.length > 1 && (
                <div className="prod-form-group" style={{ marginBottom: "1rem" }}>
                  <label className="prod-label">
                    Choose ingredient to reallocate
                    <span style={{ fontWeight: 400, color: "#9ca3af", marginLeft: "0.35rem" }}>
                      — switch to see more donor options
                    </span>
                  </label>
                  <select
                    className="inv-select"
                    style={{ width: "100%", padding: "0.5rem 0.75rem" }}
                    value={selectedIng}
                    onChange={(e) => handleIngredientChange(e.target.value)}
                  >
                    {sharedIngredients.map((ing) => {
                      const donorCount = Object.entries(allocations[ing] || {}).filter(
                        ([name, amt]) => name !== dish.name && amt > 0,
                      ).length;
                      const servings = getServingsForIng(ing);
                      return (
                        <option key={ing} value={ing}>
                          {ing} — {donorCount} donor{donorCount !== 1 ? "s" : ""}{servings === 0 ? " ⚠ bottleneck" : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {selectedIng && inv && (
                <>
                  <p style={{ fontSize: "0.85rem", color: "var(--inv-muted)", marginBottom: "0.5rem" }}>
                    Total pool:{" "}
                    <strong>{inv.currentStock} {inv.unit}</strong> ·{" "}
                    {dish.name} currently has:{" "}
                    <strong>
                      {currentTargetServings} serving{currentTargetServings !== 1 ? "s" : ""}
                    </strong>
                  </p>
                  <p style={{ fontSize: "0.78rem", color: "#9ca3af", marginBottom: "1rem" }}>
                    Donors sorted by lowest sales — pull from those first.
                    Enter servings of <strong>{dish.name}</strong> to give.
                  </p>

                  <table className="inv-table">
                    <thead>
                      <tr>
                        <th>Donor Dish</th>
                        <th>Monthly Sales</th>
                        <th>Their Servings</th>
                        <th>
                          Give to {dish.name}
                          <span style={{ display: "block", fontSize: "0.68rem", fontWeight: 400, color: "#9ca3af" }}>
                            (in servings)
                          </span>
                        </th>
                        <th>They Lose</th>
                      </tr>
                    </thead>
                    <tbody>
                      {donorData.map((donor) => {
                        const taken = transfers[donor.name] || 0;
                        const gramsForTaken = taken * donor.targetEffQty;
                        const donorServingsLost = Math.floor(gramsForTaken / donor.donorEffQty);
                        return (
                          <tr key={donor.name}>
                            <td className="inv-td-bold">{donor.name}</td>
                            <td className="inv-td-muted">{donor.sales} sold</td>
                            <td className="inv-td-muted">{donor.donorServings}</td>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                                <input
                                  type="number"
                                  className="prod-qty-input"
                                  style={{ width: 60 }}
                                  min={0}
                                  max={donor.maxGiveServings}
                                  value={taken || ""}
                                  placeholder="0"
                                  onChange={(e) => handleChange(donor.name, e.target.value)}
                                />
                                <span style={{ fontSize: "0.73rem", color: "#9ca3af", whiteSpace: "nowrap" }}>
                                  / {donor.maxGiveServings} max
                                </span>
                              </div>
                            </td>
                            <td
                              className={donorServingsLost === 0 ? "inv-td-muted" : ""}
                              style={donorServingsLost > 0 ? { color: "#b45309", fontSize: "0.82rem" } : {}}
                            >
                              {donorServingsLost > 0 ? `−${donorServingsLost} servings` : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {totalServingsGained > 0 && (
                    <p style={{ marginTop: "0.75rem", fontSize: "0.85rem", color: "#2d7a4f", fontWeight: 600 }}>
                      ✓ {dish.name} gains +{totalServingsGained} serving{totalServingsGained !== 1 ? "s" : ""}
                    </p>
                  )}
                </>
              )}
            </>
          )}
        </div>

        <div className="inv-modal-footer">
          <button className="inv-btn inv-btn--ghost" onClick={onClose}>Cancel</button>
          <button
            className="inv-btn inv-btn--primary"
            onClick={handleConfirm}
            disabled={sharedIngredients.length === 0 || totalServingsGained === 0}
          >
            Confirm Reallocation
          </button>
        </div>
      </div>
    </div>
  );
}
