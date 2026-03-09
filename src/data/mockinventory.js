// mockinventory.js
// BEFORE opname: all stocks are healthy, no Low status, no expiry warnings.
// AFTER applying mockupdate.js via Stock Opname, actual counts reveal:
//   - Matcha Powder → Low
//   - Caramel Syrup → Low
//   - Vanilla Syrup → Low
//   - Croissant Dough → Low + expires tomorrow
//   - Fresh Milk → expires in 2 days
//   - Whipped Cream → Low + expires in 2 days
// This cascades into Production: serving counts drop, alerts fire.

export const getExpiryStatus = (expiryDate) => {
  if (!expiryDate) return "Fresh";
  const days = Math.ceil((new Date(expiryDate) - new Date()) / 86400000);
  if (days <= 0) return "Expired";
  if (days <= 3) return `Expires in ${days} day${days > 1 ? "s" : ""}`;
  return "Fresh";
};

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
};

export const inventoryItems = [
  {
    id: 1,
    name: "Espresso Beans",
    currentStock: 2400,
    unit: "g",
    category: "Raw Material",
    status: "OK",
    expiryDate: null,
    usedBy: ["Espresso", "Caramel Latte", "Cappuccino", "Iced Americano"],
    lastOpname: "3 days ago",
    packagingUnit: { label: "bag", size: 250, unitLabel: "g" },
    shelfLifeDays: 30,
    batches: [
      { label: "Batch A", amount: 1500, unit: "g", age: "Purchased 5 days ago", purchaseDate: daysAgo(5) },
      { label: "Batch B", amount: 900, unit: "g", age: "Purchased 3 days ago", purchaseDate: daysAgo(3) },
    ],
  },
  {
    id: 2,
    name: "Fresh Milk",
    currentStock: 6000,
    unit: "ml",
    category: "Dairy",
    status: "OK",
    expiryDate: null, // expiry revealed after opname
    usedBy: ["Caramel Latte", "Matcha Latte", "Cappuccino"],
    lastOpname: "3 days ago",
    packagingUnit: { label: "carton", size: 1000, unitLabel: "ml" },
    shelfLifeDays: 7,
    batches: [
      { label: "Batch A", amount: 3500, unit: "ml", age: "Purchased 4 days ago", purchaseDate: daysAgo(4) },
      { label: "Batch B", amount: 2500, unit: "ml", age: "Purchased 2 days ago", purchaseDate: daysAgo(2) },
    ],
  },
  {
    id: 3,
    name: "Matcha Powder",
    currentStock: 500,
    unit: "g",
    category: "Raw Material",
    status: "OK",
    expiryDate: null,
    usedBy: ["Matcha Latte"],
    lastOpname: "3 days ago",
    packagingUnit: { label: "tin", size: 100, unitLabel: "g" },
    shelfLifeDays: 90,
    batches: [
      { label: "Batch A", amount: 500, unit: "g", age: "Purchased 3 days ago", purchaseDate: daysAgo(3) },
    ],
  },
  {
    id: 4,
    name: "Caramel Syrup",
    currentStock: 900,
    unit: "ml",
    category: "Syrup",
    status: "OK",
    expiryDate: null,
    usedBy: ["Caramel Latte"],
    lastOpname: "3 days ago",
    packagingUnit: { label: "bottle", size: 500, unitLabel: "ml" },
    shelfLifeDays: 180,
    batches: [
      { label: "Batch A", amount: 900, unit: "ml", age: "Purchased 4 days ago", purchaseDate: daysAgo(4) },
    ],
  },
  {
    id: 5,
    name: "Croissant Dough",
    currentStock: 30,
    unit: "pcs",
    category: "Prep Base",
    status: "OK",
    expiryDate: null,
    usedBy: ["Croissant"],
    lastOpname: "1 day ago",
    packagingUnit: { label: "pc", size: 1, unitLabel: "pcs" },
    shelfLifeDays: 2, // raw laminated dough: best within 2 days of prep
    batches: [
      { label: "Batch A", amount: 18, unit: "pcs", age: "Made yesterday", purchaseDate: daysAgo(1), madeDate: daysAgo(1) },
      { label: "Batch B", amount: 12, unit: "pcs", age: "Made today", purchaseDate: daysAgo(0), madeDate: daysAgo(0) },
    ],
  },
  {
    id: 6,
    name: "Muffin Mix",
    currentStock: 800,
    unit: "g",
    category: "Pastry",
    status: "OK",
    expiryDate: null,
    usedBy: ["Muffin"],
    lastOpname: "3 days ago",
    packagingUnit: { label: "pack", size: 400, unitLabel: "g" },
    shelfLifeDays: 180,
    batches: [
      { label: "Batch A", amount: 500, unit: "g", age: "Purchased 4 days ago", purchaseDate: daysAgo(4) },
      { label: "Batch B", amount: 300, unit: "g", age: "Purchased 1 day ago", purchaseDate: daysAgo(1) },
    ],
  },
  {
    id: 7,
    name: "Sugar",
    currentStock: 5000,
    unit: "g",
    category: "Raw Material",
    status: "OK",
    expiryDate: null,
    usedBy: ["Caramel Latte", "Matcha Latte", "Cappuccino", "Muffin"],
    lastOpname: "3 days ago",
    packagingUnit: { label: "bag", size: 1000, unitLabel: "g" },
    shelfLifeDays: 365,
    batches: [
      { label: "Batch A", amount: 5000, unit: "g", age: "Purchased 5 days ago", purchaseDate: daysAgo(5) },
    ],
  },
  {
    id: 8,
    name: "Ice Cubes",
    currentStock: 200,
    unit: "pcs",
    category: "Others",
    status: "OK",
    expiryDate: null,
    usedBy: ["Iced Americano"],
    lastOpname: "3 days ago",
    packagingUnit: { label: "bag", size: 50, unitLabel: "pcs" },
    shelfLifeDays: 1,
    batches: [
      { label: "Batch A", amount: 200, unit: "pcs", age: "Made today", purchaseDate: daysAgo(0) },
    ],
  },
  {
    id: 9,
    name: "Whipped Cream",
    currentStock: 2300,
    unit: "ml",
    category: "Dairy",
    status: "OK",
    expiryDate: null, // expiry revealed after opname
    usedBy: ["Cappuccino", "Caramel Latte"],
    lastOpname: "3 days ago",
    packagingUnit: { label: "can", size: 500, unitLabel: "ml" },
    shelfLifeDays: 14,
    batches: [
      { label: "Batch A", amount: 1500, unit: "ml", age: "Purchased 3 days ago", purchaseDate: daysAgo(3) },
      { label: "Batch B", amount: 800, unit: "ml", age: "Purchased 1 day ago", purchaseDate: daysAgo(1) },
    ],
  },
  {
    id: 10,
    name: "Vanilla Syrup",
    currentStock: 600,
    unit: "ml",
    category: "Syrup",
    status: "OK",
    expiryDate: null,
    usedBy: ["Caramel Latte"],
    lastOpname: "3 days ago",
    packagingUnit: { label: "bottle", size: 500, unitLabel: "ml" },
    shelfLifeDays: 180,
    batches: [
      { label: "Batch A", amount: 600, unit: "ml", age: "Purchased 4 days ago", purchaseDate: daysAgo(4) },
    ],
  },
  {
    id: 11,
    name: "Chocolate Powder",
    currentStock: 400,
    unit: "g",
    category: "Raw Material",
    status: "OK",
    expiryDate: null,
    usedBy: ["Mocha"],
    lastOpname: "3 days ago",
    packagingUnit: { label: "tin", size: 200, unitLabel: "g" },
    shelfLifeDays: 180,
    batches: [
      { label: "Batch A", amount: 400, unit: "g", age: "Purchased 2 days ago", purchaseDate: daysAgo(2) },
    ],
  },
  {
    id: 12,
    name: "Paper Cup (12oz)",
    currentStock: 150,
    unit: "pcs",
    category: "Packaging",
    status: "OK",
    expiryDate: null,
    usedBy: ["All drinks"],
    lastOpname: "3 days ago",
    packagingUnit: { label: "pack", size: 50, unitLabel: "pcs" },
    shelfLifeDays: 730,
    batches: [
      { label: "Batch A", amount: 150, unit: "pcs", age: "Purchased today", purchaseDate: daysAgo(0) },
    ],
  },
  {
    id: 13,
    name: "All-Purpose Flour",
    currentStock: 2000,
    unit: "g",
    category: "Raw Material",
    status: "OK",
    expiryDate: null,
    usedBy: ["Croissant Dough", "Springroll Wrapper", "Muffin Batter"],
    lastOpname: "3 days ago",
    packagingUnit: { label: "bag", size: 1000, unitLabel: "g" },
    shelfLifeDays: 365,
    batches: [
      { label: "Batch A", amount: 2000, unit: "g", age: "Purchased 2 days ago", purchaseDate: daysAgo(2) },
    ],
  },
  {
    id: 14,
    name: "Eggs",
    currentStock: 24,
    unit: "pcs",
    category: "Raw Material",
    status: "OK",
    expiryDate: null,
    usedBy: ["Springroll Wrapper", "Muffin Batter"],
    lastOpname: "3 days ago",
    packagingUnit: { label: "dozen", size: 12, unitLabel: "pcs" },
    shelfLifeDays: 21,
    batches: [
      { label: "Batch A", amount: 24, unit: "pcs", age: "Purchased 1 day ago", purchaseDate: daysAgo(1) },
    ],
  },
  {
    id: 15,
    name: "Butter",
    currentStock: 500,
    unit: "g",
    category: "Dairy",
    status: "OK",
    expiryDate: null,
    usedBy: ["Croissant Dough", "Muffin Batter", "Caramel Sauce Base"],
    lastOpname: "3 days ago",
    packagingUnit: { label: "block", size: 250, unitLabel: "g" },
    shelfLifeDays: 60,
    batches: [
      { label: "Batch A", amount: 500, unit: "g", age: "Purchased 3 days ago", purchaseDate: daysAgo(3) },
    ],
  },
  {
    id: 16,
    name: "Yeast",
    currentStock: 20,
    unit: "g",
    category: "Raw Material",
    status: "OK",
    expiryDate: null,
    usedBy: ["Croissant Dough"],
    lastOpname: "3 days ago",
    packagingUnit: { label: "sachet", size: 10, unitLabel: "g" },
    shelfLifeDays: 90,
    batches: [
      { label: "Batch A", amount: 20, unit: "g", age: "Purchased 2 days ago", purchaseDate: daysAgo(2) },
    ],
  },
  {
    id: 17,
    name: "Springroll Wrapper",
    currentStock: 20,
    unit: "pcs",
    category: "Prep Base",
    status: "OK",
    expiryDate: null,
    usedBy: [],
    lastOpname: "today",
    packagingUnit: { label: "pack", size: 10, unitLabel: "pcs" },
    shelfLifeDays: 2, // fresh wrapper: best used within 2 days of prep
    batches: [
      { label: "Batch A", amount: 20, unit: "pcs", age: "Made today", purchaseDate: daysAgo(0), madeDate: daysAgo(0) },
    ],
  },
  {
    id: 18,
    name: "Muffin Batter",
    currentStock: 12,
    unit: "pcs",
    category: "Prep Base",
    status: "OK",
    expiryDate: null,
    usedBy: [],
    lastOpname: "today",
    packagingUnit: { label: "pc", size: 1, unitLabel: "pcs" },
    shelfLifeDays: 1, // wet batter with eggs: use same day or next morning max
    batches: [
      { label: "Batch A", amount: 12, unit: "pcs", age: "Made today", purchaseDate: daysAgo(0), madeDate: daysAgo(0) },
    ],
  },
  {
    id: 19,
    name: "Caramel Sauce Base",
    currentStock: 500,
    unit: "ml",
    category: "Prep Base",
    status: "OK",
    expiryDate: null,
    usedBy: [],
    lastOpname: "3 days ago",
    packagingUnit: { label: "jar", size: 250, unitLabel: "ml" },
    shelfLifeDays: 5,
    batches: [
      { label: "Batch A", amount: 500, unit: "ml", age: "Made today", purchaseDate: daysAgo(0) },
    ],
  },
  // ── New bean ingredients for House Blend ─────────────────
  {
    id: 20,
    name: "Arabica Gayo Beans",
    currentStock: 1200,
    unit: "g",
    category: "Raw Material",
    status: "OK",
    expiryDate: null,
    usedBy: ["House Blend"],
    lastOpname: "2 days ago",
    // Green beans: roasted in-house. Peak flavour window is 5–14 days post-roast.
    // We track from roast date; after 14 days off-gassing fades and flavour drops.
    shelfLifeDays: 14,
    packagingUnit: { label: "bag", size: 250, unitLabel: "g" },
    batches: [
      { label: "Roast A", amount: 750, unit: "g", age: "Roasted 3 days ago", purchaseDate: daysAgo(3), madeDate: daysAgo(3) },
      { label: "Roast B", amount: 450, unit: "g", age: "Roasted today",      purchaseDate: daysAgo(0), madeDate: daysAgo(0) },
    ],
  },
  {
    id: 21,
    name: "African Robusta Beans",
    currentStock: 800,
    unit: "g",
    category: "Raw Material",
    status: "OK",
    expiryDate: null,
    usedBy: ["House Blend"],
    lastOpname: "2 days ago",
    // Robusta is more forgiving than Arabica, but still best within 21 days post-roast
    shelfLifeDays: 21,
    packagingUnit: { label: "bag", size: 250, unitLabel: "g" },
    batches: [
      { label: "Roast A", amount: 500, unit: "g", age: "Roasted 5 days ago", purchaseDate: daysAgo(5), madeDate: daysAgo(5) },
      { label: "Roast B", amount: 300, unit: "g", age: "Roasted 1 day ago",  purchaseDate: daysAgo(1), madeDate: daysAgo(1) },
    ],
  },
  {
    id: 22,
    name: "House Blend",
    currentStock: 500,
    unit: "g",
    category: "Prep Base",
    status: "OK",
    expiryDate: null,
    usedBy: ["Any espresso-based drink (when House Blend is selected)"],
    lastOpname: "today",
    // Blended & ground: degrades fast once ground. If stored whole-bean after blending: 7 days.
    shelfLifeDays: 7,
    packagingUnit: { label: "batch", size: 500, unitLabel: "g" },
    batches: [
      { label: "Blend A", amount: 500, unit: "g", age: "Blended today", purchaseDate: daysAgo(0), madeDate: daysAgo(0) },
    ],
  },
];

export const categories = ["All Categories", "Raw Material", "Dairy", "Syrup", "Pastry", "Prep Base", "Packaging", "Others"];
export const statusOptions = ["All Status", "OK", "Low", "Out"];
export const expiryOptions = ["All Expiry", "Fresh", "Expiring Soon"];
