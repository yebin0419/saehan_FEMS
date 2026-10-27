"use client";

import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type ParetoRow = {
  code: string;
  name: string;
  color: string;
  totalMin: number;
  cumulativePct: number;
};

export function ParetoChart({ rows }: { rows: ParetoRow[] }) {
  const nonZero = rows.some((r) => r.totalMin > 0);
  if (!nonZero) {
    return (
      <div className="h-72 flex items-center justify-center text-sm text-slate-400">
        분류된 원인이 없습니다. 설비 상세에서 원인을 입력하면 집계됩니다.
      </div>
    );
  }
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={rows}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 11, fill: "#64748b" }}
            label={{
              value: "분",
              position: "insideLeft",
              fill: "#64748b",
              fontSize: 11,
            }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: "#64748b" }}
            label={{
              value: "%",
              position: "insideRight",
              fill: "#64748b",
              fontSize: 11,
            }}
          />
          <Tooltip
            contentStyle={{ fontSize: 12 }}
            formatter={(v, key) => {
              const n = Number(v);
              return String(key) === "totalMin"
                ? [`${n}분`, "손실 시간"]
                : [`${n.toFixed(1)}%`, "누적"];
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar
            yAxisId="left"
            dataKey="totalMin"
            name="손실 시간(분)"
            isAnimationActive={false}
          >
            {rows.map((r) => (
              <Cell key={r.code} fill={r.color} />
            ))}
          </Bar>
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="cumulativePct"
            name="누적 %"
            stroke="#2563eb"
            strokeWidth={2}
            dot
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
