// data/mockTransactions.js
// ─────────────────────────────────────────────────────────
// Full month of transactions: SALE events and RESTOCK events.
//
// SALE   — a dish was sold (links to mockproduction recipes for ingredient deduction)
// RESTOCK — an ingredient was purchased, with batch date + predicted expiry
//
// Predicted expiry is calculated from:
//   baseline shelf life (common knowledge) + adaptive adjustment from mockExpiryHistory.js
//
// Used by:
//   - Sales Analytics page (revenue, volume trends)
//   - AI Restock Recommendation (avg daily usage → reorder qty)
//   - AI Production Recommendation (recent sales velocity)
//   - Inventory batch tracking (which batch expires when)
// ─────────────────────────────────────────────────────────

// Baseline shelf life in days (common knowledge defaults)
export const baselineShelfLife = {
  "Espresso Beans":   30,
  "Fresh Milk":        7,
  "Matcha Powder":    90,
  "Caramel Syrup":   180,
  "Croissant Dough":   2,
  "Muffin Mix":       60,
  "Sugar":           365,
  "Ice Cubes":         1,
  "Whipped Cream":    14,
  "Vanilla Syrup":   180,
  "Chocolate Powder": 90,
  "Paper Cup (12oz)": 365,
};

// Helper to generate a date string relative to March 2024
const d = (day) => `2024-03-${String(day).padStart(2, "0")}`;

// Helper to add days to a date string
const addDays = (dateStr, days) => {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
};

