"use client";

import Link from "next/link";
import { spotlightCompanies } from "@/data/mock";

const tagStyles = {
  up: "bg-[var(--color-success-light)] text-[var(--color-success)]",
  down: "bg-red-50 text-[var(--color-danger)]",
  new: "bg-[var(--color-accent-light)] text-[var(--color-accent)]",
};

export function SpotlightCards() {
  return (
    <div>
      <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-1">
        注目企業
      </h2>
      <p className="text-sm text-[var(--color-text-muted)] mb-4">
        年収の変動が大きかった企業をピックアップ
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {spotlightCompanies.map((company) => (
          <Link
            key={company.code}
            href={`/company/${company.code}`}
            className="glass rounded-xl p-5 glass-hover block"
          >
            <div className="flex items-start justify-between mb-3">
              <span
                className={`text-xs font-medium px-2.5 py-1 rounded-full ${tagStyles[company.tag]}`}
              >
                {company.tagLabel}
              </span>
              <span className="text-xs text-[var(--color-text-muted)]">
                {company.industry}
              </span>
            </div>
            <h3 className="text-base font-bold text-[var(--color-text-primary)] mb-2">
              {company.name}
            </h3>
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-2xl font-bold text-[var(--color-text-primary)]">
                  {company.salary.toLocaleString()}
                </span>
                <span className="text-sm text-[var(--color-text-muted)] ml-1">
                  万円
                </span>
              </div>
              <span
                className={`text-sm font-bold ${
                  company.change >= 0
                    ? "text-[var(--color-success)]"
                    : "text-[var(--color-danger)]"
                }`}
              >
                {company.change >= 0 ? "+" : ""}
                {company.change}万
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
