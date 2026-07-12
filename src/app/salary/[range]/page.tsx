import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { RankingJsonLd } from "@/components/RankingJsonLd";
import { getAllCompanies } from "@/db/safe-queries";
import { SALARY_BANDS, getSalaryBand, isInBand, type SalaryBand } from "@/lib/salary-bands";

export const dynamic = "force-static";

// 一覧に表示する最大件数（内部リンクは充実させつつページ肥大を防ぐ）
const MAX_ROWS = 200;

export function generateStaticParams() {
  return SALARY_BANDS.map((b) => ({ range: b.slug }));
}

function companiesInBand(band: SalaryBand) {
  return getAllCompanies()
    .filter((c) => c.salary > 0 && isInBand(c.salary, band))
    .sort((a, b) => b.salary - a.salary);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ range: string }>;
}): Promise<Metadata> {
  const { range } = await params;
  const band = getSalaryBand(range);
  if (!band) return {};
  const count = companiesInBand(band).length;
  const title = `年収${band.label}の企業一覧【2026年最新・${count}社】｜有価証券報告書`;
  const description = `平均年収が${band.label}の上場企業${count}社を有価証券報告書のデータで一覧化。金融庁EDINETの公式データをもとに年収順に掲載しています。`;
  return {
    title,
    description,
    alternates: { canonical: `https://yuho-nenshu.com/salary/${band.slug}` },
  };
}

export default async function SalaryRangePage({
  params,
}: {
  params: Promise<{ range: string }>;
}) {
  const { range } = await params;
  const band = getSalaryBand(range);
  if (!band) notFound();

  const all = companiesInBand(band);
  const rows = all.slice(0, MAX_ROWS);
  const rest = all.length - rows.length;

  return (
    <div className="flex flex-col min-h-full">
      <RankingJsonLd
        listName={`平均年収${band.label}の企業一覧`}
        path={`/salary/${band.slug}`}
        breadcrumbLabel={`年収${band.label}`}
        items={rows}
      />
      <Header />
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 sm:px-8 lg:px-12 pb-14">
        <nav className="flex flex-wrap items-center gap-2 text-sm text-[var(--color-text-faint)] pt-8">
          <Link href="/" className="hover:text-[var(--color-primary)] transition-colors">ホーム</Link>
          <span>/</span>
          <Link href="/ranking" className="hover:text-[var(--color-primary)] transition-colors">年収ランキング</Link>
          <span>/</span>
          <span className="text-[var(--color-text)]">年収{band.label}</span>
        </nav>

        <div className="pt-6">
          <p className="text-sm text-[var(--color-primary)] font-bold">
            2026年最新 · 有価証券報告書ベース
          </p>
          <h1 className="text-[26px] sm:text-[38px] font-black text-[var(--color-text)] mt-2">
            平均年収{band.label}の企業一覧{" "}
            <span className="text-base font-bold text-[var(--color-text-faint)]">
              全{all.length.toLocaleString()}社
            </span>
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-2 leading-relaxed">
            平均年収が{band.label}の上場企業を、有価証券報告書（金融庁EDINET）のデータで年収順に掲載しています。
          </p>
        </div>

        {/* 企業一覧 */}
        <div className="mt-6 bg-white border border-[var(--color-border)] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-section)]">
                  <th className="px-4 py-3 text-left text-xs font-bold text-[var(--color-text-muted)] w-12">順位</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-[var(--color-text-muted)]">企業名</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-[var(--color-text-muted)] hidden sm:table-cell">業界</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-[var(--color-text-muted)]">平均年収</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.code} className="border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-section)] transition-colors">
                    <td className="px-4 py-3 text-center text-xs font-bold text-[var(--color-text-faint)]">
                      {i + 1}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/company/${row.code}`} className="font-bold text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors">
                        {row.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-text-muted)] hidden sm:table-cell text-xs">
                      {row.industry ? (
                        <Link href={`/industries/${encodeURIComponent(row.industry)}`} className="hover:text-[var(--color-primary)] transition-colors">
                          {row.industry}
                        </Link>
                      ) : "-"}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-[var(--color-primary)] whitespace-nowrap">
                      {row.salary.toLocaleString()}万円
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rest > 0 && (
            <p className="px-4 py-3 text-xs text-[var(--color-text-faint)] border-t border-[var(--color-border-subtle)]">
              年収の高い順に{MAX_ROWS}社を表示しています（他{rest.toLocaleString()}社）。
            </p>
          )}
        </div>

        {/* 他の年収帯への回遊 */}
        <section className="mt-12">
          <h2 className="text-[17px] font-black text-[var(--color-text)] mb-4">他の年収帯で見る</h2>
          <div className="flex flex-wrap gap-2">
            {SALARY_BANDS.map((b) => (
              <Link
                key={b.slug}
                href={`/salary/${b.slug}`}
                className={`px-4 py-2 rounded-full text-sm font-bold border transition-colors ${
                  b.slug === band.slug
                    ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                    : "bg-white text-[var(--color-text-body)] border-[var(--color-border)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                }`}
              >
                {b.kind === "band" ? b.label : `${b.label}`}
              </Link>
            ))}
          </div>
        </section>

        <div className="mt-8 bg-[var(--color-surface-section)] rounded-2xl p-4 text-xs text-[var(--color-text-muted)] leading-relaxed">
          <strong className="text-[var(--color-text-body)]">データについて：</strong>
          各企業の有価証券報告書に記載された「平均年間給与」（単体・正社員）をもとに集計しています。
          <a href="https://disclosure.edinet-fsa.go.jp/" target="_blank" rel="noopener noreferrer"
            className="text-[var(--color-primary)] hover:underline ml-1">EDINETで原典を確認</a>
        </div>
      </main>
      <Footer />
    </div>
  );
}
