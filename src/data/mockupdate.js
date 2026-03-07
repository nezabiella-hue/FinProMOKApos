// data/mockupdate.js — Simulated uploaded stock opname
//
// SCENARIO: Physical count reveals stocks are lower than system records.
// Key findings:
//   - Matcha Powder: 500g → 120g (Low)
//   - Caramel Syrup: 900ml → 150ml (Low)
//   - Vanilla Syrup: 600ml → 120ml (Low)
//   - Croissant Dough: 30pcs → 8pcs (Low) + already EXPIRED
//   - Fresh Milk: 4000ml → 3200ml + expires in 2 days
//   - Whipped Cream: 900ml → 180ml (Low) + expires in 2 days
//
// Note: usageErrorRate is now in mockUsageErrorRate.js
// That file is separate so it can be edited independently for the
// "usage error rate analysis" feature without touching opname data.

const daysFromNow = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
};

export const stockOpnameUpdate = [
  {
    name: "Espresso Beans",
    uploadedStock: 1900,
    unit: "g",
    lowThreshold: 500,
    expiryDate: null,
    notes: "Minor spillage during grinding",
  },
  {
    name: "Fresh Milk",
    uploadedStock: 3200,
    unit: "ml",
    lowThreshold: 1000,
    expiryDate: daysFromNow(2),
    notes: "Expiry not tracked before — found during count. Expires in 2 days.",
  },
  {
    name: "Matcha Powder",
    uploadedStock: 120,
    unit: "g",
    lowThreshold: 200,
    expiryDate: null,
    notes: "Used more than recorded — urgent reorder needed",
  },
  {
    name: "Caramel Syrup",
    uploadedStock: 150,
    unit: "ml",
    lowThreshold: 300,
    expiryDate: null,
    notes: "Bottle nearly empty, daily usage not tracked properly",
  },
  {
    name: "Croissant Dough",
    uploadedStock: 8,
    unit: "pcs",
    lowThreshold: 15,
    expiryDate: daysFromNow(-1),
    notes:
      "Several discarded — already expired. System expiry date was incorrect.",
  },
  {
    name: "Muffin Mix",
    uploadedStock: 800,
    unit: "g",
    lowThreshold: 200,
    expiryDate: null,
    notes: "",
  },
  {
    name: "Sugar",
    uploadedStock: 4200,
    unit: "g",
    lowThreshold: 500,
    expiryDate: null,
    notes: "Slightly less used — customers opting for less sugar",
  },
  {
    name: "Ice Cubes",
    uploadedStock: 200,
    unit: "pcs",
    lowThreshold: 50,
    expiryDate: null,
    notes: "",
  },
  {
    name: "Whipped Cream",
    uploadedStock: 180,
    unit: "ml",
    lowThreshold: 300,
    expiryDate: daysFromNow(2),
    notes: "Heavy usage, hard to portion exactly. Expiry approaching.",
  },
  {
    name: "Vanilla Syrup",
    uploadedStock: 120,
    unit: "ml",
    lowThreshold: 200,
    expiryDate: null,
    notes: "Lower than expected — likely over-pouring",
  },
  {
    name: "Chocolate Powder",
    uploadedStock: 400,
    unit: "g",
    lowThreshold: 100,
    expiryDate: null,
    notes: "",
  },
  {
    name: "Paper Cup (12oz)",
    uploadedStock: 150,
    unit: "pcs",
    lowThreshold: 50,
    expiryDate: null,
    notes: "",
  },
];
