// components/Production/CreateDishModal.jsx
import { useState } from "react";
import { X, Plus, Trash2, Sparkles, AlertTriangle } from "lucide-react";
import { askAI } from "../../services/aiService";

export default function CreateDishModal({ stock, onClose, onSave }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Coffee");
  const [yieldUnit, setYieldUnit] = useState("cup");
  const [recipe, setRecipe] = useState([{ ingredient: "", qty: 0, unit: "g", wasteBuffer: 0 }]);
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const addIngredient = () => setRecipe((p) => [...p, { ingredient: "", qty: 0, unit: "g", wasteBuffer: 0 }]);
  const removeIngredient = (i) => setRecipe((p) => p.filter((_, idx) => idx !== i));
  const updateIngredient = (i, field, val) =>
    setRecipe((p) =>
      p.map((r, idx) =>
        idx === i ? { ...r, [field]: field === "qty" ? parseFloat(val) || 0 : val } : r,
      ),
    );

  const handleAI = async () => {
    if (!name) return;
    setAiLoading(true);
    setAiSuggestion("");
    const ingredientList = stock.map((s) => `${s.name} (${s.unit})`).join(", ");
    const recipeStr = recipe.filter((r) => r.ingredient).map((r) => `${r.ingredient}: ${r.qty}${r.unit}`).join(", ");
    const prompt = `You are a coffee shop recipe assistant.
Dish name: "${name}", category: "${category}", yield: 1 ${yieldUnit}.
Current recipe: ${recipeStr || "none yet"}.
Available ingredients: ${ingredientList}.
Suggest: 1) Any unit conversions needed, 2) A recommended waste buffer % for fresh ingredients, 3) Any missing key ingredients for a typical ${name}. Be brief (max 80 words).`;
    try {
      const result = await askAI(prompt);
      setAiSuggestion(result);
    } catch {
      setAiSuggestion("AI unavailable.");
    }
    setAiLoading(false);
  };

  const missingIngredients = recipe.filter((r) => r.ingredient && !stock.find((s) => s.name === r.ingredient));

  const handleSave = () => {
    if (!name.trim()) return;
    const newDish = {
      id: Date.now(),
      name,
      category,
      yieldUnit,
      recipe: recipe.filter((r) => r.ingredient && r.qty > 0),
      sharedIngredients: recipe.filter((r) => r.ingredient).map((r) => r.ingredient).filter((ing) => stock.find((s) => s.name === ing)),
    };
    onSave(newDish);
    onClose();
  };

  return (
    <div className="inv-modal-overlay">
      <div className="inv-modal" style={{ maxWidth: 640 }}>
        <div className="inv-modal-header">
          <h2 className="inv-modal-title">Create Dish Recipe</h2>
          <button className="inv-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="inv-modal-body">
          <div className="prod-form-row">
            <div className="prod-form-group">
              <label className="prod-label">Dish Name</label>
              <input className="prod-input" placeholder="e.g. Cheese Burger" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="prod-form-group">
              <label className="prod-label">Category</label>
              <select className="inv-select" style={{ width: "100%", padding: "0.5rem 0.75rem" }} value={category} onChange={(e) => setCategory(e.target.value)}>
                {["Coffee", "Non-Coffee", "Pastry", "Food", "Beverage"].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="prod-form-group">
            <label className="prod-label">Yield Unit</label>
            <input className="prod-input" placeholder="e.g. serving / cup / pcs" value={yieldUnit} onChange={(e) => setYieldUnit(e.target.value)} />
          </div>

          <div className="prod-form-group">
            <label className="prod-label">Recipe Elements</label>
            <table className="inv-table">
              <thead>
                <tr><th>Ingredient</th><th>Quantity</th><th>Unit</th><th>Waste Buffer %</th><th></th></tr>
              </thead>
              <tbody>
                {recipe.map((r, i) => (
                  <tr key={i}>
                    <td>
                      <select className="inv-select" style={{ width: "100%" }} value={r.ingredient} onChange={(e) => updateIngredient(i, "ingredient", e.target.value)}>
                        <option value="">Select ingredient...</option>
                        {stock.map((s) => <option key={s.name}>{s.name}</option>)}
                        <option value="__custom__">+ Type custom name</option>
                      </select>
                      {r.ingredient === "__custom__" && (
                        <input className="prod-input" placeholder="Custom ingredient name" style={{ marginTop: "0.25rem" }} onChange={(e) => updateIngredient(i, "ingredient", e.target.value)} />
                      )}
                    </td>
                    <td>
                      <input type="number" className="prod-qty-input" value={r.qty || ""} min={0} onChange={(e) => updateIngredient(i, "qty", e.target.value)} />
                    </td>
                    <td>
                      <select className="inv-select" value={r.unit} onChange={(e) => updateIngredient(i, "unit", e.target.value)}>
                        {["g", "ml", "pcs", "kg", "l", "tbsp", "tsp"].map((u) => <option key={u}>{u}</option>)}
                      </select>
                    </td>
                    <td>
                      <input type="number" className="prod-qty-input" value={r.wasteBuffer || ""} min={0} max={50} placeholder="0" onChange={(e) => updateIngredient(i, "wasteBuffer", e.target.value)} />
                    </td>
                    <td>
                      <button className="prod-remove-btn" onClick={() => removeIngredient(i)}><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button className="prod-add-ingredient-btn" onClick={addIngredient}><Plus size={14} /> Add Ingredient</button>
          </div>

          {missingIngredients.length > 0 && (
            <div className="prod-missing-warning">
              <AlertTriangle size={14} />
              <span>
                These ingredients are not in inventory: <strong>{missingIngredients.map((r) => r.ingredient).join(", ")}</strong>. Servings will show as 0 until stock is added.
              </span>
            </div>
          )}

          <div className="inv-ai-panel">
            <div className="inv-ai-header">
              <Sparkles size={16} className="inv-ai-icon" />
              <span className="inv-ai-title">AI Assistance</span>
              <button className="inv-btn inv-btn--outline" style={{ marginLeft: "auto", fontSize: "0.75rem", padding: "0.25rem 0.65rem" }} onClick={handleAI} disabled={aiLoading}>
                {aiLoading ? "Thinking..." : "Ask AI"}
              </button>
            </div>
            {aiSuggestion ? (
              <p className="prod-ai-text" style={{ marginTop: "0.5rem" }}>{aiSuggestion}</p>
            ) : (
              <ul className="inv-ai-list">
                <li>Suggested unit conversion based on historical usage</li>
                <li>Suggested waste buffer for fresh ingredients</li>
              </ul>
            )}
          </div>
        </div>

        <div className="inv-modal-footer">
          <button className="inv-btn inv-btn--ghost" onClick={onClose}>Cancel</button>
          <button className="inv-btn inv-btn--primary" onClick={handleSave} disabled={!name.trim()}>Save Dish</button>
        </div>
      </div>
    </div>
  );
}
