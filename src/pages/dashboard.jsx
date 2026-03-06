import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Coffee,
  ShoppingBag,
  DollarSign,
  Receipt,
} from "lucide-react";
import { dailySales, topProducts, dateRangePresets } from "../data/mockprofit";

// ── helpers ──────────────────────────────────────────────
const fmt = (n) => "Rp. " + n.toLocaleString("id-ID");

const pct = (curr, prev) => {
  if (!prev) return 0;
  return (((curr - prev) / prev) * 100).toFixed(1);
};

const TrendBadge = ({ value }) => {
  const v = parseFloat(value);
  if (v > 0)
    return (
      <span className="db-badge db-badge--up">
        <TrendingUp size={12} /> +{v}%
      </span>
    );
  if (v < 0)
    return (
      <span className="db-badge db-badge--down">
        <TrendingDown size={12} /> {v}%
      </span>
    );
  return (
    <span className="db-badge db-badge--flat">
      <Minus size={12} /> 0%
    </span>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="db-tooltip">
      <p className="db-tooltip-label">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {fmt(p.value)}
        </p>
      ))}
    </div>
  );
};

// ── component ─────────────────────────────────────────────
export default function Dashboard() {
  const [activeDays, setActiveDays] = useState(31);

  const filtered = useMemo(() => {
    return dailySales.slice(-activeDays);
  }, [activeDays]);

  const prev = useMemo(() => {
    const start = Math.max(0, dailySales.length - activeDays * 2);
    return dailySales.slice(start, dailySales.length - activeDays);
  }, [activeDays]);

  const totals = useMemo(
    () => ({
      gross: filtered.reduce((s, d) => s + d.grossSales, 0),
      net: filtered.reduce((s, d) => s + d.netSales, 0),
      profit: filtered.reduce((s, d) => s + (d.netSales - d.cogs), 0),
      txn: filtered.reduce((s, d) => s + d.transactions, 0),
    }),
    [filtered],
  );

  const prevTotals = useMemo(
    () => ({
      gross: prev.reduce((s, d) => s + d.grossSales, 0),
      net: prev.reduce((s, d) => s + d.netSales, 0),
      profit: prev.reduce((s, d) => s + (d.netSales - d.cogs), 0),
      txn: prev.reduce((s, d) => s + d.transactions, 0),
    }),
    [prev],
  );

  const avgTxn = totals.txn > 0 ? Math.round(totals.net / totals.txn) : 0;
  const prevAvgTxn =
    prevTotals.txn > 0 ? Math.round(prevTotals.net / prevTotals.txn) : 0;

  const chartData = filtered.map((d) => ({
    date: d.date.slice(5),
    "Gross Sales": d.grossSales,
    "Net Profit": d.netSales - d.cogs,
  }));

  const stats = [
    {
      label: "Gross Sales",
      value: fmt(totals.gross),
      trend: pct(totals.gross, prevTotals.gross),
      icon: <DollarSign size={20} />,
      color: "#4e8c6e",
    },
    {
      label: "Net Sales",
      value: fmt(totals.net),
      trend: pct(totals.net, prevTotals.net),
      icon: <ShoppingBag size={20} />,
      color: "#6aab89",
    },
    {
      label: "Gross Profit",
      value: fmt(totals.profit),
      trend: pct(totals.profit, prevTotals.profit),
      icon: <Coffee size={20} />,
      color: "#2d6a4f",
    },
    {
      label: "Transactions",
      value: totals.txn.toLocaleString(),
      trend: pct(totals.txn, prevTotals.txn),
      icon: <Receipt size={20} />,
      color: "#1b4332",
    },
  ];

  return (
    <div className="db-wrap">
      {/* Header */}
      <div className="db-header">
        <div>
          <h1 className="db-title">Dashboard</h1>
          <p className="db-subtitle">
            Sales & profit overview for your coffee shop ☕
          </p>
        </div>
        <div className="db-status">
          <span className="db-status-dot" />
          Live data active
        </div>
      </div>

      {/* Date filter */}
      <div className="db-filters">
        <span className="db-filters-label">Time period:</span>
        {dateRangePresets.map((p) => (
          <button
            key={p.days}
            className={`db-filter-btn ${activeDays === p.days ? "db-filter-btn--active" : ""}`}
            onClick={() => setActiveDays(p.days)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Stat cards */}
      <div className="db-cards">
        {stats.map((s) => (
          <div className="db-card" key={s.label}>
            <div className="db-card-top">
              <span className="db-card-label">{s.label}</span>
              <span
                className="db-card-icon"
                style={{ background: s.color + "22", color: s.color }}
              >
                {s.icon}
              </span>
            </div>
            <div className="db-card-value">{s.value}</div>
            <TrendBadge value={s.trend} />
          </div>
        ))}
      </div>

      {/* Avg per transaction */}
      <div className="db-avg-row">
        <span className="db-avg-label">Avg. Sale / Transaction</span>
        <span className="db-avg-value">{fmt(avgTxn)}</span>
        <TrendBadge value={pct(avgTxn, prevAvgTxn)} />
      </div>

      {/* Charts */}
      <div className="db-charts">
        {/* Line chart */}
        <div className="db-chart-card">
          <h2 className="db-chart-title">Sales & Profit Trend</h2>
          <p className="db-chart-sub">Daily gross sales vs net profit</p>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart
              data={chartData}
              margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e8f0ec" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#888" }}
                interval="preserveStartEnd"
              />
              <YAxis
                tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`}
                tick={{ fontSize: 11, fill: "#888" }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey="Gross Sales"
                stroke="#4e8c6e"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="Net Profit"
                stroke="#1b4332"
                strokeWidth={2}
                dot={false}
                strokeDasharray="5 3"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="db-chart-card">
          <h2 className="db-chart-title">Top Products</h2>
          <p className="db-chart-sub">Most sold items this period</p>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={topProducts}
                dataKey="sold"
                nameKey="name"
                cx="45%"
                cy="50%"
                innerRadius={55}
                outerRadius={95}
                paddingAngle={3}
              >
                {topProducts.map((p, i) => (
                  <Cell key={i} fill={p.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v, n) => [`${v} cups`, n]} />
              <Legend
                layout="vertical"
                align="right"
                verticalAlign="middle"
                wrapperStyle={{ fontSize: 11 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top products table */}
      <div className="db-table-card">
        <h2 className="db-chart-title">Product Breakdown</h2>
        <table className="db-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Product</th>
              <th>Units Sold</th>
              <th>Revenue</th>
            </tr>
          </thead>
          <tbody>
            {topProducts.map((p, i) => (
              <tr key={p.name}>
                <td>
                  <span className="db-rank" style={{ background: p.color }}>
                    {i + 1}
                  </span>
                </td>
                <td className="db-product-name">
                  <span className="db-dot" style={{ background: p.color }} />
                  {p.name}
                </td>
                <td>{p.sold.toLocaleString()}</td>
                <td>{fmt(p.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
