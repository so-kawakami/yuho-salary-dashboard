import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { getExecutivePayRanking } from "@/db/safe-queries";

export const metadata: Metadata = {
  title: "役員報酬ランキング（1人あたり）| 上場企業",
  description:
    "有価証券報告書をもとにした上場企業の役員報酬ランキング。役員1人あたり報酬額・従業員年収との倍率を比較。",
};

export const dynamic = "force-static";

export default function ExecutivePayPage() {
  const data = getExecutivePayRanking(200);

  return (
    <div className="flex flex-col min-h-full bg-mesh">
      <Header />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        <nav className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
          <Link href="/" className="hover:text-[var(--color-primary)] transition-colors">ホーム</Link>
          <span>/</span>
          <Link href="/ranking" className="hover:text-[var(--color-primary)] transition-colors">ランキング</Link>
          <span>/</span>
          <span className="text-[var(--color-text-primary)]">役員報酬</span>
        </nav>

        <div>
          <h1 className="text-2xl font-extrabold text-[var(--color-text-primary)] mb-1">
            役員報酬ランキング（1人あたり）
          </h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            有価証券報告書ベース・役員1人あたり報酬額トップ{data.length}社
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
                  <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--color-text-muted)]">役員1人あたり報酬</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--color-text-muted)] hidden md:table-cell">従業員年収比</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--color-text-muted)] hidden lg:table-cell">平均年収</th>
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
                      {row.perPerson.toLocaleString()}万円
                    </td>
                    <td className="px-4 py-3 text-right hidden md:table-cell">
                      {row.ratio != null ? (
                        <span className="text-[var(--color-text-secondary)]">{row.ratio}倍</span>
                      ) : "-"}
                    </td>
                    <td className="px-4 py-3 text-right text-[var(--color-text-secondary)] hidden lg:table-cell">
                      {row.avgSalary > 0 ? `${row.avgSalary.toLocaleString()}万円` : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass rounded-2xl p-4 text-xs text-[var(--color-text-muted)] leading-relaxed">
          <strong className="text-[var(--color-text-secondary)]">データについて：</strong>
          有価証券報告書（EDINET）に記載された役員報酬総額÷役員員数で算出しています。
          ストックオプションや退職慰労金を含む場合があります。
          <a href="https://disclosure.edinet-fsa.go.jp/" target="_blank" rel="noopener noreferrer"
            className="text-[var(--color-primary)] hover:underline ml-1">EDINETで原典を確認</a>
        </div>
      </main>
    </div>
  );
}