// ── SALE TRANSACTIONS ─────────────────────────────────────
// Each entry = one transaction (one customer order)
// Grouped by date for readability, spread across the month
export const saleTransactions = [
  // Week 1 (1–7) — slow start
  { id: "S001", type: "SALE", date: d(1),  dish: "Caramel Latte",  qty: 8,  unitPrice: 14_000, total: 112_000 },
  { id: "S002", type: "SALE", date: d(1),  dish: "Matcha Latte",   qty: 7,  unitPrice: 14_000, total: 98_000 },
  { id: "S003", type: "SALE", date: d(1),  dish: "Espresso",       qty: 6,  unitPrice: 10_000, total: 60_000 },
  { id: "S004", type: "SALE", date: d(1),  dish: "Croissant",      qty: 5,  unitPrice: 10_000, total: 50_000 },
  { id: "S005", type: "SALE", date: d(2),  dish: "Caramel Latte",  qty: 10, unitPrice: 14_000, total: 140_000 },
  { id: "S006", type: "SALE", date: d(2),  dish: "Iced Americano", qty: 8,  unitPrice: 12_000, total: 96_000 },
  { id: "S007", type: "SALE", date: d(2),  dish: "Cappuccino",     qty: 7,  unitPrice: 15_000, total: 105_000 },
  { id: "S008", type: "SALE", date: d(3),  dish: "Matcha Latte",   qty: 9,  unitPrice: 14_000, total: 126_000 },
  { id: "S009", type: "SALE", date: d(3),  dish: "Muffin",         qty: 5,  unitPrice: 9_000,  total: 45_000 },
  { id: "S010", type: "SALE", date: d(4),  dish: "Caramel Latte",  qty: 12, unitPrice: 14_000, total: 168_000 },
  { id: "S011", type: "SALE", date: d(4),  dish: "Espresso",       qty: 9,  unitPrice: 10_000, total: 90_000 },
  { id: "S012", type: "SALE", date: d(5),  dish: "Cappuccino",     qty: 8,  unitPrice: 15_000, total: 120_000 },
  { id: "S013", type: "SALE", date: d(5),  dish: "Croissant",      qty: 7,  unitPrice: 10_000, total: 70_000 },
  { id: "S014", type: "SALE", date: d(6),  dish: "Caramel Latte",  qty: 14, unitPrice: 14_000, total: 196_000 },
  { id: "S015", type: "SALE", date: d(6),  dish: "Matcha Latte",   qty: 11, unitPrice: 14_000, total: 154_000 },
  { id: "S016", type: "SALE", date: d(7),  dish: "Iced Americano", qty: 10, unitPrice: 12_000, total: 120_000 },
  { id: "S017", type: "SALE", date: d(7),  dish: "Muffin",         qty: 7,  unitPrice: 9_000,  total: 63_000 },

  // Week 2 (8–14) — picking up
  { id: "S018", type: "SALE", date: d(8),  dish: "Caramel Latte",  qty: 13, unitPrice: 14_000, total: 182_000 },
  { id: "S019", type: "SALE", date: d(8),  dish: "Matcha Latte",   qty: 10, unitPrice: 14_000, total: 140_000 },
  { id: "S020", type: "SALE", date: d(9),  dish: "Espresso",       qty: 8,  unitPrice: 10_000, total: 80_000 },
  { id: "S021", type: "SALE", date: d(10), dish: "Cappuccino",     qty: 9,  unitPrice: 15_000, total: 135_000 },
  { id: "S022", type: "SALE", date: d(10), dish: "Caramel Latte",  qty: 12, unitPrice: 14_000, total: 168_000 },
  { id: "S023", type: "SALE", date: d(11), dish: "Matcha Latte",   qty: 12, unitPrice: 14_000, total: 168_000 },
  { id: "S024", type: "SALE", date: d(11), dish: "Croissant",      qty: 8,  unitPrice: 10_000, total: 80_000 },
  { id: "S025", type: "SALE", date: d(12), dish: "Caramel Latte",  qty: 15, unitPrice: 14_000, total: 210_000 },
  { id: "S026", type: "SALE", date: d(12), dish: "Iced Americano", qty: 9,  unitPrice: 12_000, total: 108_000 },
  { id: "S027", type: "SALE", date: d(13), dish: "Espresso",       qty: 11, unitPrice: 10_000, total: 110_000 },
  { id: "S028", type: "SALE", date: d(13), dish: "Muffin",         qty: 8,  unitPrice: 9_000,  total: 72_000 },
  { id: "S029", type: "SALE", date: d(14), dish: "Caramel Latte",  qty: 16, unitPrice: 14_000, total: 224_000 },
  { id: "S030", type: "SALE", date: d(14), dish: "Cappuccino",     qty: 10, unitPrice: 15_000, total: 150_000 },

  // Week 3 (15–21) — strong mid-month
  { id: "S031", type: "SALE", date: d(15), dish: "Caramel Latte",  qty: 17, unitPrice: 14_000, total: 238_000 },
  { id: "S032", type: "SALE", date: d(15), dish: "Matcha Latte",   qty: 14, unitPrice: 14_000, total: 196_000 },
  { id: "S033", type: "SALE", date: d(16), dish: "Espresso",       qty: 12, unitPrice: 10_000, total: 120_000 },
  { id: "S034", type: "SALE", date: d(16), dish: "Iced Americano", qty: 11, unitPrice: 12_000, total: 132_000 },
  { id: "S035", type: "SALE", date: d(17), dish: "Caramel Latte",  qty: 14, unitPrice: 14_000, total: 196_000 },
  { id: "S036", type: "SALE", date: d(17), dish: "Croissant",      qty: 9,  unitPrice: 10_000, total: 90_000 },
  { id: "S037", type: "SALE", date: d(18), dish: "Cappuccino",     qty: 8,  unitPrice: 15_000, total: 120_000 },
  { id: "S038", type: "SALE", date: d(18), dish: "Matcha Latte",   qty: 11, unitPrice: 14_000, total: 154_000 },
  { id: "S039", type: "SALE", date: d(19), dish: "Caramel Latte",  qty: 13, unitPrice: 14_000, total: 182_000 },
  { id: "S040", type: "SALE", date: d(19), dish: "Muffin",         qty: 6,  unitPrice: 9_000,  total: 54_000 },
  { id: "S041", type: "SALE", date: d(20), dish: "Espresso",       qty: 10, unitPrice: 10_000, total: 100_000 },
  { id: "S042", type: "SALE", date: d(21), dish: "Caramel Latte",  qty: 15, unitPrice: 14_000, total: 210_000 },

  // Week 4 (22–31) — best week, end-of-month surge
  { id: "S043", type: "SALE", date: d(22), dish: "Caramel Latte",  qty: 16, unitPrice: 14_000, total: 224_000 },
  { id: "S044", type: "SALE", date: d(22), dish: "Matcha Latte",   qty: 13, unitPrice: 14_000, total: 182_000 },
  { id: "S045", type: "SALE", date: d(23), dish: "Cappuccino",     qty: 11, unitPrice: 15_000, total: 165_000 },
  { id: "S046", type: "SALE", date: d(23), dish: "Iced Americano", qty: 12, unitPrice: 12_000, total: 144_000 },
  { id: "S047", type: "SALE", date: d(24), dish: "Caramel Latte",  qty: 18, unitPrice: 14_000, total: 252_000 },
  { id: "S048", type: "SALE", date: d(24), dish: "Croissant",      qty: 10, unitPrice: 10_000, total: 100_000 },
  { id: "S049", type: "SALE", date: d(25), dish: "Espresso",       qty: 14, unitPrice: 10_000, total: 140_000 },
  { id: "S050", type: "SALE", date: d(25), dish: "Matcha Latte",   qty: 15, unitPrice: 14_000, total: 210_000 },
  { id: "S051", type: "SALE", date: d(26), dish: "Caramel Latte",  qty: 17, unitPrice: 14_000, total: 238_000 },
  { id: "S052", type: "SALE", date: d(26), dish: "Muffin",         qty: 9,  unitPrice: 9_000,  total: 81_000 },
  { id: "S053", type: "SALE", date: d(27), dish: "Cappuccino",     qty: 12, unitPrice: 15_000, total: 180_000 },
  { id: "S054", type: "SALE", date: d(28), dish: "Caramel Latte",  qty: 15, unitPrice: 14_000, total: 210_000 },
  { id: "S055", type: "SALE", date: d(28), dish: "Iced Americano", qty: 11, unitPrice: 12_000, total: 132_000 },
  { id: "S056", type: "SALE", date: d(29), dish: "Matcha Latte",   qty: 14, unitPrice: 14_000, total: 196_000 },
  { id: "S057", type: "SALE", date: d(29), dish: "Espresso",       qty: 12, unitPrice: 10_000, total: 120_000 },
  { id: "S058", type: "SALE", date: d(30), dish: "Caramel Latte",  qty: 18, unitPrice: 14_000, total: 252_000 },
  { id: "S059", type: "SALE", date: d(30), dish: "Croissant",      qty: 12, unitPrice: 10_000, total: 120_000 },
  { id: "S060", type: "SALE", date: d(31), dish: "Caramel Latte",  qty: 19, unitPrice: 14_000, total: 266_000 },
  { id: "S061", type: "SALE", date: d(31), dish: "Matcha Latte",   qty: 16, unitPrice: 14_000, total: 224_000 },
  { id: "S062", type: "SALE", date: d(31), dish: "Cappuccino",     qty: 13, unitPrice: 15_000, total: 195_000 },
];

