import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { RankingNav } from "@/components/RankingNav";
import { RankingJsonLd } from "@/components/RankingJsonLd";
import { getYoungHighIncomeRanking } from "@/db/safe-queries";

export const metadata: Metadata = {
  title: "【2026年最新】若手×高年収企業ランキング（平均年齢40歳未満）",
  description:
    "有価証券報告書をもとにした上場企業の若手高年収ランキング。平均年齢40歳未満かつ年収500万円以上の企業を比較。",
};

export const dynamic = "force-static";

export default function YoungHighIncomePage() {
  const data = getYoungHighIncomeRanking(200);

  return (
    <div className="flex flex-col min-h-full bg-mesh">
      <RankingJsonLd
        listName="若手×高年収企業ランキング（平均年齢40歳未満）"
        path="/ranking/young-high-income"
        breadcrumbLabel="若手×高年収"
        items={data}
      />
      <Header />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        <nav className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
          <Link href="/" className="hover:text-[var(--color-primary)] transition-colors">ホーム</Link>
          <span>/</span>
          <Link href="/ranking" className="hover:text-[var(--color-primary)] transition-colors">ランキング</Link>
          <span>/</span>
          <span className="text-[var(--color-text-primary)]">若手×高年収</span>
        </nav>

        <div>
          <h1 className="text-2xl font-extrabold text-[var(--color-text-primary)] mb-1">
            若手×高年収ランキング
          </h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            有価証券報告書ベース・平均年齢40歳未満かつ年収500万円以上の企業トップ{data.length}社
          </p>
        </div>

        <div className="glass rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-secondary)]">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-muted)] w-10">順位</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-muted)]">企業名</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-muted)] hidden sm:table-cell">業界</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--color-text-muted)]">平均年収</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--color-text-muted)]">平均年齢</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--color-text-muted)] hidden md:table-cell">従業員数</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row: any, i: number) => (
                  <tr key={row.code} className="border-b border-[var(--color-border)] hover:bg-[var(--color-surface-secondary)] transition-colors">
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-bold ${i < 3 ? "text-[var(--color-primary)]" : "text-[var(--color-text-muted)]"}`}>
                        {i + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/company/${row.code}`} className="font-semibold text-[var(--color-text-primary)] hover:text-[var(--color-primary)] transition-colors">
                        {row.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-text-muted)] hidden sm:table-cell text-xs">
                      {row.industry}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gradient">
                      {row.salary.toLocaleString()}万円
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-[var(--color-text-primary)]">
                      {row.avgAge > 0 ? `${row.avgAge}歳` : "-"}
                    </td>
                    <td className="px-4 py-3 text-right text-[var(--color-text-secondary)] hidden md:table-cell">
                      {row.employees > 0 ? `${row.employees.toLocaleString()}名` : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass rounded-2xl p-4 text-xs text-[var(--color-text-muted)] leading-relaxed">
          <strong className="text-[var(--color-text-secondary)]">データについて：</strong>
          有価証券報告書（EDINET）に記載された平均年齢・平均年収（単体・正社員）のデータです。
          平均年齢40歳未満・年収500万円以上の企業を年収の高い順で集計しています。
          <a href="https://disclosure.edinet-fsa.go.jp/" target="_blank" rel="noopener noreferrer"
            className="text-[var(--color-primary)] hover:underline ml-1">EDINETで原典を確認</a>
        </div>

        <RankingNav current="/ranking/young-high-income" />
      </main>
      <Footer />
    </div>
  );
}
