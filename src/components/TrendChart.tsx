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

export interface TrendPoint {
  year: string;
  listed: number; // 当サイト集計の平均年収（万円）
  average: number | null; // 全国平均（国税庁・万円）
  companies?: number;
}

export function TrendChart({ data }: { data: TrendPoint[] }) {
  const values = data.flatMap((d) => [d.listed, d.average ?? d.listed]);
  const min = Math.floor((Math.min(...values) - 40) / 50) * 50;
  const max = Math.ceil((Math.max(...values) + 40) / 50) * 50;

  return (
    <div className="glass rounded-xl p-5">
      <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
        平均年収の推移
      </h2>
      <p className="text-sm text-[var(--color-text-muted)] mb-4">
        当サイト集計（上場企業中心）vs 全国平均（万円）
      </p>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="year" tick={{ fontSize: 12 }} />
            <YAxis domain={[min, max]} tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value, name) => [
                `${value}万円`,
                name === "listed" ? "当サイト集計" : "全国平均",
              ]}
              labelFormatter={(label) => `${label}年度`}
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
              }}
            />
            <Legend
              formatter={(value: string) =>
                value === "listed" ? "当サイト集計（上場企業中心）" : "全国平均（国税庁）"
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
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-3 text-xs text-[var(--color-text-muted)]">
        ※ 当サイト集計は各年度に有価証券報告書を提出した企業の平均年間給与の単純平均。
        全国平均は国税庁「民間給与実態統計調査」の平均給与（未公表年度は表示なし）。
      </p>
    </div>
  );
}