// ── RESTOCK TRANSACTIONS ──────────────────────────────────
// Each restock = one purchase order line.
// predictedExpiryDate = purchaseDate + adjustedShelfLife (from mockExpiryHistory)
// supplier is placeholder for future Purchase Order page
export const restockTransactions = [
  // Early month restocks (day 1–3)
  {
    id: "R001", type: "RESTOCK", date: d(1),
    ingredient: "Espresso Beans",
    qty: 2000, unit: "g",
    supplier: "Kopi Nusantara Supplier",
    unitCost: 150,  totalCost: 300_000,
    batchLabel: "Batch Mar-1A",
    purchaseDate: d(1),
    predictedExpiryDate: addDays(d(1), 30),
    adjustedShelfLifeDays: 30,
    notes: "Regular monthly restock",
  },
  {
    id: "R002", type: "RESTOCK", date: d(1),
    ingredient: "Fresh Milk",
    qty: 5000, unit: "ml",
    supplier: "Dairy Fresh Co.",
    unitCost: 14,  totalCost: 70_000,
    batchLabel: "Batch Mar-1B",
    purchaseDate: d(1),
    predictedExpiryDate: addDays(d(1), 6), // adjusted: opname history shows milk spoils at day 6
    adjustedShelfLifeDays: 6,
    notes: "Adjusted expiry: 3 opnames show milk spoiling at day 6 not day 7",
  },
  {
    id: "R003", type: "RESTOCK", date: d(1),
    ingredient: "Croissant Dough",
    qty: 40, unit: "pcs",
    supplier: "Bakery Artisan",
    unitCost: 8_000, totalCost: 320_000,
    batchLabel: "Batch Mar-1C",
    purchaseDate: d(1),
    predictedExpiryDate: addDays(d(1), 2),
    adjustedShelfLifeDays: 2,
    notes: "Short shelf life — order frequently in small batches",
  },
  {
    id: "R004", type: "RESTOCK", date: d(3),
    ingredient: "Caramel Syrup",
    qty: 1500, unit: "ml",
    supplier: "Syrup House ID",
    unitCost: 80,  totalCost: 120_000,
    batchLabel: "Batch Mar-3A",
    purchaseDate: d(3),
    predictedExpiryDate: addDays(d(3), 180),
    adjustedShelfLifeDays: 180,
    notes: "",
  },
  {
    id: "R005", type: "RESTOCK", date: d(3),
    ingredient: "Vanilla Syrup",
    qty: 1000, unit: "ml",
    supplier: "Syrup House ID",
    unitCost: 85,  totalCost: 85_000,
    batchLabel: "Batch Mar-3B",
    purchaseDate: d(3),
    predictedExpiryDate: addDays(d(3), 180),
    adjustedShelfLifeDays: 180,
    notes: "",
  },

  // Mid-month restocks (day 8–12)
  {
    id: "R006", type: "RESTOCK", date: d(8),
    ingredient: "Fresh Milk",
    qty: 4000, unit: "ml",
    supplier: "Dairy Fresh Co.",
    unitCost: 14,  totalCost: 56_000,
    batchLabel: "Batch Mar-8A",
    purchaseDate: d(8),
    predictedExpiryDate: addDays(d(8), 6),
    adjustedShelfLifeDays: 6,
    notes: "Adjusted expiry based on opname history (pattern confirmed)",
  },
  {
    id: "R007", type: "RESTOCK", date: d(8),
    ingredient: "Croissant Dough",
    qty: 35, unit: "pcs",
    supplier: "Bakery Artisan",
    unitCost: 8_000, totalCost: 280_000,
    batchLabel: "Batch Mar-8B",
    purchaseDate: d(8),
    predictedExpiryDate: addDays(d(8), 2),
    adjustedShelfLifeDays: 2,
    notes: "",
  },
  {
    id: "R008", type: "RESTOCK", date: d(10),
    ingredient: "Matcha Powder",
    qty: 500, unit: "g",
    supplier: "Matcha Direct",
    unitCost: 400, totalCost: 200_000,
    batchLabel: "Batch Mar-10A",
    purchaseDate: d(10),
    predictedExpiryDate: addDays(d(10), 90),
    adjustedShelfLifeDays: 90,
    notes: "",
  },
  {
    id: "R009", type: "RESTOCK", date: d(10),
    ingredient: "Whipped Cream",
    qty: 1200, unit: "ml",
    supplier: "Dairy Fresh Co.",
    unitCost: 50,  totalCost: 60_000,
    batchLabel: "Batch Mar-10B",
    purchaseDate: d(10),
    predictedExpiryDate: addDays(d(10), 12), // adjusted: opname shows 12 days not 14
    adjustedShelfLifeDays: 12,
    notes: "Adjusted expiry: 3 opnames show cream losing quality at day 12",
  },
  {
    id: "R010", type: "RESTOCK", date: d(12),
    ingredient: "Sugar",
    qty: 3000, unit: "g",
    supplier: "Grosir Bahan Kue",
    unitCost: 15,  totalCost: 45_000,
    batchLabel: "Batch Mar-12A",
    purchaseDate: d(12),
    predictedExpiryDate: addDays(d(12), 365),
    adjustedShelfLifeDays: 365,
    notes: "",
  },
  {
    id: "R011", type: "RESTOCK", date: d(12),
    ingredient: "Paper Cup (12oz)",
    qty: 200, unit: "pcs",
    supplier: "Packaging Supplies ID",
    unitCost: 800, totalCost: 160_000,
    batchLabel: "Batch Mar-12B",
    purchaseDate: d(12),
    predictedExpiryDate: addDays(d(12), 365),
    adjustedShelfLifeDays: 365,
    notes: "",
  },

  // Late month restocks (day 15–25)
  {
    id: "R012", type: "RESTOCK", date: d(15),
    ingredient: "Fresh Milk",
    qty: 5000, unit: "ml",
    supplier: "Dairy Fresh Co.",
    unitCost: 14,  totalCost: 70_000,
    batchLabel: "Batch Mar-15A",
    purchaseDate: d(15),
    predictedExpiryDate: addDays(d(15), 6),
    adjustedShelfLifeDays: 6,
    notes: "Adjusted expiry (pattern confirmed — 3+ opnames)",
  },
  {
    id: "R013", type: "RESTOCK", date: d(15),
    ingredient: "Croissant Dough",
    qty: 30, unit: "pcs",
    supplier: "Bakery Artisan",
    unitCost: 8_000, totalCost: 240_000,
    batchLabel: "Batch Mar-15B",
    purchaseDate: d(15),
    predictedExpiryDate: addDays(d(15), 2),
    adjustedShelfLifeDays: 2,
    notes: "",
  },
  {
    id: "R014", type: "RESTOCK", date: d(18),
    ingredient: "Espresso Beans",
    qty: 1500, unit: "g",
    supplier: "Kopi Nusantara Supplier",
    unitCost: 150, totalCost: 225_000,
    batchLabel: "Batch Mar-18A",
    purchaseDate: d(18),
    predictedExpiryDate: addDays(d(18), 30),
    adjustedShelfLifeDays: 30,
    notes: "",
  },
  {
    id: "R015", type: "RESTOCK", date: d(20),
    ingredient: "Muffin Mix",
    qty: 1000, unit: "g",
    supplier: "Grosir Bahan Kue",
    unitCost: 50,  totalCost: 50_000,
    batchLabel: "Batch Mar-20A",
    purchaseDate: d(20),
    predictedExpiryDate: addDays(d(20), 60),
    adjustedShelfLifeDays: 60,
    notes: "",
  },
  {
    id: "R016", type: "RESTOCK", date: d(22),
    ingredient: "Fresh Milk",
    qty: 4500, unit: "ml",
    supplier: "Dairy Fresh Co.",
    unitCost: 14,  totalCost: 63_000,
    batchLabel: "Batch Mar-22A",
    purchaseDate: d(22),
    predictedExpiryDate: addDays(d(22), 6),
    adjustedShelfLifeDays: 6,
    notes: "Adjusted expiry (pattern confirmed)",
  },
  {
    id: "R017", type: "RESTOCK", date: d(22),
    ingredient: "Whipped Cream",
    qty: 900, unit: "ml",
    supplier: "Dairy Fresh Co.",
    unitCost: 50,  totalCost: 45_000,
    batchLabel: "Batch Mar-22B",
    purchaseDate: d(22),
    predictedExpiryDate: addDays(d(22), 12),
    adjustedShelfLifeDays: 12,
    notes: "Adjusted expiry (pattern confirmed)",
  },
  {
    id: "R018", type: "RESTOCK", date: d(25),
    ingredient: "Caramel Syrup",
    qty: 900, unit: "ml",
    supplier: "Syrup House ID",
    unitCost: 80,  totalCost: 72_000,
    batchLabel: "Batch Mar-25A",
    purchaseDate: d(25),
    predictedExpiryDate: addDays(d(25), 180),
    adjustedShelfLifeDays: 180,
    notes: "",
  },
  {
    id: "R019", type: "RESTOCK", date: d(28),
    ingredient: "Croissant Dough",
    qty: 30, unit: "pcs",
    supplier: "Bakery Artisan",
    unitCost: 8_000, totalCost: 240_000,
    batchLabel: "Batch Mar-28A",
    purchaseDate: d(28),
    predictedExpiryDate: addDays(d(28), 2),
    adjustedShelfLifeDays: 2,
    notes: "",
  },
  {
    id: "R020", type: "RESTOCK", date: d(29),
    ingredient: "Fresh Milk",
    qty: 4000, unit: "ml",
    supplier: "Dairy Fresh Co.",
    unitCost: 14,  totalCost: 56_000,
    batchLabel: "Batch Mar-29A",
    purchaseDate: d(29),
    predictedExpiryDate: addDays(d(29), 6),
    adjustedShelfLifeDays: 6,
    notes: "Adjusted expiry (pattern confirmed)",
  },
];

