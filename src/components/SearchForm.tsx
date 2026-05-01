"use client";

import Link from "next/link";
import { useState } from "react";
import type { CompanySalary } from "@/data/mock";

export function SearchForm({ companies }: { companies: CompanySalary[] }) {
  const [query, setQuery] = useState("");

  const filtered = query.length >= 1
    ? companies.filter((c) =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.industry.toLowerCase().includes(query.toLowerCase()) ||
        c.code.includes(query)
      )
    : [];

  return (
    <div className="space-y-6">
      {/* 検索バー */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="企業名・業種・証券コードで検索..."
          className="w-full h-14 rounded-2xl glass px-5 pl-12 text-base outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition placeholder:text-[var(--color-text-muted)]"
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
            {filtered.length}件
          </span>
        )}
      </div>

      {/* 結果一覧 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((company) => (
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
        ))}
      </div>

      {query.length === 0 && (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">🔍</p>
          <p className="text-lg font-medium text-[var(--color-text-primary)] mb-2">
            企業名・業種・証券コードで検索
          </p>
          <p className="text-sm text-[var(--color-text-muted)]">
            全{companies.length.toLocaleString()}社のデータから絞り込めます
          </p>
        </div>
      )}

      {query.length >= 1 && filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-lg text-[var(--color-text-muted)]">
            「{query}」に一致する企業が見つかりませんでした
          </p>
        </div>
      )}
    </div>
  );
}
