import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./Components/sidebar.jsx";
import Dashboard from "./pages/dashboard.jsx";
import Inventory from "./pages/inventory.jsx";
import Production from "./pages/production.jsx";
import NotFound from "./pages/notfound.jsx";
import { inventoryItems } from "./data/mockinventory";
import "./App.css";

export default function App() {
  const [stock, setStock] = useState(inventoryItems);

  return (
    <>
      {/* Mobile blocker — hidden on tablet/desktop via CSS */}
      <div className="mobile-blocker">
        <div className="mobile-blocker-icon">🖥️</div>
        <h1 className="mobile-blocker-title">Desktop & Tablet Only</h1>
        <p className="mobile-blocker-sub">
          This app is optimized for desktop and tablet screens. Please open it on a larger device for the best experience.
        </p>
        <span className="mobile-blocker-badge">📐 Minimum 768px screen width</span>
      </div>

      <div className="app-layout">
        <Sidebar />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/inventory" element={<Inventory stock={stock} setStock={setStock} />} />
            <Route path="/production" element={<Production stock={stock} />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </>
  );
}
