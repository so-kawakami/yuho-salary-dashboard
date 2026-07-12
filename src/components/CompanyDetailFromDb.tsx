"use client";

import Link from "next/link";
import { track } from "@vercel/analytics";
import { AdBanner } from "@/components/AdBanner";
import { SalaryHistogram } from "@/components/SalaryHistogram";
import { TrendLine } from "@/components/TrendLine";
import type { HistogramBar } from "@/lib/distribution";
import {
  LineChart,
  Line,
  Bar,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatManYen } from "@/lib/format";

interface Company {
  name: string;
  secCode: string | null;
  industry: string | null;
  edinetCode: string;
}

interface SalaryRecord {
  fiscalYear: string;
  avgSalary: number | null;
  employees: number | null;
  avgAge: number | null;
  avgTenure: number | null;
  tempWorkers: number | null;
  genderWageGapAll: number | null;
  genderWageGapFull: number | null;
  genderWageGapPart: number | null;
  maleParentalLeaveRate: number | null;
  femaleManagerRate: number | null;
  execCompTotal: number | null;
  execCompCount: number | null;
}

interface FinancialsRecord {
  fiscalYear: string;
  netSales: number | null;
  operatingIncome: number | null;
  ordinaryIncome: number | null;
  netIncome: number | null;
  isConsolidated: boolean;
}

interface Peer {
  code: string;
  name: string;
  salary: number;
  employees: number;
}

interface SimilarCompany {
  code: string;
  name: string;
  industry: string;
  salary: number;
}

interface IndustryDei {
  genderWageGapAll: number | null;
  genderWageGapFull: number | null;
  genderWageGapPart: number | null;
  maleParentalLeaveRate: number | null;
  femaleManagerRate: number | null;
  companyCount: number;
}

/** ページ側で集計するランキング・分布コンテキスト */
export interface RankContext {
  rank: number;
  totalRanked: number;
  industryAvg: number | null;
  industryRank: number | null;
  industryCount: number;
  median: number;
  histogram: HistogramBar[];
  highlightIndex: number;
}

// チャートは紺青の濃淡のみ（多色パレット全廃）
const CHART_COLORS = ["#1e56a0", "#6b93c4", "#a3bedd"];

const CARD = "bg-white border border-[var(--color-border)] rounded-2xl";

