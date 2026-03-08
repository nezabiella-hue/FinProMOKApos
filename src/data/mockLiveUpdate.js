// data/mockLiveUpdate.js
// ─────────────────────────────────────────────────────────
// Simulates a "Live Update" button press for prototype demos.
// Represents POS sync events: hourly sales batches + one restock.
//
// IMPORTANT: Live updates NEVER affect usageErrorRate.
// Usage error rate is only recalculated during Stock Opname (mockupdate.js).
//
// Flow:
//   Step 1 → Hour 1 sales (morning rush)
//   Step 2 → Hour 2 sales (late morning)
//   Step 3 → Restock arrives (Fresh Milk delivery)
//   Step 4 → Hour 3 sales (afternoon)
//
// After step 4, button disables — the day simulation is complete.
// ─────────────────────────────────────────────────────────

export const liveSteps = [
  {
    step: 1,
    time: "09:00",
    label: "Hour 1 – Morning Rush",
    type: "sales",
    sales: [
      { dish: "Caramel Latte",  qty: 5,  unitPrice: 14_000, subtotal: 70_000  },
      { dish: "Espresso",       qty: 4,  unitPrice: 10_000, subtotal: 40_000  },
      { dish: "Cappuccino",     qty: 3,  unitPrice: 15_000, subtotal: 45_000  },
    ],
    // Stock deductions calculated from recipes × qty sold
    // Caramel Latte ×5: Espresso Beans 18g×5=90g, Fresh Milk 200ml×5=1000ml,
    //   Caramel Syrup 30ml×5=150ml, Vanilla Syrup 15ml×5=75ml, Whipped Cream 30ml×5=150ml
    // Espresso ×4: Espresso Beans 18g×4=72g
    // Cappuccino ×3: Espresso Beans 18g×3=54g, Fresh Milk 150ml×3=450ml,
    //   Whipped Cream 50ml×3=150ml, Sugar 10g×3=30g
    deductions: [
      { ingredient: "Espresso Beans",   deduct: 216,  unit: "g"   },
      { ingredient: "Fresh Milk",       deduct: 1450, unit: "ml"  },
      { ingredient: "Caramel Syrup",    deduct: 150,  unit: "ml"  },
      { ingredient: "Vanilla Syrup",    deduct: 75,   unit: "ml"  },
      { ingredient: "Whipped Cream",    deduct: 300,  unit: "ml"  },
      { ingredient: "Sugar",            deduct: 30,   unit: "g"   },
      { ingredient: "Paper Cup (12oz)", deduct: 12,   unit: "pcs" },
    ],
  },
  {
    step: 2,
    time: "11:00",
    label: "Hour 2 – Late Morning",
    type: "sales",
    sales: [
      { dish: "Matcha Latte",   qty: 4,  unitPrice: 14_000, subtotal: 56_000  },
      { dish: "Iced Americano", qty: 3,  unitPrice: 12_000, subtotal: 36_000  },
      { dish: "Croissant",      qty: 5,  unitPrice: 10_000, subtotal: 50_000  },
    ],
    // Matcha Latte ×4: Matcha Powder 20g×4=80g, Fresh Milk 250ml×4=1000ml, Sugar 15g×4=60g
    // Iced Americano ×3: Espresso Beans 18g×3=54g, Ice Cubes 5pcs×3=15pcs
    // Croissant ×5: Croissant Dough 1pcs×5=5pcs
    deductions: [
      { ingredient: "Matcha Powder",    deduct: 80,   unit: "g"   },
      { ingredient: "Fresh Milk",       deduct: 1000, unit: "ml"  },
      { ingredient: "Sugar",            deduct: 60,   unit: "g"   },
      { ingredient: "Espresso Beans",   deduct: 54,   unit: "g"   },
      { ingredient: "Ice Cubes",        deduct: 15,   unit: "pcs" },
      { ingredient: "Croissant Dough",  deduct: 5,    unit: "pcs" },
      { ingredient: "Paper Cup (12oz)", deduct: 7,    unit: "pcs" },
    ],
  },
  {
    step: 3,
    time: "13:00",
    label: "Restock – Fresh Milk Delivery",
    type: "restock",
    restock: {
      ingredient: "Fresh Milk",
      qty: 3000,
      unit: "ml",
      supplier: "Dairy Fresh Co.",
      batchLabel: "Batch Live-A",
      note: "Scheduled midday delivery",
    },
    // No deductions — restock only adds to stock
    additions: [
      { ingredient: "Fresh Milk", add: 3000, unit: "ml" },
    ],
  },
  {
    step: 4,
    time: "15:00",
    label: "Hour 3 – Afternoon",
    type: "sales",
    sales: [
      { dish: "Caramel Latte",  qty: 4,  unitPrice: 14_000, subtotal: 56_000  },
      { dish: "Muffin",         qty: 6,  unitPrice: 9_000,  subtotal: 54_000  },
      { dish: "Espresso",       qty: 3,  unitPrice: 10_000, subtotal: 30_000  },
    ],
    // Caramel Latte ×4: Espresso Beans 18g×4=72g, Fresh Milk 200ml×4=800ml,
    //   Caramel Syrup 30ml×4=120ml, Vanilla Syrup 15ml×4=60ml, Whipped Cream 30ml×4=120ml
    // Muffin ×6: Muffin Mix 50g×6=300g, Sugar 20g×6=120g
    // Espresso ×3: Espresso Beans 18g×3=54g
    deductions: [
      { ingredient: "Espresso Beans",   deduct: 126,  unit: "g"   },
      { ingredient: "Fresh Milk",       deduct: 800,  unit: "ml"  },
      { ingredient: "Caramel Syrup",    deduct: 120,  unit: "ml"  },
      { ingredient: "Vanilla Syrup",    deduct: 60,   unit: "ml"  },
      { ingredient: "Whipped Cream",    deduct: 120,  unit: "ml"  },
      { ingredient: "Muffin Mix",       deduct: 300,  unit: "g"   },
      { ingredient: "Sugar",            deduct: 120,  unit: "g"   },
      { ingredient: "Paper Cup (12oz)", deduct: 7,    unit: "pcs" },
    ],
  },
];

