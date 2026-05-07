"use client";

import Link from "next/link";
import { AdBanner } from "@/components/AdBanner";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
  Dot,
} from "recharts";
import { calcSalaryPercentile } from "@/data/mock";

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

interface IndustryDei {
  genderWageGapAll: number | null;
  genderWageGapFull: number | null;
  genderWageGapPart: number | null;
  maleParentalLeaveRate: number | null;
  femaleManagerRate: number | null;
  companyCount: number;
}

export function CompanyDetailFromDb({
  company,
  salaryHistory,
  peers = [],
  financialsHistory = [],
  industryDei = null,
}: {
  company: Company;
  salaryHistory: SalaryRecord[];
  peers?: Peer[];
  financialsHistory?: FinancialsRecord[];
  industryDei?: IndustryDei | null;
}) {
  const latest = salaryHistory[salaryHistory.length - 1];
  const prev = salaryHistory[salaryHistory.length - 2];
  const salaryMan = latest?.avgSalary ? Math.round(latest.avgSalary / 10000) : 0;
  const prevSalaryMan = prev?.avgSalary ? Math.round(prev.avgSalary / 10000) : null;
  const change = prevSalaryMan ? salaryMan - prevSalaryMan : null;
  const percentile = calcSalaryPercentile(salaryMan);

  const trend = salaryHistory
    .filter((s) => s.avgSalary)
    .map((s) => ({
      year: s.fiscalYear,
      salary: Math.round(s.avgSalary! / 10000),
    }));

  // 業界平均（peersと自社の平均）
  const industryAvg =
    peers.length > 0
      ? Math.round(
          (peers.reduce((s, p) => s + p.salary, 0) + salaryMan) /
            (peers.length + 1)
        )
      : null;

  // KPI カード定義
  const kpis = [
    {
      label: "平均年収",
      value: salaryMan > 0 ? `${salaryMan.toLocaleString()}万円` : "-",
      sub: change !== null
        ? `前年比 ${change >= 0 ? "+" : ""}${change}万円`
        : "有価証券報告書より",
      subColor: change === null ? "muted" : change >= 0 ? "success" : "danger",
      icon: "💰",
    },
    {
      label: "従業員数",
      value: latest?.employees ? `${latest.employees.toLocaleString()}名` : "-",
      sub: "単体（正社員）",
      subColor: "muted",
      icon: "👥",
    },
    {
      label: "平均年齢",
      value: latest?.avgAge ? `${latest.avgAge}歳` : "-",
      sub: "全従業員平均",
      subColor: "muted",
      icon: "🎂",
    },
    {
      label: "平均勤続年数",
      value: latest?.avgTenure ? `${latest.avgTenure}年` : "-",
      sub: "全従業員平均",
      subColor: "muted",
      icon: "📅",
    },
  ];

  const subColorClass: Record<string, string> = {
    muted: "text-[var(--color-text-muted)]",
    success: "text-[var(--color-success)] font-semibold",
    danger: "text-[var(--color-danger)] font-semibold",
  };

  return (
    <div className="space-y-6">
      {/* 企業ヘッダー */}
      <div className="glass rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {company.industry && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] font-medium">
                  {company.industry}
                </span>
              )}
              {company.secCode && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--color-surface-secondary)] text-[var(--color-text-muted)]">
                  証券コード: {company.secCode}
                </span>
              )}
              {latest?.fiscalYear && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--color-surface-secondary)] text-[var(--color-text-muted)]">
                  {latest.fiscalYear}期
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text-primary)]">
              {company.name}
            </h1>
          </div>

          {salaryMan > 0 && (
            <div className="text-right">
              <p className="text-xs text-[var(--color-text-muted)] mb-1">平均年収</p>
              <div className="flex items-baseline gap-1 justify-end">
                <span className="text-4xl sm:text-5xl font-extrabold text-gradient">
                  {salaryMan.toLocaleString()}
                </span>
                <span className="text-lg text-[var(--color-text-secondary)]">万円</span>
              </div>
              {change !== null && (
                <p className={`text-sm mt-1 ${change >= 0 ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"}`}>
                  前年比 {change >= 0 ? "+" : ""}{change}万円
                </p>
              )}
            </div>
          )}
        </div>

        {/* 上場企業内ポジション */}
        {salaryMan > 0 && (
          <div className="mt-5 rounded-xl bg-[var(--color-surface-secondary)] p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[var(--color-text-secondary)]">
                上場企業 {rankLabel(percentile.deviation)} の年収水準
              </span>
              <div className="flex items-center gap-3">
                {industryAvg && (
                  <span className="text-xs text-[var(--color-text-muted)]">
                    業界平均 {industryAvg}万円
                  </span>
                )}
                <span className="text-sm font-bold text-[var(--color-primary)]">
                  上位 {100 - percentile.percentile}% / 偏差値 {percentile.deviation}
                </span>
              </div>
            </div>
            <div className="h-3 rounded-full bg-white/50 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] transition-all duration-700"
                style={{ width: `${percentile.percentile}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* KPI カード */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="glass rounded-xl p-4 glass-hover">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{kpi.icon}</span>
              <p className="text-xs text-[var(--color-text-secondary)]">{kpi.label}</p>
            </div>
            <p className="text-xl font-bold text-[var(--color-text-primary)]">{kpi.value}</p>
            <p className={`text-xs mt-1 ${subColorClass[kpi.subColor]}`}>{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* 自動生成分析テキスト */}
      {salaryMan > 0 && (
        <CompanyAnalysis
          companyName={company.name}
          industry={company.industry}
          salaryMan={salaryMan}
          change={change}
          percentile={percentile}
          industryAvg={industryAvg}
          employees={latest?.employees ?? null}
          avgAge={latest?.avgAge ?? null}
          avgTenure={latest?.avgTenure ?? null}
          trendYears={trend.length}
          fiscalYear={latest?.fiscalYear ?? null}
          peers={peers}
        />
      )}

      {/* 広告 */}
      <AdBanner slot="9555970163" format="horizontal" className="my-2" />

      {/* 年収推移グラフ + 同業他社比較 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 推移グラフ */}
        <div className="glass rounded-2xl p-6 lg:col-span-2">
          <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-1">
            平均年収の推移
          </h2>
          <p className="text-sm text-[var(--color-text-muted)] mb-4">万円</p>
          {trend.length > 0 ? (
            <div className="h-[200px] sm:h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend} margin={{ top: 5, right: 30, bottom: 5, left: 0 }}>
                  <defs>
                    <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#1a56db" />
                      <stop offset="100%" stopColor="#7c3aed" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} tickFormatter={(v) => formatFiscalYear(v)} />
                  <YAxis
                    domain={[
                      Math.floor((Math.min(...trend.map((t) => t.salary)) * 0.88) / 100) * 100,
                      Math.ceil((Math.max(...trend.map((t) => t.salary)) * 1.06) / 100) * 100,
                    ]}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `${v}万`}
                  />
                  <Tooltip
                    labelFormatter={(label) => formatFiscalYear(label)}
                    formatter={(value) => [`${value}万円`, "平均年収"]}
                    contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
                  />
                  {industryAvg && (
                    <ReferenceLine
                      y={industryAvg}
                      stroke="#9ca3af"
                      strokeDasharray="4 4"
                      label={{ value: "業界平均", position: "right", fontSize: 10, fill: "#9ca3af" }}
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey="salary"
                    stroke="url(#lineGrad)"
                    strokeWidth={3}
                    dot={{ fill: "#1a56db", r: 5, strokeWidth: 2, stroke: "#fff" }}
                    activeDot={{ r: 7, fill: "#7c3aed" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-[var(--color-text-muted)] text-sm py-12 text-center">
              推移データがありません
            </p>
          )}
        </div>

        {/* 同業他社比較 */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-1">
            同業他社と比較
          </h2>
          <p className="text-sm text-[var(--color-text-muted)] mb-4">
            {company.industry || "同業界"} の年収ランキング
          </p>
          {peers.length > 0 ? (
            <div className="space-y-3">
              {/* 自社 */}
              <div className="rounded-xl bg-[var(--color-primary-light)] border border-[var(--color-primary)]/20 p-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-[var(--color-primary)] truncate mr-2">
                    {company.name}
                  </span>
                  <span className="text-sm font-bold text-[var(--color-primary)] shrink-0">
                    {salaryMan}万円
                  </span>
                </div>
              </div>
              {/* 競合各社 */}
              {peers.map((peer) => (
                <Link
                  key={peer.code}
                  href={`/company/${peer.code}`}
                  className="block rounded-xl bg-[var(--color-surface-secondary)] hover:bg-[var(--color-primary-light)] p-3 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[var(--color-text-primary)] truncate mr-2">
                      {peer.name}
                    </span>
                    <span className="text-sm font-medium text-[var(--color-text-primary)] shrink-0">
                      {peer.salary}万円
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-white/60 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--color-text-muted)]"
                      style={{ width: `${Math.min((peer.salary / salaryMan) * 100, 100)}%` }}
                    />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--color-text-muted)] py-8 text-center">
              同業他社データがありません
            </p>
          )}
        </div>
      </div>

      {/* 組織データ推移グラフ */}
      {salaryHistory.length >= 2 && (
        <OrganizationTrendSection salaryHistory={salaryHistory} />
      )}

      {/* DEI指標 */}
      {(latest?.genderWageGapAll != null || latest?.maleParentalLeaveRate != null || latest?.femaleManagerRate != null) && (
        <DeiSection latest={latest} industryDei={industryDei} />
      )}

      {/* 財務データ（売上高・営業利益推移） */}
      {financialsHistory.length > 0 && (
        <FinancialsSection financialsHistory={financialsHistory} companyName={company.name} />
      )}

      {/* 従業員1人あたり効率指標 */}
      {financialsHistory.length > 0 && salaryHistory.length > 0 && (
        <EfficiencySection salaryHistory={salaryHistory} financialsHistory={financialsHistory} />
      )}

      {/* 役員報酬 */}
      {latest?.execCompTotal != null && latest.execCompTotal > 0 && (
        <ExecCompSection
          execCompTotal={latest.execCompTotal}
          execCompCount={latest.execCompCount}
          employees={latest.employees}
          fiscalYear={latest.fiscalYear}
          avgSalary={salaryMan}
        />
      )}

      {/* 他社と比較 */}
      {peers.length > 0 && (
        <div className="glass rounded-2xl p-6">
          <h2 className="text-base font-bold text-[var(--color-text-primary)] mb-1">
            他社と年収を比較
          </h2>
          <p className="text-xs text-[var(--color-text-muted)] mb-4">
            {company.name}と同業他社の年収をサイドバイサイドで比較
          </p>
          <div className="flex flex-wrap gap-2">
            {peers.map((peer) => (
              <Link
                key={peer.code}
                href={`/compare/${company.secCode ?? ""}-vs-${peer.code}`}
                className="text-xs px-4 py-2 rounded-full glass text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-light)] transition-colors"
              >
                vs {peer.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 転職・求人リンク */}
      <div className="glass rounded-2xl p-6">
        <h2 className="text-base font-bold text-[var(--color-text-primary)] mb-1">
          {company.name}の求人を探す
        </h2>
        <p className="text-xs text-[var(--color-text-muted)] mb-4">
          主要転職サイトで{company.name}の求人情報を確認できます
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              name: "doda",
              color: "from-orange-500 to-orange-600",
              url: `https://doda.jp/DodaFront/View/JobSearchResult/j_ks__searchkeyword-${encodeURIComponent(company.name)}/`,
            },
            {
              name: "リクナビNEXT",
              color: "from-blue-500 to-blue-600",
              url: `https://next.rikunabi.com/tag/KEYWORD_${encodeURIComponent(company.name)}/`,
            },
            {
              name: "ビズリーチ",
              color: "from-red-500 to-red-600",
              url: `https://www.bizreach.jp/job-list/?free_word=${encodeURIComponent(company.name)}`,
            },
          ].map((site) => (
            <a
              key={site.name}
              href={site.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r ${site.color} text-white text-sm font-bold hover:opacity-90 transition-opacity`}
            >
              {site.name}で求人を探す
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          ))}
        </div>
      </div>

      {/* SNSシェア */}
      <div className="glass rounded-2xl p-6">
        <h2 className="text-base font-bold text-[var(--color-text-primary)] mb-1">
          この企業の年収をシェア
        </h2>
        <p className="text-xs text-[var(--color-text-muted)] mb-4">
          {company.name}の年収データを友達や同僚に共有
        </p>
        <ShareButtons companyName={company.name} salary={salaryMan} code={company.secCode ?? ""} />
      </div>

      {/* データ注釈 */}
      <div className="glass rounded-2xl p-5">
        <h2 className="text-sm font-bold text-[var(--color-text-primary)] mb-1">
          データについて
        </h2>
        <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
          このページのデータは{company.name}が金融庁EDINETに提出した有価証券報告書に基づいています。
          「平均年間給与」は提出会社単体の正社員の平均値であり、グループ全体や契約社員を含まない場合があります。
          詳細は
          <a
            href="https://disclosure.edinet-fsa.go.jp/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-primary)] hover:underline mx-1"
          >
            EDINET
          </a>
          でご確認ください。
        </p>
      </div>
    </div>
  );
}

// "2024-03" → "2024年3月期"
function formatFiscalYear(fy: string): string {
  const [year, month] = fy.split("-");
  return `${year}年${parseInt(month)}月期`;
}

function rankLabel(deviation: number): string {
  if (deviation >= 70) return "トップクラス";
  if (deviation >= 60) return "かなり高い";
  if (deviation >= 55) return "やや高い";
  if (deviation >= 45) return "平均的";
  if (deviation >= 40) return "やや低い";
  return "低め";
}

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
    <div className="glass rounded-2xl p-6">
      <h2 className="text-base font-bold text-[var(--color-text-primary)] mb-1">
        組織データの推移
      </h2>
      <p className="text-xs text-[var(--color-text-muted)] mb-4">
        従業員数（左軸）・平均年齢・平均勤続年数（右軸）の推移
      </p>
      <div className="h-[200px] sm:h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trendData} margin={{ top: 5, right: 40, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} tickFormatter={(v) => formatFiscalYear(v)} />
            {hasEmployees && (
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => `${v.toLocaleString()}名`}
                domain={[0, Math.ceil(maxEmployees * 1.2 / 1000) * 1000]}
                width={60}
              />
            )}
            {(hasAge || hasTenure) && (
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => `${v}`}
                domain={[0, 60]}
                width={30}
              />
            )}
            <Tooltip
              labelFormatter={(label) => formatFiscalYear(label)}
              contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
              formatter={(value, name) => {
                const v = Number(value);
                if (name === "従業員数") return [`${v.toLocaleString()}名`, name as string];
                if (name === "平均年齢") return [`${v}歳`, name as string];
                if (name === "平均勤続年数") return [`${v}年`, name as string];
                return [`${v}`, name as string];
              }}
            />
            <Legend />
            {hasEmployees && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="従業員数"
                stroke="#1a56db"
                strokeWidth={2}
                dot={{ r: 4, fill: "#1a56db" }}
                connectNulls
              />
            )}
            {hasAge && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="平均年齢"
                stroke="#7c3aed"
                strokeWidth={2}
                dot={{ r: 4, fill: "#7c3aed" }}
                connectNulls
              />
            )}
            {hasTenure && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="平均勤続年数"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 4, fill: "#10b981" }}
                connectNulls
              />
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
  // 年度をキーに従業員数マップを作成
  const employeesByYear: Record<string, number> = {};
  for (const s of salaryHistory) {
    if (s.employees) employeesByYear[s.fiscalYear] = s.employees;
  }

  const trendData = financialsHistory
    .filter((f) => f.netSales && employeesByYear[f.fiscalYear])
    .map((f) => {
      const employees = employeesByYear[f.fiscalYear];
      const salesPerEmployee = Math.round(f.netSales! / employees / 10_000); // 万円/人
      return {
        year: f.fiscalYear,
        "1人あたり売上（万円）": salesPerEmployee,
      };
    });

  if (trendData.length < 2) return null;

  return (
    <div className="glass rounded-2xl p-6">
      <h2 className="text-base font-bold text-[var(--color-text-primary)] mb-1">
        従業員1人あたりの売上高
      </h2>
      <p className="text-xs text-[var(--color-text-muted)] mb-4">
        売上高 ÷ 従業員数（企業の効率性指標・万円/人）
      </p>
      <div className="h-[180px] sm:h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} tickFormatter={(v) => formatFiscalYear(v)} />
            <YAxis
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => `${v.toLocaleString()}万`}
            />
            <Tooltip
              labelFormatter={(label) => formatFiscalYear(label)}
              contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
              formatter={(v) => [`${Number(v).toLocaleString()}万円/人`, "1人あたり売上"]}
            />
            <Line
              type="monotone"
              dataKey="1人あたり売上（万円）"
              stroke="#f59e0b"
              strokeWidth={2.5}
              dot={{ r: 4, fill: "#f59e0b" }}
              connectNulls
            />
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
      good: 90,
    },
    {
      label: "男女賃金格差（正規）",
      value: latest.genderWageGapFull,
      industryAvg: industryDei?.genderWageGapFull ?? null,
      desc: "正規労働者の男女比率",
      good: 85,
    },
    {
      label: "男女賃金格差（非正規）",
      value: latest.genderWageGapPart,
      industryAvg: industryDei?.genderWageGapPart ?? null,
      desc: "非正規労働者の男女比率",
      good: 80,
    },
    {
      label: "男性育休取得率",
      value: latest.maleParentalLeaveRate,
      industryAvg: industryDei?.maleParentalLeaveRate ?? null,
      desc: "前年度取得者を含むため100%超の場合あり",
      good: 50,
    },
    {
      label: "女性管理職比率",
      value: latest.femaleManagerRate,
      industryAvg: industryDei?.femaleManagerRate ?? null,
      desc: "管理職に占める女性の割合",
      good: 15,
    },
  ].filter((item) => item.value != null);

  if (items.length === 0) return null;

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-start justify-between mb-1">
        <h2 className="text-base font-bold text-[var(--color-text-primary)]">
          DEI・男女格差データ
        </h2>
        {industryDei && (
          <span className="text-xs text-[var(--color-text-muted)] shrink-0 ml-2">
            業界平均 ({industryDei.companyCount}社)
          </span>
        )}
      </div>
      <p className="text-xs text-[var(--color-text-muted)] mb-4">
        有価証券報告書ベース（2023年度以降開示義務化）
      </p>
      <div className="space-y-5">
        {items.map((item) => {
          const pct = item.value!;
          const isGood = pct >= item.good;
          const barColor = isGood
            ? "bg-[var(--color-success)]"
            : pct >= item.good * 0.7
            ? "bg-yellow-400"
            : "bg-[var(--color-danger)]";
          const industryPct = item.industryAvg;
          const vsIndustry =
            industryPct != null ? pct - industryPct : null;

          return (
            <div key={item.label}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-[var(--color-text-secondary)]">
                  {item.label}
                </span>
                <div className="flex items-center gap-2">
                  {vsIndustry !== null && (
                    <span
                      className={`text-xs font-medium ${
                        vsIndustry >= 0
                          ? "text-[var(--color-success)]"
                          : "text-[var(--color-danger)]"
                      }`}
                    >
                      業界比 {vsIndustry >= 0 ? "+" : ""}
                      {vsIndustry.toFixed(1)}%
                    </span>
                  )}
                  <span
                    className={`text-sm font-bold ${
                      isGood
                        ? "text-[var(--color-success)]"
                        : "text-[var(--color-text-primary)]"
                    }`}
                  >
                    {pct.toFixed(1)}%
                  </span>
                </div>
              </div>
              {/* この企業のバー */}
              <div className="h-2 rounded-full bg-[var(--color-surface-secondary)] overflow-hidden mb-1">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
              {/* 業界平均のバー */}
              {industryPct != null && (
                <div className="h-1.5 rounded-full bg-[var(--color-surface-secondary)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gray-400 transition-all duration-700"
                    style={{ width: `${Math.min(industryPct, 100)}%` }}
                  />
                </div>
              )}
              <div className="flex justify-between mt-0.5">
                <p className="text-xs text-[var(--color-text-muted)]">{item.desc}</p>
                {industryPct != null && (
                  <p className="text-xs text-[var(--color-text-muted)]">
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

function FinancialsSection({
  financialsHistory,
  companyName,
}: {
  financialsHistory: FinancialsRecord[];
  companyName: string;
}) {
  const trendData = financialsHistory
    .filter((f) => f.netSales || f.operatingIncome)
    .map((f) => ({
      year: f.fiscalYear,
      売上高: f.netSales ? Math.round(f.netSales / 100_000_000) : null,      // 億円
      営業利益: f.operatingIncome ? Math.round(f.operatingIncome / 100_000_000) : null,
    }));

  if (trendData.length === 0) return null;

  const latest = financialsHistory[financialsHistory.length - 1];
  const isConsolidated = latest?.isConsolidated;

  const allValues = trendData.flatMap((d) => [d.売上高, d.営業利益]).filter((v): v is number => v != null);
  const maxVal = allValues.length > 0 ? Math.ceil(Math.max(...allValues) * 1.15 / 100) * 100 : 1000;

  return (
    <div className="glass rounded-2xl p-6">
      <h2 className="text-base font-bold text-[var(--color-text-primary)] mb-1">
        業績推移
      </h2>
      <p className="text-xs text-[var(--color-text-muted)] mb-4">
        {isConsolidated ? "連結" : "単体"}・億円ベース（有価証券報告書より）
      </p>

      {/* 最新KPI */}
      {latest && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { label: "売上高", value: latest.netSales },
            { label: "営業利益", value: latest.operatingIncome },
            { label: "経常利益", value: latest.ordinaryIncome },
            { label: "純利益", value: latest.netIncome },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl bg-[var(--color-surface-secondary)] p-3">
              <p className="text-xs text-[var(--color-text-muted)] mb-1">{label}</p>
              <p className="text-base font-bold text-[var(--color-text-primary)]">
                {value != null
                  ? value >= 100_000_000
                    ? `${Math.round(value / 100_000_000).toLocaleString()}億円`
                    : `${Math.round(value / 10_000).toLocaleString()}万円`
                  : "-"}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* 推移グラフ */}
      {trendData.length >= 2 && (
        <div className="h-[180px] sm:h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} tickFormatter={(v) => formatFiscalYear(v)} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}億`} domain={[0, maxVal]} />
              <Tooltip
                labelFormatter={(label) => formatFiscalYear(label)}
                contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(v: any) => [`${Number(v).toLocaleString()}億円`]}
              />
              <Legend />
              <Bar dataKey="売上高" fill="#1a56db" radius={[4, 4, 0, 0]} />
              <Bar dataKey="営業利益" fill="#7c3aed" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function ExecCompSection({
  execCompTotal,
  execCompCount,
  employees,
  fiscalYear,
  avgSalary,
}: {
  execCompTotal: number;
  execCompCount: number | null;
  employees: number | null;
  fiscalYear: string;
  avgSalary: number;
}) {
  const totalOkuMan = Math.round((execCompTotal / 100_000_000) * 10) / 10;
  const perPerson =
    execCompCount && execCompCount > 0
      ? Math.round(execCompTotal / execCompCount / 10_000)
      : null;
  const ratio =
    perPerson && avgSalary > 0
      ? Math.round((perPerson / avgSalary) * 10) / 10
      : null;

  return (
    <div className="glass rounded-2xl p-6">
      <h2 className="text-base font-bold text-[var(--color-text-primary)] mb-1">
        役員報酬
      </h2>
      <p className="text-xs text-[var(--color-text-muted)] mb-4">
        {fiscalYear}期・有価証券報告書より
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl bg-[var(--color-surface-secondary)] p-4">
          <p className="text-xs text-[var(--color-text-muted)] mb-1">役員報酬総額</p>
          <p className="text-xl font-bold text-[var(--color-text-primary)]">
            {totalOkuMan >= 1
              ? `${totalOkuMan}億円`
              : `${Math.round(execCompTotal / 10_000).toLocaleString()}万円`}
          </p>
        </div>
        {execCompCount != null && (
          <div className="rounded-xl bg-[var(--color-surface-secondary)] p-4">
            <p className="text-xs text-[var(--color-text-muted)] mb-1">対象役員数</p>
            <p className="text-xl font-bold text-[var(--color-text-primary)]">
              {execCompCount}名
            </p>
          </div>
        )}
        {perPerson != null && (
          <div className="rounded-xl bg-[var(--color-surface-secondary)] p-4">
            <p className="text-xs text-[var(--color-text-muted)] mb-1">役員1人あたり平均</p>
            <p className="text-xl font-bold text-[var(--color-text-primary)]">
              {perPerson.toLocaleString()}万円
            </p>
          </div>
        )}
        {ratio != null && (
          <div className="rounded-xl bg-[var(--color-surface-secondary)] p-4">
            <p className="text-xs text-[var(--color-text-muted)] mb-1">一般社員との格差</p>
            <p className="text-xl font-bold text-[var(--color-text-primary)]">
              {ratio}倍
            </p>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              役員 {perPerson?.toLocaleString()}万円 vs 社員 {avgSalary.toLocaleString()}万円
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function CompanyAnalysis({
  companyName,
  industry,
  salaryMan,
  change,
  percentile,
  industryAvg,
  employees,
  avgAge,
  avgTenure,
  trendYears,
  fiscalYear,
  peers,
}: {
  companyName: string;
  industry: string | null;
  salaryMan: number;
  change: number | null;
  percentile: { percentile: number; deviation: number; label: string };
  industryAvg: number | null;
  employees: number | null;
  avgAge: number | null;
  avgTenure: number | null;
  trendYears: number;
  fiscalYear: string | null;
  peers: Peer[];
}) {
  const paragraphs: string[] = [];

  // 第1段落: 基本情報
  let intro = `${companyName}の平均年収は${salaryMan.toLocaleString()}万円です`;
  if (fiscalYear) intro += `（${fiscalYear}期・有価証券報告書より）`;
  intro += "。";
  if (percentile.percentile >= 80) {
    intro += `上場企業の中で上位${100 - percentile.percentile}%に位置し、偏差値は${percentile.deviation}と非常に高い水準です。`;
  } else if (percentile.percentile >= 60) {
    intro += `上場企業の中で上位${100 - percentile.percentile}%に位置し、偏差値${percentile.deviation}とやや高めの水準です。`;
  } else {
    intro += `上場企業全体での偏差値は${percentile.deviation}で、${percentile.label}の水準です。`;
  }
  paragraphs.push(intro);

  // 第2段落: 業界比較
  if (industry && industryAvg && industryAvg > 0) {
    const ratio = (salaryMan / industryAvg).toFixed(1);
    const diff = salaryMan - industryAvg;
    let industryText = `${industry}業界の平均年収${industryAvg.toLocaleString()}万円と比較すると、`;
    if (diff > 100) {
      industryText += `${diff.toLocaleString()}万円上回っており、業界平均の約${ratio}倍の水準です。`;
    } else if (diff > 0) {
      industryText += `${diff.toLocaleString()}万円上回っています。`;
    } else if (diff < -100) {
      industryText += `${Math.abs(diff).toLocaleString()}万円下回っています。`;
    } else if (diff < 0) {
      industryText += `やや下回る水準です。`;
    } else {
      industryText += `ほぼ同等の水準です。`;
    }
    if (peers.length > 0) {
      const higher = peers.filter((p) => p.salary > salaryMan).length;
      const lower = peers.filter((p) => p.salary <= salaryMan).length;
      if (higher === 0) {
        industryText += `同業他社${peers.length}社の中ではトップの年収です。`;
      } else {
        industryText += `同業他社${peers.length}社中、${higher}社が${companyName}より高い年収水準となっています。`;
      }
    }
    paragraphs.push(industryText);
  }

  // 第3段落: 組織の特徴
  const orgParts: string[] = [];
  if (employees) {
    orgParts.push(`従業員数は${employees.toLocaleString()}名`);
  }
  if (avgAge) {
    const ageDesc = avgAge < 35 ? "若い組織" : avgAge < 40 ? "比較的若い組織" : avgAge < 45 ? "標準的な年齢構成" : "経験豊富な組織";
    orgParts.push(`平均年齢は${avgAge}歳（${ageDesc}）`);
  }
  if (avgTenure) {
    const tenureDesc = avgTenure < 8 ? "転職が活発" : avgTenure < 15 ? "標準的な定着率" : "長期的に働く社員が多い";
    orgParts.push(`平均勤続年数は${avgTenure}年（${tenureDesc}）`);
  }
  if (orgParts.length > 0) {
    paragraphs.push(orgParts.join("、") + "です。");
  }

  // 第4段落: 年収推移
  if (change !== null && trendYears >= 2) {
    let trendText = `前年と比較すると年収は${Math.abs(change)}万円${change >= 0 ? "増加" : "減少"}しています。`;
    if (trendYears >= 3) {
      trendText += `${trendYears}年分の推移データが確認できます。`;
    }
    paragraphs.push(trendText);
  }

  return (
    <div className="glass rounded-2xl p-6">
      <h2 className="text-base font-bold text-[var(--color-text-primary)] mb-1">
        {companyName}の年収分析
      </h2>
      <p className="text-xs text-[var(--color-text-muted)] mb-4">
        有価証券報告書データに基づく自動分析
      </p>
      <div className="space-y-3">
        {paragraphs.map((p, i) => (
          <p key={i} className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
            {p}
          </p>
        ))}
      </div>
    </div>
  );
}

function ShareButtons({ companyName, salary, code }: { companyName: string; salary: number; code: string }) {
  const url = `https://yuho-salary-dashboard.vercel.app/company/${code}`;
  const text = salary > 0
    ? `${companyName}の平均年収は${salary.toLocaleString()}万円！（有価証券報告書より）`
    : `${companyName}の年収データをチェック！`;

  const xUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  const lineUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}`;

  return (
    <div className="flex gap-3">
      <a
        href={xUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-black text-white text-sm font-bold hover:bg-gray-800 transition-colors"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        Xでシェア
      </a>
      <a
        href={lineUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#06C755] text-white text-sm font-bold hover:bg-[#05b34c] transition-colors"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.508-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.508.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
        </svg>
        LINEで送る
      </a>
    </div>
  );
}
