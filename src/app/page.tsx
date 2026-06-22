import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { StatsCards } from "@/components/StatsCards";
import { SalaryChecker } from "@/components/SalaryChecker";
import { AdBanner } from "@/components/AdBanner";
import { getRanking, getStatsData, getIndustries, getAllCompanies, getFeaturedComparisons } from "@/db/safe-queries";

export const dynamic = "force-static";
export const revalidate = 86400;

export default function Home() {
  const ranking = getRanking(100);
  const stats = getStatsData();
  const industries = getIndustries();

  // 偏差値チェッカー用：年収帯（100万円刻み）ごとに代表企業を最大6社サンプリング
  const checkerSamples = (() => {
    const byBand = new Map<number, { code: string; name: string; salary: number }[]>();
    for (const c of getAllCompanies()) {
      if (!c.salary || !c.code) continue;
      const band = Math.floor(c.salary / 100);
      const list = byBand.get(band) ?? [];
      if (list.length < 6) {
        list.push({ code: c.code, name: c.name, salary: c.salary });
        byBand.set(band, list);
      }
    }
    return Array.from(byBand.values()).flat();
  })();

  // 業界別ハイライト（全社集計データから上位4業界）
  const topIndustries = industries
    .filter((i) => i.industry && i.companies >= 3)
    .slice(0, 4);

  // 高年収・若手に人気の企業（平均年齢が低くて年収が高い）
  const youngHighPay = ranking
    .filter((r) => r.avgAge > 0 && r.avgAge < 38 && r.salary > 600)
    .slice(0, 4);

  // ランキングTOP5（コンパクトプレビュー）
  const top5 = ranking.slice(0, 5);

  // 注目の年収比較（主要業界のトップ2社対決）
  const featuredComparisons = getFeaturedComparisons(6);

  // 勤続年数が長い企業TOP4（年収だけじゃない切り口）
  const longTenure = [...ranking]
    .filter((r) => r.avgTenure > 0 && r.salary > 500)
    .sort((a, b) => b.avgTenure - a.avgTenure)
    .slice(0, 4);

  // よくある質問（FAQ）— 滞在時間・YMYL信頼性・検索リッチリザルト用
  const faqs = [
    {
      q: "平均年収のデータはどこから来ていますか？",
      a: "すべて金融庁が運営する電子開示システム「EDINET」に各企業が提出した有価証券報告書から取得しています。有価証券報告書は金融商品取引法に基づく法定開示書類で、内容は法的根拠のある公式データです。",
    },
    {
      q: "「平均年収」は何を指していますか？",
      a: "有価証券報告書に記載される「平均年間給与」で、提出会社（単体）の正社員の値です。賞与・基準外賃金（残業代）を含みます。連結子会社の社員・パート・アルバイト・派遣社員は含まれません。",
    },
    {
      q: "データはいつ時点のものですか？",
      a: `各企業が直近に提出した有価証券報告書の値で、多くは2025年3月期（2024年4月〜2025年3月）です。決算月は企業によって異なります。現在${stats.totalCompanies.toLocaleString()}社のデータを掲載しています。`,
    },
    {
      q: "持株会社の年収が高く見えるのはなぜですか？",
      a: "持株会社（ホールディングス）は従業員が管理部門中心で少人数のため、平均年収が高く算出される傾向があります。事業会社の実態とは異なる場合があるため、グループ全体の水準を見る際は注意が必要です。",
    },
  ];

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "有報年収ダッシュボード",
      url: "https://yuho-salary-dashboard.vercel.app",
      description:
        "金融庁EDINETの有価証券報告書をもとに、上場企業を含む4,000社以上の平均年収を集計・公開。業界別ランキング・企業検索・年収偏差値チェッカーが使えます。",
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate:
            "https://yuho-salary-dashboard.vercel.app/search?q={search_term_string}",
        },
        "query-input": "required name=search_term_string",
      },
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
                <span className="text-[var(--color-text-primary)]">知ってる？</span>
              </h2>
              <p className="text-base sm:text-lg text-[var(--color-text-secondary)] max-w-xl mx-auto mb-8 leading-relaxed">
                金融庁EDINETの有価証券報告書から、上場企業の平均年収を自動集計。
                業界別比較やトレンド分析をダッシュボードで。
              </p>
              <div className="flex justify-center">
                <Link
                  href="/search"
                  className="relative w-full max-w-lg group"
                >
                  <div className="w-full h-14 rounded-2xl glass px-5 pl-12 text-base flex items-center text-[var(--color-text-muted)] group-hover:ring-2 group-hover:ring-[var(--color-primary)] transition cursor-text">
                    企業名・業種で検索...
                  </div>
                  <svg className="absolute left-4 top-4 h-5 w-5 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </Link>
              </div>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {["キーエンス", "トヨタ", "ソニー", "三菱商事", "任天堂"].map((name) => (
                  <Link
                    key={name}
                    href={`/search?q=${encodeURIComponent(name)}`}
                    className="text-xs px-3 py-1.5 rounded-full glass text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
                  >
                    {name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16 space-y-12">
          {/* 統計カード */}
          <section>
            <StatsCards stats={stats} />
          </section>

          {/* 年収偏差値チェッカー */}
          <section id="checker" className="scroll-mt-20">
            <SalaryChecker stats={stats} sampleCompanies={checkerSamples} />
          </section>

          {/* 広告 */}
          <AdBanner slot="7121378512" format="auto" />

          {/* 業界別ハイライト（全社集計ベース） */}
          {topIndustries.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-[var(--color-text-primary)]">業界別 平均年収</h2>
                  <p className="text-sm text-[var(--color-text-muted)]">平均年収が高い業界トップ4</p>
                </div>
                <Link href="/industries" className="text-sm text-[var(--color-primary)] hover:underline flex items-center gap-1">
                  もっと見る
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {topIndustries.map((ind, i) => (
                  <Link
                    key={ind.industry}
                    href={`/industries/${ind.industry}`}
                    className="glass rounded-xl p-4 glass-hover block"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                        i === 0 ? "bg-[var(--color-primary)]" : "bg-[var(--color-text-muted)]"
                      }`}>
                        {i + 1}
                      </span>
                      <span className="text-xs text-[var(--color-text-muted)]">{ind.companies}社</span>
                    </div>
                    <p className="text-sm font-bold text-[var(--color-text-primary)] mb-1">{ind.industry}</p>
                    <p className="text-2xl font-extrabold text-gradient">{ind.avgSalary.toLocaleString()}<span className="text-sm font-normal text-[var(--color-text-secondary)]"> 万円</span></p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* 年収ランキング TOP5（コンパクト） */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-[var(--color-text-primary)]">年収ランキング</h2>
                <p className="text-sm text-[var(--color-text-muted)]">有価証券報告書ベース</p>
              </div>
              <Link href="/ranking" className="text-sm text-[var(--color-primary)] hover:underline flex items-center gap-1">
                全ランキングを見る
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            <div className="space-y-2">
              {top5.map((r, i) => (
                <Link
                  key={r.code}
                  href={`/company/${r.code}`}
                  className="glass rounded-xl px-5 py-4 glass-hover flex items-center gap-4"
                >
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                    i === 0 ? "bg-yellow-400 text-white" :
                    i === 1 ? "bg-gray-300 text-white" :
                    i === 2 ? "bg-amber-600 text-white" :
                    "bg-[var(--color-surface-secondary)] text-[var(--color-text-muted)]"
                  }`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[var(--color-text-primary)] truncate">{r.name}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">{r.industry || ""}</p>
                  </div>
                  <p className="text-xl font-extrabold text-gradient shrink-0">
                    {r.salary.toLocaleString()}<span className="text-sm font-normal text-[var(--color-text-secondary)]"> 万円</span>
                  </p>
                </Link>
              ))}
            </div>
          </section>

          {/* 注目の年収比較 */}
          {featuredComparisons.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-[var(--color-text-primary)]">注目の年収比較</h2>
                  <p className="text-sm text-[var(--color-text-muted)]">主要業界のトップ企業を直接比較</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {featuredComparisons.map((c) => (
                  <Link
                    key={c.codes}
                    href={`/compare/${c.codes}`}
                    className="glass rounded-xl p-5 glass-hover block"
                  >
                    <p className="text-xs text-[var(--color-text-muted)] mb-3">{c.industry}</p>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0 text-center">
                        <p className="text-sm font-bold text-[var(--color-text-primary)] truncate">{c.name1}</p>
                        <p className="text-lg font-extrabold text-gradient">{c.salary1.toLocaleString()}<span className="text-xs font-normal text-[var(--color-text-secondary)]">万</span></p>
                      </div>
                      <span className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center text-white text-xs font-extrabold">VS</span>
                      <div className="flex-1 min-w-0 text-center">
                        <p className="text-sm font-bold text-[var(--color-text-primary)] truncate">{c.name2}</p>
                        <p className="text-lg font-extrabold text-gradient">{c.salary2.toLocaleString()}<span className="text-xs font-normal text-[var(--color-text-secondary)]">万</span></p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* 若手向け高年収企業 */}
          {youngHighPay.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-[var(--color-text-primary)]">若手に人気の高年収企業</h2>
                  <p className="text-sm text-[var(--color-text-muted)]">平均年齢38歳未満 × 年収600万円以上</p>
                </div>
                <Link href="/ranking" className="text-sm text-[var(--color-primary)] hover:underline flex items-center gap-1">
                  ランキングへ
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {youngHighPay.map((r) => (
                  <Link
                    key={r.code}
                    href={`/company/${r.code}`}
                    className="glass rounded-xl p-5 glass-hover block"
                  >
                    <p className="text-xs text-[var(--color-text-muted)] mb-1">{r.industry || ""}</p>
                    <p className="text-sm font-bold text-[var(--color-text-primary)] mb-3">{r.name}</p>
                    <p className="text-2xl font-extrabold text-gradient">{r.salary.toLocaleString()}<span className="text-sm font-normal text-[var(--color-text-secondary)]"> 万円</span></p>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">平均 {r.avgAge}歳</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* 長く働ける高年収企業 */}
          {longTenure.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-[var(--color-text-primary)]">長く働ける高年収企業</h2>
                  <p className="text-sm text-[var(--color-text-muted)]">平均勤続年数が長い × 年収500万円以上</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {longTenure.map((r) => (
                  <Link
                    key={r.code}
                    href={`/company/${r.code}`}
                    className="glass rounded-xl p-5 glass-hover block"
                  >
                    <p className="text-xs text-[var(--color-text-muted)] mb-1">{r.industry || ""}</p>
                    <p className="text-sm font-bold text-[var(--color-text-primary)] mb-3">{r.name}</p>
                    <p className="text-2xl font-extrabold text-gradient">{r.salary.toLocaleString()}<span className="text-sm font-normal text-[var(--color-text-secondary)]"> 万円</span></p>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">平均勤続 {r.avgTenure}年</p>
                  </Link>
                ))}
              </div>
            </section>
          )}
          {/* よくある質問 */}
          <section>
            <div className="mb-4">
              <h2 className="text-xl font-bold text-[var(--color-text-primary)]">よくある質問</h2>
              <p className="text-sm text-[var(--color-text-muted)]">データの見方・注意点</p>
            </div>
            <div className="space-y-3">
              {faqs.map((f) => (
                <details
                  key={f.q}
                  className="glass rounded-xl px-5 py-4 group"
                >
                  <summary className="flex items-center justify-between cursor-pointer list-none">
                    <span className="text-sm font-bold text-[var(--color-text-primary)] pr-4">
                      Q. {f.q}
                    </span>
                    <svg
                      className="h-5 w-5 shrink-0 text-[var(--color-text-muted)] transition-transform group-open:rotate-180"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <p className="mt-3 text-sm text-[var(--color-text-secondary)] leading-relaxed">
                    {f.a}
                  </p>
                </details>
              ))}
            </div>
            <div className="mt-4 text-center">
              <Link href="/about" className="text-sm text-[var(--color-primary)] hover:underline">
                データの詳しい説明・集計方法を見る →
              </Link>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
