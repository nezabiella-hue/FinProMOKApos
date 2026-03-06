import { useState } from "react";
import { Search, ChevronDown, X, Package } from "lucide-react";
import {
  inventoryItems,
  categories,
  statusOptions,
  expiryOptions,
} from "../data/mockinventory";
import StockOpnameModal from "../Components/StockOpnameModal";
import "../App.css";

export default function Inventory({ stock, setStock }) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [expiryFilter, setExpiryFilter] = useState("All Expiry");
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const filtered = stock.filter((item) => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory =
      categoryFilter === "All Categories" || item.category === categoryFilter;
    const matchStatus =
      statusFilter === "All Status" || item.status === statusFilter;
    const matchExpiry =
      expiryFilter === "All Expiry" ||
      (expiryFilter === "Fresh" && item.expiry === "Fresh") ||
      (expiryFilter === "Expiring Soon" && item.expiry !== "Fresh");
    return matchSearch && matchCategory && matchStatus && matchExpiry;
  });

  const handleApplyUpdate = (updates) => {
    setStock((prev) =>
      prev.map((item) => {
        const update = updates.find((u) => u.name === item.name);
        if (!update) return item;
        const newStock = update.uploadedStock;
        const newStatus =
          newStock === 0 ? "Out" : newStock < 200 ? "Low" : "OK";
        return {
          ...item,
          currentStock: newStock,
          status: newStatus,
          lastOpname: "Just now",
        };
      }),
    );
  };

  const getStatusClass = (status) => {
    if (status === "Low") return "inv-badge inv-badge--low";
    if (status === "Out") return "inv-badge inv-badge--out";
    return "inv-badge inv-badge--ok";
  };

  const getExpiryClass = (expiry) =>
    expiry !== "Fresh" ? "inv-expiry--warn" : "";

  return (
    <div className="inv-wrap">
      <div className="inv-page-header">
        <h1 className="inv-page-title">Inventory</h1>
        <div className="inv-tabs">
          <button className="inv-tab inv-tab--active">Stock Status</button>
        </div>
      </div>

      <div className="inv-card">
        <div className="inv-card-header">
          <div>
            <h2 className="inv-card-title">Stock Status</h2>
            <p className="inv-card-sub">
              See exact ingredient-level details behind production shortages or
              expiry risks.
            </p>
          </div>
          <button
            className="inv-btn inv-btn--primary"
            onClick={() => setShowModal(true)}
          >
            Upload Stock Opname
          </button>
        </div>

        <div className="inv-toolbar">
          <div className="inv-select-wrap">
            <select
              className="inv-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <ChevronDown size={14} className="inv-select-icon" />
          </div>
          <div className="inv-select-wrap">
            <select
              className="inv-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {statusOptions.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <ChevronDown size={14} className="inv-select-icon" />
          </div>
          <div className="inv-select-wrap">
            <select
              className="inv-select"
              value={expiryFilter}
              onChange={(e) => setExpiryFilter(e.target.value)}
            >
              {expiryOptions.map((e) => (
                <option key={e}>{e}</option>
              ))}
            </select>
            <ChevronDown size={14} className="inv-select-icon" />
          </div>
          <div className="inv-search-wrap">
            <Search size={14} className="inv-search-icon" />
            <input
              className="inv-search"
              placeholder="Search ingredient..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <table className="inv-table">
          <thead>
            <tr>
              <th>Ingredient</th>
              <th>Current Stock</th>
              <th>Status</th>
              <th>Expiry / Stale Risk</th>
              <th>Used By Dishes</th>
              <th>Last Opname</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="inv-empty">
                  No ingredients found.
                </td>
              </tr>
            )}
            {filtered.map((item) => (
              <tr key={item.id}>
                <td className="inv-td-bold">{item.name}</td>
                <td>
                  <span className="inv-stock-num">{item.currentStock}</span>
                  <span className="inv-stock-unit"> {item.unit}</span>
                </td>
                <td>
                  <span className={getStatusClass(item.status)}>
                    {item.status}
                  </span>
                </td>
                <td className={getExpiryClass(item.expiry)}>{item.expiry}</td>
                <td className="inv-td-muted">{item.usedBy.join(", ")}</td>
                <td className="inv-td-muted">{item.lastOpname}</td>
                <td>
                  <button
                    className="inv-link"
                    onClick={() => setSelectedItem(item)}
                  >
                    View Detail
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedItem && (
        <div
          className="inv-drawer-overlay"
          onClick={() => setSelectedItem(null)}
        >
          <div className="inv-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="inv-drawer-header">
              <div className="inv-drawer-title-wrap">
                <Package size={20} className="inv-drawer-icon" />
                <h2 className="inv-drawer-title">{selectedItem.name}</h2>
              </div>
              <button
                className="inv-modal-close"
                onClick={() => setSelectedItem(null)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="inv-drawer-body">
              <section className="inv-drawer-section">
                <h3 className="inv-drawer-section-title">Overview</h3>
                <div className="inv-overview-grid">
                  <div className="inv-overview-item">
                    <span className="inv-overview-label">Current Stock</span>
                    <span className="inv-overview-value">
                      {selectedItem.currentStock} {selectedItem.unit}
                    </span>
                  </div>
                  <div className="inv-overview-item">
                    <span className="inv-overview-label">Status</span>
                    <span className={getStatusClass(selectedItem.status)}>
                      {selectedItem.status}
                    </span>
                  </div>
                  <div className="inv-overview-item">
                    <span className="inv-overview-label">Used By</span>
                    <span className="inv-overview-value">
                      {selectedItem.usedBy.join(", ")}
                    </span>
                  </div>
                </div>
              </section>

              <section className="inv-drawer-section">
                <h3 className="inv-drawer-section-title">Affected Dishes</h3>
                <table className="inv-table">
                  <thead>
                    <tr>
                      <th>Dish</th>
                      <th>Remaining Servings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedItem.affectedDishes.map((d) => (
                      <tr key={d.dish}>
                        <td>{d.dish}</td>
                        <td>can make {d.remaining} more</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>

              <section className="inv-drawer-section">
                <h3 className="inv-drawer-section-title">Batch / Freshness</h3>
                {selectedItem.batches.length === 0 ? (
                  <p className="inv-td-muted">No batch data available.</p>
                ) : (
                  <div className="inv-batches">
                    {selectedItem.batches.map((b) => (
                      <div key={b.label} className="inv-batch-card">
                        <span className="inv-batch-label">{b.label}</span>
                        <span className="inv-batch-amount">
                          {b.amount} {b.unit}
                        </span>
                        <span className="inv-batch-age">{b.age}</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="inv-drawer-section">
                <h3 className="inv-drawer-section-title">
                  Verification Actions
                </h3>
                <div className="inv-drawer-actions">
                  <button
                    className="inv-btn inv-btn--primary"
                    onClick={() => {
                      setSelectedItem(null);
                      setShowModal(true);
                    }}
                  >
                    Upload Stock Opname
                  </button>
                  <button className="inv-btn inv-btn--outline">
                    Manual Stock Adjustment
                  </button>
                  <button className="inv-btn inv-btn--outline">
                    Confirm Discrepancy
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <StockOpnameModal
          inventory={stock}
          onClose={() => setShowModal(false)}
          onApply={handleApplyUpdate}
        />
      )}
    </div>
  );
}
