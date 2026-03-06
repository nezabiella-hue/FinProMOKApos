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

const daysFromNow = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
};

export const inventoryItems = [
  {
    id: 1,
    name: "Espresso Beans",
    currentStock: 2400,
    unit: "g",
    category: "Bahan Baku",
    status: "OK",
    expiryDate: null,
    usedBy: ["Espresso", "Caramel Latte", "Cappuccino", "Iced Americano"],
    lastOpname: "3 days ago",
    batches: [
      { label: "Batch A", amount: 1500, unit: "g", age: "Purchased 5 days ago" },
      { label: "Batch B", amount: 900, unit: "g", age: "Purchased 3 days ago" },
    ],
  },
  {
    id: 2,
    name: "Fresh Milk",
    currentStock: 4000,
    unit: "ml",
    category: "Dairy",
    status: "OK",
    expiryDate: null, // expiry revealed after opname
    usedBy: ["Caramel Latte", "Matcha Latte", "Cappuccino"],
    lastOpname: "3 days ago",
    batches: [
      { label: "Batch A", amount: 2500, unit: "ml", age: "Purchased 4 days ago" },
      { label: "Batch B", amount: 1500, unit: "ml", age: "Purchased 2 days ago" },
    ],
  },
  {
    id: 3,
    name: "Matcha Powder",
    currentStock: 500,
    unit: "g",
    category: "Bahan Baku",
    status: "OK",
    expiryDate: null,
    usedBy: ["Matcha Latte"],
    lastOpname: "3 days ago",
    batches: [
      { label: "Batch A", amount: 500, unit: "g", age: "Purchased 3 days ago" },
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
    batches: [
      { label: "Batch A", amount: 900, unit: "ml", age: "Purchased 4 days ago" },
    ],
  },
  {
    id: 5,
    name: "Croissant Dough",
    currentStock: 30,
    unit: "pcs",
    category: "Pastry",
    status: "OK",
    expiryDate: null, // expiry revealed after opname
    usedBy: ["Croissant"],
    lastOpname: "3 days ago",
    batches: [
      { label: "Batch A", amount: 30, unit: "pcs", age: "Purchased 3 days ago" },
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
    batches: [
      { label: "Batch A", amount: 500, unit: "g", age: "Purchased 4 days ago" },
      { label: "Batch B", amount: 300, unit: "g", age: "Purchased 1 day ago" },
    ],
  },
  {
    id: 7,
    name: "Sugar",
    currentStock: 5000,
    unit: "g",
    category: "Bahan Baku",
    status: "OK",
    expiryDate: null,
    usedBy: ["Caramel Latte", "Matcha Latte", "Cappuccino", "Muffin"],
    lastOpname: "3 days ago",
    batches: [
      { label: "Batch A", amount: 5000, unit: "g", age: "Purchased 5 days ago" },
    ],
  },
  {
    id: 8,
    name: "Ice Cubes",
    currentStock: 200,
    unit: "pcs",
    category: "Lainnya",
    status: "OK",
    expiryDate: null,
    usedBy: ["Iced Americano"],
    lastOpname: "3 days ago",
    batches: [
      { label: "Batch A", amount: 200, unit: "pcs", age: "Made today" },
    ],
  },
  {
    id: 9,
    name: "Whipped Cream",
    currentStock: 900,
    unit: "ml",
    category: "Dairy",
    status: "OK",
    expiryDate: null, // expiry revealed after opname
    usedBy: ["Cappuccino", "Caramel Latte"],
    lastOpname: "3 days ago",
    batches: [
      { label: "Batch A", amount: 900, unit: "ml", age: "Purchased 3 days ago" },
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
    batches: [
      { label: "Batch A", amount: 600, unit: "ml", age: "Purchased 4 days ago" },
    ],
  },
  {
    id: 11,
    name: "Chocolate Powder",
    currentStock: 400,
    unit: "g",
    category: "Bahan Baku",
    status: "OK",
    expiryDate: null,
    usedBy: ["Mocha"],
    lastOpname: "3 days ago",
    batches: [
      { label: "Batch A", amount: 400, unit: "g", age: "Purchased 2 days ago" },
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
    batches: [
      { label: "Batch A", amount: 150, unit: "pcs", age: "Purchased today" },
    ],
  },
];

export const categories = ["All Categories", "Bahan Baku", "Dairy", "Syrup", "Pastry", "Packaging", "Lainnya"];
export const statusOptions = ["All Status", "OK", "Low", "Out"];
export const expiryOptions = ["All Expiry", "Fresh", "Expiring Soon"];
