import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { IndustryChart } from "@/components/IndustryChart";
import { getIndustries, getCompaniesByIndustry, getStatsData } from "@/db/safe-queries";

export const metadata: Metadata = {
  title: "【2026年最新】業界別 平均年収ランキング｜33業種を比較",
  description:
    "卸売・IT・電機・医薬品・銀行など業界別の平均年収を有価証券報告書で比較。自分の業界の年収水準や転職先の給与水準をチェックできます。",
};

export const dynamic = "force-static";

export default function IndustriesPage() {
  const industries = getIndustries().filter((i) => i.industry && i.companies > 0);
  const stats = getStatsData();

  const sorted = [...industries].sort((a, b) => b.avgSalary - a.avgSalary);
  const top = sorted[0];
  const bottom = sorted[sorted.length - 1];
  const ratio =
    top && bottom && bottom.avgSalary > 0
      ? Math.round((top.avgSalary / bottom.avgSalary) * 10) / 10
      : null;

  // 各業界のトップ企業を取得
  const industriesWithCompanies = sorted.map((i) => ({
    name: i.industry,
    avgSalary: i.avgSalary,
    count: i.companies,
    topCompanies: getCompaniesByIndustry(i.industry, 8),
  }));

  return (
    <div className="flex flex-col min-h-full">
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-5 sm:px-8 lg:px-12 pb-14">
        <div className="pt-8 sm:pt-12">
          <p className="text-sm text-[var(--color-primary)] font-bold">
            全{industries.length}業界 · 有価証券報告書ベース
          </p>
          <h1 className="text-[28px] sm:text-[40px] font-black text-[var(--color-text)] mt-2">
            業界別 平均年収
          </h1>
          {top && ratio != null && (
            <p className="text-[15px] text-[var(--color-text-muted)] mt-2">
              トップの{top.industry}と最下位の差はおよそ{ratio}倍。点線は上場企業全体の平均（{stats.averageSalary.toLocaleString()}万円）。
            </p>
          )}
        </div>

        <div className="mt-6">
          <IndustryChart data={industries} overallAvg={stats.averageSalary} />
        </div>

        {/* 業界ごとの企業一覧 */}
        <div className="space-y-4 mt-10">
          <h2 className="text-[17px] font-black text-[var(--color-text)]">
            業界ごとの主要企業
          </h2>
          {industriesWithCompanies.map((ind) => (
            <div
              key={ind.name}
              className="bg-white border border-[var(--color-border)] rounded-2xl px-6 py-5"
            >
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <Link
                  href={`/industries/${ind.name}`}
                  className="text-[15.5px] font-bold text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors"
                >
                  {ind.name}
                </Link>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-[var(--color-text-faint)]">
                    {ind.count.toLocaleString()}社
                  </span>
                  <span className="text-sm font-bold text-[var(--color-primary)]">
                    平均 {ind.avgSalary.toLocaleString()}万円
                  </span>
                  <Link
                    href={`/industries/${ind.name}`}
                    className="text-[13px] font-bold text-[var(--color-primary)] hover:underline"
                  >
                    一覧 →
                  </Link>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {ind.topCompanies.map((c) => (
                  <Link
                    key={c.code}
                    href={`/company/${c.code}`}
                    className="text-[13px] px-3.5 py-[7px] rounded-full bg-white border border-[var(--color-border-input)] text-[var(--color-text-body)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
                  >
                    {c.name}{" "}
                    <span className="font-bold">{c.salary.toLocaleString()}万</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
