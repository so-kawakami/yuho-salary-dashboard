import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { RankingNav } from "@/components/RankingNav";
import { getExecutivePayRanking, getExecPayOver1Oku, getExecPayIndustries } from "@/db/safe-queries";
import { formatManYen } from "@/lib/format";

const SITE_URL = "https://yuho-nenshu.com";

export function generateMetadata(): Metadata {
  const top = getExecutivePayRanking(1)[0];
  const topText = top ? `1位は${top.name}の${formatManYen(top.perPerson)}。` : "";
  return {
    title: "【2026年最新】役員報酬ランキング｜上場企業の役員年収トップ200",
    description: `有価証券報告書をもとにした上場企業の役員報酬ランキング2026年最新版。${topText}役員1人あたり報酬額・従業員年収との倍率を全${getExecutivePayRanking(Number.MAX_SAFE_INTEGER).length}社の公式データで比較。`,
    alternates: { canonical: `${SITE_URL}/ranking/executive-pay` },
  };
}

export const dynamic = "force-static";

const faqs = [
  {
    q: "役員報酬とは何ですか？",
    a: "役員報酬とは、取締役・監査役など会社の役員に支払われる報酬の総称です。基本報酬（固定給）のほか、業績連動報酬、ストックオプション（株式報酬）、退職慰労金などが含まれます。金額は株主総会の決議または定款で定められ、上場企業は有価証券報告書での開示が義務付けられています。",
  },
  {
    q: "「役員報酬1億円ルール」とは何ですか？",
    a: "2010年3月期から、連結報酬等の総額が1億円以上の役員は、有価証券報告書で氏名と個別の報酬額の開示が義務付けられています。これが通称「1億円ルール」です。このページのランキングは役員報酬総額を役員数で割った「1人あたり平均」で、個別開示とは算出方法が異なります。",
  },
  {
    q: "このランキングの計算方法は？",
    a: "各社の有価証券報告書に記載された役員報酬等の総額を、対象となる役員の員数で割って「役員1人あたり報酬」を算出しています。ストックオプションや退職慰労金を含む場合があります。データ出典はすべて金融庁EDINETの公式開示資料です。",
  },
  {
    q: "役員報酬と従業員の平均年収はどれくらい差がありますか？",
    a: "企業によって大きく異なりますが、ランキング上位企業では役員報酬が従業員平均年収の数十倍に達することもあります。このページでは各社の「従業員年収比」も掲載しているので、役員と従業員の格差も確認できます。",
  },
];

export default function ExecutivePayPage() {
  const data = getExecutivePayRanking(200);
  const over1oku = getExecPayOver1Oku();
  const industries = getExecPayIndustries();

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "ホーム", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "ランキング", item: `${SITE_URL}/ranking` },
        { "@type": "ListItem", position: 3, name: "役員報酬ランキング", item: `${SITE_URL}/ranking/executive-pay` },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "役員報酬ランキング（上場企業・1人あたり）",
      itemListElement: data.slice(0, 20).map((row: any, i: number) => ({
        "@type": "ListItem",
        position: i + 1,
        name: row.name,
        url: `${SITE_URL}/company/${row.code}`,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
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
          <Link href="/ranking" className="hover:text-[var(--color-primary)] transition-colors">ランキング</Link>
          <span>/</span>
          <span className="text-[var(--color-text-primary)]">役員報酬</span>
        </nav>

        <div>
          <h1 className="text-2xl font-extrabold text-[var(--color-text-primary)] mb-1">
            【2026年最新】役員報酬ランキング
          </h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            有価証券報告書ベース・役員1人あたり報酬額トップ{data.length}社（すべて金融庁EDINETの公式データ）
          </p>
        </div>

        {/* 注目ページへの導線 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link href="/ranking/executive-pay/1oku" className="glass rounded-xl p-4 glass-hover flex items-center gap-3">
            <div>
              <p className="text-sm font-bold text-[var(--color-text-primary)]">役員報酬1億円以上の企業一覧</p>
              <p className="text-xs text-[var(--color-text-muted)]">1人あたり平均1億円超えは{over1oku.length}社</p>
            </div>
          </Link>
          <a href="#industry" className="glass rounded-xl p-4 glass-hover flex items-center gap-3">
            <div>
              <p className="text-sm font-bold text-[var(--color-text-primary)]">業界別 役員報酬ランキング</p>
              <p className="text-xs text-[var(--color-text-muted)]">{industries.length}業界の役員報酬を比較</p>
            </div>
          </a>
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

        {/* 業界別ランキングへのリンク */}
        <section id="industry" className="glass rounded-2xl p-6">
          <h2 className="text-base font-bold text-[var(--color-text-primary)] mb-1">
            業界別 役員報酬ランキング
          </h2>
          <p className="text-xs text-[var(--color-text-muted)] mb-4">
            業界ごとの役員報酬水準を比較できます（カッコ内は業界内トップの1人あたり報酬）
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {industries.map((ind) => (
              <Link
                key={ind.industry}
                href={`/ranking/executive-pay/${encodeURIComponent(ind.industry)}`}
                className="px-3 py-2.5 rounded-xl bg-[var(--color-surface-secondary)] hover:bg-[var(--color-primary-light)] text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
              >
                {ind.industry}
                <span className="block text-[12px] text-[var(--color-text-muted)] mt-0.5">
                  最高 {ind.topPay >= 10_000 ? `${(ind.topPay / 10_000).toFixed(1)}億円` : `${ind.topPay.toLocaleString()}万円`}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* 解説・FAQ */}
        <section className="glass rounded-2xl p-6">
          <h2 className="text-base font-bold text-[var(--color-text-primary)] mb-4">
            役員報酬に関するよくある質問
          </h2>
          <div className="space-y-3">
            {faqs.map((f) => (
              <details key={f.q} className="rounded-xl bg-[var(--color-surface-secondary)] px-4 py-3 group">
                <summary className="flex items-center justify-between cursor-pointer list-none">
                  <span className="text-sm font-bold text-[var(--color-text-primary)] pr-4">Q. {f.q}</span>
                  <svg className="h-4 w-4 shrink-0 text-[var(--color-text-muted)] transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="mt-2 text-sm text-[var(--color-text-secondary)] leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <div className="glass rounded-2xl p-4 text-xs text-[var(--color-text-muted)] leading-relaxed">
          <strong className="text-[var(--color-text-secondary)]">データについて：</strong>
          有価証券報告書（EDINET）に記載された役員報酬総額÷役員員数で算出しています。
          ストックオプションや退職慰労金を含む場合があります。
          <a href="https://disclosure.edinet-fsa.go.jp/" target="_blank" rel="noopener noreferrer"
            className="text-[var(--color-primary)] hover:underline ml-1">EDINETで原典を確認</a>
        </div>

        <RankingNav current="/ranking/executive-pay" />
      </main>
      <Footer />
    </div>
  );
}
