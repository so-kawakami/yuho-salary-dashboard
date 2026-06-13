import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { calcSalaryPercentile } from "@/data/mock";
import { getStatsData, getAllCompanies, getRanking } from "@/db/safe-queries";

export const dynamic = "force-static";

const SITE_URL = "https://yuho-salary-dashboard.vercel.app";

// 100万〜2,000万円・50万円刻みの結果ページを事前生成（それ以外はオンデマンド生成）
export function generateStaticParams() {
  const params: { salary: string }[] = [];
  for (let s = 100; s <= 2000; s += 50) {
    params.push({ salary: String(s) });
  }
  return params;
}

function parseSalary(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null;
  const salary = parseInt(raw, 10);
  if (salary < 50 || salary > 30000) return null;
  return salary;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ salary: string }>;
}): Promise<Metadata> {
  const { salary: raw } = await params;
  const salary = parseSalary(raw);
  if (!salary) return { title: "年収偏差値チェッカー" };

  const stats = getStatsData();
  const result = calcSalaryPercentile(salary, stats.salaryMean, stats.salaryStddev);
  const title = `年収${salary.toLocaleString()}万円の偏差値は${result.deviation}【上場企業の上位${100 - result.percentile}%】`;
  const description = `年収${salary.toLocaleString()}万円は上場企業${stats.totalCompanies.toLocaleString()}社の平均年間給与と比較して偏差値${result.deviation}（${result.label}）。同じ年収帯の企業や年収ランキングもチェックできます。`;

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/checker/${salary}` },
    openGraph: { title, description },
    twitter: { title, description, card: "summary_large_image" },
  };
}

export default async function CheckerResultPage({
  params,
}: {
  params: Promise<{ salary: string }>;
}) {
  const { salary: raw } = await params;
  const salary = parseSalary(raw);
  if (!salary) notFound();

  const stats = getStatsData();
  const result = calcSalaryPercentile(salary, stats.salaryMean, stats.salaryStddev);

  // 同じ年収帯の企業（±60万円 → 足りなければ±120万円）
  const all = getAllCompanies().filter((c) => c.salary > 0);
  const within = (range: number) =>
    all
      .filter((c) => Math.abs(c.salary - salary) <= range)
      .sort((a, b) => Math.abs(a.salary - salary) - Math.abs(b.salary - salary));
  const near = within(60);
  const nearbyCompanies = (near.length >= 6 ? near : within(120)).slice(0, 12);

  // ワンランク上の年収帯（+100万円〜+250万円）の企業
  const nextLevel = all
    .filter((c) => c.salary >= salary + 100 && c.salary <= salary + 250)
    .sort((a, b) => a.salary - b.salary)
    .slice(0, 6);

  const top5 = getRanking(5);

  const shareUrl = `${SITE_URL}/checker/${salary}`;
  const shareText = `私の年収偏差値は${result.deviation}！上場企業${stats.totalCompanies.toLocaleString()}社の中で上位${100 - result.percentile}%でした。あなたの年収偏差値は？`;

  const diffFromMean = salary - stats.averageSalary;
  const diffFromMedian = salary - stats.medianSalary;

  return (
    <div className="flex flex-col min-h-full bg-mesh">
      <Header />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        <nav className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
          <Link href="/" className="hover:text-[var(--color-primary)] transition-colors">ホーム</Link>
          <span>/</span>
          <Link href="/#checker" className="hover:text-[var(--color-primary)] transition-colors">年収偏差値チェッカー</Link>
          <span>/</span>
          <span className="text-[var(--color-text-primary)]">{salary.toLocaleString()}万円</span>
        </nav>

        {/* 結果ヒーロー */}
        <div className="glass rounded-2xl p-8 text-center">
          <p className="text-sm text-[var(--color-text-muted)] mb-2">
            年収{salary.toLocaleString()}万円の偏差値（上場企業{stats.totalCompanies.toLocaleString()}社比較）
          </p>
          <div className="flex items-baseline justify-center gap-3 mb-1">
            <span className="text-7xl sm:text-8xl font-black text-gradient leading-none">
              {result.deviation}
            </span>
            <span className="text-xl font-bold text-[var(--color-text-secondary)]">
              {result.label}
            </span>
          </div>
          <p className="text-lg font-bold text-[var(--color-text-primary)] mb-6">
            上場企業社員の中で
            <span className="text-[var(--color-primary)] mx-1">上位{100 - result.percentile}%</span>
          </p>

          <div className="max-w-md mx-auto">
            <div className="h-3 rounded-full bg-white/60 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)]"
                style={{ width: `${result.percentile}%` }}
              />
            </div>
            <div className="flex justify-between mt-1 text-xs text-[var(--color-text-muted)]">
              <span>0%</span>
              <span>あなたの位置</span>
              <span>100%</span>
            </div>
          </div>

          {/* シェア */}
          <div className="flex gap-2 flex-wrap justify-center mt-6">
            <a
              href={`https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-black text-white text-sm font-bold hover:bg-gray-800 transition-colors"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              Xでシェア
            </a>
            <a
              href={`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#06C755] text-white text-sm font-bold hover:bg-[#05b34c] transition-colors"
            >
              LINEで送る
            </a>
            <Link
              href="/#checker"
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl glass text-sm font-bold text-[var(--color-primary)] hover:bg-[var(--color-primary-light)] transition-colors"
            >
              別の年収で診断する
            </Link>
          </div>
        </div>

        {/* 統計との比較 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              label: "上場企業平均との差",
              value: `${diffFromMean >= 0 ? "+" : ""}${diffFromMean.toLocaleString()}万円`,
              sub: `平均 ${stats.averageSalary.toLocaleString()}万円`,
              positive: diffFromMean >= 0,
            },
            {
              label: "中央値との差",
              value: `${diffFromMedian >= 0 ? "+" : ""}${diffFromMedian.toLocaleString()}万円`,
              sub: `中央値 ${stats.medianSalary.toLocaleString()}万円`,
              positive: diffFromMedian >= 0,
            },
            {
              label: "比較対象",
              value: `${stats.totalCompanies.toLocaleString()}社`,
              sub: stats.dataYear,
              positive: true,
            },
          ].map((item) => (
            <div key={item.label} className="glass rounded-xl p-5 text-center">
              <p className="text-xs text-[var(--color-text-muted)] mb-1">{item.label}</p>
              <p className={`text-2xl font-extrabold ${item.positive ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"}`}>
                {item.value}
              </p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">{item.sub}</p>
            </div>
          ))}
        </div>

        {/* 同じ年収帯の企業 */}
        {nearbyCompanies.length > 0 && (
          <div className="glass rounded-2xl p-6">
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-1">
              あなたと同じ年収帯の上場企業
            </h2>
            <p className="text-sm text-[var(--color-text-muted)] mb-4">
              平均年収{salary.toLocaleString()}万円前後の企業（クリックで詳細データへ）
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {nearbyCompanies.map((c) => (
                <Link
                  key={c.code}
                  href={`/company/${c.code}`}
                  className="flex flex-col gap-0.5 p-3 rounded-xl bg-[var(--color-surface-secondary)] hover:bg-[var(--color-primary-light)] transition-colors"
                >
                  <span className="text-xs font-semibold text-[var(--color-text-primary)] line-clamp-1">
                    {c.name}
                  </span>
                  <span className="text-base font-bold text-gradient">
                    {c.salary.toLocaleString()}万円
                  </span>
                  {c.industry && (
                    <span className="text-[10px] text-[var(--color-text-muted)] line-clamp-1">{c.industry}</span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ワンランク上の企業 */}
        {nextLevel.length > 0 && (
          <div className="glass rounded-2xl p-6">
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-1">
              ワンランク上の年収の企業
            </h2>
            <p className="text-sm text-[var(--color-text-muted)] mb-4">
              いまの年収+100〜250万円の企業をチェック（転職の参考に）
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {nextLevel.map((c) => (
                <Link
                  key={c.code}
                  href={`/company/${c.code}`}
                  className="flex flex-col gap-0.5 p-3 rounded-xl bg-[var(--color-surface-secondary)] hover:bg-[var(--color-primary-light)] transition-colors"
                >
                  <span className="text-xs font-semibold text-[var(--color-text-primary)] line-clamp-1">
                    {c.name}
                  </span>
                  <span className="text-base font-bold text-gradient">
                    {c.salary.toLocaleString()}万円
                  </span>
                  {c.industry && (
                    <span className="text-[10px] text-[var(--color-text-muted)] line-clamp-1">{c.industry}</span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 年収ランキングTOP5への導線 */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
              年収ランキング TOP5
            </h2>
            <Link href="/ranking" className="text-sm text-[var(--color-primary)] hover:underline">
              全ランキングを見る →
            </Link>
          </div>
          <div className="space-y-2">
            {top5.map((r, i) => (
              <Link
                key={r.code}
                href={`/company/${r.code}`}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--color-surface-secondary)] hover:bg-[var(--color-primary-light)] transition-colors"
              >
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${
                  i === 0 ? "bg-yellow-400" : i === 1 ? "bg-gray-300" : i === 2 ? "bg-amber-600" : "bg-[var(--color-text-muted)]"
                }`}>
                  {i + 1}
                </span>
                <span className="flex-1 text-sm font-bold text-[var(--color-text-primary)] truncate">{r.name}</span>
                <span className="text-base font-extrabold text-gradient shrink-0">{r.salary.toLocaleString()}万円</span>
              </Link>
            ))}
          </div>
        </div>

        <p className="text-xs text-[var(--color-text-muted)] text-center">
          ※ 偏差値は上場企業{stats.totalCompanies.toLocaleString()}社の平均年間給与（有価証券報告書・単体正社員）の分布をもとに算出した参考値です。
          個人の年収分布（国税庁統計など）とは異なります。
        </p>
      </main>
      <Footer />
    </div>
  );
}
