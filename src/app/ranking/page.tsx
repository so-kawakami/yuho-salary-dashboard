import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { RankingWithFilter } from "@/components/RankingWithFilter";
import { getAllCompanies } from "@/db/safe-queries";

export const metadata: Metadata = {
  title: "年収ランキング | 上場企業の平均年収",
  description:
    "有価証券報告書をもとにした上場企業の平均年収ランキング。業界・規模・勤続年数でフィルタリングできます。",
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
    <div className="flex flex-col min-h-full bg-mesh">
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        <div>
          <h2 className="text-2xl font-extrabold text-[var(--color-text-primary)] mb-1">
            年収ランキング
          </h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            有価証券報告書ベース・全{data.length.toLocaleString()}社・業界や規模でフィルタリング可能
          </p>
        </div>
        {/* 独自指標ランキング */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { href: "/ranking/executive-pay", label: "役員報酬", emoji: "👔", sub: "1人あたり報酬額" },
            { href: "/ranking/sales-per-employee", label: "1人あたり売上高", emoji: "📈", sub: "労働生産性" },
            { href: "/ranking/female-managers", label: "女性管理職比率", emoji: "⚖️", sub: "DEI指標" },
            { href: "/ranking/long-tenure", label: "勤続年数×高年収", emoji: "🏆", sub: "定着率" },
            { href: "/ranking/young-high-income", label: "若手×高年収", emoji: "🚀", sub: "平均年齢40歳未満" },
          ].map((item) => (
            <Link key={item.href} href={item.href}
              className="glass rounded-2xl p-4 glass-hover flex flex-col gap-1 hover:border-[var(--color-primary)] transition-colors">
              <span className="text-2xl">{item.emoji}</span>
              <span className="text-xs font-bold text-[var(--color-text-primary)] leading-snug">{item.label}</span>
              <span className="text-[10px] text-[var(--color-text-muted)]">{item.sub}</span>
            </Link>
          ))}
        </div>

        <RankingWithFilter data={data} />
      </main>
      <Footer />
    </div>
  );
}
