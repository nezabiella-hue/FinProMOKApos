// pages/reports.jsx — Sales Analytics
import { useState, useMemo } from "react";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import {
  TrendingUp, TrendingDown, Minus,
  ShoppingBag, DollarSign, Receipt,
  RefreshCw, Package,
} from "lucide-react";
import { dailySales, topProducts } from "../data/mockprofit";
import { saleTransactions, restockTransactions, getTotalRestockCost } from "../data/mockTransactions";
import { liveUpdateSnapshot } from "../data/mockLiveUpdate";
import "../App.css";

const fmt = (n) => "Rp. " + n.toLocaleString("id-ID");
const pct = (curr, prev) => {
  if (!prev) return 0;
  return (((curr - prev) / prev) * 100).toFixed(1);
};

const TrendBadge = ({ value }) => {
  const v = parseFloat(value);
  if (v > 0) return <span className="db-badge db-badge--up"><TrendingUp size={12} /> +{v}%</span>;
  if (v < 0) return <span className="db-badge db-badge--down"><TrendingDown size={12} /> {v}%</span>;
  return <span className="db-badge db-badge--flat"><Minus size={12} /> 0%</span>;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="db-tooltip">
      <p className="db-tooltip-label">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {typeof p.value === "number" && p.value > 1000 ? fmt(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

const TABS = ["Daily", "Monthly"];

export default function Reports() {
  const [activeTab, setActiveTab] = useState("Daily");
  const [liveApplied, setLiveApplied] = useState(false);

  // ── Daily view data ────────────────────────────────────
  // Build per-dish sales per day from saleTransactions
  const dailyDishData = useMemo(() => {
    const map = {};
    saleTransactions.forEach(({ date, dish, qty, total }) => {
      if (!map[date]) map[date] = { date: date.slice(5), fullDate: date, revenue: 0, units: 0, dishes: {} };
      map[date].revenue += total;
      map[date].units += qty;
      map[date].dishes[dish] = (map[date].dishes[dish] || 0) + qty;
    });

    // Add live update as "today" if applied
    if (liveApplied) {
      const snap = liveUpdateSnapshot;
      const key = snap.snapshotDate;
      map[key] = {
        date: key.slice(5),
        fullDate: key,
        revenue: snap.todayTotals.grossSales,
        units: snap.todaySales.reduce((s, d) => s + d.qty, 0),
        dishes: snap.todaySales.reduce((acc, d) => { acc[d.dish] = d.qty; return acc; }, {}),
        isLive: true,
      };
    }

    return Object.values(map).sort((a, b) => new Date(a.fullDate) - new Date(b.fullDate));
  }, [liveApplied]);

  // ── Monthly summary ────────────────────────────────────
  const monthlyTotals = useMemo(() => {
    const gross = dailySales.reduce((s, d) => s + d.grossSales, 0);
    const net = dailySales.reduce((s, d) => s + d.netSales, 0);
    const profit = dailySales.reduce((s, d) => s + (d.netSales - d.cogs), 0);
    const txn = dailySales.reduce((s, d) => s + d.transactions, 0);
    const restockCost = getTotalRestockCost();
    return { gross, net, profit, txn, restockCost };
  }, []);

  // ── Today's stats (from live update) ──────────────────
  const todayStats = liveUpdateSnapshot.todayTotals;

  // ── Per-dish revenue totals for bar chart ─────────────
  const dishRevenueData = useMemo(() => {
    const map = {};
    saleTransactions.forEach(({ dish, total, qty }) => {
      if (!map[dish]) map[dish] = { dish, revenue: 0, units: 0 };
      map[dish].revenue += total;
      map[dish].units += qty;
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, []);

  // ── Restock cost per date ─────────────────────────────
  const restockByDate = useMemo(() => {
    const map = {};
    restockTransactions.forEach(({ date, totalCost }) => {
      map[date] = (map[date] || 0) + totalCost;
    });
    return Object.entries(map).map(([date, cost]) => ({ date: date.slice(5), cost }));
  }, []);

  return (
    <div className="inv-wrap">
      {/* Header */}
      <div className="inv-page-header">
        <div>
          <h1 className="inv-page-title">Sales Analytics</h1>
          <p style={{ color: "#6b7280", fontSize: "0.88rem", marginTop: "0.2rem" }}>
            Transaction history, revenue trends, and restock costs.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {/* Live Update button */}
          <button
            className={`inv-btn ${liveApplied ? "inv-btn--outline" : "inv-btn--primary"}`}
            onClick={() => setLiveApplied((p) => !p)}
            style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
          >
            <RefreshCw size={14} className={liveApplied ? "" : ""} />
            {liveApplied
              ? `Live: ${liveUpdateSnapshot.label}`
              : "Apply Live Update"}
          </button>
        </div>
      </div>

      {/* Live update banner */}
      {liveApplied && (
        <div style={{
          background: "#ecfdf5", border: "1px solid #6ee7b7",
          borderRadius: "10px", padding: "0.65rem 1.1rem",
          fontSize: "0.83rem", color: "#065f46",
          display: "flex", alignItems: "center", gap: "0.5rem",
          marginBottom: "1.25rem",
        }}>
          <RefreshCw size={13} />
          Live data applied — showing today ({liveUpdateSnapshot.snapshotDate}) partial day alongside historical data.
          {" "}<strong>{fmt(todayStats.grossSales)}</strong> gross · {todayStats.transactions} transactions so far ·
          Projected full day: <strong>{fmt(todayStats.projectedDayTotal)}</strong>
        </div>
      )}

      {/* Tabs */}
      <div className="inv-tabs" style={{ marginBottom: "1.25rem" }}>
        {TABS.map((t) => (
          <button
            key={t}
            className={`inv-tab ${activeTab === t ? "inv-tab--active" : ""}`}
            onClick={() => setActiveTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── DAILY TAB ── */}
      {activeTab === "Daily" && (
        <>
          {/* Today's snapshot cards */}
          <div className="db-cards" style={{ marginBottom: "1.25rem" }}>
            {[
              {
                label: "Today's Gross Sales",
                value: liveApplied ? fmt(todayStats.grossSales) : "—",
                sub: liveApplied ? `${todayStats.transactions} transactions` : "Apply Live Update to see",
                icon: <DollarSign size={18} />, color: "#4e8c6e",
              },
              {
                label: "Projected Full Day",
                value: liveApplied ? fmt(todayStats.projectedDayTotal) : "—",
                sub: liveApplied ? "Based on morning velocity" : "—",
                icon: <TrendingUp size={18} />, color: "#6aab89",
              },
              {
                label: "Avg / Transaction",
                value: liveApplied ? fmt(todayStats.avgPerTransaction) : "—",
                sub: "Today so far",
                icon: <Receipt size={18} />, color: "#2d6a4f",
              },
              {
                label: "Month Restock Spend",
                value: fmt(monthlyTotals.restockCost),
                sub: `${restockTransactions.length} purchase orders`,
                icon: <Package size={18} />, color: "#1b4332",
              },
            ].map((c) => (
              <div className="db-card" key={c.label}>
                <div className="db-card-top">
                  <span className="db-card-label">{c.label}</span>
                  <span className="db-card-icon" style={{ background: c.color + "22", color: c.color }}>
                    {c.icon}
                  </span>
                </div>
                <div className="db-card-value">{c.value}</div>
                <p style={{ fontSize: "0.78rem", color: "#8aab97", marginTop: "0.25rem" }}>{c.sub}</p>
              </div>
            ))}
          </div>

          {/* Daily revenue line chart */}
          <div className="db-chart-card" style={{ marginBottom: "1.25rem" }}>
            <h2 className="db-chart-title">Daily Revenue</h2>
            <p className="db-chart-sub">
              Transaction revenue per day
              {liveApplied && " — includes today's partial data"}
            </p>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={dailyDishData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8f0ec" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#888" }} interval="preserveStartEnd" />
                <YAxis tickFormatter={(v) => `${(v / 1_000).toFixed(0)}K`} tick={{ fontSize: 11, fill: "#888" }} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone" dataKey="revenue" name="Revenue"
                  stroke="#4e8c6e" strokeWidth={2} dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Daily transaction table */}
          <div className="inv-card">
            <div className="inv-card-header">
              <div>
                <h2 className="inv-card-title">Daily Transaction Log</h2>
                <p className="inv-card-sub">All sales transactions this month</p>
              </div>
            </div>
            <table className="inv-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Dish</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                  <th>Type</th>
                </tr>
              </thead>
              <tbody>
                {liveApplied && liveUpdateSnapshot.todaySales.map((s, i) => (
                  <tr key={`live-${i}`} style={{ background: "#f0fdf4" }}>
                    <td className="inv-td-muted">
                      {liveUpdateSnapshot.snapshotDate}
                      <span style={{ fontSize: "0.72rem", marginLeft: 4, color: "#059669" }}>● Live</span>
                    </td>
                    <td className="inv-td-bold">{s.dish}</td>
                    <td>{s.qty}</td>
                    <td className="inv-td-muted">{fmt(s.unitPrice)}</td>
                    <td>{fmt(s.subtotal)}</td>
                    <td><span className="inv-badge inv-badge--ok">Sale</span></td>
                  </tr>
                ))}
                {[...saleTransactions].reverse().map((t) => (
                  <tr key={t.id}>
                    <td className="inv-td-muted">{t.date}</td>
                    <td className="inv-td-bold">{t.dish}</td>
                    <td>{t.qty}</td>
                    <td className="inv-td-muted">{fmt(t.unitPrice)}</td>
                    <td>{fmt(t.total)}</td>
                    <td><span className="inv-badge inv-badge--ok">Sale</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── MONTHLY TAB ── */}
      {activeTab === "Monthly" && (
        <>
          {/* Monthly summary cards */}
          <div className="db-cards" style={{ marginBottom: "1.25rem" }}>
            {[
              { label: "Gross Sales",    value: fmt(monthlyTotals.gross),       trend: "+12.4", icon: <DollarSign size={18} />, color: "#4e8c6e" },
              { label: "Net Sales",      value: fmt(monthlyTotals.net),         trend: "+11.8", icon: <ShoppingBag size={18} />, color: "#6aab89" },
              { label: "Gross Profit",   value: fmt(monthlyTotals.profit),      trend: "+10.2", icon: <TrendingUp size={18} />, color: "#2d6a4f" },
              { label: "Restock Spend",  value: fmt(monthlyTotals.restockCost), trend: "-3.1",  icon: <Package size={18} />,    color: "#e65100" },
            ].map((c) => (
              <div className="db-card" key={c.label}>
                <div className="db-card-top">
                  <span className="db-card-label">{c.label}</span>
                  <span className="db-card-icon" style={{ background: c.color + "22", color: c.color }}>
                    {c.icon}
                  </span>
                </div>
                <div className="db-card-value">{c.value}</div>
                <TrendBadge value={c.trend} />
              </div>
            ))}
          </div>

          {/* Revenue vs Restock cost bar chart */}
          <div className="db-chart-card" style={{ marginBottom: "1.25rem" }}>
            <h2 className="db-chart-title">Revenue by Dish</h2>
            <p className="db-chart-sub">Total revenue generated per menu item this month</p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={dishRevenueData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8f0ec" />
                <XAxis dataKey="dish" tick={{ fontSize: 10, fill: "#888" }} />
                <YAxis tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`} tick={{ fontSize: 11, fill: "#888" }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue" name="Revenue" fill="#4e8c6e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Restock log */}
          <div className="inv-card">
            <div className="inv-card-header">
              <div>
                <h2 className="inv-card-title">Restock Log</h2>
                <p className="inv-card-sub">All purchase orders this month with batch and expiry data</p>
              </div>
            </div>
            <table className="inv-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Ingredient</th>
                  <th>Qty</th>
                  <th>Batch</th>
                  <th>Predicted Expiry</th>
                  <th>Shelf Life</th>
                  <th>Cost</th>
                </tr>
              </thead>
              <tbody>
                {restockTransactions.map((r) => {
                  const isAdjusted = r.notes?.includes("Adjusted") || r.notes?.includes("confirmed");
                  return (
                    <tr key={r.id}>
                      <td className="inv-td-muted">{r.date}</td>
                      <td className="inv-td-bold">{r.ingredient}</td>
                      <td>{r.qty} {r.unit}</td>
                      <td className="inv-td-muted">{r.batchLabel}</td>
                      <td className={isAdjusted ? "" : "inv-td-muted"}>
                        {r.predictedExpiryDate}
                        {isAdjusted && (
                          <span style={{ fontSize: "0.7rem", marginLeft: 4, color: "#d97706" }}>
                            ↺ adjusted
                          </span>
                        )}
                      </td>
                      <td className="inv-td-muted">{r.adjustedShelfLifeDays}d</td>
                      <td>{fmt(r.totalCost)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
