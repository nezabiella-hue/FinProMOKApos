import { useState } from "react";
import { X, Upload, FileText, ClipboardList, Sparkles } from "lucide-react";
import { stockOpnameUpdate } from "../data/mockupdate";

const getSuggestedAction = (diff) => {
  if (diff === 0) return "No change";
  if (diff < -100) return "Mark discrepancy";
  return "Update stock";
};

export default function StockOpnameModal({ inventory, onClose, onApply }) {
  const [activeMethod, setActiveMethod] = useState(null);
  const [previewReady, setPreviewReady] = useState(false);

  const preview = stockOpnameUpdate.map((update) => {
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

  const handleMethodSelect = (method) => {
    setActiveMethod(method);
    setPreviewReady(true);
  };

  const handleApply = () => {
    onApply(stockOpnameUpdate);
    onClose();
  };

  return (
    <div className="inv-modal-overlay">
      <div className="inv-modal">
        <div className="inv-modal-header">
          <h2 className="inv-modal-title">Upload Stock Opname Data</h2>
          <button className="inv-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="inv-modal-body">
          <div className="inv-modal-methods">
            <button className={`inv-method-card ${activeMethod === "csv" ? "inv-method-card--active" : ""}`} onClick={() => handleMethodSelect("csv")}>
              <FileText size={28} className="inv-method-icon inv-method-icon--blue" />
              <span>Upload CSV / Excel</span>
            </button>
            <button className={`inv-method-card ${activeMethod === "pos" ? "inv-method-card--active" : ""}`} onClick={() => handleMethodSelect("pos")}>
              <Upload size={28} className="inv-method-icon inv-method-icon--purple" />
              <span>POS Export</span>
            </button>
            <button className={`inv-method-card ${activeMethod === "manual" ? "inv-method-card--active" : ""}`} onClick={() => handleMethodSelect("manual")}>
              <ClipboardList size={28} className="inv-method-icon inv-method-icon--grey" />
              <span>Manual Paste</span>
            </button>
          </div>

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

          {previewReady && (
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
                  {preview.map((row) => (
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
        </div>

        <div className="inv-modal-footer">
          <button className="inv-btn inv-btn--ghost" onClick={onClose}>Cancel</button>
          <div className="inv-modal-footer-right">
            <button className="inv-btn inv-btn--outline">Save as Draft</button>
            <button className="inv-btn inv-btn--whatsapp">Send via WhatsApp</button>
            <button className="inv-btn inv-btn--primary" onClick={handleApply} disabled={!previewReady}>
              Apply Update
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
