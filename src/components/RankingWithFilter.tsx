"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

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

const SIZE_OPTIONS = [
  { key: "all", label: "すべての規模", min: 0, max: Infinity },
  { key: "large", label: "1,000名以上", min: 1000, max: Infinity },
  { key: "mid", label: "300〜999名", min: 300, max: 999 },
  { key: "small", label: "300名未満", min: 0, max: 299 },
];

const PAGE_SIZE = 100;
const INDUSTRY_PREVIEW = 6;

function pillClass(active: boolean): string {
  return active
    ? "bg-[var(--color-primary)] text-white font-bold px-4 py-[7px] rounded-full text-sm"
    : "bg-white border border-[var(--color-border-input)] text-[var(--color-text-body)] px-4 py-[7px] rounded-full text-sm hover:bg-[var(--color-surface-section)] transition-colors";
}

export function RankingWithFilter({ data }: { data: RankingRow[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [industryFilter, setIndustryFilter] = useState(
    searchParams.get("industry") ?? "すべて"
  );
  const [sizeKey, setSizeKey] = useState(searchParams.get("size") ?? "all");
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [industryExpanded, setIndustryExpanded] = useState(false);

  // 社数の多い順に業界チップを並べる
  const industries = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of data) {
      if (r.industry) counts.set(r.industry, (counts.get(r.industry) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name);
  }, [data]);

  const visibleIndustries = industryExpanded
    ? industries
    : industries.slice(0, INDUSTRY_PREVIEW);

  // フィルタ状態をURLクエリに反映（SEOページ化・シェア対応）
  const updateUrl = (industry: string, size: string) => {
    const params = new URLSearchParams();
    if (industry !== "すべて") params.set("industry", industry);
    if (size !== "all") params.set("size", size);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const selectIndustry = (industry: string) => {
    setIndustryFilter(industry);
    setLimit(PAGE_SIZE);
    updateUrl(industry, sizeKey);
  };

  const selectSize = (key: string) => {
    setSizeKey(key);
    setLimit(PAGE_SIZE);
    updateUrl(industryFilter, key);
  };

  const { displayed, totalFiltered, maxSalary } = useMemo(() => {
    const size = SIZE_OPTIONS.find((o) => o.key === sizeKey) ?? SIZE_OPTIONS[0];
    const afterFilter = data.filter((r) => {
      if (industryFilter !== "すべて" && r.industry !== industryFilter) return false;
      if (r.employees > 0 && (r.employees < size.min || r.employees > size.max)) return false;
      if (query && !r.name.includes(query) && !r.industry.includes(query)) return false;
      return true;
    });
    return {
      totalFiltered: afterFilter.length,
      maxSalary: afterFilter[0]?.salary ?? 1,
      displayed: afterFilter
        .slice(0, limit)
        .map((r, i) => ({ ...r, displayRank: i + 1 })),
    };
  }, [data, industryFilter, sizeKey, query, limit]);

  return (
    <div>
      {/* フィルタ: ピル型チップ */}
      <div className="flex gap-2 flex-wrap items-center">
        <button onClick={() => selectIndustry("すべて")} className={pillClass(industryFilter === "すべて")}>
          すべての業界
        </button>
        {visibleIndustries.map((ind) => (
          <button key={ind} onClick={() => selectIndustry(ind)} className={pillClass(industryFilter === ind)}>
            {ind}
          </button>
        ))}
        {!industryExpanded && industries.length > INDUSTRY_PREVIEW && (
          <button
            onClick={() => setIndustryExpanded(true)}
            className="text-sm font-bold text-[var(--color-primary)] px-1.5 py-[7px]"
          >
            + {industries.length - INDUSTRY_PREVIEW}業界
          </button>
        )}
      </div>
      <div className="flex gap-2 flex-wrap items-center mt-3">
        {SIZE_OPTIONS.map((opt) => (
          <button key={opt.key} onClick={() => selectSize(opt.key)} className={pillClass(sizeKey === opt.key)}>
            {opt.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setLimit(PAGE_SIZE);
            }}
            placeholder="企業名で絞り込み"
            className="h-9 w-44 bg-white border-[1.5px] border-[var(--color-border-input)] rounded-xl px-3.5 text-sm outline-none focus:border-[var(--color-primary)] transition-colors placeholder:text-[var(--color-text-faint)]"
          />
          <span className="text-sm text-[var(--color-text-faint)] whitespace-nowrap">
            {totalFiltered.toLocaleString()}社
          </span>
        </div>
      </div>

      {/* テーブル（白カード・行内バー） */}
      <div className="bg-white border border-[var(--color-border)] rounded-2xl px-5 sm:px-8 py-3 mt-6">
        {/* ヘッダー行（デスクトップのみ） */}
        <div className="hidden md:grid grid-cols-[44px_minmax(0,1fr)_120px_minmax(120px,320px)_100px] gap-4 py-3.5 border-b border-[var(--color-border-subtle)] text-[12.5px] text-[var(--color-text-faint)] tracking-[0.06em]">
          <span>順位</span>
          <span>企業名</span>
          <span>業界</span>
          <span></span>
          <span className="text-right">平均年収</span>
        </div>

        {displayed.map((company) => {
          const top3 = company.displayRank <= 3;
          const barColor =
            company.displayRank === 1
              ? "#1e56a0"
              : company.displayRank <= 3
                ? "#6b93c4"
                : "#a3bedd";
          const barWidth = `${Math.max(2, (company.salary / maxSalary) * 100)}%`;
          return (
            <Link
              key={company.code}
              href={`/company/${company.code}`}
              className="group block border-b border-[var(--color-border-subtle)] last:border-b-0 hover:bg-[var(--color-surface-section)] transition-colors -mx-2 px-2"
            >
              {/* デスクトップ行 */}
              <div className="hidden md:grid grid-cols-[44px_minmax(0,1fr)_120px_minmax(120px,320px)_100px] gap-4 py-[15px] items-center">
                <span className={`text-[15px] font-bold ${top3 ? "text-[var(--color-primary)]" : "text-[var(--color-text-faint)]"}`}>
                  {company.displayRank}
                </span>
                <span className={`text-[15px] truncate group-hover:text-[var(--color-primary)] transition-colors ${top3 ? "font-bold" : "font-medium"}`}>
                  {company.name}
                </span>
                <span className="text-[13.5px] text-[var(--color-text-faint)] truncate">
                  {company.industry || "-"}
                </span>
                <div className="h-3.5 bg-[var(--color-border-subtle)] rounded-full">
                  <div
                    className="h-full rounded-full"
                    style={{ width: barWidth, background: barColor }}
                  />
                </div>
                <span className="text-[15.5px] font-bold text-right">
                  {company.salary.toLocaleString()}万
                </span>
              </div>
              {/* モバイル行: 順位 / 社名+細バー / 年収 */}
              <div className="flex md:hidden items-center gap-3 py-[13px] min-h-11">
                <span className={`w-6 text-[15px] font-bold shrink-0 ${top3 ? "text-[var(--color-primary)]" : "text-[var(--color-text-faint)]"}`}>
                  {company.displayRank}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-[15px] truncate ${top3 ? "font-bold" : "font-medium"}`}>
                    {company.name}
                  </p>
                  <div className="h-1.5 bg-[var(--color-border-subtle)] rounded-[3px] mt-1.5">
                    <div
                      className="h-full rounded-[3px]"
                      style={{ width: barWidth, background: barColor }}
                    />
                  </div>
                </div>
                <span className="text-[15px] font-bold shrink-0">
                  {company.salary.toLocaleString()}万
                </span>
              </div>
            </Link>
          );
        })}

        {displayed.length === 0 && (
          <p className="px-4 py-12 text-center text-[var(--color-text-faint)]">
            条件に一致する企業がありません
          </p>
        )}
      </div>

      {/* さらに表示（アウトラインピル） */}
      {totalFiltered > limit && (
        <div className="mt-6 text-center">
          <button
            onClick={() => setLimit((l) => l + PAGE_SIZE)}
            className="inline-block bg-white border-[1.5px] border-[var(--color-primary)] text-[var(--color-primary)] rounded-full px-10 py-[13px] text-[15px] font-bold hover:bg-[var(--color-primary-tint)] transition-colors"
          >
            さらに表示
          </button>
          <p className="text-[13px] text-[var(--color-text-faint)] mt-2">
            {Math.min(limit, totalFiltered).toLocaleString()} / {totalFiltered.toLocaleString()}社
          </p>
        </div>
      )}
    </div>
  );
}
