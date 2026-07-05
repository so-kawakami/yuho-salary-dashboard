import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { RankingNav } from "@/components/RankingNav";
import { getExecPayOver1Oku } from "@/db/safe-queries";
import { formatManYen } from "@/lib/format";

const SITE_URL = "https://yuho-salary-dashboard.vercel.app";

export function generateMetadata(): Metadata {
  const list = getExecPayOver1Oku();
  const top = list[0];
  const topText = top ? `最高額は${top.name}の${formatManYen(top.perPerson)}。` : "";
  return {
    title: `【2026年最新】役員報酬1億円以上の上場企業一覧（全${list.length}社）`,
    description: `役員1人あたり報酬が1億円を超える上場企業${list.length}社の一覧。${topText}有価証券報告書（金融庁EDINET）の公式データから集計。企業名・業界・従業員年収との倍率も掲載。`,
    alternates: { canonical: `${SITE_URL}/ranking/executive-pay/1oku` },
  };
}

export const dynamic = "force-static";

export default function ExecPay1OkuPage() {
  const data = getExecPayOver1Oku();

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "ホーム", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "役員報酬ランキング", item: `${SITE_URL}/ranking/executive-pay` },
        { "@type": "ListItem", position: 3, name: "役員報酬1億円以上の企業一覧", item: `${SITE_URL}/ranking/executive-pay/1oku` },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "役員報酬1億円以上の上場企業一覧",
      itemListElement: data.map((row: any, i: number) => ({
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
          <span className="text-[var(--color-text-primary)]">1億円以上</span>
        </nav>

        <div>
          <h1 className="text-2xl font-extrabold text-[var(--color-text-primary)] mb-1">
            👑 役員報酬1億円以上の上場企業一覧
          </h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            役員1人あたり平均報酬が1億円を超える{data.length}社（有価証券報告書・2026年最新）
          </p>
        </div>

        <div className="glass rounded-2xl p-5 text-sm text-[var(--color-text-secondary)] leading-relaxed">
          <p>
            上場企業では、報酬1億円以上の役員は氏名と金額の個別開示が義務付けられています（通称「1億円ルール」）。
            このページでは、有価証券報告書の役員報酬総額から算出した<strong className="text-[var(--color-text-primary)]">「役員1人あたり平均報酬」が1億円を超える{data.length}社</strong>を掲載しています。
            平均で1億円を超えるのは上場企業でもごく一握りです。
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

        <div className="glass rounded-2xl p-4 text-xs text-[var(--color-text-muted)] leading-relaxed">
          <strong className="text-[var(--color-text-secondary)]">データについて：</strong>
          有価証券報告書（EDINET）に記載された役員報酬総額÷役員員数で算出した「1人あたり平均」です。
          個別開示（1億円ルール）の報酬額とは算出方法が異なります。
          ストックオプションや退職慰労金を含む場合があります。
        </div>

        <div className="text-center">
          <Link
            href="/ranking/executive-pay"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] text-white text-sm font-bold shadow-lg hover:opacity-90 transition-opacity"
          >
            役員報酬ランキング トップ200を見る →
          </Link>
        </div>

        <RankingNav current="/ranking/executive-pay" />
      </main>
      <Footer />
    </div>
  );
}
