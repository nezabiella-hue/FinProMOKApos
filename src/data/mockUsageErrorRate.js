// data/mockUsageErrorRate.js
// ─────────────────────────────────────────────────────────
// Usage error rate per ingredient, based on:
//   expected_usage = dishes_sold (3 days) × qty_per_recipe
//   error_rate = (actual_used - expected_used) / expected_used × 100
//
// Positive = over-used (spills, over-pouring, waste)
// Negative = under-used (customers opting out, barista adjustment)
//
// Rates are kept realistic: max ±6% for wet ingredients,
// 0% for counted items, negative for optional ingredients.
// ─────────────────────────────────────────────────────────

export const usageErrorRates = [
  {
    ingredient: "Espresso Beans",
    errorRate: 3,
    direction: "over",
    note: "Consistent small loss during grinding — within normal range",
  },
  {
    ingredient: "Fresh Milk",
    errorRate: 2,
    direction: "over",
    note: "Slight over-pour when steaming, barista has improved technique",
  },
  {
    ingredient: "Matcha Powder",
    errorRate: 4,
    direction: "over",
    note: "Powder sticks to scoop and container sides",
  },
  {
    ingredient: "Caramel Syrup",
    errorRate: 3,
    direction: "over",
    note: "Pump dispenser slightly over-dispenses per pull",
  },
  {
    ingredient: "Croissant Dough",
    errorRate: 0,
    direction: "none",
    note: "Counted individually — barista adjusted after last report, now accurate",
  },
  {
    ingredient: "Muffin Mix",
    errorRate: 2,
    direction: "over",
    note: "Small residue left in mixing bowl each batch",
  },
  {
    ingredient: "Sugar",
    errorRate: -4,
    direction: "under",
    note: "Many customers request less or no sugar — actual use lower than recipe",
  },
  {
    ingredient: "Ice Cubes",
    errorRate: 0,
    direction: "none",
    note: "Counted individually, no measurement error",
  },
  {
    ingredient: "Whipped Cream",
    errorRate: 5,
    direction: "over",
    note: "Spray nozzle inconsistent, some residue remains in can",
  },
  {
    ingredient: "Vanilla Syrup",
    errorRate: 3,
    direction: "over",
    note: "Same pump dispenser issue as Caramel Syrup",
  },
  {
    ingredient: "Chocolate Powder",
    errorRate: 2,
    direction: "over",
    note: "Dusting for latte art is imprecise",
  },
  {
    ingredient: "Paper Cup (12oz)",
    errorRate: 0,
    direction: "none",
    note: "Counted individually, no measurement error",
  },
];

// ── Helpers ───────────────────────────────────────────────

export function getErrorRate(ingredientName) {
  return usageErrorRates.find((r) => r.ingredient === ingredientName) || null;
}

export function getErrorSeverity(errorRate) {
  const abs = Math.abs(errorRate);
  if (abs === 0) return "none";
  if (abs <= 3) return "low";    // acceptable
  if (abs <= 6) return "medium"; // worth monitoring
  return "high";                 // needs attention
}

// ── Live error rate calculator (called after opname) ──────
// Blends the newly observed discrepancy with the historical baseline.
// Weight: 60% new observation, 40% historical.
// Caps max shift at ±5% per opname so it moves organically —
// a single bad opname won't spike the number dramatically.
export function calculateLiveErrorRate(ingredientName, systemStock, actualStock) {
  if (!systemStock || systemStock === 0) return null;

  const rawError = ((systemStock - actualStock) / systemStock) * 100;
  const rounded = Math.round(rawError * 10) / 10;

  const baseline = getErrorRate(ingredientName);
  const baselineRate = baseline
    ? baseline.errorRate * (baseline.direction === "under" ? -1 : 1)
    : 0;

  // Blend: 60% new observation, 40% historical baseline
  const blended = Math.round((rounded * 0.6 + baselineRate * 0.4) * 10) / 10;

  // Cap shift at ±5% vs baseline so changes are gradual
  const maxShift = 5;
  const capped = Math.max(
    baselineRate - maxShift,
    Math.min(baselineRate + maxShift, blended)
  );
  const final = Math.round(capped * 10) / 10;

  return {
    ingredient: ingredientName,
    errorRate: Math.abs(final),
    direction: final > 0 ? "over" : final < 0 ? "under" : "none",
    note: `Updated from opname: system had ${systemStock}, actual was ${actualStock}`,
    isLive: true,
  };
}
