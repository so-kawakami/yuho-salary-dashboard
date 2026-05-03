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

interface IndustryData {
  industry: string;
  avgSalary: number;
  companies: number;
}

const COLORS = [
  "#1a56db", "#2563eb", "#3b82f6", "#60a5fa",
  "#7c3aed", "#8b5cf6", "#a78bfa",
  "#06b6d4", "#0891b2", "#0d9488",
  "#059669", "#10b981", "#6366f1",
  "#8b5cf6", "#ec4899", "#f59e0b",
  "#ef4444", "#64748b",
];

export function IndustryChart({ data }: { data: IndustryData[] }) {
  const sorted = [...data].sort((a, b) => b.avgSalary - a.avgSalary);
  const barHeight = 28;
  const chartHeight = Math.max(300, sorted.length * (barHeight + 8) + 40);

  return (
    <div className="glass rounded-xl p-5">
      <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
        業界別 平均年収
      </h2>
      <p className="text-sm text-[var(--color-text-muted)] mb-4">
        全{data.length}業界・有価証券報告書ベース（万円）
      </p>
      <div style={{ height: chartHeight }} className="overflow-x-auto">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={sorted}
            layout="vertical"
            margin={{ top: 0, right: 20, bottom: 0, left: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
            <XAxis
              type="number"
              domain={[0, (dataMax: number) => Math.ceil(dataMax / 200) * 200]}
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => `${v}`}
            />
            <YAxis
              dataKey="industry"
              type="category"
              width={90}
              tick={{ fontSize: 11 }}
            />
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any, _name: any, props: any) => [
                `${Number(value).toLocaleString()}万円（${props.payload.companies}社）`,
                "平均年収",
              ]}
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
              }}
            />
            <Bar dataKey="avgSalary" radius={[0, 6, 6, 0]} barSize={barHeight}>
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
