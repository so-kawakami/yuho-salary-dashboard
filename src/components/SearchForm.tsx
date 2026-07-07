"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import type { CompanySalary } from "@/data/mock";

// 全角→半角に変換（英数字・記号）
function normalize(str: string): string {
  return str
    .normalize("NFKC")
    .toLowerCase();
}

const DISPLAY_STEP = 30;

export function SearchForm({ companies }: { companies: CompanySalary[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [displayCount, setDisplayCount] = useState(DISPLAY_STEP);

  const normalizedQuery = normalize(query);

  const filtered = useMemo(() => {
    if (query.length < 1) return [];
    return companies
      .filter((c) =>
        normalize(c.name).includes(normalizedQuery) ||
        normalize(c.industry).includes(normalizedQuery) ||
        normalize(c.code).includes(normalizedQuery)
      )
      .sort((a, b) => b.salary - a.salary);
  }, [companies, query, normalizedQuery]);

  const displayed = filtered.slice(0, displayCount);

  // 検索ボックスが空のときに見せる人気企業（年収上位）
  const popular = useMemo(
    () => [...companies].sort((a, b) => b.salary - a.salary).slice(0, 12),
    [companies]
  );

  const handleChange = (value: string) => {
    setQuery(value);
    setDisplayCount(DISPLAY_STEP);
    // URLにクエリを反映（シェア・ブラウザバック対応）
    const params = new URLSearchParams();
    if (value) params.set("q", value);
    router.replace(value ? `${pathname}?${params}` : pathname, { scroll: false });
  };

  const renderCard = (company: CompanySalary) => (
    <Link
      key={company.code}
      href={`/company/${company.code}`}
      className="glass rounded-xl p-5 glass-hover block"
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-base font-bold text-[var(--color-text-primary)]">
          {company.name}
        </h3>
        <span className="text-xs text-[var(--color-text-muted)] shrink-0 ml-2">
          {company.code}
        </span>
      </div>
      {company.industry && (
        <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] font-medium">
          {company.industry}
        </span>
      )}
      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-2xl font-bold text-[var(--color-text-primary)]">
          {company.salary.toLocaleString()}
        </span>
        <span className="text-sm text-[var(--color-text-muted)]">
          万円
        </span>
      </div>
      {company.employees > 0 && (
        <p className="text-xs text-[var(--color-text-muted)] mt-1">
          従業員 {company.employees.toLocaleString()}名
        </p>
      )}
    </Link>
  );

  return (
    <div className="space-y-6">
      {/* 検索バー */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="企業名・業種・証券コードで検索..."
          autoFocus
          className="w-full h-14 rounded-xl bg-white border-[1.5px] border-[var(--color-border-input)] px-5 pl-12 text-base outline-none focus:border-[var(--color-primary)] transition-colors placeholder:text-[var(--color-text-faint)]"
        />
        <svg
          className="absolute left-4 top-4 h-5 w-5 text-[var(--color-text-muted)]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        {query && (
          <span className="absolute right-4 top-4 text-sm text-[var(--color-text-muted)]">
            {filtered.length.toLocaleString()}件
          </span>
        )}
      </div>

      {/* 結果一覧 */}
      {query.length >= 1 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayed.map(renderCard)}
          </div>
          {filtered.length > displayCount && (
            <div className="text-center">
              <button
                onClick={() => setDisplayCount((c) => c + DISPLAY_STEP * 2)}
                className="px-10 py-[13px] rounded-full bg-white border-[1.5px] border-[var(--color-primary)] text-[15px] font-bold text-[var(--color-primary)] hover:bg-[var(--color-primary-tint)] transition-colors"
              >
                さらに表示（残り{(filtered.length - displayCount).toLocaleString()}件）
              </button>
            </div>
          )}
        </>
      )}

      {query.length === 0 && (
        <div className="space-y-4">
          <div className="text-center py-8">
            <p className="text-lg font-bold text-[var(--color-text)] mb-2">
              企業名・業種・証券コードで検索
            </p>
            <p className="text-sm text-[var(--color-text-muted)]">
              全{companies.length.toLocaleString()}社のデータから絞り込めます
            </p>
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--color-text-primary)] mb-3">
              年収が高い注目企業
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {popular.map(renderCard)}
            </div>
          </div>
        </div>
      )}

      {query.length >= 1 && filtered.length === 0 && (
        <div className="text-center py-12 space-y-3">
          <p className="text-lg text-[var(--color-text-muted)]">
            「{query}」に一致する企業が見つかりませんでした
          </p>
          <p className="text-sm text-[var(--color-text-muted)]">
            ヒント：正式社名の一部（例：「トヨタ」「ソニー」）や業種名（例：「銀行」）で検索してみてください
          </p>
          <Link href="/ranking" className="inline-block text-sm text-[var(--color-primary)] hover:underline">
            年収ランキングから探す →
          </Link>
        </div>
      )}
    </div>
  );
}
