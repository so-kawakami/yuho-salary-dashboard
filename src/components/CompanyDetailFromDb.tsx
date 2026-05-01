"use client";

import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
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

interface Peer {
  code: string;
  name: string;
  salary: number;
  employees: number;
}

export function CompanyDetailFromDb({
  company,
  salaryHistory,
  peers = [],
}: {
  company: Company;
  salaryHistory: SalaryRecord[];
  peers?: Peer[];
}) {
  const latest = salaryHistory[salaryHistory.length - 1];
  const prev = salaryHistory[salaryHistory.length - 2];
  const salaryMan = latest?.avgSalary ? Math.round(latest.avgSalary / 10000) : 0;
  const prevSalaryMan = prev?.avgSalary ? Math.round(prev.avgSalary / 10000) : null;
  const change = prevSalaryMan ? salaryMan - prevSalaryMan : null;
  const percentile = calcSalaryPercentile(salaryMan);

  const trend = salaryHistory
    .filter((s) => s.avgSalary)
    .map((s) => ({
      year: s.fiscalYear,
      salary: Math.round(s.avgSalary! / 10000),
    }));

  // 業界平均（peersと自社の平均）
  const industryAvg =
    peers.length > 0
      ? Math.round(
          (peers.reduce((s, p) => s + p.salary, 0) + salaryMan) /
            (peers.length + 1)
        )
      : null;

  // KPI カード定義
  const kpis = [
    {
      label: "平均年収",
      value: salaryMan > 0 ? `${salaryMan.toLocaleString()}万円` : "-",
      sub: change !== null
        ? `前年比 ${change >= 0 ? "+" : ""}${change}万円`
        : "有価証券報告書より",
      subColor: change === null ? "muted" : change >= 0 ? "success" : "danger",
      icon: "💰",
    },
    {
      label: "従業員数",
      value: latest?.employees ? `${latest.employees.toLocaleString()}名` : "-",
      sub: "単体（正社員）",
      subColor: "muted",
      icon: "👥",
    },
    {
      label: "平均年齢",
      value: latest?.avgAge ? `${latest.avgAge}歳` : "-",
      sub: "全従業員平均",
      subColor: "muted",
      icon: "🎂",
    },
    {
      label: "平均勤続年数",
      value: latest?.avgTenure ? `${latest.avgTenure}年` : "-",
      sub: "全従業員平均",
      subColor: "muted",
      icon: "📅",
    },
  ];

  const subColorClass: Record<string, string> = {
    muted: "text-[var(--color-text-muted)]",
    success: "text-[var(--color-success)] font-semibold",
    danger: "text-[var(--color-danger)] font-semibold",
  };

  return (
    <div className="space-y-6">
      {/* 企業ヘッダー */}
      <div className="glass rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {company.industry && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] font-medium">
                  {company.industry}
                </span>
              )}
              {company.secCode && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--color-surface-secondary)] text-[var(--color-text-muted)]">
                  証券コード: {company.secCode}
                </span>
              )}
              {latest?.fiscalYear && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--color-surface-secondary)] text-[var(--color-text-muted)]">
                  {latest.fiscalYear}期
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text-primary)]">
              {company.name}
            </h1>
          </div>

          {salaryMan > 0 && (
            <div className="text-right">
              <p className="text-xs text-[var(--color-text-muted)] mb-1">平均年収</p>
              <div className="flex items-baseline gap-1 justify-end">
                <span className="text-4xl sm:text-5xl font-extrabold text-gradient">
                  {salaryMan.toLocaleString()}
                </span>
                <span className="text-lg text-[var(--color-text-secondary)]">万円</span>
              </div>
              {change !== null && (
                <p className={`text-sm mt-1 ${change >= 0 ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"}`}>
                  前年比 {change >= 0 ? "+" : ""}{change}万円
                </p>
              )}
            </div>
          )}
        </div>

        {/* 上場企業内ポジション */}
        {salaryMan > 0 && (
          <div className="mt-5 rounded-xl bg-[var(--color-surface-secondary)] p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[var(--color-text-secondary)]">
                上場企業 {rankLabel(percentile.deviation)} の年収水準
              </span>
              <div className="flex items-center gap-3">
                {industryAvg && (
                  <span className="text-xs text-[var(--color-text-muted)]">
                    業界平均 {industryAvg}万円
                  </span>
                )}
                <span className="text-sm font-bold text-[var(--color-primary)]">
                  上位 {100 - percentile.percentile}% / 偏差値 {percentile.deviation}
                </span>
              </div>
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

      {/* KPI カード */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="glass rounded-xl p-4 glass-hover">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{kpi.icon}</span>
              <p className="text-xs text-[var(--color-text-secondary)]">{kpi.label}</p>
            </div>
            <p className="text-xl font-bold text-[var(--color-text-primary)]">{kpi.value}</p>
            <p className={`text-xs mt-1 ${subColorClass[kpi.subColor]}`}>{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* 年収推移グラフ + 同業他社比較 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 推移グラフ */}
        <div className="glass rounded-2xl p-6 lg:col-span-2">
          <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-1">
            平均年収の推移
          </h2>
          <p className="text-sm text-[var(--color-text-muted)] mb-4">万円</p>
          {trend.length > 0 ? (
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis
                    domain={[
                      Math.floor((Math.min(...trend.map((t) => t.salary)) * 0.88) / 100) * 100,
                      Math.ceil((Math.max(...trend.map((t) => t.salary)) * 1.06) / 100) * 100,
                    ]}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `${v}万`}
                  />
                  <Tooltip
                    formatter={(value) => [`${value}万円`, "平均年収"]}
                    contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
                  />
                  {industryAvg && (
                    <ReferenceLine
                      y={industryAvg}
                      stroke="#9ca3af"
                      strokeDasharray="4 4"
                      label={{ value: "業界平均", position: "right", fontSize: 10, fill: "#9ca3af" }}
                    />
                  )}
                  <Bar dataKey="salary" radius={[6, 6, 0, 0]} barSize={36} fill="url(#grad)">
                    <defs>
                      <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#1a56db" />
                        <stop offset="100%" stopColor="#7c3aed" />
                      </linearGradient>
                    </defs>
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-[var(--color-text-muted)] text-sm py-12 text-center">
              推移データがありません
            </p>
          )}
        </div>

        {/* 同業他社比較 */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-1">
            同業他社と比較
          </h2>
          <p className="text-sm text-[var(--color-text-muted)] mb-4">
            {company.industry || "同業界"} の年収ランキング
          </p>
          {peers.length > 0 ? (
            <div className="space-y-3">
              {/* 自社 */}
              <div className="rounded-xl bg-[var(--color-primary-light)] border border-[var(--color-primary)]/20 p-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-[var(--color-primary)] truncate mr-2">
                    {company.name}
                  </span>
                  <span className="text-sm font-bold text-[var(--color-primary)] shrink-0">
                    {salaryMan}万円
                  </span>
                </div>
              </div>
              {/* 競合各社 */}
              {peers.map((peer) => (
                <Link
                  key={peer.code}
                  href={`/company/${peer.code}`}
                  className="block rounded-xl bg-[var(--color-surface-secondary)] hover:bg-[var(--color-primary-light)] p-3 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[var(--color-text-primary)] truncate mr-2">
                      {peer.name}
                    </span>
                    <span className="text-sm font-medium text-[var(--color-text-primary)] shrink-0">
                      {peer.salary}万円
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-white/60 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--color-text-muted)]"
                      style={{ width: `${Math.min((peer.salary / salaryMan) * 100, 100)}%` }}
                    />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--color-text-muted)] py-8 text-center">
              同業他社データがありません
            </p>
          )}
        </div>
      </div>

      {/* データ注釈 */}
      <div className="glass rounded-2xl p-5">
        <h2 className="text-sm font-bold text-[var(--color-text-primary)] mb-1">
          データについて
        </h2>
        <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
          このページのデータは{company.name}が金融庁EDINETに提出した有価証券報告書に基づいています。
          「平均年間給与」は提出会社単体の正社員の平均値であり、グループ全体や契約社員を含まない場合があります。
          詳細は
          <a
            href="https://disclosure.edinet-fsa.go.jp/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-primary)] hover:underline mx-1"
          >
            EDINET
          </a>
          でご確認ください。
        </p>
      </div>
    </div>
  );
}

function rankLabel(deviation: number): string {
  if (deviation >= 70) return "トップクラス";
  if (deviation >= 60) return "かなり高い";
  if (deviation >= 55) return "やや高い";
  if (deviation >= 45) return "平均的";
  if (deviation >= 40) return "やや低い";
  return "低め";
}
