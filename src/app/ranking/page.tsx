import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { RankingWithFilter } from "@/components/RankingWithFilter";
import { getRanking } from "@/db/safe-queries";

export const metadata: Metadata = {
  title: "年収ランキング | 上場企業の平均年収",
  description:
    "有価証券報告書をもとにした上場企業の平均年収ランキング。業界・規模・勤続年数でフィルタリングできます。",
};

export const dynamic = "force-static";

export default function RankingPage() {
  const ranking = getRanking(200);
  const data = ranking.map((r) => ({
    rank: r.rank,
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
            有価証券報告書ベース・上位200社・業界や規模でフィルタリング可能
          </p>
        </div>
        <RankingWithFilter data={data} />
      </main>
    </div>
  );
}
