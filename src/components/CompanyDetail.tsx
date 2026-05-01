"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { type CompanySalary, calcSalaryPercentile } from "@/data/mock";

// ダミーの過去5年推移データ
function generateTrend(currentSalary: number): { year: string; salary: number }[] {
  return [
    { year: "2021", salary: Math.round(currentSalary * 0.91) },
    { year: "2022", salary: Math.round(currentSalary * 0.94) },
    { year: "2023", salary: Math.round(currentSalary * 0.96) },
    { year: "2024", salary: Math.round(currentSalary * 0.98) },
    { year: "2025", salary: currentSalary },
  ];
}

export function CompanyDetail({ company }: { company: CompanySalary }) {
  const trend = generateTrend(company.salary);
  const percentile = calcSalaryPercentile(company.salary);

  const infoItems = [
    { label: "平均年収", value: `${company.salary.toLocaleString()}万円`, highlight: true },
    { label: "前年比", value: `${company.change >= 0 ? "+" : ""}${company.change}万円`, highlight: false },
    { label: "従業員数", value: `${company.employees.toLocaleString()}名`, highlight: false },
    { label: "平均年齢", value: `${company.avgAge}歳`, highlight: false },
    { label: "平均勤続年数", value: `${company.avgTenure}年`, highlight: false },
    { label: "決算期", value: company.periodEnd, highlight: false },
    { label: "業種", value: company.industry, highlight: false },
    { label: "証券コード", value: company.code, highlight: false },
  ];

  return (
    <div className="space-y-6">
      {/* 企業ヘッダー */}
      <div className="glass rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] font-medium">
                {company.industry}
              </span>
              <span className="text-xs text-[var(--color-text-muted)]">
                証券コード: {company.code}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text-primary)]">
              {company.name}
            </h1>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-4xl sm:text-5xl font-extrabold text-gradient">
              {company.salary.toLocaleString()}
            </span>
            <span className="text-lg text-[var(--color-text-secondary)]">
              万円
            </span>
          </div>
        </div>

        {/* 年収ポジション */}
        <div className="mt-6 rounded-xl bg-[var(--color-surface-secondary)] p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[var(--color-text-secondary)]">
              上場企業内の位置
            </span>
            <span className="text-sm font-bold text-[var(--color-primary)]">
              上位 {100 - percentile.percentile}% / 偏差値 {percentile.deviation}
            </span>
          </div>
          <div className="h-3 rounded-full bg-white/50 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] transition-all duration-700"
              style={{ width: `${percentile.percentile}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 基本情報 */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-4">
            基本情報
          </h2>
          <dl className="space-y-3">
            {infoItems.map((item) => (
              <div key={item.label} className="flex justify-between items-center py-2 border-b border-[var(--color-border)] last:border-0">
                <dt className="text-sm text-[var(--color-text-secondary)]">
                  {item.label}
                </dt>
                <dd
                  className={`text-sm font-medium ${
                    item.highlight
                      ? "text-lg font-bold text-[var(--color-text-primary)]"
                      : "text-[var(--color-text-primary)]"
                  }`}
                >
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* 年収推移グラフ */}
        <div className="glass rounded-2xl p-6 lg:col-span-2">
          <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-1">
            平均年収の推移
          </h2>
          <p className="text-sm text-[var(--color-text-muted)] mb-4">
            過去5年間（万円）
          </p>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                <YAxis
                  domain={[
                    Math.floor((trend[0].salary * 0.9) / 100) * 100,
                    Math.ceil((company.salary * 1.05) / 100) * 100,
                  ]}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value) => [`${value}万円`, "平均年収"]}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                  }}
                />
                <Bar
                  dataKey="salary"
                  radius={[6, 6, 0, 0]}
                  barSize={40}
                  fill="url(#salaryGradient)"
                />
                <defs>
                  <linearGradient
                    id="salaryGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#1a56db" />
                    <stop offset="100%" stopColor="#7c3aed" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 補足情報 */}
      <div className="glass rounded-2xl p-6">
        <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">
          データについて
        </h2>
        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
          このページのデータは{company.name}が金融庁EDINETに提出した有価証券報告書（{company.periodEnd}期）に基づいています。
          「平均年間給与」は提出会社単体の正社員の平均値であり、グループ全体や契約社員等を含まない場合があります。
        </p>
      </div>
    </div>
  );
}
