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
import { liveSteps } from "../data/mockLiveUpdate";
import { calcDishSalesVolumes } from "../utils/productionHelpers";
import { saleTransactions } from "../data/mockTransactions";
import DishList from "../Components/Production/DishList";
import DishDetail from "../Components/Production/DishDetail";
import PlanningTab from "../Components/Production/PlanningTab";
import CreateDishModal from "../Components/Production/CreateDishModal";
import ReallocateModal from "../Components/Production/ReallocateModal";
import "../App.css";

const TABS = ["Dish List", "Planning"];

export default function Production({ stock, liveStep, onLiveUpdate, onLowServingWarn, onReallocationNotify }) {
  const [activeTab, setActiveTab] = useState("Dish List");
  const [dishes, setDishes] = useState(initialDishes);
  const [detailDish, setDetailDish] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [allocationOverrides, setAllocationOverrides] = useState({});
  const [reallocateDish, setReallocateDish] = useState(null);

  const salesVolumes = calcDishSalesVolumes(saleTransactions);

  const handleSaveDish = (newDish) => setDishes((p) => [...p, newDish]);
  const handleEditDish = (updatedDish) => setDishes((p) => p.map((d) => d.id === updatedDish.id ? updatedDish : d));

  const handleReallocateConfirm = (transfers) => {
    setAllocationOverrides((prev) => {
      const next = { ...prev };
      transfers.forEach(({ fromDish, toDish, ingredient, qty }) => {
        if (!next[ingredient]) next[ingredient] = {};
        next[ingredient][fromDish] = (next[ingredient][fromDish] || 0) - qty;
        next[ingredient][toDish] = (next[ingredient][toDish] || 0) + qty;
      });
      return next;
    });
    setReallocateDish(null);
  };

  return (
    <div className="inv-wrap">
      <div className="inv-page-header">
        <h1 className="inv-page-title">Production</h1>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {liveStep < liveSteps.length ? (
            <button
              className="inv-btn inv-btn--outline"
              onClick={onLiveUpdate}
              title={`Apply: ${liveSteps[liveStep].label}`}
            >
              ▶ Live Update ({liveSteps[liveStep].time} – {liveSteps[liveStep].label})
            </button>
          ) : (
            <button className="inv-btn inv-btn--outline" disabled>
              ✓ Day Simulation Complete
            </button>
          )}
        </div>
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
          allocationOverrides={allocationOverrides}
          onViewDetail={(d) => setDetailDish(d)}
          onCreateDish={() => setShowCreate(true)}
          onReallocate={(dish) => setReallocateDish(dish)}
          onLowServingWarn={onLowServingWarn}
        />
      )}

      {activeTab === "Dish List" && detailDish && (
        <DishDetail
          dish={detailDish}
          stock={stock}
          allDishes={dishes}
          allocationOverrides={allocationOverrides}
          onBack={() => setDetailDish(null)}
          onEditDish={handleEditDish}
        />
      )}

      {activeTab === "Planning" && (
        <PlanningTab dishes={dishes} stock={stock} />
      )}

      {showCreate && (
        <CreateDishModal
          stock={stock}
          onClose={() => setShowCreate(false)}
          onSave={handleSaveDish}
        />
      )}

      {reallocateDish && (
        <ReallocateModal
          dish={reallocateDish}
          dishes={dishes}
          stock={stock}
          salesVolumes={salesVolumes}
          overrides={allocationOverrides}
          onConfirm={handleReallocateConfirm}
          onClose={() => setReallocateDish(null)}
          onNotify={onReallocationNotify}
        />
      )}
    </div>
  );
}
