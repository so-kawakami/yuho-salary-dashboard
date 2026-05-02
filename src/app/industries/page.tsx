import type { Metadata } from "next";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "業界別 平均年収ランキング | 業種ごとの年収比較",
  description:
    "卸売・IT・電機・医薬品・銀行など業界別の平均年収を有価証券報告書で比較。自分の業界の年収水準や転職先の給与水準をチェックできます。",
};
import Link from "next/link";
import { IndustryChart } from "@/components/IndustryChart";
import { getRanking } from "@/db/safe-queries";

export const dynamic = "force-static";

export default function IndustriesPage() {
  // ランキングデータから業界ごとに集計
  const ranking = getRanking(100);
  const industryMap = new Map<
    string,
    { total: number; count: number; companies: typeof ranking }
  >();

  for (const r of ranking) {
    const ind = r.industry || "その他";
    const entry = industryMap.get(ind) ?? {
      total: 0,
      count: 0,
      companies: [] as typeof ranking,
    };
    entry.total += r.salary;
    entry.count += 1;
    entry.companies.push(r);
    industryMap.set(ind, entry);
  }

  const industries = [...industryMap.entries()]
    .map(([name, data]) => ({
      name,
      avgSalary: Math.round(data.total / data.count),
      count: data.count,
      companies: data.companies.sort((a, b) => b.salary - a.salary),
    }))
    .sort((a, b) => b.avgSalary - a.avgSalary);

  return (
    <div className="flex flex-col min-h-full bg-mesh">
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        <div>
          <h2 className="text-2xl font-extrabold text-[var(--color-text-primary)] mb-1">
            業界別 平均年収
          </h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            有価証券報告書ベースの業界別平均年収比較
          </p>
        </div>

        <IndustryChart />

        {/* 業界ごとの企業一覧 */}
        <div className="space-y-6">
          {industries.map((ind) => (
            <div key={ind.name} className="glass rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <Link
                  href={`/industries/${ind.name}`}
                  className="text-base font-bold text-[var(--color-text-primary)] hover:text-[var(--color-primary)] transition-colors"
                >
                  {ind.name}
                </Link>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-[var(--color-text-muted)]">
                    {ind.count}社
                  </span>
                  <span className="text-sm font-bold text-[var(--color-primary)]">
                    平均 {ind.avgSalary.toLocaleString()}万円
                  </span>
                  <Link
                    href={`/industries/${ind.name}`}
                    className="text-xs text-[var(--color-primary)] hover:underline"
                  >
                    一覧→
                  </Link>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {ind.companies.slice(0, 8).map((c) => (
                  <a
                    key={c.code}
                    href={`/company/${c.code}`}
                    className="text-xs px-3 py-1.5 rounded-full bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-light)] transition-colors"
                  >
                    {c.name} ({c.salary.toLocaleString()}万)
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
