// utils/productionHelpers.js
// ─────────────────────────────────────────────────────────
// Pure calculation helpers shared across Production components.
// No React, no API calls — just functions.
// ─────────────────────────────────────────────────────────

export function calcServings(dish, stock) {
  if (!dish.recipe || dish.recipe.length === 0)
    return { servings: 0, limiter: "No recipe" };

  let min = Infinity;
  let limiter = "";
  let missingIngredients = [];

  dish.recipe.forEach(({ ingredient, qty, wasteBuffer }) => {
    const inv = stock.find((s) => s.name === ingredient);
    if (!inv || inv.currentStock === 0) {
      missingIngredients.push(ingredient);
      min = 0;
      limiter = ingredient;
      return;
    }
    const effectiveQty = qty * (1 + (wasteBuffer || 0) / 100);
    const possible = Math.floor(inv.currentStock / effectiveQty);
    if (possible < min) {
      min = possible;
      limiter = ingredient;
    }
  });

  if (missingIngredients.length > 0 && min === 0) {
    return { servings: 0, limiter: missingIngredients[0], missing: true };
  }
  return { servings: min === Infinity ? 0 : min, limiter, missing: false };
}

export function getServingStatus(servings) {
  if (servings === 0) return "out";
  if (servings <= 5) return "low";
  return "ok";
}

export function getExpiryStatus(expiryDate) {
  if (!expiryDate) return "Fresh";
  const days = Math.ceil((new Date(expiryDate) - new Date()) / 86400000);
  if (days <= 0) return "Expired";
  if (days <= 3) return `Expires in ${days} day${days > 1 ? "s" : ""}`;
  return "Fresh";
}

export function getExpiryWarning(dish, stock) {
  for (const { ingredient } of dish.recipe) {
    const inv = stock.find((s) => s.name === ingredient);
    if (inv && inv.expiryDate) {
      const status = getExpiryStatus(inv.expiryDate);
      if (status !== "Fresh") return `${ingredient} expiring`;
    }
  }
  return null;
}

export function getSharedWith(dish, allDishes) {
  const sharedNames = new Set();
  dish.sharedIngredients?.forEach((ing) => {
    allDishes.forEach((d) => {
      if (d.id !== dish.id && d.recipe?.some((r) => r.ingredient === ing)) {
        sharedNames.add(d.name);
      }
    });
  });
  return [...sharedNames];
}
