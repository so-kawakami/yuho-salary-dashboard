"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { mockTrend } from "@/data/mock";

export function TrendChart() {
  return (
    <div className="glass rounded-xl p-5">
      <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
        平均年収の推移
      </h2>
      <p className="text-sm text-[var(--color-text-muted)] mb-4">
        全国平均 vs 上場企業平均（万円）
      </p>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={mockTrend}
            margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="year" tick={{ fontSize: 12 }} />
            <YAxis domain={[300, 750]} tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value, name) => [
                `${value}万円`,
                name === "listed" ? "上場企業平均" : "全国平均",
              ]}
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
              }}
            />
            <Legend
              formatter={(value: string) =>
                value === "listed" ? "上場企業平均" : "全国平均"
              }
            />
            <Line
              type="monotone"
              dataKey="listed"
              stroke="#1a56db"
              strokeWidth={3}
              dot={{ r: 5 }}
              activeDot={{ r: 7 }}
            />
            <Line
              type="monotone"
              dataKey="average"
              stroke="#9ca3af"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
