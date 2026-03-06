// mockinventory.js — Coffee Shop Inventory

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
    lastOpname: "Today",
    batches: [
      { label: "Batch A", amount: 1500, unit: "g", age: "Purchased 3 days ago" },
      { label: "Batch B", amount: 900, unit: "g", age: "Purchased today" },
    ],
  },
  {
    id: 2,
    name: "Fresh Milk",
    currentStock: 3200,
    unit: "ml",
    category: "Dairy",
    status: "OK",
    expiryDate: daysFromNow(2),
    usedBy: ["Caramel Latte", "Matcha Latte", "Cappuccino"],
    lastOpname: "Yesterday",
    batches: [
      { label: "Batch A", amount: 2000, unit: "ml", age: "Purchased 2 days ago" },
      { label: "Batch B", amount: 1200, unit: "ml", age: "Purchased today" },
    ],
  },
  {
    id: 3,
    name: "Matcha Powder",
    currentStock: 180,
    unit: "g",
    category: "Bahan Baku",
    status: "Low",
    expiryDate: null,
    usedBy: ["Matcha Latte"],
    lastOpname: "Today",
    batches: [
      { label: "Batch A", amount: 180, unit: "g", age: "Purchased 1 day ago" },
    ],
  },
  {
    id: 4,
    name: "Caramel Syrup",
    currentStock: 500,
    unit: "ml",
    category: "Syrup",
    status: "Low",
    expiryDate: null,
    usedBy: ["Caramel Latte"],
    lastOpname: "2 days ago",
    batches: [
      { label: "Batch A", amount: 500, unit: "ml", age: "Purchased 3 days ago" },
    ],
  },
  {
    id: 5,
    name: "Croissant Dough",
    currentStock: 12,
    unit: "pcs",
    category: "Pastry",
    status: "Low",
    expiryDate: daysFromNow(1),
    usedBy: ["Croissant"],
    lastOpname: "Today",
    batches: [
      { label: "Batch A", amount: 12, unit: "pcs", age: "Purchased today" },
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
    lastOpname: "Yesterday",
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
    usedBy: ["Caramel Latte", "Matcha Latte", "Cappuccino"],
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
    lastOpname: "Today",
    batches: [
      { label: "Batch A", amount: 200, unit: "pcs", age: "Made today" },
    ],
  },
  {
    id: 9,
    name: "Whipped Cream",
    currentStock: 600,
    unit: "ml",
    category: "Dairy",
    status: "OK",
    expiryDate: daysFromNow(2),
    usedBy: ["Cappuccino", "Caramel Latte"],
    lastOpname: "Yesterday",
    batches: [
      { label: "Batch A", amount: 600, unit: "ml", age: "Purchased 2 days ago" },
    ],
  },
  {
    id: 10,
    name: "Vanilla Syrup",
    currentStock: 300,
    unit: "ml",
    category: "Syrup",
    status: "Low",
    expiryDate: null,
    usedBy: ["Caramel Latte"],
    lastOpname: "2 days ago",
    batches: [
      { label: "Batch A", amount: 300, unit: "ml", age: "Purchased 4 days ago" },
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
    lastOpname: "Yesterday",
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
    lastOpname: "Today",
    batches: [
      { label: "Batch A", amount: 150, unit: "pcs", age: "Purchased today" },
    ],
  },
];

export const categories = ["All Categories", "Bahan Baku", "Dairy", "Syrup", "Pastry", "Packaging", "Lainnya"];
export const statusOptions = ["All Status", "OK", "Low", "Out"];
export const expiryOptions = ["All Expiry", "Fresh", "Expiring Soon"];
