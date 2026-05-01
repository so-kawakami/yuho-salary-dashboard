"use client";

import Link from "next/link";

export interface RankingRow {
  rank: number;
  code: string;
  name: string;
  industry: string;
  salary: number;
  employees: number;
  change: number;
}

export function SalaryRanking({ data }: { data: RankingRow[] }) {
  return (
    <div className="glass rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-[var(--color-border)]">
        <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
          平均年収ランキング TOP{data.length}
        </h2>
        <p className="text-sm text-[var(--color-text-muted)]">
          有価証券報告書ベース
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)]">
              <th className="px-4 py-3 text-left font-medium">#</th>
              <th className="px-4 py-3 text-left font-medium">企業名</th>
              <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">
                業種
              </th>
              <th className="px-4 py-3 text-right font-medium">平均年収</th>
              <th className="px-4 py-3 text-right font-medium hidden sm:table-cell">
                従業員数
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((company) => (
              <tr
                key={company.code}
                className="border-t border-[var(--color-border)] hover:bg-[var(--color-primary-light)] transition-colors"
              >
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${
                      company.rank <= 3
                        ? "bg-[var(--color-primary)]"
                        : "bg-[var(--color-text-muted)]"
                    }`}
                  >
                    {company.rank}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium text-[var(--color-text-primary)]">
                  <Link
                    href={`/company/${company.code}`}
                    className="hover:text-[var(--color-primary)] transition-colors"
                  >
                    {company.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-[var(--color-text-secondary)] hidden sm:table-cell">
                  {company.industry || "-"}
                </td>
                <td className="px-4 py-3 text-right font-bold text-[var(--color-text-primary)]">
                  {company.salary.toLocaleString()}
                  <span className="text-xs font-normal text-[var(--color-text-muted)]">
                    {" "}万円
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-[var(--color-text-secondary)] hidden sm:table-cell">
                  {company.employees
                    ? `${company.employees.toLocaleString()}名`
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
