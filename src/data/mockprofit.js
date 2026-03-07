// data/mockprofit.js — Coffee Shop POS Mock Data
// ─────────────────────────────────────────────────────────
// dailySales: aggregated revenue per day
// topProducts: monthly sales summary per dish
// dailyDishSales: per-dish sales per day — used for:
//   - AI production planning (how many to make tomorrow)
//   - Purchase request generation (how much to reorder)
//   - Usage error rate calculation (expected vs actual stock usage)
// ─────────────────────────────────────────────────────────

export const dailySales = [
  { date: "2024-03-01", grossSales: 1_820_000, netSales: 1_640_000, transactions: 42, cogs: 410_000 },
  { date: "2024-03-02", grossSales: 2_100_000, netSales: 1_890_000, transactions: 51, cogs: 472_500 },
  { date: "2024-03-03", grossSales: 1_560_000, netSales: 1_404_000, transactions: 38, cogs: 351_000 },
  { date: "2024-03-04", grossSales: 2_450_000, netSales: 2_205_000, transactions: 60, cogs: 551_250 },
  { date: "2024-03-05", grossSales: 2_780_000, netSales: 2_502_000, transactions: 68, cogs: 625_500 },
  { date: "2024-03-06", grossSales: 3_100_000, netSales: 2_790_000, transactions: 75, cogs: 697_500 },
  { date: "2024-03-07", grossSales: 3_450_000, netSales: 3_105_000, transactions: 84, cogs: 776_250 },
  { date: "2024-03-08", grossSales: 2_900_000, netSales: 2_610_000, transactions: 70, cogs: 652_500 },
  { date: "2024-03-09", grossSales: 2_200_000, netSales: 1_980_000, transactions: 53, cogs: 495_000 },
  { date: "2024-03-10", grossSales: 2_650_000, netSales: 2_385_000, transactions: 64, cogs: 596_250 },
  { date: "2024-03-11", grossSales: 2_980_000, netSales: 2_682_000, transactions: 72, cogs: 670_500 },
  { date: "2024-03-12", grossSales: 3_200_000, netSales: 2_880_000, transactions: 78, cogs: 720_000 },
  { date: "2024-03-13", grossSales: 3_550_000, netSales: 3_195_000, transactions: 86, cogs: 798_750 },
  { date: "2024-03-14", grossSales: 3_800_000, netSales: 3_420_000, transactions: 92, cogs: 855_000 },
  { date: "2024-03-15", grossSales: 4_100_000, netSales: 3_690_000, transactions: 99, cogs: 922_500 },
  { date: "2024-03-16", grossSales: 3_700_000, netSales: 3_330_000, transactions: 89, cogs: 832_500 },
  { date: "2024-03-17", grossSales: 3_300_000, netSales: 2_970_000, transactions: 80, cogs: 742_500 },
  { date: "2024-03-18", grossSales: 2_750_000, netSales: 2_475_000, transactions: 66, cogs: 618_750 },
  { date: "2024-03-19", grossSales: 2_980_000, netSales: 2_682_000, transactions: 72, cogs: 670_500 },
  { date: "2024-03-20", grossSales: 3_150_000, netSales: 2_835_000, transactions: 76, cogs: 708_750 },
  { date: "2024-03-21", grossSales: 3_420_000, netSales: 3_078_000, transactions: 82, cogs: 769_500 },
  { date: "2024-03-22", grossSales: 3_680_000, netSales: 3_312_000, transactions: 88, cogs: 828_000 },
  { date: "2024-03-23", grossSales: 3_950_000, netSales: 3_555_000, transactions: 95, cogs: 888_750 },
  { date: "2024-03-24", grossSales: 4_200_000, netSales: 3_780_000, transactions: 101, cogs: 945_000 },
  { date: "2024-03-25", grossSales: 4_500_000, netSales: 4_050_000, transactions: 108, cogs: 1_012_500 },
  { date: "2024-03-26", grossSales: 4_100_000, netSales: 3_690_000, transactions: 98, cogs: 922_500 },
  { date: "2024-03-27", grossSales: 3_800_000, netSales: 3_420_000, transactions: 91, cogs: 855_000 },
  { date: "2024-03-28", grossSales: 3_500_000, netSales: 3_150_000, transactions: 84, cogs: 787_500 },
  { date: "2024-03-29", grossSales: 3_750_000, netSales: 3_375_000, transactions: 90, cogs: 843_750 },
  { date: "2024-03-30", grossSales: 4_050_000, netSales: 3_645_000, transactions: 97, cogs: 911_250 },
  { date: "2024-03-31", grossSales: 4_350_000, netSales: 3_915_000, transactions: 104, cogs: 978_750 },
];

export const topProducts = [
  { name: "Caramel Latte",  sold: 312, revenue: 4_368_000, color: "#4e8c6e" },
  { name: "Matcha Latte",   sold: 278, revenue: 3_892_000, color: "#6aab89" },
  { name: "Espresso",       sold: 245, revenue: 2_450_000, color: "#8bc4a8" },
  { name: "Croissant",      sold: 198, revenue: 1_980_000, color: "#a8d5bf" },
  { name: "Iced Americano", sold: 187, revenue: 2_244_000, color: "#2d6a4f" },
  { name: "Cappuccino",     sold: 165, revenue: 2_475_000, color: "#1b4332" },
  { name: "Muffin",         sold: 143, revenue: 1_287_000, color: "#c8e6d7" },
];

// ── Per-dish daily sales (last 3 days before opname) ─────────────────────────
// Used for:
//   1. Calculating expected ingredient usage → comparing to opname actual
//   2. AI production planning ("sell X yesterday, make X today")
//   3. AI purchase request ("used Y per day × reorder days = buy Z")
export const dailyDishSales = [
  {
    date: "2024-03-29",
    sales: {
      "Caramel Latte": 28, "Matcha Latte": 25, "Espresso": 22,
      "Croissant": 18, "Iced Americano": 17, "Cappuccino": 15, "Muffin": 12,
    },
  },
  {
    date: "2024-03-30",
    sales: {
      "Caramel Latte": 32, "Matcha Latte": 29, "Espresso": 26,
      "Croissant": 21, "Iced Americano": 19, "Cappuccino": 17, "Muffin": 15,
    },
  },
  {
    date: "2024-03-31",
    sales: {
      "Caramel Latte": 30, "Matcha Latte": 27, "Espresso": 24,
      "Croissant": 19, "Iced Americano": 18, "Cappuccino": 16, "Muffin": 14,
    },
  },
];

// ── Helper: get total sales per dish over last N days ─────────────────────────
// Used by AI service to build purchase/production recommendations
export function getDishSalesTotals(days = 3) {
  const recent = dailyDishSales.slice(-days);
  const totals = {};
  recent.forEach(({ sales }) => {
    Object.entries(sales).forEach(([dish, qty]) => {
      totals[dish] = (totals[dish] || 0) + qty;
    });
  });
  return totals;
}

// ── Helper: get average daily sales per dish ──────────────────────────────────
export function getAvgDailySales(days = 3) {
  const totals = getDishSalesTotals(days);
  return Object.fromEntries(
    Object.entries(totals).map(([dish, total]) => [dish, Math.round(total / days)])
  );
}

export const dateRangePresets = [
  { label: "Today",       days: 1  },
  { label: "Last 7 days", days: 7  },
  { label: "Last 14 days",days: 14 },
  { label: "This month",  days: 31 },
];
