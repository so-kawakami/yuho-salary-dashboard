import Link from "next/link";
import { Header } from "@/components/Header";
import { StatsCards } from "@/components/StatsCards";
import { SalaryChecker } from "@/components/SalaryChecker";
import { SpotlightCards } from "@/components/SpotlightCards";
import { SalaryRanking } from "@/components/SalaryRanking";
import { getRanking, getStatsData } from "@/db/safe-queries";

export const dynamic = "force-static";
export const revalidate = 86400; // 1日キャッシュ

export default function Home() {
  const ranking = getRanking(15);
  const stats = getStatsData();

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

      <main className="flex-1">
        {/* ヒーローセクション */}
        <section className="relative overflow-hidden pt-16 pb-12 sm:pt-24 sm:pb-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <p className="text-sm font-medium text-[var(--color-primary)] mb-3 tracking-wide">
                有価証券報告書 × {stats.totalCompanies.toLocaleString()}社のデータ
              </p>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6">
                <span className="text-gradient">あの企業の年収、</span>
                <br />
                <span className="text-[var(--color-text-primary)]">
                  知ってる？
                </span>
              </h2>
              <p className="text-base sm:text-lg text-[var(--color-text-secondary)] max-w-xl mx-auto mb-8 leading-relaxed">
                金融庁EDINETの有価証券報告書から、上場企業の平均年収を自動集計。
                業界別比較やトレンド分析をダッシュボードで。
              </p>

              {/* 検索バー */}
              <div className="flex justify-center">
                <div className="relative w-full max-w-lg">
                  <input
                    type="text"
                    placeholder="企業名・業界で検索..."
                    className="w-full h-14 rounded-2xl glass px-5 pl-12 text-base outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition placeholder:text-[var(--color-text-muted)]"
                  />
                  <svg
                    className="absolute left-4 top-4 h-5 w-5 text-[var(--color-text-muted)]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>

              {/* クイックリンク */}
              <div className="flex flex-wrap justify-center gap-2 mt-5">
                {["キーエンス", "トヨタ", "ソニー", "任天堂", "三菱商事"].map(
                  (name) => (
                    <span
                      key={name}
                      className="text-xs px-3 py-1.5 rounded-full glass text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] cursor-pointer transition-colors"
                    >
                      {name}
                    </span>
                  )
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-12 space-y-10">
          <section>
            <StatsCards stats={stats} />
          </section>

          <section>
            <SalaryChecker />
          </section>

          <section>
            <SpotlightCards />
          </section>

          <section>
            <SalaryRanking data={rankingData} />
            <div className="text-center mt-4">
              <Link
                href="/ranking"
                className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] transition-colors"
              >
                すべてのランキングを見る
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>
          </section>
        </div>
      </main>

      <footer className="glass-header py-8">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-sm text-[var(--color-text-muted)]">
            データ出典：
            <a
              href="https://disclosure.edinet-fsa.go.jp/"
              className="text-[var(--color-primary)] hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              EDINET（金融庁）
            </a>
            の有価証券報告書より自動集計
          </p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            ※ 平均年収は各企業の有価証券報告書に記載された「平均年間給与」の値です
          </p>
        </div>
      </footer>
    </div>
  );
}
