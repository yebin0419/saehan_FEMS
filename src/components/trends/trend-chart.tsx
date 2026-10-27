"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TrendData } from "@/lib/analysis/trends";

const COLORS = ["#2563eb", "#10b981", "#f59e0b", "#8e4ec6", "#e5484d"];

export function TrendChart({ data }: { data: TrendData }) {
  if (data.labels.length === 0) {
    return (
      <div className="h-72 flex items-center justify-center text-sm text-slate-400">
        추세 집계를 위한 데이터가 없습니다.
      </div>
    );
  }
  const chartData = data.labels.map((label, i) => {
    const row: Record<string, string | number> = { label };
    for (const s of data.series) {
      row[s.equipmentCode] = Number(s.points[i].utilPct.toFixed(1));
    }
    return row;
  });
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#64748b" }}
            minTickGap={32}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: "#64748b" }}
            label={{
              value: "%",
              position: "insideLeft",
              fill: "#64748b",
              fontSize: 11,
            }}
          />
          <Tooltip
            contentStyle={{ fontSize: 12 }}
            formatter={(v) => [`${Number(v).toFixed(1)}%`, "가동률"]}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {data.series.map((s, idx) => (
            <Line
              key={s.equipmentCode}
              type="monotone"
              dataKey={s.equipmentCode}
              name={s.equipmentName}
              stroke={COLORS[idx % COLORS.length]}
              dot={{ r: 3 }}
              strokeWidth={2}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
