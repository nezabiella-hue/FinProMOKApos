// mockproduction.js — Coffee Shop Production Dishes

export const initialDishes = [
  {
    id: 1,
    name: "Caramel Latte",
    category: "Coffee",
    yieldUnit: "cup",
    recipe: [
      { ingredient: "Espresso Beans", qty: 18, unit: "g", wasteBuffer: 5 },
      { ingredient: "Fresh Milk", qty: 200, unit: "ml", wasteBuffer: 3 },
      { ingredient: "Caramel Syrup", qty: 30, unit: "ml", wasteBuffer: 0 },
      { ingredient: "Vanilla Syrup", qty: 15, unit: "ml", wasteBuffer: 0 },
      { ingredient: "Whipped Cream", qty: 30, unit: "ml", wasteBuffer: 5 },
    ],
    sharedIngredients: ["Espresso Beans", "Fresh Milk", "Whipped Cream"],
  },
  {
    id: 2,
    name: "Matcha Latte",
    category: "Non-Coffee",
    yieldUnit: "cup",
    recipe: [
      { ingredient: "Matcha Powder", qty: 20, unit: "g", wasteBuffer: 5 },
      { ingredient: "Fresh Milk", qty: 250, unit: "ml", wasteBuffer: 3 },
      { ingredient: "Sugar", qty: 15, unit: "g", wasteBuffer: 0 },
    ],
    sharedIngredients: ["Fresh Milk", "Sugar"],
  },
  {
    id: 3,
    name: "Espresso",
    category: "Coffee",
    yieldUnit: "shot",
    recipe: [
      { ingredient: "Espresso Beans", qty: 18, unit: "g", wasteBuffer: 5 },
    ],
    sharedIngredients: ["Espresso Beans"],
  },
  {
    id: 4,
    name: "Cappuccino",
    category: "Coffee",
    yieldUnit: "cup",
    recipe: [
      { ingredient: "Espresso Beans", qty: 18, unit: "g", wasteBuffer: 5 },
      { ingredient: "Fresh Milk", qty: 150, unit: "ml", wasteBuffer: 3 },
      { ingredient: "Whipped Cream", qty: 50, unit: "ml", wasteBuffer: 5 },
      { ingredient: "Sugar", qty: 10, unit: "g", wasteBuffer: 0 },
    ],
    sharedIngredients: ["Espresso Beans", "Fresh Milk", "Whipped Cream"],
  },
  {
    id: 5,
    name: "Iced Americano",
    category: "Coffee",
    yieldUnit: "cup",
    recipe: [
      { ingredient: "Espresso Beans", qty: 18, unit: "g", wasteBuffer: 5 },
      { ingredient: "Ice Cubes", qty: 5, unit: "pcs", wasteBuffer: 0 },
    ],
    sharedIngredients: ["Espresso Beans"],
  },
  {
    id: 6,
    name: "Croissant",
    category: "Pastry",
    yieldUnit: "pcs",
    recipe: [
      { ingredient: "Croissant Dough", qty: 1, unit: "pcs", wasteBuffer: 0 },
    ],
    sharedIngredients: [],
  },
  {
    id: 7,
    name: "Muffin",
    category: "Pastry",
    yieldUnit: "pcs",
    recipe: [
      { ingredient: "Muffin Mix", qty: 50, unit: "g", wasteBuffer: 5 },
      { ingredient: "Sugar", qty: 20, unit: "g", wasteBuffer: 0 },
    ],
    sharedIngredients: ["Sugar"],
  },
];

export const dishCategories = ["All", "Coffee", "Non-Coffee", "Pastry"];
export const availabilityOptions = ["All", "Available", "Low", "Out of Stock"];

// Semi-finished goods: prep items made in batches before service
// Used in the Planning tab's "Semi-Finished Prep" section
export const semiFinishedGoods = [
  {
    id: "sf1",
    name: "Croissant Dough",
    category: "Pastry Base",
    yieldQty: 12,
    yieldUnit: "pcs",
    recipe: [
      { ingredient: "All-Purpose Flour", qty: 300, unit: "g",   wasteBuffer: 2 },
      { ingredient: "Butter",            qty: 150, unit: "g",   wasteBuffer: 0 },
      { ingredient: "Yeast",             qty: 5,   unit: "g",   wasteBuffer: 0 },
      { ingredient: "Sugar",             qty: 30,  unit: "g",   wasteBuffer: 0 },
    ],
  },
  {
    id: "sf2",
    name: "Springroll Wrapper",
    category: "Food Base",
    yieldQty: 20,
    yieldUnit: "pcs",
    recipe: [
      { ingredient: "All-Purpose Flour", qty: 200, unit: "g",   wasteBuffer: 3 },
      { ingredient: "Eggs",              qty: 2,   unit: "pcs", wasteBuffer: 0 },
    ],
  },
  {
    id: "sf3",
    name: "Muffin Batter",
    category: "Pastry Base",
    yieldQty: 12,
    yieldUnit: "pcs",
    recipe: [
      { ingredient: "All-Purpose Flour", qty: 250, unit: "g",   wasteBuffer: 2 },
      { ingredient: "Eggs",              qty: 3,   unit: "pcs", wasteBuffer: 0 },
      { ingredient: "Butter",            qty: 100, unit: "g",   wasteBuffer: 0 },
      { ingredient: "Sugar",             qty: 150, unit: "g",   wasteBuffer: 0 },
    ],
  },
  {
    id: "sf4",
    name: "Caramel Sauce Base",
    category: "Sauce Base",
    yieldQty: 500,
    yieldUnit: "ml",
    recipe: [
      { ingredient: "Sugar",  qty: 200, unit: "g", wasteBuffer: 0 },
      { ingredient: "Butter", qty: 50,  unit: "g", wasteBuffer: 0 },
    ],
  },
];
