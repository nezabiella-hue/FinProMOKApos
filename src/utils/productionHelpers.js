// utils/productionHelpers.js
// ─────────────────────────────────────────────────────────
// Pure calculation helpers shared across Production components.
// No React, no API calls — just functions.
// ─────────────────────────────────────────────────────────

import { predictExpiryDate } from "../data/mockExpiryHistory";

// ── Batch expiry helpers ──────────────────────────────────
// Returns array of batches that are expiring within 3 days (or already expired).
// Each entry: { label, amount, unit, daysLeft, status, percentage }
// percentage = that batch's share of total currentStock.
// Items with no batches or no shelfLifeDays return [].
export function getBatchExpiryInfo(item) {
  if (!item.batches?.length || !item.shelfLifeDays) return [];
  const totalStock = item.currentStock > 0 ? item.currentStock
    : item.batches.reduce((s, b) => s + b.amount, 0);
  if (totalStock === 0) return [];

  // FIFO depletion: consumed stock is drawn from the oldest batches first.
  // This ensures effective amounts always sum to totalStock, so % never exceeds 100%.
  const totalBatchAmount = item.batches.reduce((s, b) => s + b.amount, 0);
  let remaining = Math.max(0, totalBatchAmount - totalStock); // already consumed
  const effective = item.batches.map((b) => {
    const eff = Math.max(0, b.amount - remaining);
    remaining = Math.max(0, remaining - b.amount);
    return eff;
  });

  const expiring = [];
  item.batches.forEach((batch, i) => {
    const dateRef = batch.madeDate || batch.purchaseDate;
    if (!dateRef || effective[i] === 0) return;
    const predicted = predictExpiryDate(item.name, dateRef, item.shelfLifeDays);
    const daysLeft = Math.ceil((new Date(predicted) - new Date()) / 86400000);
    if (daysLeft <= 3) {
      const percentage = Math.round((effective[i] / totalStock) * 100);
      expiring.push({
        label: batch.label,
        amount: effective[i],
        unit: batch.unit,
        daysLeft,
        status: daysLeft <= 0 ? "Expired" : `Expires in ${daysLeft} day${daysLeft > 1 ? "s" : ""}`,
        percentage,
      });
    }
  });
  return expiring;
}

// Returns true if any batch on the item is expiring soon (for filter/class logic)
export function hasExpiringBatch(item) {
  return getBatchExpiryInfo(item).length > 0;
}

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

// ── Allocated servings system ─────────────────────────────
// Replaces the naive per-dish calcServings for the DishList view.
// Shared ingredients are distributed proportionally by sales volume.

// Returns { "Caramel Latte": 84, "Cappuccino": 42, ... }
export function calcDishSalesVolumes(saleTransactions) {
  return saleTransactions.reduce((acc, { dish, qty }) => {
    acc[dish] = (acc[dish] || 0) + qty;
    return acc;
  }, {});
}

// Distributes each shared ingredient's stock across dishes by sales volume weight.
// overrides: { ingredientName: { dishName: deltaQty } } — additive adjustments from reallocation
// Returns { "Fresh Milk": { "Caramel Latte": 1200, "Cappuccino": 600, ... }, ... }
export function calcIngredientAllocations(dishes, stock, salesVolumes, overrides = {}) {
  const result = {};

  stock.forEach((item) => {
    const users = dishes.filter((d) =>
      d.recipe?.some((r) => r.ingredient === item.name)
    );
    if (users.length <= 1) return; // not shared — handled per-dish with full stock

    const volumes = users.map((d) => salesVolumes[d.name] || 0);
    const totalVolume = volumes.reduce((a, b) => a + b, 0);

    result[item.name] = {};
    users.forEach((d, i) => {
      const weight = totalVolume > 0 ? volumes[i] / totalVolume : 1 / users.length;
      const base = item.currentStock * weight;
      const override = overrides[item.name]?.[d.name] || 0;
      result[item.name][d.name] = Math.max(0, base + override);
    });
  });

  return result;
}

// Computes allocated servings for a dish considering shared ingredient pools.
// status:
//   "ok"     — servings > 0
//   "yellow" — servings === 0 but at least one ingredient pool is not empty
//   "red"    — at least one ingredient currentStock === 0
export function calcAllocatedServings(dish, dishes, stock, salesVolumes, overrides = {}) {
  if (!dish.recipe || dish.recipe.length === 0)
    return { servings: 0, limiter: "No recipe", status: "red" };

  const allocations = calcIngredientAllocations(dishes, stock, salesVolumes, overrides);

  let min = Infinity;
  let limiter = "";

  for (const { ingredient, qty, wasteBuffer } of dish.recipe) {
    const inv = stock.find((s) => s.name === ingredient);

    if (!inv || inv.currentStock === 0) {
      return { servings: 0, limiter: ingredient, status: "red" };
    }

    const effectiveQty = qty * (1 + (wasteBuffer || 0) / 100);
    const shared = allocations[ingredient];
    const available = shared ? (shared[dish.name] ?? 0) : inv.currentStock;

    const possible = Math.floor(available / effectiveQty);
    if (possible < min) {
      min = possible;
      limiter = ingredient;
    }
  }

  const servings = min === Infinity ? 0 : min;
  // If we get here, no ingredient was at 0 stock
  // "low" = 1–4 servings (warning), "yellow" = 0 but pool not empty, "ok" = 5+
  const status = servings === 0 ? "yellow" : servings < 5 ? "low" : "ok";
  return { servings, limiter, status };
}
