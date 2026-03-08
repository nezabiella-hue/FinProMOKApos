// pages/inventory.jsx
// ─────────────────────────────────────────────────────────
// Thin shell: state + data wiring only. UI lives in components.
//
// To fix the stock table   → src/Components/Inventory/StockTable.jsx
// To fix the detail drawer → src/Components/Inventory/StockDetailDrawer.jsx
// To fix the opname modal  → src/Components/Inventory/StockOpnameModal.jsx
// ─────────────────────────────────────────────────────────
import { useState } from "react";
import { calculateLiveErrorRate } from "../data/mockUsageErrorRate";
import StockTable from "../Components/Inventory/StockTable";
import StockDetailDrawer from "../Components/Inventory/StockDetailDrawer";
import StockOpnameModal from "../Components/Inventory/StockOpnameModal";
import "../App.css";

export default function Inventory({ stock, setStock, liveStep, onLiveUpdate, onWhatsappNotify }) {
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [liveErrorRates, setLiveErrorRates] = useState({});

  const handleApplyUpdate = (updates) => {
    const newLiveRates = {};
    updates.forEach((update) => {
      const current = stock.find((s) => s.name === update.name);
      if (current) {
        const live = calculateLiveErrorRate(update.name, current.currentStock, update.uploadedStock);
        if (live) newLiveRates[update.name] = live;
      }
    });
    setLiveErrorRates((prev) => ({ ...prev, ...newLiveRates }));

    setStock((prev) =>
      prev.map((item) => {
        const update = updates.find((u) => u.name === item.name);
        if (!update) return item;
        const newStock = update.uploadedStock;
        const newStatus =
          newStock === 0 ? "Out"
          : newStock < (update.lowThreshold ?? 200) ? "Low"
          : "OK";
        return {
          ...item,
          currentStock: newStock,
          status: newStatus,
          lastOpname: "Just now",
          ...(update.expiryDate !== undefined ? { expiryDate: update.expiryDate } : {}),
        };
      }),
    );
  };

  return (
    <div className="inv-wrap">
      <div className="inv-page-header">
        <h1 className="inv-page-title">Inventory</h1>
        <div className="inv-tabs">
          <button className="inv-tab inv-tab--active">Stock Status</button>
        </div>
      </div>

      <StockTable
        stock={stock}
        liveStep={liveStep}
        liveErrorRates={liveErrorRates}
        onViewDetail={setSelectedItem}
        onLiveUpdate={onLiveUpdate}
        onOpenOpname={() => setShowModal(true)}
      />

      {selectedItem && (
        <StockDetailDrawer
          item={selectedItem}
          liveErrorRates={liveErrorRates}
          onClose={() => setSelectedItem(null)}
          onOpenOpname={() => { setSelectedItem(null); setShowModal(true); }}
        />
      )}

      {showModal && (
        <StockOpnameModal
          inventory={stock}
          onClose={() => setShowModal(false)}
          onApply={handleApplyUpdate}
          onWhatsappNotify={onWhatsappNotify}
        />
      )}
    </div>
  );
}
