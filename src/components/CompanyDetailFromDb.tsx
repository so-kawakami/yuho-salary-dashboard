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
import { calcSalaryPercentile } from "@/data/mock";

interface Company {
  name: string;
  secCode: string | null;
  industry: string | null;
  edinetCode: string;
}

interface SalaryRecord {
  fiscalYear: string;
  avgSalary: number | null;
  employees: number | null;
  avgAge: number | null;
  avgTenure: number | null;
}

export function CompanyDetailFromDb({
  company,
  salaryHistory,
}: {
  company: Company;
  salaryHistory: SalaryRecord[];
}) {
  const latest = salaryHistory[salaryHistory.length - 1];
  const salaryMan = latest?.avgSalary
    ? Math.round(latest.avgSalary / 10000)
    : 0;
  const percentile = calcSalaryPercentile(salaryMan);

  const trend = salaryHistory
    .filter((s) => s.avgSalary)
    .map((s) => ({
      year: s.fiscalYear.replace("-", "/"),
      salary: Math.round(s.avgSalary! / 10000),
    }));

  const infoItems = [
    { label: "平均年収", value: `${salaryMan.toLocaleString()}万円`, highlight: true },
    { label: "従業員数", value: latest?.employees ? `${latest.employees.toLocaleString()}名` : "-" },
    { label: "平均年齢", value: latest?.avgAge ? `${latest.avgAge}歳` : "-" },
    { label: "平均勤続年数", value: latest?.avgTenure ? `${latest.avgTenure}年` : "-" },
    { label: "決算期", value: latest?.fiscalYear ?? "-" },
    { label: "業種", value: company.industry ?? "-" },
    { label: "証券コード", value: company.secCode ?? "-" },
    { label: "EDINETコード", value: company.edinetCode },
  ];

  return (
    <div className="space-y-6">
      {/* 企業ヘッダー */}
      <div className="glass rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              {company.industry && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] font-medium">
                  {company.industry}
                </span>
              )}
              {company.secCode && (
                <span className="text-xs text-[var(--color-text-muted)]">
                  証券コード: {company.secCode}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text-primary)]">
              {company.name}
            </h1>
          </div>

          {salaryMan > 0 && (
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-extrabold text-gradient">
                {salaryMan.toLocaleString()}
              </span>
              <span className="text-lg text-[var(--color-text-secondary)]">
                万円
              </span>
            </div>
          )}
        </div>

        {salaryMan > 0 && (
          <div className="mt-6 rounded-xl bg-[var(--color-surface-secondary)] p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[var(--color-text-secondary)]">
                上場企業内の位置
              </span>
              <span className="text-sm font-bold text-[var(--color-primary)]">
                上位 {100 - percentile.percentile}% / 偏差値{" "}
                {percentile.deviation}
              </span>
            </div>
            <div className="h-3 rounded-full bg-white/50 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] transition-all duration-700"
                style={{ width: `${percentile.percentile}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 基本情報 */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-4">
            基本情報
          </h2>
          <dl className="space-y-3">
            {infoItems.map((item) => (
              <div
                key={item.label}
                className="flex justify-between items-center py-2 border-b border-[var(--color-border)] last:border-0"
              >
                <dt className="text-sm text-[var(--color-text-secondary)]">
                  {item.label}
                </dt>
                <dd
                  className={`text-sm font-medium ${
                    "highlight" in item && item.highlight
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
            万円
          </p>
          {trend.length > 0 ? (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={trend}
                  margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                  <YAxis
                    domain={[
                      Math.floor((Math.min(...trend.map((t) => t.salary)) * 0.9) / 100) * 100,
                      Math.ceil((Math.max(...trend.map((t) => t.salary)) * 1.05) / 100) * 100,
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
          ) : (
            <p className="text-[var(--color-text-muted)] text-sm py-8 text-center">
              推移データがまだありません
            </p>
          )}
        </div>
      </div>

      <div className="glass rounded-2xl p-6">
        <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">
          データについて
        </h2>
        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
          このページのデータは{company.name}
          が金融庁EDINETに提出した有価証券報告書に基づいています。
          「平均年間給与」は提出会社単体の正社員の平均値であり、
          グループ全体や契約社員等を含まない場合があります。
        </p>
      </div>
    </div>
  );
}
