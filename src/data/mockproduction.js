// mockproduction.js — Coffee Shop Production Dishes

export const initialDishes = [
  {
    id: 1,
    name: "Caramel Latte",
    category: "Coffee",
    yieldUnit: "cup",
    recipe: [
      { ingredient: "Espresso Beans", qty: 18, unit: "g" },
      { ingredient: "Fresh Milk", qty: 200, unit: "ml" },
      { ingredient: "Caramel Syrup", qty: 30, unit: "ml" },
      { ingredient: "Vanilla Syrup", qty: 15, unit: "ml" },
      { ingredient: "Whipped Cream", qty: 30, unit: "ml" },
    ],
    sharedIngredients: ["Espresso Beans", "Fresh Milk", "Whipped Cream"],
  },
  {
    id: 2,
    name: "Matcha Latte",
    category: "Non-Coffee",
    yieldUnit: "cup",
    recipe: [
      { ingredient: "Matcha Powder", qty: 20, unit: "g" },
      { ingredient: "Fresh Milk", qty: 250, unit: "ml" },
      { ingredient: "Sugar", qty: 15, unit: "g" },
    ],
    sharedIngredients: ["Fresh Milk", "Sugar"],
  },
  {
    id: 3,
    name: "Espresso",
    category: "Coffee",
    yieldUnit: "shot",
    recipe: [
      { ingredient: "Espresso Beans", qty: 18, unit: "g" },
    ],
    sharedIngredients: ["Espresso Beans"],
  },
  {
    id: 4,
    name: "Cappuccino",
    category: "Coffee",
    yieldUnit: "cup",
    recipe: [
      { ingredient: "Espresso Beans", qty: 18, unit: "g" },
      { ingredient: "Fresh Milk", qty: 150, unit: "ml" },
      { ingredient: "Whipped Cream", qty: 50, unit: "ml" },
      { ingredient: "Sugar", qty: 10, unit: "g" },
    ],
    sharedIngredients: ["Espresso Beans", "Fresh Milk", "Whipped Cream"],
  },
  {
    id: 5,
    name: "Iced Americano",
    category: "Coffee",
    yieldUnit: "cup",
    recipe: [
      { ingredient: "Espresso Beans", qty: 18, unit: "g" },
      { ingredient: "Ice Cubes", qty: 5, unit: "pcs" },
    ],
    sharedIngredients: ["Espresso Beans"],
  },
  {
    id: 6,
    name: "Croissant",
    category: "Pastry",
    yieldUnit: "pcs",
    recipe: [
      { ingredient: "Croissant Dough", qty: 1, unit: "pcs" },
    ],
    sharedIngredients: [],
  },
  {
    id: 7,
    name: "Muffin",
    category: "Pastry",
    yieldUnit: "pcs",
    recipe: [
      { ingredient: "Muffin Mix", qty: 50, unit: "g" },
      { ingredient: "Sugar", qty: 20, unit: "g" },
    ],
    sharedIngredients: ["Sugar"],
  },
];

export const dishCategories = ["All", "Coffee", "Non-Coffee", "Pastry"];
export const availabilityOptions = ["All", "Available", "Low", "Out of Stock"];
