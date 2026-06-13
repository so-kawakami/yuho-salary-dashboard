import type { Metadata } from "next";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "年収トレンド | 上場企業の平均年収推移と分布",
  description:
    "上場企業の平均年収の推移グラフと年収帯別分布を掲載。全国平均との比較や高年収企業の特徴（平均年齢・勤続年数）もチェックできます。",
};
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { TrendChart } from "@/components/TrendChart";
import { getAllCompanies, getSalaryTrend, getIndustries } from "@/db/safe-queries";

export const dynamic = "force-static";

export default function TrendsPage() {
  const ranking = getAllCompanies().filter((r) => r.salary > 0);
  const trend = getSalaryTrend();
  const topIndustries = getIndustries()
    .filter((i) => i.industry && i.companies >= 3)
    .slice(0, 6);

  // 年収帯ごとの分布
  const bands = [
    { label: "1,500万円以上", min: 1500, color: "bg-[var(--color-primary)]" },
    { label: "1,000〜1,500万円", min: 1000, color: "bg-[var(--color-accent)]" },
    { label: "800〜1,000万円", min: 800, color: "bg-blue-400" },
    { label: "600〜800万円", min: 600, color: "bg-cyan-500" },
    { label: "400〜600万円", min: 400, color: "bg-teal-400" },
    { label: "400万円未満", min: 0, color: "bg-gray-400" },
  ];

  const distribution = bands.map((band, i) => {
    const max = i === 0 ? Infinity : bands[i - 1].min;
    const count = ranking.filter(
      (r) => r.salary >= band.min && r.salary < max
    ).length;
    return { ...band, count, percent: Math.round((count / ranking.length) * 100) };
  });

  return (
    <div className="flex flex-col min-h-full bg-mesh">
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        <div>
          <h2 className="text-2xl font-extrabold text-[var(--color-text-primary)] mb-1">
            年収トレンド
          </h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            上場企業の年収推移と分布
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TrendChart data={trend} />

          {/* 年収分布 */}
          <div className="glass rounded-xl p-5">
            <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-1">
              年収帯の分布
            </h3>
            <p className="text-sm text-[var(--color-text-muted)] mb-4">
              上場企業 {ranking.length.toLocaleString()}社の年収帯別分布
            </p>
            <div className="space-y-3">
              {distribution.map((d) => (
                <div key={d.label}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-[var(--color-text-secondary)]">
                      {d.label}
                    </span>
                    <span className="font-medium text-[var(--color-text-primary)]">
                      {d.count}社 ({d.percent}%)
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-white/50 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${d.color} transition-all duration-500`}
                      style={{ width: `${d.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 高年収企業の特徴 */}
        <div className="glass rounded-xl p-6">
          <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-4">
            高年収企業の特徴
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                label: "年収1,000万超の平均年齢",
                value: (() => {
                  const high = ranking.filter((r) => r.salary >= 1000 && r.avgAge > 0);
                  return high.length > 0
                    ? `${(high.reduce((s, r) => s + r.avgAge, 0) / high.length).toFixed(1)}歳`
                    : "-";
                })(),
              },
              {
                label: "年収1,000万超の平均勤続",
                value: (() => {
                  const high = ranking.filter((r) => r.salary >= 1000 && r.avgTenure > 0);
                  return high.length > 0
                    ? `${(high.reduce((s, r) => s + r.avgTenure, 0) / high.length).toFixed(1)}年`
                    : "-";
                })(),
              },
              {
                label: "年収1,000万超の企業数",
                value: `${ranking.filter((r) => r.salary >= 1000).length}社`,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl bg-[var(--color-surface-secondary)] p-4 text-center"
              >
                <p className="text-sm text-[var(--color-text-muted)] mb-1">
                  {item.label}
                </p>
                <p className="text-2xl font-bold text-gradient">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 業界別年収への導線 */}
        {topIndustries.length > 0 && (
          <div className="glass rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
                  業界別の年収水準もチェック
                </h3>
                <p className="text-sm text-[var(--color-text-muted)]">
                  平均年収が高い業界トップ6
                </p>
              </div>
              <Link href="/industries" className="text-sm text-[var(--color-primary)] hover:underline shrink-0">
                業界一覧へ →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {topIndustries.map((ind, i) => (
                <Link
                  key={ind.industry}
                  href={`/industries/${ind.industry}`}
                  className="rounded-xl bg-[var(--color-surface-secondary)] p-4 hover:bg-[var(--color-primary-light)] transition-colors block"
                >
                  <p className="text-xs text-[var(--color-text-muted)] mb-1">#{i + 1}</p>
                  <p className="text-sm font-bold text-[var(--color-text-primary)] mb-1">{ind.industry}</p>
                  <p className="text-lg font-extrabold text-gradient">
                    {ind.avgSalary.toLocaleString()}<span className="text-xs font-normal text-[var(--color-text-secondary)]">万円</span>
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
