// data/mockExpiryHistory.js
// ─────────────────────────────────────────────────────────
// Tracks per-ingredient expiry observations from stock opnames.
// Used to adaptively adjust predicted shelf life in restock batches.
//
// PATTERN DETECTION RULE:
//   - 1–2 opnames showing deviation → "possible" (no adjustment yet)
//   - 3+ opnames in the SAME direction → "confirmed" (adjust shelf life)
//   - If direction alternates → reset streak, stay at baseline
//
// patternStatus: "baseline" | "possible" | "confirmed"
//
// How it feeds into the system:
//   mockTransactions.js restocks use adjustedShelfLifeDays (not baseline)
//   when patternStatus === "confirmed".
//   The AI Restock Recommendation will warn if a pattern is forming.
// ─────────────────────────────────────────────────────────

export const expiryHistory = [
  {
    ingredient: "Fresh Milk",
    baselineShelfLife: 7,         // days (common knowledge)
    adjustedShelfLife: 6,         // days (confirmed by 4 opnames)
    patternStatus: "confirmed",
    patternDirection: "shorter",  // actual expiry is shorter than baseline
    consecutiveCount: 4,          // 4 opnames all showing the same direction
    observations: [
      {
        date: "2024-02-05",
        expectedExpiry: "2024-02-08", // baseline: purchased Feb 1 + 7 days
        actualCondition: "spoiled",
        actualDaysLasted: 6,
        note: "Smelled off on day 6, discarded",
        opnameId: "OP-2024-02-05",
      },
      {
        date: "2024-02-14",
        expectedExpiry: "2024-02-21",
        actualCondition: "spoiled",
        actualDaysLasted: 6,
        note: "Barista noticed sourness on day 6",
        opnameId: "OP-2024-02-14",
      },
      {
        date: "2024-02-22",
        expectedExpiry: "2024-03-01",
        actualCondition: "spoiled",
        actualDaysLasted: 6,
        note: "Third time — consistent pattern, flagged for review",
        opnameId: "OP-2024-02-22",
      },
      {
        date: "2024-03-08",
        expectedExpiry: "2024-03-15",
        actualCondition: "spoiled",
        actualDaysLasted: 6,
        note: "Pattern confirmed. Adjusted shelf life to 6 days.",
        opnameId: "OP-2024-03-08",
      },
    ],
    aiNote: "Fresh Milk consistently expires 1 day earlier than baseline in this branch. Predicted expiry adjusted to 6 days. Recommend ordering more frequently in smaller batches.",
  },

  {
    ingredient: "Whipped Cream",
    baselineShelfLife: 14,
    adjustedShelfLife: 12,
    patternStatus: "confirmed",
    patternDirection: "shorter",
    consecutiveCount: 3,
    observations: [
      {
        date: "2024-02-10",
        expectedExpiry: "2024-02-24",
        actualCondition: "degraded",
        actualDaysLasted: 12,
        note: "Texture broke down at day 12",
        opnameId: "OP-2024-02-10",
      },
      {
        date: "2024-02-20",
        expectedExpiry: "2024-03-05",
        actualCondition: "degraded",
        actualDaysLasted: 12,
        note: "Same issue — nozzle residue accelerates degradation",
        opnameId: "OP-2024-02-20",
      },
      {
        date: "2024-03-10",
        expectedExpiry: "2024-03-24",
        actualCondition: "degraded",
        actualDaysLasted: 12,
        note: "Pattern confirmed (3 opnames). Adjusted to 12 days.",
        opnameId: "OP-2024-03-10",
      },
    ],
    aiNote: "Whipped Cream consistently degrades at day 12 instead of 14. Likely due to nozzle contamination. Adjusted shelf life confirmed. Consider switching supplier or cleaning protocol.",
  },

  {
    ingredient: "Croissant Dough",
    baselineShelfLife: 2,
    adjustedShelfLife: 2,         // matches baseline — no adjustment needed
    patternStatus: "baseline",
    patternDirection: "none",
    consecutiveCount: 0,
    observations: [
      {
        date: "2024-03-03",
        expectedExpiry: "2024-03-05",
        actualCondition: "expired",
        actualDaysLasted: 1,       // one bad batch, but isolated
        note: "Batch arrived already 1 day old from supplier",
        opnameId: "OP-2024-03-03",
      },
      {
        date: "2024-03-10",
        expectedExpiry: "2024-03-12",
        actualCondition: "good",
        actualDaysLasted: 2,
        note: "Normal — fresh batch from supplier",
        opnameId: "OP-2024-03-10",
      },
    ],
    aiNote: "One outlier observed (day 1 spoilage) but likely a supplier issue, not a pattern. Baseline of 2 days maintained. Monitor supplier delivery freshness.",
  },

  {
    ingredient: "Espresso Beans",
    baselineShelfLife: 30,
    adjustedShelfLife: 30,
    patternStatus: "baseline",
    patternDirection: "none",
    consecutiveCount: 0,
    observations: [
      {
        date: "2024-03-01",
        expectedExpiry: "2024-03-31",
        actualCondition: "good",
        actualDaysLasted: 30,
        note: "No issues observed",
        opnameId: "OP-2024-03-01",
      },
    ],
    aiNote: "No deviation from baseline. Shelf life stable at 30 days.",
  },

  {
    ingredient: "Matcha Powder",
    baselineShelfLife: 90,
    adjustedShelfLife: 90,
    patternStatus: "possible",    // only 2 opnames showing shorter — not confirmed yet
    patternDirection: "shorter",
    consecutiveCount: 2,
    observations: [
      {
        date: "2024-02-15",
        expectedExpiry: "2024-05-15",
        actualCondition: "degraded",
        actualDaysLasted: 75,
        note: "Color fading and flavor weakening around day 75",
        opnameId: "OP-2024-02-15",
      },
      {
        date: "2024-03-10",
        expectedExpiry: "2024-06-08",
        actualCondition: "degraded",
        actualDaysLasted: 78,
        note: "Similar degradation at ~day 75–80. Possible humidity issue.",
        opnameId: "OP-2024-03-10",
      },
    ],
    aiNote: "2 opnames suggest Matcha Powder may degrade around day 75–80 (baseline: 90). Not yet confirmed — needs 1 more consistent observation. Consider airtight storage to extend shelf life.",
  },
];

// ── Helpers ───────────────────────────────────────────────

// Get expiry record for a specific ingredient
export function getExpiryRecord(ingredientName) {
  return expiryHistory.find((e) => e.ingredient === ingredientName) || null;
}

// Get the adjusted shelf life for a given ingredient
// Falls back to baseline if no pattern confirmed
export function getAdjustedShelfLife(ingredientName, baselineDays) {
  const record = getExpiryRecord(ingredientName);
  if (!record) return baselineDays;
  return record.patternStatus === "confirmed"
    ? record.adjustedShelfLife
    : record.baselineShelfLife;
}

// Calculate predicted expiry date from purchase date
export function predictExpiryDate(ingredientName, purchaseDate, baselineDays) {
  const shelfLife = getAdjustedShelfLife(ingredientName, baselineDays);
  const date = new Date(purchaseDate);
  date.setDate(date.getDate() + shelfLife);
  return date.toISOString().split("T")[0];
}

// Check if a pattern is forming (for AI warning)
export function getPatternWarnings() {
  return expiryHistory
    .filter((e) => e.patternStatus === "possible" || e.patternStatus === "confirmed")
    .map((e) => ({
      ingredient: e.ingredient,
      status: e.patternStatus,
      direction: e.patternDirection,
      consecutiveCount: e.consecutiveCount,
      aiNote: e.aiNote,
    }));
}
