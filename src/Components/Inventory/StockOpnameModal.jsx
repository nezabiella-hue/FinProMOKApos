import { useState } from "react";
import { X, Upload, FileText, ClipboardList, Sparkles } from "lucide-react";
import { stockOpnameUpdate } from "../../data/mockupdate";

const getSuggestedAction = (diff) => {
  if (diff === 0) return "No change";
  if (diff < -100) return "Mark discrepancy";
  return "Update stock";
};

export default function StockOpnameModal({ inventory, onClose, onApply, onWhatsappNotify }) {
  const [activeMethod, setActiveMethod] = useState(null);
  // manual input values: { [ingredientName]: string }
  const [manualValues, setManualValues] = useState({});
  const [showWhatsappConfirm, setShowWhatsappConfirm] = useState(false);
  // holds the built update array while waiting for whatsapp confirmation
  const [pendingUpdates, setPendingUpdates] = useState(null);

  // ── Preview for CSV / POS methods (uses mock data) ──────
  const mockPreview = stockOpnameUpdate.map((update) => {
    const match = inventory.find((i) => i.name === update.name);
    const systemStock = match ? match.currentStock : 0;
    const diff = update.uploadedStock - systemStock;
    return {
      name: update.name,
      unit: update.unit,
      systemStock,
      uploadedStock: update.uploadedStock,
      diff,
      action: getSuggestedAction(diff),
    };
  });

  // ── Manual method: rows derived from live inventory ─────
  const manualRows = inventory.map((item) => {
    const raw = manualValues[item.name];
    const hasValue = raw !== undefined && raw !== "";
    const uploadedStock = hasValue ? parseFloat(raw) : null;
    const diff = hasValue ? uploadedStock - item.currentStock : null;
    const action = hasValue ? getSuggestedAction(diff) : "—";
    return { name: item.name, unit: item.unit, systemStock: item.currentStock, uploadedStock, diff, action };
  });

  const handleManualChange = (name, value) => {
    // only allow non-negative numbers
    if (value !== "" && (isNaN(value) || parseFloat(value) < 0)) return;
    setManualValues((prev) => ({ ...prev, [name]: value }));
  };

  // ── Apply ────────────────────────────────────────────────
  // Step 1: build updates and show WhatsApp confirmation
  const handleApply = () => {
    let updates;
    if (activeMethod === "manual") {
      updates = manualRows
        .filter((r) => r.uploadedStock !== null && !isNaN(r.uploadedStock))
        .map((r) => {
          const mock = stockOpnameUpdate.find((u) => u.name === r.name);
          return {
            name: r.name,
            uploadedStock: r.uploadedStock,
            unit: r.unit,
            lowThreshold: mock?.lowThreshold ?? 200,
            expiryDate: mock?.expiryDate,
            notes: "Manual entry via opname form",
          };
        });
    } else {
      updates = stockOpnameUpdate;
    }
    setPendingUpdates(updates);
    setShowWhatsappConfirm(true);
  };

  // Step 2a: confirmed — notify WhatsApp then apply
  const handleConfirmNotify = () => {
    onApply(pendingUpdates);
    if (onWhatsappNotify) onWhatsappNotify();
    onClose();
  };

  // Step 2b: skipped — just apply
  const handleSkipNotify = () => {
    onApply(pendingUpdates);
    onClose();
  };

  const isApplyEnabled =
    activeMethod === "manual"
      ? manualRows.some((r) => r.uploadedStock !== null)
      : activeMethod !== null;

  return (
    <div className="inv-modal-overlay">
      <div className="inv-modal">
        <div className="inv-modal-header">
          <h2 className="inv-modal-title">Upload Stock Opname Data</h2>
          <button className="inv-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="inv-modal-body">
          {/* Method selector */}
          <div className="inv-modal-methods">
            <button
              className={`inv-method-card ${activeMethod === "csv" ? "inv-method-card--active" : ""}`}
              onClick={() => setActiveMethod("csv")}
            >
              <FileText size={28} className="inv-method-icon inv-method-icon--blue" />
              <span>Upload CSV / Excel</span>
            </button>
            <button
              className={`inv-method-card ${activeMethod === "pos" ? "inv-method-card--active" : ""}`}
              onClick={() => setActiveMethod("pos")}
            >
              <Upload size={28} className="inv-method-icon inv-method-icon--purple" />
              <span>POS Export</span>
            </button>
            <button
              className={`inv-method-card ${activeMethod === "manual" ? "inv-method-card--active" : ""}`}
              onClick={() => setActiveMethod("manual")}
            >
              <ClipboardList size={28} className="inv-method-icon inv-method-icon--grey" />
              <span>Manual Entry</span>
            </button>
          </div>

          {/* AI panel — shown for CSV and POS, hidden for manual */}
          {activeMethod !== "manual" && (
            <div className="inv-ai-panel">
              <div className="inv-ai-header">
                <Sparkles size={16} className="inv-ai-icon" />
                <span className="inv-ai-title">AI Automated Checks</span>
              </div>
              <ul className="inv-ai-list">
                <li>Detect mismatched ingredient names</li>
                <li>Suggest unit normalization</li>
                <li>Highlight discrepancies vs system stock</li>
              </ul>
            </div>
          )}

          {/* CSV / POS preview (mock data) */}
          {(activeMethod === "csv" || activeMethod === "pos") && (
            <>
              <div className="inv-preview-header">
                <span className="inv-preview-label">Preview</span>
              </div>
              <table className="inv-table">
                <thead>
                  <tr>
                    <th>Ingredient</th>
                    <th>System Stock</th>
                    <th>Uploaded Stock</th>
                    <th>Difference</th>
                    <th>Suggested Action</th>
                  </tr>
                </thead>
                <tbody>
                  {mockPreview.map((row) => (
                    <tr key={row.name}>
                      <td className="inv-td-bold">{row.name}</td>
                      <td className="inv-td-muted">{row.systemStock} {row.unit}</td>
                      <td className="inv-td-bold">{row.uploadedStock} {row.unit}</td>
                      <td>
                        <span className={`inv-diff ${row.diff < 0 ? "inv-diff--neg" : row.diff > 0 ? "inv-diff--pos" : "inv-diff--zero"}`}>
                          {row.diff > 0 ? "+" : ""}{row.diff} {row.unit}
                        </span>
                      </td>
                      <td>
                        <select className="inv-action-select">
                          <option>{row.action}</option>
                          <option>Mark discrepancy</option>
                          <option>Update stock</option>
                          <option>Skip</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {/* Manual entry table */}
          {activeMethod === "manual" && (
            <>
              <div className="inv-preview-header">
                <span className="inv-preview-label">Manual Entry</span>
                <span style={{ fontSize: "0.78rem", color: "#6b7280" }}>
                  Leave blank to skip an ingredient
                </span>
              </div>
              <table className="inv-table">
                <thead>
                  <tr>
                    <th>Ingredient</th>
                    <th>System Stock</th>
                    <th>Actual Count</th>
                    <th>Difference</th>
                    <th>Suggested Action</th>
                  </tr>
                </thead>
                <tbody>
                  {manualRows.map((row) => (
                    <tr key={row.name}>
                      <td className="inv-td-bold">{row.name}</td>
                      <td className="inv-td-muted">{row.systemStock} {row.unit}</td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          placeholder="—"
                          value={manualValues[row.name] ?? ""}
                          onChange={(e) => handleManualChange(row.name, e.target.value)}
                          style={{
                            width: "90px",
                            padding: "0.25rem 0.4rem",
                            border: "1px solid #d1fae5",
                            borderRadius: "6px",
                            fontSize: "0.85rem",
                            background: "#f0fdf4",
                            color: "#1a3c2e",
                            outline: "none",
                          }}
                        />
                        <span style={{ marginLeft: "0.3rem", color: "#6b7280", fontSize: "0.8rem" }}>
                          {row.unit}
                        </span>
                      </td>
                      <td>
                        {row.diff !== null ? (
                          <span className={`inv-diff ${row.diff < 0 ? "inv-diff--neg" : row.diff > 0 ? "inv-diff--pos" : "inv-diff--zero"}`}>
                            {row.diff > 0 ? "+" : ""}{row.diff} {row.unit}
                          </span>
                        ) : (
                          <span className="inv-td-muted">—</span>
                        )}
                      </td>
                      <td>
                        {row.diff !== null ? (
                          <select className="inv-action-select">
                            <option>{row.action}</option>
                            <option>Mark discrepancy</option>
                            <option>Update stock</option>
                            <option>Skip</option>
                          </select>
                        ) : (
                          <span className="inv-td-muted">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>

        {/* WhatsApp confirmation overlay */}
        {showWhatsappConfirm && (
          <div style={{
            position: "absolute", inset: 0,
            background: "rgba(0,0,0,0.45)",
            borderRadius: "inherit",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 10,
          }}>
            <div style={{
              background: "#fff",
              borderRadius: "12px",
              padding: "1.75rem 2rem",
              maxWidth: "320px",
              width: "100%",
              textAlign: "center",
              boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
            }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>💬</div>
              <h3 style={{ margin: "0 0 0.5rem", fontSize: "1rem", color: "#1a3c2e" }}>
                Notify boss on WhatsApp?
              </h3>
              <p style={{ fontSize: "0.83rem", color: "#6b7280", margin: "0 0 1.25rem" }}>
                Send a stock opname summary to the owner via WhatsApp.
              </p>
              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
                <button className="inv-btn inv-btn--outline" onClick={handleSkipNotify}>
                  No, skip
                </button>
                <button className="inv-btn inv-btn--primary" onClick={handleConfirmNotify}>
                  Yes, notify
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="inv-modal-footer">
          <button className="inv-btn inv-btn--ghost" onClick={onClose}>Cancel</button>
          <div className="inv-modal-footer-right">
            <button className="inv-btn inv-btn--outline">Save as Draft</button>
            <button
              className="inv-btn inv-btn--primary"
              onClick={handleApply}
              disabled={!isApplyEnabled}
            >
              Apply Update
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
