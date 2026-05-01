import { Header } from "@/components/Header";
import { SalaryRanking } from "@/components/SalaryRanking";
import { IndustryChart } from "@/components/IndustryChart";
import { TrendChart } from "@/components/TrendChart";
import { getRanking } from "@/db/safe-queries";

export const dynamic = "force-static";

export default function RankingPage() {
  const ranking = getRanking(50);
  const rankingData = ranking.map((r) => ({
    rank: r.rank,
    code: r.code,
    name: r.name,
    industry: r.industry ?? "",
    salary: r.salary,
    employees: r.employees ?? 0,
    change: 0,
  }));

  return (
    <div className="flex flex-col min-h-full bg-mesh">
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        <div>
          <h2 className="text-2xl font-extrabold text-[var(--color-text-primary)] mb-1">
            年収ランキング TOP50
          </h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            有価証券報告書ベースの平均年収ランキング
          </p>
        </div>

        <SalaryRanking data={rankingData} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <IndustryChart />
          <TrendChart />
        </div>
      </main>
    </div>
  );
}
