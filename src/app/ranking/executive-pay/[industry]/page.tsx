import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { RankingNav } from "@/components/RankingNav";
import { getExecutivePayRanking, getExecPayIndustries } from "@/db/safe-queries";
import { formatManYen } from "@/lib/format";

const SITE_URL = "https://yuho-nenshu.com";

export function generateStaticParams() {
  // 注意: paramsには生の日本語を返す（encodeURIComponentすると本番Vercelで
  // 二重エンコードされ404になる。/industries/[slug]と同じ方式）
  return getExecPayIndustries().map(({ industry }) => ({ industry }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ industry: string }>;
}): Promise<Metadata> {
  const { industry: raw } = await params;
  const industry = decodeURIComponent(raw);
  const data = getExecutivePayRanking(200, industry);
  if (data.length === 0) return {};
  const top = data[0];
  const topText = top ? `1位は${top.name}の${formatManYen(top.perPerson)}。` : "";
  return {
    title: `【2026年最新】${industry}業界の役員報酬ランキング（${data.length}社）`,
    description: `${industry}業界の上場企業${data.length}社の役員報酬ランキング。${topText}役員1人あたり報酬額を有価証券報告書（金融庁EDINET）の公式データで比較。`,
    alternates: { canonical: `${SITE_URL}/ranking/executive-pay/${encodeURIComponent(industry)}` },
  };
}

export const dynamic = "force-static";

export default async function ExecPayIndustryPage({
  params,
}: {
  params: Promise<{ industry: string }>;
}) {
  const { industry: raw } = await params;
  const industry = decodeURIComponent(raw);
  const data = getExecutivePayRanking(100, industry);
  if (data.length < 5) notFound();

  const otherIndustries = getExecPayIndustries().filter((i) => i.industry !== industry).slice(0, 12);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "ホーム", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "役員報酬ランキング", item: `${SITE_URL}/ranking/executive-pay` },
        { "@type": "ListItem", position: 3, name: `${industry}業界の役員報酬`, item: `${SITE_URL}/ranking/executive-pay/${encodeURIComponent(industry)}` },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `${industry}業界の役員報酬ランキング`,
      itemListElement: data.slice(0, 20).map((row: any, i: number) => ({
        "@type": "ListItem",
        position: i + 1,
        name: row.name,
        url: `${SITE_URL}/company/${row.code}`,
      })),
    },
  ];

  return (
    <div className="flex flex-col min-h-full bg-mesh">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        <nav className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
          <Link href="/" className="hover:text-[var(--color-primary)] transition-colors">ホーム</Link>
          <span>/</span>
          <Link href="/ranking/executive-pay" className="hover:text-[var(--color-primary)] transition-colors">役員報酬</Link>
          <span>/</span>
          <span className="text-[var(--color-text-primary)]">{industry}</span>
        </nav>

        <div>
          <h1 className="text-2xl font-extrabold text-[var(--color-text-primary)] mb-1">
            {industry}業界の役員報酬ランキング【2026年最新】
          </h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            {industry}業界 上場企業{data.length}社・役員1人あたり報酬額（有価証券報告書ベース）
          </p>
        </div>

        <div className="glass rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-secondary)]">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-muted)] w-10">順位</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-muted)]">企業名</th>
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
                    <td className="px-4 py-3 text-right font-bold text-gradient whitespace-nowrap">
                      {formatManYen(row.perPerson)}
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

        {/* この業界の年収情報への導線 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link href={`/industries/${encodeURIComponent(industry)}`} className="glass rounded-xl p-4 glass-hover flex items-center gap-3">
            <span className="text-2xl">📊</span>
            <div>
              <p className="text-sm font-bold text-[var(--color-text-primary)]">{industry}業界の平均年収を見る</p>
              <p className="text-xs text-[var(--color-text-muted)]">従業員の年収ランキング・業界統計</p>
            </div>
          </Link>
          <Link href="/ranking/executive-pay/1oku" className="glass rounded-xl p-4 glass-hover flex items-center gap-3">
            <div>
              <p className="text-sm font-bold text-[var(--color-text-primary)]">役員報酬1億円以上の企業一覧</p>
              <p className="text-xs text-[var(--color-text-muted)]">全業界の1億円プレイヤー企業</p>
            </div>
          </Link>
        </div>

        {/* 他業界へのリンク */}
        <section className="glass rounded-2xl p-6">
          <h2 className="text-base font-bold text-[var(--color-text-primary)] mb-4">
            他の業界の役員報酬ランキング
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {otherIndustries.map((ind) => (
              <Link
                key={ind.industry}
                href={`/ranking/executive-pay/${encodeURIComponent(ind.industry)}`}
                className="px-3 py-2.5 rounded-xl bg-[var(--color-surface-secondary)] hover:bg-[var(--color-primary-light)] text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors text-center"
              >
                {ind.industry}
              </Link>
            ))}
          </div>
        </section>

        <div className="glass rounded-2xl p-4 text-xs text-[var(--color-text-muted)] leading-relaxed">
          <strong className="text-[var(--color-text-secondary)]">データについて：</strong>
          有価証券報告書（EDINET）に記載された役員報酬総額÷役員員数で算出しています。
          ストックオプションや退職慰労金を含む場合があります。
        </div>

        <RankingNav current="/ranking/executive-pay" />
      </main>
      <Footer />
    </div>
  );
}
