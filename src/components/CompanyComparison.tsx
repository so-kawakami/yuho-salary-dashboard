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
  Legend,
  LineChart,
  Line,
} from "recharts";
import { calcSalaryPercentile } from "@/data/mock";

interface CompanyData {
  company: {
    name: string;
    secCode: string | null;
    industry: string | null;
    edinetCode: string;
  };
  salaryHistory: {
    fiscalYear: string;
    avgSalary: number | null;
    employees: number | null;
    avgAge: number | null;
    avgTenure: number | null;
  }[];
}

const COLOR1 = "#1e56a0";
const COLOR2 = "#6b93c4";

export function CompanyComparison({
  data1,
  data2,
  stats,
}: {
  data1: CompanyData;
  data2: CompanyData;
  stats?: { salaryMean?: number; salaryStddev?: number };
}) {
  const latest1 = data1.salaryHistory[data1.salaryHistory.length - 1];
  const latest2 = data2.salaryHistory[data2.salaryHistory.length - 1];
  const s1 = latest1?.avgSalary ? Math.round(latest1.avgSalary / 10000) : 0;
  const s2 = latest2?.avgSalary ? Math.round(latest2.avgSalary / 10000) : 0;
  const p1 = calcSalaryPercentile(s1, stats?.salaryMean, stats?.salaryStddev);
  const p2 = calcSalaryPercentile(s2, stats?.salaryMean, stats?.salaryStddev);
  const name1 = data1.company.name;
  const name2 = data2.company.name;

  // 比較項目データ
  const compareItems = [
    { label: "平均年収", v1: s1 > 0 ? `${s1.toLocaleString()}万円` : "-", v2: s2 > 0 ? `${s2.toLocaleString()}万円` : "-", n1: s1, n2: s2, unit: "万円" },
    { label: "従業員数", v1: latest1?.employees ? `${latest1.employees.toLocaleString()}名` : "-", v2: latest2?.employees ? `${latest2.employees.toLocaleString()}名` : "-", n1: latest1?.employees ?? 0, n2: latest2?.employees ?? 0, unit: "名" },
    { label: "平均年齢", v1: latest1?.avgAge ? `${latest1.avgAge}歳` : "-", v2: latest2?.avgAge ? `${latest2.avgAge}歳` : "-", n1: latest1?.avgAge ?? 0, n2: latest2?.avgAge ?? 0, unit: "歳" },
    { label: "平均勤続年数", v1: latest1?.avgTenure ? `${latest1.avgTenure}年` : "-", v2: latest2?.avgTenure ? `${latest2.avgTenure}年` : "-", n1: latest1?.avgTenure ?? 0, n2: latest2?.avgTenure ?? 0, unit: "年" },
    { label: "偏差値", v1: s1 > 0 ? `${p1.deviation}` : "-", v2: s2 > 0 ? `${p2.deviation}` : "-", n1: p1.deviation, n2: p2.deviation, unit: "" },
  ];

  // 年収バーチャート
  const barData = compareItems.slice(0, 4).map((item) => ({
    label: item.label,
    [name1]: item.n1,
    [name2]: item.n2,
  }));

  // 年収推移を重ね合わせ
  const trend1 = data1.salaryHistory.filter((s) => s.avgSalary).map((s) => ({ year: s.fiscalYear, salary: Math.round(s.avgSalary! / 10000) }));
  const trend2 = data2.salaryHistory.filter((s) => s.avgSalary).map((s) => ({ year: s.fiscalYear, salary: Math.round(s.avgSalary! / 10000) }));

  const allYears = [...new Set([...trend1.map((t) => t.year), ...trend2.map((t) => t.year)])].sort();
  const trendData = allYears.map((year) => ({
    year,
    [name1]: trend1.find((t) => t.year === year)?.salary ?? null,
    [name2]: trend2.find((t) => t.year === year)?.salary ?? null,
  }));

  const allSalaries = [...trend1.map((t) => t.salary), ...trend2.map((t) => t.salary)];
  const minSalary = allSalaries.length > 0 ? Math.floor(Math.min(...allSalaries) * 0.88 / 100) * 100 : 0;
  const maxSalary = allSalaries.length > 0 ? Math.ceil(Math.max(...allSalaries) * 1.06 / 100) * 100 : 1000;

  // 年収差
  const diff = s1 - s2;

  return (
    <div className="space-y-6">
      {/* ヘッダー: VS */}
      <div className="glass rounded-2xl p-6 sm:p-8">
        <h1 className="text-lg sm:text-xl font-extrabold text-[var(--color-text-primary)] text-center mb-6">
          企業年収比較
        </h1>
        <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
          {/* 企業1 */}
          <Link href={`/company/${data1.company.secCode ?? ""}`} className="text-center group">
            {data1.company.industry && (
              <p className="text-xs text-[var(--color-text-muted)] mb-1">{data1.company.industry}</p>
            )}
            <p className="text-base sm:text-lg font-bold text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)] transition-colors">
              {name1}
            </p>
            {s1 > 0 && (
              <p className="text-2xl sm:text-3xl font-extrabold mt-2" style={{ color: COLOR1 }}>
                {s1.toLocaleString()}<span className="text-sm font-normal text-[var(--color-text-secondary)]"> 万円</span>
              </p>
            )}
          </Link>

          {/* VS */}
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white font-black text-sm">
              VS
            </div>
            {s1 > 0 && s2 > 0 && (
              <p className="text-xs text-[var(--color-text-muted)] mt-2">
                差額 {Math.abs(diff).toLocaleString()}万円
              </p>
            )}
          </div>

          {/* 企業2 */}
          <Link href={`/company/${data2.company.secCode ?? ""}`} className="text-center group">
            {data2.company.industry && (
              <p className="text-xs text-[var(--color-text-muted)] mb-1">{data2.company.industry}</p>
            )}
            <p className="text-base sm:text-lg font-bold text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)] transition-colors">
              {name2}
            </p>
            {s2 > 0 && (
              <p className="text-2xl sm:text-3xl font-extrabold mt-2" style={{ color: COLOR2 }}>
                {s2.toLocaleString()}<span className="text-sm font-normal text-[var(--color-text-secondary)]"> 万円</span>
              </p>
            )}
          </Link>
        </div>
      </div>

      {/* 比較テーブル */}
      <div className="glass rounded-2xl p-6">
        <h2 className="text-base font-bold text-[var(--color-text-primary)] mb-4">
          項目別比較
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                <th className="text-left py-3 px-2 text-[var(--color-text-muted)] font-medium">項目</th>
                <th className="text-right py-3 px-2 font-bold" style={{ color: COLOR1 }}>{name1}</th>
                <th className="text-right py-3 px-2 font-bold" style={{ color: COLOR2 }}>{name2}</th>
                <th className="text-right py-3 px-2 text-[var(--color-text-muted)] font-medium">差</th>
              </tr>
            </thead>
            <tbody>
              {compareItems.map((item) => {
                const d = item.n1 - item.n2;
                const showDiff = item.n1 > 0 && item.n2 > 0;
                return (
                  <tr key={item.label} className="border-b border-[var(--color-border)]/50">
                    <td className="py-3 px-2 text-[var(--color-text-secondary)]">{item.label}</td>
                    <td className={`py-3 px-2 text-right font-bold ${showDiff && d > 0 ? "text-[var(--color-primary)]" : "text-[var(--color-text-primary)]"}`}>
                      {item.v1}
                    </td>
                    <td className={`py-3 px-2 text-right font-bold ${showDiff && d < 0 ? "text-[var(--color-primary)]" : "text-[var(--color-text-primary)]"}`}>
                      {item.v2}
                    </td>
                    <td className="py-3 px-2 text-right text-[var(--color-text-muted)]">
                      {showDiff ? (
                        <span className={d > 0 ? "text-[var(--color-success)]" : d < 0 ? "text-[var(--color-danger)]" : ""}>
                          {d > 0 ? "+" : ""}{item.label === "平均年齢" || item.label === "平均勤続年数" ? d.toFixed(1) : d.toLocaleString()}{item.unit}
                        </span>
                      ) : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 年収推移グラフ */}
      {trendData.length > 0 && (
        <div className="glass rounded-2xl p-6">
          <h2 className="text-base font-bold text-[var(--color-text-primary)] mb-1">
            平均年収の推移
          </h2>
          <p className="text-xs text-[var(--color-text-muted)] mb-4">万円</p>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 5, right: 30, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#edf1f5" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis
                  domain={[minSalary, maxSalary]}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `${v}万`}
                />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any) => value != null ? [`${Number(value).toLocaleString()}万円`] : ["-"]}
                />
                <Legend />
                <Line type="monotone" dataKey={name1} stroke={COLOR1} strokeWidth={3} dot={{ fill: COLOR1, r: 4 }} connectNulls />
                <Line type="monotone" dataKey={name2} stroke={COLOR2} strokeWidth={3} dot={{ fill: COLOR2, r: 4 }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 各企業の詳細リンク */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href={`/company/${data1.company.secCode ?? ""}`}
          className="glass rounded-xl p-5 glass-hover block text-center"
        >
          <p className="text-sm font-bold text-[var(--color-text-primary)] mb-1">{name1}の詳細</p>
          <p className="text-xs text-[var(--color-primary)]">企業ページを見る →</p>
        </Link>
        <Link
          href={`/company/${data2.company.secCode ?? ""}`}
          className="glass rounded-xl p-5 glass-hover block text-center"
        >
          <p className="text-sm font-bold text-[var(--color-text-primary)] mb-1">{name2}の詳細</p>
          <p className="text-xs text-[var(--color-primary)]">企業ページを見る →</p>
        </Link>
      </div>
    </div>
  );
}
