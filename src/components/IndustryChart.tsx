"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { mockIndustries } from "@/data/mock";

const sorted = [...mockIndustries].sort((a, b) => b.avgSalary - a.avgSalary);

const COLORS = [
  "#1a56db",
  "#2563eb",
  "#3b82f6",
  "#60a5fa",
  "#7c3aed",
  "#8b5cf6",
  "#a78bfa",
  "#06b6d4",
  "#0891b2",
  "#0d9488",
];

export function IndustryChart() {
  return (
    <div className="glass rounded-xl p-5">
      <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
        業界別 平均年収
      </h2>
      <p className="text-sm text-[var(--color-text-muted)] mb-4">
        業界ごとの上場企業平均（万円）
      </p>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={sorted}
            layout="vertical"
            margin={{ top: 0, right: 20, bottom: 0, left: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis type="number" domain={[0, 1000]} tick={{ fontSize: 12 }} />
            <YAxis
              dataKey="industry"
              type="category"
              width={80}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              formatter={(value) => [`${value}万円`, "平均年収"]}
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
              }}
            />
            <Bar dataKey="avgSalary" radius={[0, 6, 6, 0]} barSize={24}>
              {sorted.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
