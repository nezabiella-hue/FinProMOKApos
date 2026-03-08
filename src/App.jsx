import { useState, useEffect } from "react";
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
  const [toast, setToast] = useState(null); // { message, type }

  // Auto-dismiss toast after 4 seconds
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  // Applies the next live update step to stock.
  // Never touches usageErrorRate — that is opname-only.
  const handleLiveUpdate = () => {
    if (liveStep >= liveSteps.length) return;
    const step = liveSteps[liveStep];
    setStock((prev) => applyLiveStep(prev, step));
    setLiveStep((prev) => prev + 1);
  };

  const handleWhatsappNotify = () => {
    setToast({ message: "Boss has been notified via WhatsApp.", type: "success" });
  };

  const handleLowServingWarn = (dishNames) => {
    setToast({ message: `Boss has been notified that ${dishNames.join(", ")} ${dishNames.length > 1 ? "are" : "is"} running low on servings.` });
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
                onWhatsappNotify={handleWhatsappNotify}
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
                onLowServingWarn={handleLowServingWarn}
              />
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      {/* Global toast notification */}
      {toast && (
        <div style={{
          position: "fixed",
          bottom: "1.5rem",
          right: "1.5rem",
          background: "#1a3c2e",
          color: "#fff",
          padding: "0.75rem 1.25rem",
          borderRadius: "10px",
          fontSize: "0.88rem",
          boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          zIndex: 9999,
          animation: "fadeInUp 0.25s ease",
        }}>
          ✅ {toast.message}
        </div>
      )}
    </div>
  );
}
