// pages/production.jsx
// ─────────────────────────────────────────────────────────
// Main shell: tab routing only. All logic lives in components.
//
// To fix AI features → src/components/Production/PlanningTab.jsx
// To fix AI model/API → src/services/aiService.js
// To fix calculations → src/utils/productionHelpers.js
// ─────────────────────────────────────────────────────────
import { useState } from "react";
import { initialDishes } from "../data/mockproduction";
import DishList from "../Components/Production/DishList";
import DishDetail from "../Components/Production/DishDetail";
import { CapacityTab } from "../Components/Production/CapacityTab";
import PlanningTab from "../Components/Production/PlanningTab";
import IngredientPools from "../Components/Production/IngredientPools";
import AlertsTab from "../Components/Production/AlertsTab";
import CreateDishModal from "../Components/Production/CreateDishModal";
import "../App.css";

const TABS = [
  "Dish List",
  "Capacity",
  "Planning",
  "Ingredient Pools",
  "Alerts",
];

export default function Production({ stock }) {
  const [activeTab, setActiveTab] = useState("Dish List");
  const [dishes, setDishes] = useState(initialDishes);
  const [detailDish, setDetailDish] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  const handleSaveDish = (newDish) => setDishes((p) => [...p, newDish]);

  return (
    <div className="inv-wrap">
      <div className="inv-page-header">
        <h1 className="inv-page-title">Production</h1>
        <div className="inv-tabs">
          {TABS.map((t) => (
            <button
              key={t}
              className={`inv-tab ${activeTab === t ? "inv-tab--active" : ""}`}
              onClick={() => {
                setActiveTab(t);
                setDetailDish(null);
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "Dish List" && !detailDish && (
        <DishList
          dishes={dishes}
          stock={stock}
          onViewDetail={(d) => setDetailDish(d)}
          onCreateDish={() => setShowCreate(true)}
        />
      )}

      {activeTab === "Dish List" && detailDish && (
        <DishDetail
          dish={detailDish}
          stock={stock}
          allDishes={dishes}
          onBack={() => setDetailDish(null)}
        />
      )}

      {activeTab === "Capacity" && (
        <CapacityTab
          dishes={dishes}
          stock={stock}
          onViewDetail={(d) => {
            setDetailDish(d);
            setActiveTab("Dish List");
          }}
        />
      )}

      {activeTab === "Planning" && (
        <PlanningTab dishes={dishes} stock={stock} />
      )}
      {activeTab === "Ingredient Pools" && (
        <IngredientPools dishes={dishes} stock={stock} />
      )}
      {activeTab === "Alerts" && <AlertsTab dishes={dishes} stock={stock} />}

      {showCreate && (
        <CreateDishModal
          stock={stock}
          onClose={() => setShowCreate(false)}
          onSave={handleSaveDish}
        />
      )}
    </div>
  );
}
