import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SalaryChecker } from "@/components/SalaryChecker";
import { SalaryHistogram } from "@/components/SalaryHistogram";
import { HeroSearch } from "@/components/HeroSearch";
import { AdBanner } from "@/components/AdBanner";
import { buildHistogram } from "@/lib/distribution";
import { getRanking, getStatsData, getIndustries, getAllCompanies, getFeaturedComparisons } from "@/db/safe-queries";

export const dynamic = "force-static";
export const revalidate = 86400;

export default function Home() {
  const ranking = getRanking(100);
  const stats = getStatsData();
  const industries = getIndustries();
  const allCompanies = getAllCompanies();

  // 分布ヒストグラム（全社の年収から集計）
  const histogram = buildHistogram(allCompanies.map((c) => c.salary));

  // 最高年収の企業・トップ業界
  const topCompany = ranking[0];
  const topIndustry = [...industries]
    .filter((i) => i.industry && i.companies >= 3)
    .sort((a, b) => b.avgSalary - a.avgSalary)[0];

  // 偏差値チェッカー用：年収帯（100万円刻み）ごとに代表企業を最大6社サンプリング
  const checkerSamples = (() => {
    const byBand = new Map<number, { code: string; name: string; salary: number }[]>();
    for (const c of allCompanies) {
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

  // 注目の年収比較（主要業界のトップ2社対決）
  const featuredComparisons = getFeaturedComparisons(6);

  // 高年収・若手に人気の企業（平均年齢が低くて年収が高い）
  const youngHighPay = ranking
    .filter((r) => r.avgAge > 0 && r.avgAge < 38 && r.salary > 600)
    .slice(0, 4);

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
      url: "https://yuho-nenshu.com",
      description:
        "金融庁EDINETの有価証券報告書をもとに、上場企業を含む4,000社以上の平均年収を集計・公開。業界別ランキング・企業検索・年収偏差値チェッカーが使えます。",
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate:
            "https://yuho-nenshu.com/search?q={search_term_string}",
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
    <div className="flex flex-col min-h-full">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          {/* ヒーロー: 検索と統計が主役 */}
          <section className="pt-10 pb-6 lg:pt-16 lg:pb-10 grid lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-10 lg:gap-16 items-center">
            <div>
              <p className="text-[13px] sm:text-sm text-[var(--color-primary)] font-bold tracking-[0.05em]">
                有価証券報告書ベースの年収データ
              </p>
              <h1 className="text-[28px] sm:text-[44px] font-black leading-[1.45] sm:leading-[1.4] mt-3 text-[var(--color-text)]">
                気になるあの会社の年収、
                <br className="hidden sm:block" />
                本当の数字で。
              </h1>
              <p className="text-[14.5px] sm:text-[15px] leading-[1.9] sm:leading-[2.0] text-[var(--color-text-muted)] mt-4">
                口コミの推定でも、求人票の「モデル年収」でもなく。企業が国に提出する書類に記載された平均年間給与を、上場企業{stats.totalCompanies.toLocaleString()}社ぶん収録しています。
              </p>
              <div className="mt-7">
                <HeroSearch />
              </div>
              <div className="flex sm:hidden flex-wrap gap-2 mt-3">
                {["キーエンス", "トヨタ", "任天堂"].map((name) => (
                  <Link
                    key={name}
                    href={`/search?q=${encodeURIComponent(name)}`}
                    className="text-[13.5px] px-3.5 py-[7px] rounded-full bg-white border border-[var(--color-border-input)] text-[var(--color-text-body)]"
                  >
                    {name}
                  </Link>
                ))}
              </div>
            </div>

            {/* 統計カード */}
            <div className="bg-white border-[1.5px] border-[var(--color-border)] rounded-2xl px-7 py-7 sm:px-9 sm:py-8">
              <p className="text-[15px] font-bold text-[var(--color-text)] mb-4">
                上場企業のいま{" "}
                <span className="text-[12.5px] text-[var(--color-text-faint)] font-normal ml-1.5">
                  {stats.dataYear}
                </span>
              </p>
              <dl>
                <div className="flex justify-between items-baseline py-[13px] border-t border-[var(--color-border-subtle)]">
                  <dt className="text-[14.5px] text-[var(--color-text-muted)]">平均年収</dt>
                  <dd className="text-[26px] font-black text-[var(--color-text)]">
                    {stats.averageSalary.toLocaleString()}
                    <span className="text-sm font-bold text-[var(--color-text-faint)]">万円</span>
                  </dd>
                </div>
                <div className="flex justify-between items-baseline py-[13px] border-t border-[var(--color-border-subtle)]">
                  <dt className="text-[14.5px] text-[var(--color-text-muted)]">中央値</dt>
                  <dd className="text-[26px] font-black text-[var(--color-text)]">
                    {stats.medianSalary.toLocaleString()}
                    <span className="text-sm font-bold text-[var(--color-text-faint)]">万円</span>
                  </dd>
                </div>
                {topCompany && (
                  <div className="flex justify-between items-baseline gap-3 py-[13px] border-t border-[var(--color-border-subtle)]">
                    <dt className="text-[14.5px] text-[var(--color-text-muted)] min-w-0">
                      最高（{topCompany.name.replace(/株式会社/g, "")}）
                    </dt>
                    <dd className="text-[26px] font-black text-[var(--color-primary)] whitespace-nowrap shrink-0">
                      {topCompany.salary.toLocaleString()}
                      <span className="text-sm font-bold text-[var(--color-text-faint)]">万円</span>
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </section>

          {/* 分布セクション */}
          <section className="pb-4">
            <div className="bg-[var(--color-surface-section)] rounded-2xl px-6 py-7 sm:px-10 sm:py-9">
              <div className="flex justify-between items-baseline flex-wrap gap-2">
                <h2 className="text-[15px] sm:text-[17px] font-black text-[var(--color-text)]">
                  {stats.totalCompanies.toLocaleString()}社はこう分布している
                </h2>
                <a
                  href="#checker"
                  className="text-sm text-[var(--color-primary)] font-bold hover:underline"
                >
                  あなたの位置を見る →
                </a>
              </div>
              <div className="mt-7">
                <SalaryHistogram
                  bars={histogram}
                  height={100}
                  axisLabels={[
                    { text: "〜300万" },
                    { text: `中央値 ${stats.medianSalary.toLocaleString()}万`, highlight: true },
                    { text: "1,000万" },
                    { text: "1,500万" },
                    { text: "2,500万+" },
                  ]}
                />
              </div>
            </div>

            {/* 3枚カード列 */}
            <div className="grid sm:grid-cols-3 gap-4 mt-4">
              <Link
                href="/ranking"
                className="bg-white border-[1.5px] border-[var(--color-border)] rounded-2xl px-7 py-6 hover:bg-[var(--color-surface-section)] transition-colors"
              >
                <p className="text-[15.5px] font-black text-[var(--color-text)]">年収ランキング</p>
                {topCompany && (
                  <p className="text-[13.5px] text-[var(--color-text-faint)] mt-1">
                    1位 {topCompany.name} {topCompany.salary.toLocaleString()}万円
                  </p>
                )}
                <p className="text-sm text-[var(--color-primary)] font-bold mt-4">
                  全{allCompanies.filter((c) => c.salary > 0).length.toLocaleString()}社を見る →
                </p>
              </Link>
              <Link
                href="/industries"
                className="bg-white border-[1.5px] border-[var(--color-border)] rounded-2xl px-7 py-6 hover:bg-[var(--color-surface-section)] transition-colors"
              >
                <p className="text-[15.5px] font-black text-[var(--color-text)]">業界別 平均年収</p>
                {topIndustry && (
                  <p className="text-[13.5px] text-[var(--color-text-faint)] mt-1">
                    1位 {topIndustry.industry} {topIndustry.avgSalary.toLocaleString()}万円
                  </p>
                )}
                <p className="text-sm text-[var(--color-primary)] font-bold mt-4">
                  全{industries.filter((i) => i.industry && i.companies > 0).length}業界を見る →
                </p>
              </Link>
              <a
                href="#checker"
                className="bg-[var(--color-primary)] text-white rounded-2xl px-7 py-6 hover:bg-[var(--color-primary-dark)] transition-colors"
              >
                <p className="text-[15.5px] font-black">年収偏差値チェッカー</p>
                <p className="text-[13.5px] text-[#b9cfec] mt-1">
                  {stats.totalCompanies.toLocaleString()}社の中でのあなたの位置
                </p>
                <p className="text-sm font-bold mt-4">30秒で診断する →</p>
              </a>
            </div>
          </section>
        </div>

        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12 pb-16 pt-8 space-y-12">
          {/* 年収偏差値チェッカー */}
          <section id="checker" className="scroll-mt-20">
            <SalaryChecker stats={stats} sampleCompanies={checkerSamples} />
          </section>

          {/* 広告 */}
          <AdBanner slot="7121378512" format="auto" />

          {/* 役員報酬特集（検索流入の主力テーマ） */}
          <section>
            <div className="mb-4">
              <h2 className="text-[17px] sm:text-lg font-black text-[var(--color-text)]">役員報酬ランキング</h2>
              <p className="text-sm text-[var(--color-text-faint)] mt-0.5">経営トップの報酬はいくら？ 有価証券報告書の公式データで公開</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { href: "/ranking/executive-pay", title: "役員報酬ランキング TOP200", sub: "役員1人あたり報酬額・従業員年収との倍率つき" },
                { href: "/ranking/executive-pay/1oku", title: "報酬1億円以上の企業一覧", sub: "1人あたり平均1億円超えの上場企業だけを厳選" },
                { href: "/ranking/executive-pay#industry", title: "業界別 役員報酬ランキング", sub: "33業界ごとの役員報酬水準を比較" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="bg-white border border-[var(--color-border)] rounded-2xl px-7 py-6 hover:bg-[var(--color-surface-section)] transition-colors"
                >
                  <p className="text-[15px] font-bold text-[var(--color-text)]">{item.title}</p>
                  <p className="text-[13px] text-[var(--color-text-faint)] mt-1.5 leading-relaxed">{item.sub}</p>
                  <p className="text-sm text-[var(--color-primary)] font-bold mt-3">見る →</p>
                </Link>
              ))}
            </div>
          </section>

          {/* 注目の年収比較 */}
          {featuredComparisons.length > 0 && (
            <section>
              <div className="mb-4">
                <h2 className="text-[17px] sm:text-lg font-black text-[var(--color-text)]">注目の年収比較</h2>
                <p className="text-sm text-[var(--color-text-faint)] mt-0.5">主要業界のトップ企業を直接比較</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {featuredComparisons.map((c) => (
                  <Link
                    key={c.codes}
                    href={`/compare/${c.codes}`}
                    className="bg-white border border-[var(--color-border)] rounded-2xl px-6 py-5 hover:bg-[var(--color-surface-section)] transition-colors block"
                  >
                    <p className="text-xs text-[var(--color-text-faint)] mb-3">{c.industry}</p>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0 text-center">
                        <p className="text-sm font-bold text-[var(--color-text)] truncate">{c.name1}</p>
                        <p className="text-lg font-black text-[var(--color-primary)]">{c.salary1.toLocaleString()}<span className="text-xs font-bold text-[var(--color-text-faint)]">万</span></p>
                      </div>
                      <span className="shrink-0 text-[13px] font-bold text-[var(--color-text-faint)]">vs</span>
                      <div className="flex-1 min-w-0 text-center">
                        <p className="text-sm font-bold text-[var(--color-text)] truncate">{c.name2}</p>
                        <p className="text-lg font-black text-[var(--color-primary)]">{c.salary2.toLocaleString()}<span className="text-xs font-bold text-[var(--color-text-faint)]">万</span></p>
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
                  <h2 className="text-[17px] sm:text-lg font-black text-[var(--color-text)]">若手に人気の高年収企業</h2>
                  <p className="text-sm text-[var(--color-text-faint)] mt-0.5">平均年齢38歳未満 × 年収600万円以上</p>
                </div>
                <Link href="/ranking/young-high-income" className="text-sm font-bold text-[var(--color-primary)] hover:underline shrink-0">
                  もっと見る →
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {youngHighPay.map((r) => (
                  <Link
                    key={r.code}
                    href={`/company/${r.code}`}
                    className="bg-white border border-[var(--color-border)] rounded-2xl px-6 py-5 hover:bg-[var(--color-surface-section)] transition-colors block"
                  >
                    <p className="text-xs text-[var(--color-text-faint)] mb-1">{r.industry || ""}</p>
                    <p className="text-sm font-bold text-[var(--color-text)] mb-3">{r.name}</p>
                    <p className="text-2xl font-black text-[var(--color-primary)]">{r.salary.toLocaleString()}<span className="text-sm font-bold text-[var(--color-text-faint)]"> 万円</span></p>
                    <p className="text-xs text-[var(--color-text-faint)] mt-1">平均 {r.avgAge}歳</p>
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
                  <h2 className="text-[17px] sm:text-lg font-black text-[var(--color-text)]">長く働ける高年収企業</h2>
                  <p className="text-sm text-[var(--color-text-faint)] mt-0.5">平均勤続年数が長い × 年収500万円以上</p>
                </div>
                <Link href="/ranking/long-tenure" className="text-sm font-bold text-[var(--color-primary)] hover:underline shrink-0">
                  もっと見る →
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {longTenure.map((r) => (
                  <Link
                    key={r.code}
                    href={`/company/${r.code}`}
                    className="bg-white border border-[var(--color-border)] rounded-2xl px-6 py-5 hover:bg-[var(--color-surface-section)] transition-colors block"
                  >
                    <p className="text-xs text-[var(--color-text-faint)] mb-1">{r.industry || ""}</p>
                    <p className="text-sm font-bold text-[var(--color-text)] mb-3">{r.name}</p>
                    <p className="text-2xl font-black text-[var(--color-primary)]">{r.salary.toLocaleString()}<span className="text-sm font-bold text-[var(--color-text-faint)]"> 万円</span></p>
                    <p className="text-xs text-[var(--color-text-faint)] mt-1">平均勤続 {r.avgTenure}年</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* よくある質問 */}
          <section>
            <div className="mb-4">
              <h2 className="text-[17px] sm:text-lg font-black text-[var(--color-text)]">よくある質問</h2>
              <p className="text-sm text-[var(--color-text-faint)] mt-0.5">データの見方・注意点</p>
            </div>
            <div className="space-y-3">
              {faqs.map((f) => (
                <details
                  key={f.q}
                  className="bg-white border border-[var(--color-border)] rounded-2xl px-6 py-4 group"
                >
                  <summary className="flex items-center justify-between cursor-pointer list-none min-h-8">
                    <span className="text-[15px] font-bold text-[var(--color-text)] pr-4">
                      Q. {f.q}
                    </span>
                    <svg
                      className="h-5 w-5 shrink-0 text-[var(--color-text-faint)] transition-transform group-open:rotate-180"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <p className="mt-3 text-[15px] text-[var(--color-text-body)] leading-[1.9]">
                    {f.a}
                  </p>
                </details>
              ))}
            </div>
            <div className="mt-4 text-center">
              <Link href="/about" className="text-sm font-bold text-[var(--color-primary)] hover:underline">
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