// ── Snapshot summary for the Sales Analytics (reports) page ──
// Derived from all sales steps combined — represents end-of-afternoon state.
// Reports page uses this for its own "Apply Live Update" toggle which is
// separate from the inventory/production step-by-step simulation.
export const liveUpdateSnapshot = {
  snapshotDate: "2024-04-01",
  snapshotTime: "15:30",
  label: "Live as of 15:30",
  todaySales: [
    { dish: "Caramel Latte",  qty: 9,  unitPrice: 14_000, subtotal: 126_000 },
    { dish: "Espresso",       qty: 7,  unitPrice: 10_000, subtotal: 70_000  },
    { dish: "Cappuccino",     qty: 3,  unitPrice: 15_000, subtotal: 45_000  },
    { dish: "Matcha Latte",   qty: 4,  unitPrice: 14_000, subtotal: 56_000  },
    { dish: "Iced Americano", qty: 3,  unitPrice: 12_000, subtotal: 36_000  },
    { dish: "Croissant",      qty: 5,  unitPrice: 10_000, subtotal: 50_000  },
    { dish: "Muffin",         qty: 6,  unitPrice: 9_000,  subtotal: 54_000  },
  ],
  todayTotals: {
    grossSales: 437_000,
    transactions: 22,
    avgPerTransaction: 19_864,
    projectedDayTotal: 874_000,
  },
};

// ── Apply one live step to the current stock array ────────
// NEVER recalculates usageErrorRate — that is opname-only.
export function applyLiveStep(currentStock, step) {
  return currentStock.map((item) => {
    // Sales step: deduct stock
    if (step.type === "sales" && step.deductions) {
      const d = step.deductions.find((d) => d.ingredient === item.name);
      if (!d) return item;
      const newQty = Math.max(0, item.currentStock - d.deduct);
      const newStatus =
        newQty === 0 ? "Out"
        : newQty < (item.lowThreshold || 200) ? "Low"
        : "OK";
      return { ...item, currentStock: newQty, status: newStatus };
    }

    // Restock step: add to stock
    if (step.type === "restock" && step.additions) {
      const a = step.additions.find((a) => a.ingredient === item.name);
      if (!a) return item;
      const newQty = item.currentStock + a.add;
      const newStatus =
        newQty === 0 ? "Out"
        : newQty < (item.lowThreshold || 200) ? "Low"
        : "OK";
      return { ...item, currentStock: newQty, status: newStatus };
    }

    return item;
  });
}
