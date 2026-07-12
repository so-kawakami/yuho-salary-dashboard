import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { RankingWithFilter } from "@/components/RankingWithFilter";
import { RankingJsonLd } from "@/components/RankingJsonLd";
import { getAllCompanies } from "@/db/safe-queries";
import { SALARY_BANDS } from "@/lib/salary-bands";

export const metadata: Metadata = {
  title: "【2026年最新】年収ランキング｜上場企業4,000社の平均年収",
  description:
    "有価証券報告書をもとにした上場企業の平均年収ランキング。業界・規模でフィルタリングできます。",
};

export const dynamic = "force-static";

export default function RankingPage() {
  const all = getAllCompanies()
    .filter((r) => r.salary > 0)
    .sort((a, b) => b.salary - a.salary);

  const data = all.map((r, i) => ({
    rank: i + 1,
    code: r.code,
    name: r.name,
    industry: r.industry ?? "",
    salary: r.salary,
    employees: r.employees ?? 0,
    avgAge: r.avgAge ?? 0,
    avgTenure: r.avgTenure ?? 0,
  }));

  return (
    <div className="flex flex-col min-h-full">
      <RankingJsonLd
        listName="上場企業 平均年収ランキング"
        path="/ranking"
        breadcrumbLabel="年収ランキング"
        items={data}
      />
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-5 sm:px-8 lg:px-12 pb-14">
        <div className="pt-8 sm:pt-12">
          <p className="text-sm text-[var(--color-primary)] font-bold">
            2026年最新 · 有価証券報告書ベース
          </p>
          <h1 className="text-[28px] sm:text-[40px] font-black text-[var(--color-text)] mt-2">
            年収ランキング{" "}
            <span className="text-base font-bold text-[var(--color-text-faint)]">
              全{data.length.toLocaleString()}社
            </span>
          </h1>
        </div>

        <div className="mt-6">
          <Suspense>
            <RankingWithFilter data={data} />
          </Suspense>
        </div>

        {/* 年収帯から探す（ロングテール導線） */}
        <section className="mt-12">
          <h2 className="text-[17px] font-black text-[var(--color-text)] mb-4">
            年収帯から企業を探す
          </h2>
          <div className="flex flex-wrap gap-2">
            {SALARY_BANDS.map((b) => (
              <Link
                key={b.slug}
                href={`/salary/${b.slug}`}
                className="bg-white border border-[var(--color-border)] rounded-full px-4 py-2 text-sm font-bold text-[var(--color-text-body)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
              >
                年収{b.label}
              </Link>
            ))}
          </div>
        </section>

        {/* 切り口別ランキング */}
        <section className="mt-12">
          <h2 className="text-[17px] font-black text-[var(--color-text)] mb-4">
            別の切り口で見る
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { href: "/ranking/executive-pay", label: "役員報酬", sub: "1人あたり報酬額" },
              { href: "/ranking/sales-per-employee", label: "1人あたり売上高", sub: "労働生産性" },
              { href: "/ranking/female-managers", label: "女性管理職比率", sub: "DEI指標" },
              { href: "/ranking/long-tenure", label: "勤続年数×高年収", sub: "定着率" },
              { href: "/ranking/young-high-income", label: "若手×高年収", sub: "平均年齢40歳未満" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="bg-white border border-[var(--color-border)] rounded-2xl px-5 py-4 hover:bg-[var(--color-surface-section)] transition-colors"
              >
                <p className="text-sm font-bold text-[var(--color-text)] leading-snug">
                  {item.label}
                </p>
                <p className="text-xs text-[var(--color-text-faint)] mt-1">{item.sub}</p>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
