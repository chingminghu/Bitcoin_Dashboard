"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;

  const point = payload[0]?.payload;

  return (
    <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-xl border border-slate-700 min-w-[220px]">
      <p className="text-sm text-slate-300 mb-3">{label}</p>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-slate-400">mNAV</span>
          <span className="font-semibold">{point.mnav}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-400">BTC Price</span>
          <span>{formatCurrency(point.btc_price)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-400">BTC NAV</span>
          <span>{formatCurrency(point.btc_nav)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-400">Market Cap</span>
          <span>{formatCurrency(point.market_cap)}</span>
        </div>
      </div>
    </div>
  );
}

export default function MnavChart({ data }) {
  const min = Math.min(...data.map(d => d.mnav));
  const max = Math.max(...data.map(d => d.mnav));
  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-6 gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">
            Time Series Chart
          </p>
          <h2 className="text-2xl font-bold text-slate-900">
            MSTR mNAV (30 Days)
          </h2>
        </div>
        <p className="text-sm text-slate-500">
          Red dashed line = mNAV 1.0 reference level
        </p>
      </div>

      <div className="w-full h-[420px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 10, right: 24, left: 0, bottom: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
            <XAxis
              dataKey="date"
              tick={{ fill: "#475569", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[
                Math.min(min - 0.02, 1 - 0.02),
                Math.max(max + 0.02, 1 + 0.02)
              ]}
              tick={{ fill: "#475569", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={1} stroke="#ef4444" strokeDasharray="5 5" />
            <Line
              type="monotone"
              dataKey="mnav"
              stroke="#0f172a"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6, fill: "#0f172a" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}