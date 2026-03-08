import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./Components/sidebar.jsx";
import Dashboard from "./pages/dashboard.jsx";
import Inventory from "./pages/inventory.jsx";
import Production from "./pages/production.jsx";
import Reports from "./pages/reports.jsx";
import NotFound from "./pages/notfound.jsx";
import { inventoryItems } from "./data/mockinventory";
import { liveSteps, applyLiveStep } from "./data/mockLiveUpdate";
import "./App.css";

export default function App() {
  const [stock, setStock] = useState(inventoryItems);
  const [liveStep, setLiveStep] = useState(0);

  // Applies the next live update step to stock.
  // Never touches usageErrorRate — that is opname-only.
  const handleLiveUpdate = () => {
    if (liveStep >= liveSteps.length) return;
    const step = liveSteps[liveStep];
    setStock((prev) => applyLiveStep(prev, step));
    setLiveStep((prev) => prev + 1);
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/reports" element={<Reports />} />
          <Route
            path="/inventory"
            element={
              <Inventory
                stock={stock}
                setStock={setStock}
                liveStep={liveStep}
                onLiveUpdate={handleLiveUpdate}
              />
            }
          />
          <Route
            path="/production"
            element={
              <Production
                stock={stock}
                liveStep={liveStep}
                onLiveUpdate={handleLiveUpdate}
              />
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}
