"use client";

import { format } from "date-fns";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Point = { ts: string; current: number };

export function CurrentChart({
  points,
  thresholds,
}: {
  points: Point[];
  thresholds: { running: number; stop: number };
}) {
  const data = points.map((p) => ({
    t: new Date(p.ts).getTime(),
    current: p.current,
    label: format(new Date(p.ts), "HH:mm"),
  }));

  if (data.length === 0) {
    return (
      <div className="h-72 flex items-center justify-center text-sm text-slate-400">
        전류 데이터가 없습니다.
      </div>
    );
  }

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#64748b" }}
            minTickGap={32}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#64748b" }}
            label={{
              value: "A",
              position: "insideLeft",
              offset: 10,
              fill: "#64748b",
              fontSize: 11,
            }}
          />
          <Tooltip
            labelClassName="text-xs"
            contentStyle={{ fontSize: 12 }}
            formatter={(v) => [`${Number(v).toFixed(2)} A`, "전류"]}
          />
          <ReferenceLine
            y={thresholds.running}
            stroke="#22c55e"
            strokeDasharray="4 2"
            label={{
              value: `가동 ≥ ${thresholds.running}A`,
              position: "insideTopRight",
              fontSize: 10,
              fill: "#22c55e",
            }}
          />
          <ReferenceLine
            y={thresholds.stop}
            stroke="#ef4444"
            strokeDasharray="4 2"
            label={{
              value: `정지 ≤ ${thresholds.stop}A`,
              position: "insideBottomRight",
              fontSize: 10,
              fill: "#ef4444",
            }}
          />
          <Line
            type="monotone"
            dataKey="current"
            stroke="#2563eb"
            dot={false}
            strokeWidth={1.5}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
