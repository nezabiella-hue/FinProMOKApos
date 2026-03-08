// data/mockLiveUpdate.js
// ─────────────────────────────────────────────────────────
// Simulates a "Live Update" button press — represents what
// a real POS sync would push into the system in real time.
//
// In production this would be a WebSocket / polling event.
// For the prototype, pressing "Live Update" applies this data.
//
// Affects:
//   - Sales Analytics: today's running totals update
//   - Inventory: stock levels decrease based on sales
//   - Production Alerts: may trigger if stock drops to Low/Out
//   - Dashboard: today's card values refresh
// ─────────────────────────────────────────────────────────

export const liveUpdateSnapshot = {
  // Snapshot timestamp (simulated as "today")
  snapshotDate: "2024-04-01",
  snapshotTime: "14:32",
  label: "Live as of 14:32",

  // ── Today's sales so far (partial day — morning rush done) ──
  todaySales: [
    { dish: "Caramel Latte",  qty: 12, unitPrice: 14_000, subtotal: 168_000 },
    { dish: "Matcha Latte",   qty: 10, unitPrice: 14_000, subtotal: 140_000 },
    { dish: "Espresso",       qty: 9,  unitPrice: 10_000, subtotal: 90_000  },
    { dish: "Cappuccino",     qty: 7,  unitPrice: 15_000, subtotal: 105_000 },
    { dish: "Iced Americano", qty: 8,  unitPrice: 12_000, subtotal: 96_000  },
    { dish: "Croissant",      qty: 6,  unitPrice: 10_000, subtotal: 60_000  },
    { dish: "Muffin",         qty: 5,  unitPrice: 9_000,  subtotal: 45_000  },
  ],

  // ── Running totals for today ──
  todayTotals: {
    grossSales: 704_000,
    transactions: 22,
    avgPerTransaction: 32_000,
    // vs yesterday (March 31): grossSales was 4_350_000 / 104 txn
    // today is partial — projected full day at current rate: ~1_408_000
    projectedDayTotal: 1_408_000,
  },

  // ── Stock deductions from today's sales ──────────────────
  // Calculated from recipes × qty sold
  // Used to update inventory.currentStock when Live Update is applied
  stockDeductions: [
    { ingredient: "Espresso Beans",  deduct: 486,  unit: "g"   }, // 18g × (12+9+7+8) espresso dishes
    { ingredient: "Fresh Milk",      deduct: 5_050, unit: "ml"  }, // 200ml×12 + 250ml×10 + 150ml×7
    { ingredient: "Caramel Syrup",   deduct: 360,  unit: "ml"  }, // 30ml × 12
    { ingredient: "Vanilla Syrup",   deduct: 180,  unit: "ml"  }, // 15ml × 12
    { ingredient: "Whipped Cream",   deduct: 710,  unit: "ml"  }, // 30ml×12 + 50ml×7
    { ingredient: "Matcha Powder",   deduct: 200,  unit: "g"   }, // 20g × 10
    { ingredient: "Sugar",           deduct: 420,  unit: "g"   }, // 15g×10 + 10g×7 + 20g×5
    { ingredient: "Ice Cubes",       deduct: 40,   unit: "pcs" }, // 5pcs × 8
    { ingredient: "Croissant Dough", deduct: 6,    unit: "pcs" }, // 1pcs × 6
    { ingredient: "Muffin Mix",      deduct: 250,  unit: "g"   }, // 50g × 5
    { ingredient: "Paper Cup (12oz)",deduct: 52,   unit: "pcs" }, // ~all drinks
  ],

  // ── Any restocks that happened today ──
  todayRestocks: [
    {
      ingredient: "Fresh Milk",
      qty: 3000,
      unit: "ml",
      supplier: "Dairy Fresh Co.",
      batchLabel: "Batch Apr-1A",
      purchaseDate: "2024-04-01",
      predictedExpiryDate: "2024-04-07", // 6 days (adjusted shelf life)
      totalCost: 42_000,
    },
  ],

  // ── Low stock alerts triggered by today's deductions ──
  // Pre-calculated for instant display when Live Update is applied
  triggeredAlerts: [
    {
      ingredient: "Fresh Milk",
      currentAfterDeduction: 150,   // 3200 (post-opname) - 5050 + 3000 restock = 1150 → wait, sim value
      threshold: 1000,
      alertType: "expiry",
      message: "Fresh Milk batch expires in 2 days",
    },
    {
      ingredient: "Whipped Cream",
      currentAfterDeduction: 180,
      threshold: 300,
      alertType: "low",
      message: "Whipped Cream below threshold",
    },
    {
      ingredient: "Croissant Dough",
      currentAfterDeduction: 2,
      threshold: 15,
      alertType: "critical",
      message: "Croissant Dough critically low — expired batch was removed",
    },
  ],

  // ── Comparison vs yesterday ───────────────────────────────
  vsYesterday: {
    grossSalesDiff: null,   // null = partial day, can't compare yet
    transactionsDiff: null,
    note: "Partial day data — full comparison available after closing",
  },
};

// ── Helper: apply live update deductions to stock array ──
// Used in Inventory and Production pages when user clicks "Live Update"
export function applyLiveDeductions(currentStock) {
  const deductions = liveUpdateSnapshot.stockDeductions;
  return currentStock.map((item) => {
    const d = deductions.find((d) => d.ingredient === item.name);
    if (!d) return item;
    const newQty = Math.max(0, item.currentStock - d.deduct);
    const newStatus =
      newQty === 0 ? "Out"
      : newQty < (item.lowThreshold || 200) ? "Low"
      : "OK";
    return { ...item, currentStock: newQty, status: newStatus };
  });
}

// ── Helper: get today's gross sales total ────────────────
export function getTodayGross() {
  return liveUpdateSnapshot.todayTotals.grossSales;
}

// ── Helper: get today's per-dish sales as a flat object ──
export function getTodayDishSales() {
  return liveUpdateSnapshot.todaySales.reduce((acc, s) => {
    acc[s.dish] = s.qty;
    return acc;
  }, {});
}