// ── All transactions combined ─────────────────────────────
export const allTransactions = [...saleTransactions, ...restockTransactions]
  .sort((a, b) => new Date(a.date) - new Date(b.date));

// ── Helper: get daily sales totals by dish ────────────────
export function getSalesByDate(date) {
  return saleTransactions
    .filter((t) => t.date === date)
    .reduce((acc, t) => {
      acc[t.dish] = (acc[t.dish] || 0) + t.qty;
      return acc;
    }, {});
}

// ── Helper: get restocks for a given ingredient ───────────
export function getRestockHistory(ingredientName) {
  return restockTransactions.filter((t) => t.ingredient === ingredientName);
}

// ── Helper: get total restock spend this month ────────────
export function getTotalRestockCost() {
  return restockTransactions.reduce((s, t) => s + t.totalCost, 0);
}

// ── Helper: get avg daily sales per dish (last N sale days) ──
export function getAvgDailySalesFromTransactions(days = 7) {
  const dates = [...new Set(saleTransactions.map((t) => t.date))].slice(-days);
  const totals = {};
  const counts = {};
  saleTransactions
    .filter((t) => dates.includes(t.date))
    .forEach((t) => {
      totals[t.dish] = (totals[t.dish] || 0) + t.qty;
      counts[t.dish] = (counts[t.dish] || 0) + 1;
    });
  return Object.fromEntries(
    Object.entries(totals).map(([dish, total]) => [dish, Math.round(total / dates.length)])
  );
}
