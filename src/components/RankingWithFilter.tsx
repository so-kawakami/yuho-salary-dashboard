"use client";

import Link from "next/link";
import { useState, useMemo } from "react";

interface RankingRow {
  rank: number;
  code: string;
  name: string;
  industry: string;
  salary: number;
  employees: number;
  avgAge: number;
  avgTenure: number;
}

type SortKey = "salary" | "employees" | "avgAge" | "avgTenure";

const SIZE_OPTIONS = [
  { label: "すべて", min: 0, max: Infinity },
  { label: "大企業 (1,000名+)", min: 1000, max: Infinity },
  { label: "中堅 (300〜999名)", min: 300, max: 999 },
  { label: "中小 (300名未満)", min: 0, max: 299 },
];

export function RankingWithFilter({ data }: { data: RankingRow[] }) {
  const [industryFilter, setIndustryFilter] = useState("すべて");
  const [sizeFilter, setSizeFilter] = useState(0);
  const [sortKey, setSortKey] = useState<SortKey>("salary");
  const [query, setQuery] = useState("");

  const industries = useMemo(() => {
    const set = new Set(data.map((r) => r.industry).filter(Boolean));
    return ["すべて", ...Array.from(set).sort()];
  }, [data]);

  const { displayed, totalFiltered } = useMemo(() => {
    const size = SIZE_OPTIONS[sizeFilter];
    const afterFilter = data
      .filter((r) => {
        if (industryFilter !== "すべて" && r.industry !== industryFilter) return false;
        if (r.employees > 0 && (r.employees < size.min || r.employees > size.max)) return false;
        if (query && !r.name.includes(query) && !r.industry.includes(query)) return false;
        return true;
      })
      .sort((a, b) => (b[sortKey] ?? 0) - (a[sortKey] ?? 0));
    return {
      totalFiltered: afterFilter.length,
      displayed: afterFilter.slice(0, 200).map((r, i) => ({ ...r, displayRank: i + 1 })),
    };
  }, [data, industryFilter, sizeFilter, sortKey, query]);

  const sortCols: { key: SortKey; label: string }[] = [
    { key: "salary", label: "年収" },
    { key: "employees", label: "従業員数" },
    { key: "avgAge", label: "平均年齢" },
    { key: "avgTenure", label: "勤続年数" },
  ];

  return (
    <div className="space-y-4">
      {/* フィルター行 */}
      <div className="glass rounded-xl p-4 flex flex-wrap gap-3 items-center">
        {/* フリーワード */}
        <div className="relative flex-1 min-w-40">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="企業名・業種で絞り込み"
            className="w-full h-9 rounded-lg bg-white/60 border border-[var(--color-border)] px-3 pl-8 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition"
          />
          <svg className="absolute left-2.5 top-2.5 h-4 w-4 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* 業界フィルター */}
        <select
          value={industryFilter}
          onChange={(e) => setIndustryFilter(e.target.value)}
          className="h-9 rounded-lg bg-white/60 border border-[var(--color-border)] px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition"
        >
          {industries.map((ind) => (
            <option key={ind} value={ind}>{ind}</option>
          ))}
        </select>

        {/* 規模フィルター */}
        <select
          value={sizeFilter}
          onChange={(e) => setSizeFilter(Number(e.target.value))}
          className="h-9 rounded-lg bg-white/60 border border-[var(--color-border)] px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition"
        >
          {SIZE_OPTIONS.map((opt, i) => (
            <option key={i} value={i}>{opt.label}</option>
          ))}
        </select>

        {/* ソート */}
        <div className="flex rounded-lg overflow-hidden border border-[var(--color-border)] bg-white/60">
          {sortCols.map((col) => (
            <button
              key={col.key}
              onClick={() => setSortKey(col.key)}
              className={`px-3 py-1.5 text-xs font-medium transition ${
                sortKey === col.key
                  ? "bg-[var(--color-primary)] text-white"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-light)]"
              }`}
            >
              {col.label}
            </button>
          ))}
        </div>

        <span className="text-sm text-[var(--color-text-muted)] ml-auto">
          {totalFiltered > 200
            ? `${totalFiltered.toLocaleString()}社中 上位200社`
            : `${totalFiltered}社`}
        </span>
      </div>

      {/* テーブル */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)]">
                <th className="px-4 py-3 text-left font-medium w-10">#</th>
                <th className="px-4 py-3 text-left font-medium">企業名</th>
                <th className="px-4 py-3 text-left font-medium hidden md:table-cell">業種</th>
                <th className="px-4 py-3 text-right font-medium">平均年収</th>
                <th className="px-4 py-3 text-right font-medium hidden sm:table-cell">従業員</th>
                <th className="px-4 py-3 text-right font-medium hidden lg:table-cell">平均年齢</th>
                <th className="px-4 py-3 text-right font-medium hidden lg:table-cell">勤続年数</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((company) => (
                <tr
                  key={company.code}
                  className="border-t border-[var(--color-border)] hover:bg-[var(--color-primary-light)] transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${
                      company.displayRank <= 3 ? "bg-[var(--color-primary)]" : "bg-[var(--color-text-muted)]"
                    }`}>
                      {company.displayRank}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/company/${company.code}`} className="hover:text-[var(--color-primary)] transition-colors">
                      {company.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text-secondary)] hidden md:table-cell">
                    {company.industry || "-"}
                  </td>
                  <td className="px-4 py-3 text-right font-bold">
                    {company.salary.toLocaleString()}
                    <span className="text-xs font-normal text-[var(--color-text-muted)]"> 万円</span>
                  </td>
                  <td className="px-4 py-3 text-right text-[var(--color-text-secondary)] hidden sm:table-cell">
                    {company.employees ? `${company.employees.toLocaleString()}名` : "-"}
                  </td>
                  <td className="px-4 py-3 text-right text-[var(--color-text-secondary)] hidden lg:table-cell">
                    {company.avgAge ? `${company.avgAge}歳` : "-"}
                  </td>
                  <td className="px-4 py-3 text-right text-[var(--color-text-secondary)] hidden lg:table-cell">
                    {company.avgTenure ? `${company.avgTenure}年` : "-"}
                  </td>
                </tr>
              ))}
              {displayed.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-[var(--color-text-muted)]">
                    条件に一致する企業がありません
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
