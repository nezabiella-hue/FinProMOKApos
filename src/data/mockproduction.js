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