export function CompanyDetailFromDb({
  company,
  salaryHistory,
  peers = [],
  financialsHistory = [],
  industryDei = null,
  similarCompanies = [],
  context = null,
  faq = [],
}: {
  company: Company;
  salaryHistory: SalaryRecord[];
  peers?: Peer[];
  financialsHistory?: FinancialsRecord[];
  industryDei?: IndustryDei | null;
  similarCompanies?: SimilarCompany[];
  context?: RankContext | null;
  faq?: { q: string; a: string }[];
}) {
  const latest = salaryHistory[salaryHistory.length - 1];
  const salaryMan = latest?.avgSalary ? Math.round(latest.avgSalary / 10000) : 0;

  const trendPoints = salaryHistory
    .filter((s) => s.avgSalary)
    .slice(-6)
    .map((s) => ({
      label: `FY${s.fiscalYear.split("-")[0]}`,
      value: Math.round(s.avgSalary! / 10000),
    }));

  const trendDiff =
    trendPoints.length >= 2
      ? trendPoints[trendPoints.length - 1].value - trendPoints[0].value
      : null;

  const percentileTop =
    context && context.totalRanked > 0
      ? Math.max(0.1, Math.round((context.rank / context.totalRanked) * 1000) / 10)
      : null;

  const industryDiff =
    context?.industryAvg != null ? salaryMan - context.industryAvg : null;

  // 分布のピルラベル用に社名を短縮
  const shortName =
    company.name.replace(/株式会社|ホールディングス/g, "").trim() || company.name;

  // 比較CTA用のピア（年収が近い順に並べ替え）
  const sortedPeers = [...peers].sort(
    (a, b) => Math.abs(a.salary - salaryMan) - Math.abs(b.salary - salaryMan)
  );
  const comparePeer = sortedPeers[0];
  const compareHref =
    comparePeer && company.secCode
      ? `/compare/${[company.secCode, comparePeer.code].sort().join("-vs-")}`
      : null;

  return (
    <div className="space-y-4">
      {/* ── ファーストビュー: 答えを全部置く ── */}
      <div className="grid lg:grid-cols-[minmax(0,1fr)_380px] gap-8 lg:gap-14 pt-2 pb-4 lg:items-center">
        <div>
          {/* パンくず */}
          <nav className="text-[13px] sm:text-[13.5px] text-[var(--color-text-faint)]">
            <Link href="/" className="hover:text-[var(--color-primary)]">ホーム</Link>
            <span className="mx-1.5">/</span>
            <Link href="/search" className="hover:text-[var(--color-primary)]">企業を探す</Link>
            {company.industry && (
              <>
                <span className="mx-1.5">/</span>
                <Link
                  href={`/industries/${encodeURIComponent(company.industry)}`}
                  className="hover:text-[var(--color-primary)]"
                >
                  {company.industry}
                </Link>
              </>
            )}
          </nav>

          {/* 企業名 */}
          <div className="flex items-baseline gap-3 flex-wrap mt-3">
            <h1 className="text-[24px] sm:text-[38px] font-black text-[var(--color-text)]">
              {company.name}
            </h1>
            {company.secCode && (
              <span className="text-[13.5px] bg-[var(--color-primary-tint)] rounded-md px-2.5 py-0.5 text-[var(--color-text-body)]">
                {company.secCode}
              </span>
            )}
            {company.industry && (
              <span className="text-sm text-[var(--color-text-faint)]">
                {company.industry}
              </span>
            )}
          </div>

          {/* 年収数字（主役） */}
          <div className="flex items-baseline gap-4 sm:gap-5 mt-4 sm:mt-5 flex-wrap">
            <span className="text-[56px] sm:text-[84px] font-black leading-none tracking-[-0.02em] text-[var(--color-primary)]">
              {salaryMan > 0 ? salaryMan.toLocaleString() : "—"}
              {salaryMan > 0 && (
                <span className="text-[18px] sm:text-2xl font-bold">万円</span>
              )}
            </span>
            <span className="text-[13px] sm:text-[14.5px] leading-[1.7] text-[var(--color-text-muted)]">
              平均年間給与
              <br />
              <span className="text-[12px] sm:text-[13px] text-[var(--color-text-faint)]">
                {latest?.fiscalYear ? `${formatFiscalYear(latest.fiscalYear)} 有価証券報告書` : "有価証券報告書"}
              </span>
            </span>
          </div>

          {/* 要約文: 順位・パーセンタイル・業界差 */}
          {context && salaryMan > 0 && (
            <p className="text-[14.5px] sm:text-[15.5px] leading-[1.9] text-[var(--color-text-body)] mt-4">
              上場企業{context.totalRanked.toLocaleString()}社中{" "}
              <strong className="text-[var(--color-primary)]">
                {context.rank.toLocaleString()}位（上位{percentileTop}%）
              </strong>
              {industryDiff != null && context.industryAvg != null && (
                <>
                  。業界平均（{context.industryAvg.toLocaleString()}万円）を{" "}
                  <strong className="text-[var(--color-primary)]">
                    {industryDiff >= 0 ? "+" : "−"}
                    {Math.abs(industryDiff).toLocaleString()}万円
                  </strong>{" "}
                  {industryDiff >= 0 ? "上回ります" : "下回ります"}
                </>
              )}
              。
            </p>
          )}
        </div>

        {/* ファクトカード */}
        <div>
          {/* モバイル: 3列コンパクト */}
          <div className={`lg:hidden ${CARD} grid grid-cols-3 text-center py-4`}>
            <div className="border-r border-[var(--color-border-subtle)]">
              <p className="text-[12px] text-[var(--color-text-faint)]">平均年齢</p>
              <p className="text-[17px] font-black mt-0.5">
                {latest?.avgAge ? `${latest.avgAge}歳` : "—"}
              </p>
            </div>
            <div className="border-r border-[var(--color-border-subtle)]">
              <p className="text-[12px] text-[var(--color-text-faint)]">勤続</p>
              <p className="text-[17px] font-black mt-0.5">
                {latest?.avgTenure ? `${latest.avgTenure}年` : "—"}
              </p>
            </div>
            <div>
              <p className="text-[12px] text-[var(--color-text-faint)]">従業員</p>
              <p className="text-[17px] font-black mt-0.5">
                {latest?.employees ? `${latest.employees.toLocaleString()}名` : "—"}
              </p>
            </div>
          </div>
          {/* デスクトップ: 行区切りリスト */}
          <dl className={`hidden lg:block ${CARD} px-8 py-4`}>
            {[
              { label: "平均年齢", value: latest?.avgAge, unit: "歳" },
              { label: "平均勤続年数", value: latest?.avgTenure, unit: "年" },
              { label: "従業員数（単体）", value: latest?.employees?.toLocaleString(), unit: "名" },
            ].map((row) => (
              <div
                key={row.label}
                className="flex justify-between items-baseline py-[11px] border-b border-[var(--color-border-subtle)]"
              >
                <dt className="text-sm text-[var(--color-text-muted)]">{row.label}</dt>
                <dd className="text-[19px] font-bold">
                  {row.value ?? "—"}
                  <span className="text-[13px] text-[var(--color-text-faint)]">{row.value != null ? row.unit : ""}</span>
                </dd>
              </div>
            ))}
            <div className="flex justify-between items-baseline py-[11px]">
              <dt className="text-sm text-[var(--color-text-muted)]">業界内順位</dt>
              <dd className="text-[19px] font-bold text-[var(--color-primary)]">
                {context?.industryRank != null ? (
                  <>
                    {context.industryRank.toLocaleString()}
                    <span className="text-[13px] text-[var(--color-text-faint)]">
                      位 / {context.industryCount.toLocaleString()}社
                    </span>
                  </>
                ) : (
                  "—"
                )}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* ── 分布セクション（このページの主役） ── */}
      {context && salaryMan > 0 && (
        <div className="bg-[var(--color-surface-section)] rounded-2xl px-6 py-6 sm:px-10 sm:py-9">
          <h2 className="text-[15px] sm:text-lg font-black text-[var(--color-text)]">
            上場企業の中での位置
          </h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            全{context.totalRanked.toLocaleString()}社の年収分布の上に、{shortName}を置いてみると
          </p>
          <div className="mt-2">
            <SalaryHistogram
              bars={context.histogram}
              height={110}
              highlightIndex={context.highlightIndex}
              highlightLabel={`${shortName} ${salaryMan.toLocaleString()}万円`}
              axisLabels={[
                { text: "〜300万" },
                { text: `中央値 ${context.median.toLocaleString()}万` },
                { text: `↑ ${shortName}（上位${percentileTop}%）`, highlight: true },
                { text: "2,500万+" },
              ]}
            />
          </div>
        </div>
      )}

      {/* ── 年収推移 + 同じ業界の会社 ── */}
      <div className="grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] gap-4">
        <div className={`${CARD} px-6 py-6 sm:px-8 sm:py-7`}>
          <h2 className="text-base font-black text-[var(--color-text)]">年収の推移</h2>
          {trendDiff != null && (
            <p className="text-sm text-[var(--color-text-muted)] mt-1">
              {trendPoints.length - 1}年で{" "}
              <strong className="text-[var(--color-primary)]">
                {trendDiff >= 0 ? "+" : "−"}
                {Math.abs(trendDiff).toLocaleString()}万円
              </strong>
              。{trendDiff > 0 ? "増加が続いています。" : trendDiff < 0 ? "減少しています。" : "横ばいです。"}
            </p>
          )}
          {trendPoints.length > 0 ? (
            <div className="mt-4">
              <TrendLine points={trendPoints} />
            </div>
          ) : (
            <p className="text-[var(--color-text-faint)] text-sm py-8 text-center">
              推移データがありません
            </p>
          )}
        </div>

        <div className={`${CARD} px-6 py-6 sm:px-8 sm:py-7 flex flex-col min-w-0`}>
          <h2 className="text-base font-black text-[var(--color-text)]">同じ業界の会社</h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            {company.industry ?? "同業界"}
            {context?.industryCount ? `（${context.industryCount.toLocaleString()}社）` : ""}の近い規模の企業
          </p>
          {sortedPeers.length > 0 ? (
            <>
              <div className="flex flex-col flex-1 mt-3">
                {sortedPeers.slice(0, 4).map((peer) => (
                  <Link
                    key={peer.code}
                    href={`/company/${peer.code}`}
                    className="flex justify-between items-baseline py-3 border-b border-[var(--color-border-subtle)] last:border-b-0 hover:text-[var(--color-primary)] transition-colors"
                  >
                    <span className="text-[15px] font-medium truncate mr-3 min-w-0">{peer.name}</span>
                    <span className="text-[15.5px] font-bold shrink-0">
                      {peer.salary.toLocaleString()}万
                    </span>
                  </Link>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-2.5 mt-5">
                {compareHref && comparePeer && (
                  <Link
                    href={compareHref}
                    className="flex-1 text-center bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white rounded-full py-3 text-sm font-bold transition-colors"
                  >
                    {comparePeer.name.replace(/株式会社/g, "").trim().slice(0, 10)}と比較する
                  </Link>
                )}
                {company.industry && (
                  <Link
                    href={`/industries/${encodeURIComponent(company.industry)}`}
                    className="flex-1 text-center bg-white border-[1.5px] border-[var(--color-primary)] text-[var(--color-primary)] rounded-full py-3 text-sm font-bold hover:bg-[var(--color-primary-tint)] transition-colors"
                  >
                    業界ランキング →
                  </Link>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-[var(--color-text-faint)] py-8 text-center">
              同業他社データがありません
            </p>
          )}
        </div>
      </div>

      {/* ── 組織データ推移 + DEI ── */}
      <div className="grid lg:grid-cols-2 gap-4">
        <OrganizationTrendSection salaryHistory={salaryHistory} />
        {latest && <DeiSection latest={latest} industryDei={industryDei} />}
      </div>

      {latest && <DeiTrendSection salaryHistory={salaryHistory} />}

      {/* ── 財務 + 役員報酬/効率指標 ── */}
      {financialsHistory.length > 0 && (
        <div className="grid lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-4">
          <FinancialsSection financialsHistory={financialsHistory} />
          <div className="space-y-4">
            {latest?.execCompTotal != null && latest.execCompTotal > 0 && (
              <ExecCompSection
                execCompTotal={latest.execCompTotal}
                execCompCount={latest.execCompCount}
                fiscalYear={latest.fiscalYear}
                avgSalary={salaryMan}
              />
            )}
            <EfficiencySection
              salaryHistory={salaryHistory}
              financialsHistory={financialsHistory}
            />
          </div>
        </div>
      )}

      {/* ── 年収が近い企業 ── */}
      {similarCompanies.length > 0 && (
        <div className={`${CARD} px-6 py-6 sm:px-8 sm:py-7`}>
          <h2 className="text-base font-black text-[var(--color-text)]">年収が近い企業</h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-1 mb-4">
            同業界・近い年収帯の企業と比較してみよう
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {similarCompanies.map((c) => (
              <Link
                key={c.code}
                href={`/company/${c.code}`}
                className="flex flex-col gap-0.5 p-3.5 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-surface-section)] transition-colors"
              >
                <span className="text-[13.5px] font-bold text-[var(--color-text)] line-clamp-1">
                  {c.name}
                </span>
                <span className="text-lg font-black text-[var(--color-primary)]">
                  {c.salary.toLocaleString()}万円
                </span>
                <span className="text-[12px] text-[var(--color-text-faint)] line-clamp-1">
                  {c.industry}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── よくある質問（FAQ・構造化データと内容一致） ── */}
      {faq.length > 0 && (
        <div className={`${CARD} px-6 py-6 sm:px-8 sm:py-7`}>
          <h2 className="text-base font-black text-[var(--color-text)] mb-4">
            {company.name}の年収に関するよくある質問
          </h2>
          <div className="space-y-2.5">
            {faq.map((item) => (
              <details
                key={item.q}
                className="rounded-xl border border-[var(--color-border)] px-4 py-3 group"
              >
                <summary className="flex items-center justify-between cursor-pointer list-none">
                  <span className="text-sm font-bold text-[var(--color-text)] pr-4">
                    Q. {item.q}
                  </span>
                  <svg
                    className="h-4 w-4 shrink-0 text-[var(--color-text-faint)] transition-transform group-open:rotate-180"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="mt-2 text-sm text-[var(--color-text-body)] leading-relaxed">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      )}

      {/* ── 下部アクション ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 転職リンク */}
        <div className={`${CARD} px-6 py-6`}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[15px] font-bold text-[var(--color-text)]">
              {salaryMan > 0
                ? `年収${salaryMan.toLocaleString()}万円以上の求人`
                : `${company.name}の求人を探す`}
            </h2>
            <span className="text-[12px] px-1.5 py-0.5 rounded bg-[var(--color-surface-section)] text-[var(--color-text-faint)]">
              PR
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {[
              { name: "doda", url: `https://doda.jp/DodaFront/View/JobSearchResult/j_ks__searchkeyword-${encodeURIComponent(company.name)}/` },
              { name: "リクナビNEXT", url: `https://next.rikunabi.com/tag/KEYWORD_${encodeURIComponent(company.name)}/` },
              { name: "ビズリーチ", url: `https://www.bizreach.jp/job-list/?free_word=${encodeURIComponent(company.name)}` },
            ].map((site) => (
              <a
                key={site.name}
                href={site.url}
                target="_blank"
                rel="sponsored nofollow noopener noreferrer"
                onClick={() => track("job_link_click", { site: site.name, company: company.name })}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-full border-[1.5px] border-[var(--color-border-input)] text-[var(--color-text-body)] text-[13.5px] font-bold hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
              >
                {site.name}で求人を見る
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            ))}
          </div>
        </div>

        {/* シェア・比較 */}
        <div className={`${CARD} px-6 py-6`}>
          <h2 className="text-[15px] font-bold text-[var(--color-text)] mb-3">シェア・比較</h2>
          <div className="space-y-3">
            <ShareButtons
              companyName={company.name}
              salary={salaryMan}
              code={company.secCode ?? ""}
            />
            {sortedPeers.length > 0 && company.secCode && (
              <div className="flex flex-wrap gap-1.5">
                {sortedPeers.slice(0, 5).map((peer) => (
                  <Link
                    key={peer.code}
                    href={`/compare/${[company.secCode, peer.code].sort().join("-vs-")}`}
                    className="text-[13px] px-3 py-1.5 rounded-full border border-[var(--color-border-input)] text-[var(--color-text-body)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-colors"
                  >
                    vs {peer.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 広告 + データ注釈 */}
        <div className={`${CARD} px-6 py-6 space-y-3`}>
          <AdBanner slot="9555970163" format="horizontal" className="" />
          <div>
            <h2 className="text-[15px] font-bold text-[var(--color-text)] mb-1">データについて</h2>
            <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">
              有価証券報告書（EDINET）に基づくデータです。平均年収は単体・正社員の値です。
              <a
                href="https://disclosure.edinet-fsa.go.jp/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--color-primary)] hover:underline ml-1"
              >
                EDINET
              </a>
              でご確認ください。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// "2024-03" → "2024年3月期"
function formatFiscalYear(fy: string): string {
  const [year, month] = fy.split("-");
  return `${year}年${parseInt(month)}月期`;
}

const TOOLTIP_STYLE = {
  borderRadius: "12px",
  border: "1px solid #e3e6ea",
  fontSize: 13,
  boxShadow: "none",
};

function OrganizationTrendSection({ salaryHistory }: { salaryHistory: SalaryRecord[] }) {
  const hasEmployees = salaryHistory.some((s) => s.employees);
  const hasAge = salaryHistory.some((s) => s.avgAge);
  const hasTenure = salaryHistory.some((s) => s.avgTenure);

  if (!hasEmployees && !hasAge && !hasTenure) return null;

  const trendData = salaryHistory.map((s) => ({
    year: s.fiscalYear,
    従業員数: s.employees ?? null,
    平均年齢: s.avgAge ?? null,
    平均勤続年数: s.avgTenure ?? null,
  }));

  const maxEmployees = Math.max(...trendData.map((d) => d.従業員数 ?? 0));

  return (
    <div className={`${CARD} px-6 py-6 sm:px-8 sm:py-7 h-full`}>
      <h2 className="text-base font-black text-[var(--color-text)]">組織データの推移</h2>
      <p className="text-sm text-[var(--color-text-muted)] mt-1 mb-3">
        従業員数（左軸）・平均年齢・勤続年数（右軸）
      </p>
      <div className="h-[220px] sm:h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trendData} margin={{ top: 5, right: 40, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#edf1f5" vertical={false} />
            <XAxis dataKey="year" tick={{ fontSize: 12, fill: "#8a929d" }} tickLine={false} axisLine={{ stroke: "#e3e6ea" }} tickFormatter={(v) => formatFiscalYear(v)} />
            {hasEmployees && (
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 12, fill: "#8a929d" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v.toLocaleString()}名`}
                domain={[0, Math.ceil((maxEmployees * 1.2) / 1000) * 1000]}
                width={60}
              />
            )}
            {(hasAge || hasTenure) && (
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 12, fill: "#8a929d" }}
                tickLine={false}
                axisLine={false}
                domain={[0, 60]}
                width={30}
              />
            )}
            <Tooltip
              labelFormatter={(label) => formatFiscalYear(label)}
              contentStyle={TOOLTIP_STYLE}
              formatter={(value, name) => {
                const v = Number(value);
                if (name === "従業員数") return [`${v.toLocaleString()}名`, name as string];
                if (name === "平均年齢") return [`${v}歳`, name as string];
                if (name === "平均勤続年数") return [`${v}年`, name as string];
                return [`${v}`, name as string];
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {hasEmployees && (
              <Line yAxisId="left" type="monotone" dataKey="従業員数" stroke={CHART_COLORS[0]} strokeWidth={2.5} dot={{ r: 4, fill: CHART_COLORS[0] }} connectNulls />
            )}
            {hasAge && (
              <Line yAxisId="right" type="monotone" dataKey="平均年齢" stroke={CHART_COLORS[1]} strokeWidth={2.5} dot={{ r: 4, fill: CHART_COLORS[1] }} connectNulls />
            )}
            {hasTenure && (
              <Line yAxisId="right" type="monotone" dataKey="平均勤続年数" stroke={CHART_COLORS[2]} strokeWidth={2.5} dot={{ r: 4, fill: CHART_COLORS[2] }} connectNulls />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function EfficiencySection({
  salaryHistory,
  financialsHistory,
}: {
  salaryHistory: SalaryRecord[];
  financialsHistory: FinancialsRecord[];
}) {
  const employeesByYear: Record<string, number> = {};
  for (const s of salaryHistory) {
    if (s.employees) employeesByYear[s.fiscalYear] = s.employees;
  }

  const trendData = financialsHistory
    .filter((f) => f.netSales && employeesByYear[f.fiscalYear])
    .map((f) => ({
      year: f.fiscalYear,
      "1人あたり売上（万円）": Math.round(f.netSales! / employeesByYear[f.fiscalYear] / 10_000),
    }));

  if (trendData.length < 2) return null;

  return (
    <div className={`${CARD} px-6 py-6 sm:px-8 sm:py-7`}>
      <h2 className="text-base font-black text-[var(--color-text)]">従業員1人あたりの売上高</h2>
      <p className="text-sm text-[var(--color-text-muted)] mt-1 mb-3">
        売上高 ÷ 従業員数（万円/人）
      </p>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#edf1f5" vertical={false} />
            <XAxis dataKey="year" tick={{ fontSize: 12, fill: "#8a929d" }} tickLine={false} axisLine={{ stroke: "#e3e6ea" }} tickFormatter={(v) => formatFiscalYear(v)} />
            <YAxis tick={{ fontSize: 12, fill: "#8a929d" }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v.toLocaleString()}万`} />
            <Tooltip
              labelFormatter={(label) => formatFiscalYear(label)}
              contentStyle={TOOLTIP_STYLE}
              formatter={(v) => [`${Number(v).toLocaleString()}万円/人`, "1人あたり売上"]}
            />
            <Line type="monotone" dataKey="1人あたり売上（万円）" stroke={CHART_COLORS[0]} strokeWidth={2.5} dot={{ r: 4, fill: CHART_COLORS[0] }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function DeiSection({
  latest,
  industryDei,
}: {
  latest: SalaryRecord;
  industryDei: IndustryDei | null;
}) {
  const items = [
    {
      label: "男女賃金格差（全労働者）",
      value: latest.genderWageGapAll,
      industryAvg: industryDei?.genderWageGapAll ?? null,
      desc: "女性の賃金 ÷ 男性の賃金",
    },
    {
      label: "男女賃金格差（正規）",
      value: latest.genderWageGapFull,
      industryAvg: industryDei?.genderWageGapFull ?? null,
      desc: "正規労働者の男女比率",
    },
    {
      label: "男性育休取得率",
      value: latest.maleParentalLeaveRate,
      industryAvg: industryDei?.maleParentalLeaveRate ?? null,
      desc: "前年度取得者を含むため100%超の場合あり",
    },
    {
      label: "女性管理職比率",
      value: latest.femaleManagerRate,
      industryAvg: industryDei?.femaleManagerRate ?? null,
      desc: "管理職に占める女性の割合",
    },
  ].filter((item) => item.value != null);

  if (items.length === 0) return null;

  return (
    <div className={`${CARD} px-6 py-6 sm:px-8 sm:py-7 h-full`}>
      <h2 className="text-base font-black text-[var(--color-text)]">DEI・男女格差データ</h2>
      <p className="text-sm text-[var(--color-text-muted)] mt-1 mb-4">
        有価証券報告書ベース
        {industryDei ? `・業界${industryDei.companyCount.toLocaleString()}社平均と比較` : ""}
      </p>
      <div className="space-y-4">
        {items.map((item) => {
          const pct = item.value!;
          const industryPct = item.industryAvg;
          const vsIndustry = industryPct != null ? pct - industryPct : null;

          return (
            <div key={item.label}>
              <div className="flex justify-between items-baseline mb-1.5">
                <span className="text-sm text-[var(--color-text-muted)]">{item.label}</span>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  {vsIndustry !== null && (
                    <span className="text-[12px] font-bold px-2 py-0.5 rounded-full bg-[var(--color-primary-tint)] text-[var(--color-primary)]">
                      業界比 {vsIndustry >= 0 ? "+" : "−"}{Math.abs(vsIndustry).toFixed(1)}pt
                    </span>
                  )}
                  <span className="text-base font-bold text-[var(--color-text)]">
                    {pct.toFixed(1)}%
                  </span>
                </div>
              </div>
              {/* この企業のバー */}
              <div className="h-2.5 rounded-full bg-[var(--color-border-subtle)] overflow-hidden mb-1">
                <div
                  className="h-full rounded-full bg-[var(--color-primary)]"
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
              {/* 業界平均のバー */}
              {industryPct != null && (
                <div className="h-1.5 rounded-full bg-[var(--color-border-subtle)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#cfdae9]"
                    style={{ width: `${Math.min(industryPct, 100)}%` }}
                  />
                </div>
              )}
              <div className="flex justify-between mt-1">
                <p className="text-[12px] text-[var(--color-text-faint)]">{item.desc}</p>
                {industryPct != null && (
                  <p className="text-[12px] text-[var(--color-text-faint)]">
                    業界平均 {industryPct.toFixed(1)}%
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DeiTrendSection({ salaryHistory }: { salaryHistory: SalaryRecord[] }) {
  const trendData = salaryHistory
    .map((s) => ({
      year: s.fiscalYear,
      男女賃金格差: s.genderWageGapAll ?? null,
      女性管理職比率: s.femaleManagerRate ?? null,
      男性育休取得率: s.maleParentalLeaveRate ?? null,
    }))
    .filter(
      (d) =>
        d.男女賃金格差 != null ||
        d.女性管理職比率 != null ||
        d.男性育休取得率 != null
    );

  if (trendData.length < 2) return null;

  const hasWageGap = trendData.some((d) => d.男女賃金格差 != null);
  const hasFemaleManager = trendData.some((d) => d.女性管理職比率 != null);
  const hasMaleLeave = trendData.some((d) => d.男性育休取得率 != null);

  return (
    <div className={`${CARD} px-6 py-6 sm:px-8 sm:py-7`}>
      <h2 className="text-base font-black text-[var(--color-text)]">DEI指標の推移</h2>
      <p className="text-sm text-[var(--color-text-muted)] mt-1 mb-3">
        男女賃金格差・女性管理職比率・男性育休取得率の年度推移
      </p>
      <div className="h-[220px] sm:h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#edf1f5" vertical={false} />
            <XAxis dataKey="year" tick={{ fontSize: 12, fill: "#8a929d" }} tickLine={false} axisLine={{ stroke: "#e3e6ea" }} tickFormatter={(v) => formatFiscalYear(v)} />
            <YAxis tick={{ fontSize: 12, fill: "#8a929d" }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} domain={[0, 110]} width={40} />
            <Tooltip
              labelFormatter={(label) => formatFiscalYear(label)}
              contentStyle={TOOLTIP_STYLE}
              formatter={(value, name) => [`${Number(value).toFixed(1)}%`, name as string]}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {hasWageGap && (
              <Line type="monotone" dataKey="男女賃金格差" stroke={CHART_COLORS[0]} strokeWidth={2.5} dot={{ r: 4, fill: CHART_COLORS[0] }} connectNulls />
            )}
            {hasFemaleManager && (
              <Line type="monotone" dataKey="女性管理職比率" stroke={CHART_COLORS[1]} strokeWidth={2.5} dot={{ r: 4, fill: CHART_COLORS[1] }} connectNulls />
            )}
            {hasMaleLeave && (
              <Line type="monotone" dataKey="男性育休取得率" stroke={CHART_COLORS[2]} strokeWidth={2.5} dot={{ r: 4, fill: CHART_COLORS[2] }} connectNulls />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function FinancialsSection({
  financialsHistory,
}: {
  financialsHistory: FinancialsRecord[];
}) {
  const trendData = financialsHistory
    .filter((f) => f.netSales || f.operatingIncome)
    .map((f) => ({
      year: f.fiscalYear,
      売上高: f.netSales ? Math.round(f.netSales / 100_000_000) : null,
      営業利益: f.operatingIncome ? Math.round(f.operatingIncome / 100_000_000) : null,
      営業利益率:
        f.netSales && f.operatingIncome && f.netSales > 0
          ? Math.round((f.operatingIncome / f.netSales) * 1000) / 10
          : null,
    }));

  if (trendData.length === 0) return null;

  const latest = financialsHistory[financialsHistory.length - 1];
  const isConsolidated = latest?.isConsolidated;

  const allValues = trendData
    .flatMap((d) => [d.売上高, d.営業利益])
    .filter((v): v is number => v != null);
  const maxVal =
    allValues.length > 0 ? Math.ceil((Math.max(...allValues) * 1.15) / 100) * 100 : 1000;

  return (
    <div className={`${CARD} px-6 py-6 sm:px-8 sm:py-7 h-full`}>
      <h2 className="text-base font-black text-[var(--color-text)]">業績推移</h2>
      <p className="text-sm text-[var(--color-text-muted)] mt-1 mb-3">
        {isConsolidated ? "連結" : "単体"}・億円ベース
      </p>

      {latest && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {[
            { label: "売上高", value: latest.netSales },
            { label: "営業利益", value: latest.operatingIncome },
            { label: "経常利益", value: latest.ordinaryIncome },
            { label: "純利益", value: latest.netIncome },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl bg-[var(--color-surface-section)] px-4 py-3">
              <p className="text-[12px] text-[var(--color-text-faint)] mb-1">{label}</p>
              <p className="text-[15px] font-bold text-[var(--color-text)]">
                {value != null
                  ? value >= 100_000_000
                    ? `${Math.round(value / 100_000_000).toLocaleString()}億円`
                    : `${Math.round(value / 10_000).toLocaleString()}万円`
                  : "—"}
              </p>
            </div>
          ))}
        </div>
      )}

      {trendData.length >= 2 && (
        <div className="h-[220px] sm:h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={trendData} margin={{ top: 5, right: 40, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#edf1f5" vertical={false} />
              <XAxis dataKey="year" tick={{ fontSize: 12, fill: "#8a929d" }} tickLine={false} axisLine={{ stroke: "#e3e6ea" }} tickFormatter={(v) => formatFiscalYear(v)} />
              <YAxis yAxisId="left" tick={{ fontSize: 12, fill: "#8a929d" }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}億`} domain={[0, maxVal]} width={50} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: "#8a929d" }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} domain={[-20, 60]} width={35} />
              <Tooltip
                labelFormatter={(label) => formatFiscalYear(label)}
                contentStyle={TOOLTIP_STYLE}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(v: any, name: any) => {
                  if (name === "営業利益率") return [`${Number(v).toFixed(1)}%`, name];
                  return [`${Number(v).toLocaleString()}億円`, name];
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar yAxisId="left" dataKey="売上高" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
              <Bar yAxisId="left" dataKey="営業利益" fill={CHART_COLORS[2]} radius={[4, 4, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="営業利益率" stroke="#17437d" strokeWidth={2.5} dot={{ r: 4, fill: "#17437d" }} connectNulls />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function ExecCompSection({
  execCompTotal,
  execCompCount,
  fiscalYear,
  avgSalary,
}: {
  execCompTotal: number;
  execCompCount: number | null;
  fiscalYear: string;
  avgSalary: number;
}) {
  const totalOkuMan = Math.round((execCompTotal / 100_000_000) * 10) / 10;
  const perPerson =
    execCompCount && execCompCount > 0
      ? Math.round(execCompTotal / execCompCount / 10_000)
      : null;
  const ratio =
    perPerson && avgSalary > 0 ? Math.round((perPerson / avgSalary) * 10) / 10 : null;

  return (
    <div className={`${CARD} px-6 py-6 sm:px-8 sm:py-7`}>
      <h2 className="text-base font-black text-[var(--color-text)]">役員報酬</h2>
      <p className="text-sm text-[var(--color-text-muted)] mt-1 mb-3">
        {formatFiscalYear(fiscalYear)}・有価証券報告書より
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-[var(--color-surface-section)] px-4 py-4">
          <p className="text-[12px] text-[var(--color-text-faint)] mb-1.5">役員報酬総額</p>
          <p className="text-xl font-black text-[var(--color-text)]">
            {totalOkuMan >= 1
              ? `${totalOkuMan}億円`
              : `${Math.round(execCompTotal / 10_000).toLocaleString()}万円`}
          </p>
        </div>
        {execCompCount != null && (
          <div className="rounded-xl bg-[var(--color-surface-section)] px-4 py-4">
            <p className="text-[12px] text-[var(--color-text-faint)] mb-1.5">対象役員数</p>
            <p className="text-xl font-black text-[var(--color-text)]">{execCompCount}名</p>
          </div>
        )}
        {perPerson != null && (
          <div className="rounded-xl bg-[var(--color-surface-section)] px-4 py-4">
            <p className="text-[12px] text-[var(--color-text-faint)] mb-1.5">役員1人あたり</p>
            <p className="text-xl font-black text-[var(--color-text)]">
              {formatManYen(perPerson)}
            </p>
          </div>
        )}
        {ratio != null && (
          <div className="rounded-xl bg-[var(--color-surface-section)] px-4 py-4">
            <p className="text-[12px] text-[var(--color-text-faint)] mb-1.5">一般社員との格差</p>
            <p className="text-xl font-black text-[var(--color-primary)]">{ratio}倍</p>
            <p className="text-[12px] text-[var(--color-text-faint)] mt-1">
              社員 {avgSalary.toLocaleString()}万円比
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ShareButtons({
  companyName,
  salary,
  code,
}: {
  companyName: string;
  salary: number;
  code: string;
}) {
  const url = `https://yuho-nenshu.com/company/${code}`;
  const text =
    salary > 0
      ? `${companyName}の平均年収は${salary.toLocaleString()}万円（有価証券報告書より）`
      : `${companyName}の年収データをチェック`;

  const xUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  const lineUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}`;

  return (
    <div className="flex gap-2.5">
      <a
        href={xUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => track("share", { network: "x", company: companyName })}
        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-[var(--color-text)] text-white text-[13.5px] font-bold hover:opacity-85 transition-opacity"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        Xでシェア
      </a>
      <a
        href={lineUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => track("share", { network: "line", company: companyName })}
        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-white border-[1.5px] border-[var(--color-border-input)] text-[var(--color-text-body)] text-[13.5px] font-bold hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
      >
        LINEで送る
      </a>
    </div>
  );
}
