"use client";

import Link from "next/link";
import { AdBanner } from "@/components/AdBanner";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ComposedChart,
  Area,
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

export function CompanyDetailFromDb({
  company,
  salaryHistory,
  peers = [],
  financialsHistory = [],
  industryDei = null,
  similarCompanies = [],
}: {
  company: Company;
  salaryHistory: SalaryRecord[];
  peers?: Peer[];
  financialsHistory?: FinancialsRecord[];
  industryDei?: IndustryDei | null;
  similarCompanies?: SimilarCompany[];
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

  // 同業他社バー用の最大値（自社を含む）
  const maxPeerSalary = peers.length > 0
    ? Math.max(salaryMan, ...peers.map((p) => p.salary))
    : salaryMan;

  return (
    <div className="space-y-3">

      {/* ── ヘッダー（コンパクト1行） ── */}
      <div className="glass rounded-2xl px-5 py-3 flex flex-wrap items-center gap-2">
        <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--color-text-primary)] mr-1">
          {company.name}
        </h1>
        {company.industry && (
          <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] font-medium">
            {company.industry}
          </span>
        )}
        {company.secCode && (
          <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--color-surface-secondary)] text-[var(--color-text-muted)]">
            {company.secCode}
          </span>
        )}
        {latest?.fiscalYear && (
          <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--color-surface-secondary)] text-[var(--color-text-muted)]">
            {formatFiscalYear(latest.fiscalYear)}
          </span>
        )}
      </div>

      {/* ── メイン：左 年収ヒーロー+グラフ(8列) / 右 KPI縦(4列) ── */}
      <div className="grid grid-cols-12 gap-3">

        {/* 左：年収大表示 + 推移グラフ */}
        <div className="col-span-12 lg:col-span-8 glass rounded-2xl p-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-widest mb-2">
                平均年収
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-6xl sm:text-7xl font-black text-gradient leading-none">
                  {salaryMan > 0 ? salaryMan.toLocaleString() : "—"}
                </span>
                {salaryMan > 0 && (
                  <span className="text-2xl font-bold text-[var(--color-text-secondary)]">万円</span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                {change !== null && (
                  <span className={`text-sm font-semibold ${change >= 0 ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"}`}>
                    前年比 {change >= 0 ? "▲" : "▼"} {Math.abs(change)}万円
                  </span>
                )}
                {industryAvg && (
                  <span className="text-xs text-[var(--color-text-muted)]">
                    業界平均 {industryAvg}万円
                  </span>
                )}
              </div>
            </div>
            {salaryMan > 0 && (
              <div className="hidden sm:flex flex-col items-end gap-2 shrink-0 ml-4">
                <span className="text-sm font-bold text-white bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] px-3 py-1.5 rounded-full whitespace-nowrap">
                  上位 {100 - percentile.percentile}%
                </span>
                <span className="text-xs text-[var(--color-text-muted)]">
                  偏差値 {percentile.deviation} · {rankLabel(percentile.deviation)}
                </span>
                <div className="w-36 h-2 rounded-full bg-white/50 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)]"
                    style={{ width: `${percentile.percentile}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 年収推移グラフ */}
          {trend.length > 0 ? (
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
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
                    width={50}
                  />
                  <Tooltip
                    labelFormatter={(label) => formatFiscalYear(label)}
                    formatter={(value) => [`${value}万円`, "平均年収"]}
                    contentStyle={{ borderRadius: "10px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.12)", fontSize: 13 }}
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

        {/* 右：KPIカード4枚縦並び */}
        <div className="col-span-12 lg:col-span-4 grid grid-rows-4 gap-3">
          {[
            { ...kpis[0], border: "border-[var(--color-primary)]" },
            { ...kpis[1], border: "border-[var(--color-accent)]" },
            { ...kpis[2], border: "border-[var(--color-success)]" },
            { ...kpis[3], border: "border-[var(--color-warning)]" },
          ].map((kpi) => (
            <div key={kpi.label} className={`glass rounded-xl px-5 py-4 border-l-4 ${kpi.border} flex flex-col justify-center`}>
              <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-1.5">
                {kpi.label}
              </p>
              <p className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text-primary)] leading-none mb-1">
                {kpi.value}
              </p>
              <p className={`text-xs ${subColorClass[kpi.subColor]}`}>{kpi.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── セカンダリ：DEI(3列) + 組織推移(5列) + 同業他社(4列) ── */}
      <div className="grid grid-cols-12 gap-3">

        {/* DEI：2指標を数字どーん */}
        <div className="col-span-12 lg:col-span-3">
          <DeiCompactSection latest={latest} industryDei={industryDei} />
        </div>

        {/* 組織データ推移 */}
        <div className="col-span-12 lg:col-span-5">
          <OrganizationTrendSection salaryHistory={salaryHistory} />
        </div>

        {/* 同業他社比較 */}
        <div className="col-span-12 lg:col-span-4 glass rounded-2xl p-5">
          <h2 className="text-base font-semibold text-[var(--color-text-primary)] mb-0.5">
            同業他社と比較
          </h2>
          <p className="text-xs text-[var(--color-text-muted)] mb-3">
            {company.industry || "同業界"} · 従業員1,000名以上
          </p>
          {peers.length > 0 ? (
            <div className="space-y-2">
              {/* 自社 */}
              <div className="rounded-xl bg-[var(--color-primary-light)] border border-[var(--color-primary)]/30 p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold text-[var(--color-primary)] truncate mr-2">
                    {company.name}
                  </span>
                  <span className="text-sm font-bold text-[var(--color-primary)] shrink-0">
                    {salaryMan}万円
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[var(--color-primary)]/20 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)]"
                    style={{ width: `${(salaryMan / maxPeerSalary) * 100}%` }}
                  />
                </div>
              </div>
              {/* 競合各社 */}
              {peers.map((peer) => (
                <Link
                  key={peer.code}
                  href={`/company/${peer.code}`}
                  className="block rounded-xl bg-[var(--color-surface-secondary)] hover:bg-[var(--color-primary-light)] p-3 transition-colors group"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)] truncate mr-2 transition-colors">
                      {peer.name}
                    </span>
                    <span className="text-sm font-semibold shrink-0">{peer.salary}万円</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/60 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--color-text-muted)] transition-all duration-500"
                      style={{ width: `${(peer.salary / maxPeerSalary) * 100}%` }}
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

      {/* ── DEI詳細 + DEI推移 ── */}
      {latest && (
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-12 lg:col-span-5">
            <DeiSection latest={latest} industryDei={industryDei} />
          </div>
          <div className="col-span-12 lg:col-span-7">
            <DeiTrendSection salaryHistory={salaryHistory} />
          </div>
        </div>
      )}

      {/* ── 財務 + 役員報酬/効率指標 ── */}
      {financialsHistory.length > 0 && (
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-12 lg:col-span-7">
            <FinancialsSection financialsHistory={financialsHistory} companyName={company.name} />
          </div>
          <div className="col-span-12 lg:col-span-5 space-y-3">
            {latest?.execCompTotal != null && latest.execCompTotal > 0 && (
              <ExecCompSection
                execCompTotal={latest.execCompTotal}
                execCompCount={latest.execCompCount}
                employees={latest.employees}
                fiscalYear={latest.fiscalYear}
                avgSalary={salaryMan}
              />
            )}
            <EfficiencySection salaryHistory={salaryHistory} financialsHistory={financialsHistory} />
          </div>
        </div>
      )}

      {/* ── 年収が近い企業 ── */}
      {similarCompanies.length > 0 && (
        <div className="glass rounded-2xl p-5">
          <h2 className="text-base font-semibold text-[var(--color-text-primary)] mb-1">
            年収が近い企業
          </h2>
          <p className="text-xs text-[var(--color-text-muted)] mb-3">
            同業界・近い年収帯の企業と比較してみよう
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {similarCompanies.map((c) => (
              <Link
                key={c.code}
                href={`/company/${c.code}`}
                className="flex flex-col gap-0.5 p-3 rounded-xl glass glass-hover hover:border-[var(--color-primary)] transition-colors"
              >
                <span className="text-xs font-semibold text-[var(--color-text-primary)] line-clamp-1">
                  {c.name}
                </span>
                <span className="text-lg font-bold text-gradient">
                  {c.salary.toLocaleString()}万円
                </span>
                <span className="text-[10px] text-[var(--color-text-muted)] line-clamp-1">
                  {c.industry}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── 下部アクション ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* 転職リンク */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
              {salaryMan > 0 ? `年収${salaryMan.toLocaleString()}万円以上の求人` : `${company.name}の求人を探す`}
            </h2>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-surface-secondary)] text-[var(--color-text-muted)]">PR</span>
          </div>
          {salaryMan > 0 && (
            <p className="text-xs text-[var(--color-text-muted)] mb-3">
              {company.name}と同等以上の年収求人をチェック
            </p>
          )}
          <div className="flex flex-col gap-2">
            {[
              { name: "doda", color: "from-orange-500 to-orange-600", url: `https://doda.jp/DodaFront/View/JobSearchResult/j_ks__searchkeyword-${encodeURIComponent(company.name)}/` },
              { name: "リクナビNEXT", color: "from-blue-500 to-blue-600", url: `https://next.rikunabi.com/tag/KEYWORD_${encodeURIComponent(company.name)}/` },
              { name: "ビズリーチ", color: "from-red-500 to-red-600", url: `https://www.bizreach.jp/job-list/?free_word=${encodeURIComponent(company.name)}` },
            ].map((site) => (
              <a key={site.name} href={site.url} target="_blank" rel="sponsored nofollow noopener noreferrer"
                className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r ${site.color} text-white text-xs font-bold hover:opacity-90 transition-opacity`}>
                {site.name}で求人を見る
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            ))}
          </div>
        </div>
        {/* シェア・比較 */}
        <div className="glass rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">シェア・比較</h2>
          <div className="space-y-3">
            <ShareButtons companyName={company.name} salary={salaryMan} code={company.secCode ?? ""} />
            {peers.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {peers.map((peer) => (
                  <Link key={peer.code} href={`/compare/${company.secCode ?? ""}-vs-${peer.code}`}
                    className="text-xs px-3 py-1.5 rounded-full glass text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-light)] transition-colors">
                    vs {peer.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
        {/* 広告 + データ注釈 */}
        <div className="glass rounded-2xl p-5 space-y-3">
          <AdBanner slot="9555970163" format="horizontal" className="" />
          <div>
            <h2 className="text-xs font-semibold text-[var(--color-text-primary)] mb-1">データについて</h2>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              有価証券報告書（EDINET）に基づくデータです。平均年収は単体・正社員の値です。
              <a href="https://disclosure.edinet-fsa.go.jp/" target="_blank" rel="noopener noreferrer"
                className="text-[var(--color-primary)] hover:underline ml-1">EDINET</a>でご確認ください。
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

function rankLabel(deviation: number): string {
  if (deviation >= 70) return "トップクラス";
  if (deviation >= 60) return "かなり高い";
  if (deviation >= 55) return "やや高い";
  if (deviation >= 45) return "平均的";
  if (deviation >= 40) return "やや低い";
  return "低め";
}

function OrganizationTrendSection({ salaryHistory, compact = false }: { salaryHistory: SalaryRecord[]; compact?: boolean }) {
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
    <div className="glass rounded-2xl p-5">
      <h2 className="text-base font-semibold text-[var(--color-text-primary)] mb-0.5">
        組織データの推移
      </h2>
      <p className="text-xs text-[var(--color-text-muted)] mb-3">
        従業員数（左軸）・平均年齢・勤続年数（右軸）
      </p>
      <div className={compact ? "h-[200px]" : "h-[220px] sm:h-[280px]"}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trendData} margin={{ top: 5, right: 40, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="year" tick={{ fontSize: 10 }} tickFormatter={(v) => formatFiscalYear(v)} />
            {hasEmployees && (
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 10 }}
                tickFormatter={(v) => `${v.toLocaleString()}名`}
                domain={[0, Math.ceil(maxEmployees * 1.2 / 1000) * 1000]}
                width={60}
              />
            )}
            {(hasAge || hasTenure) && (
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 10 }}
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
    <div className="glass rounded-2xl p-5">
      <h2 className="text-base font-semibold text-[var(--color-text-primary)] mb-0.5">
        従業員1人あたりの売上高
      </h2>
      <p className="text-xs text-[var(--color-text-muted)] mb-3">
        売上高 ÷ 従業員数（企業の効率性指標・万円/人）
      </p>
      <div className="h-[200px] sm:h-[240px]">
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

function DeiCompactSection({
  latest,
  industryDei,
}: {
  latest: SalaryRecord;
  industryDei: IndustryDei | null;
}) {
  const wageGap = latest.genderWageGapAll;
  const femaleManager = latest.femaleManagerRate;

  if (wageGap == null && femaleManager == null) {
    return (
      <div className="glass rounded-2xl p-5 h-full flex items-center justify-center">
        <p className="text-sm text-[var(--color-text-muted)] text-center">DEIデータなし</p>
      </div>
    );
  }

  const wageVsIndustry = wageGap != null && industryDei?.genderWageGapAll != null
    ? wageGap - industryDei.genderWageGapAll
    : null;
  const femaleVsIndustry = femaleManager != null && industryDei?.femaleManagerRate != null
    ? femaleManager - industryDei.femaleManagerRate
    : null;

  return (
    <div className="glass rounded-2xl p-5 h-full flex flex-col justify-between">
      <h2 className="text-sm font-semibold text-[var(--color-text-muted)] mb-4">DEI指標</h2>
      <div className="space-y-5 flex-1">
        {wageGap != null && (
          <div>
            <p className="text-xs text-[var(--color-text-muted)] mb-1">男女賃金格差</p>
            <div className="flex items-end gap-2">
              <span className="text-5xl font-black text-[var(--color-primary)] leading-none">
                {wageGap.toFixed(1)}
              </span>
              <span className="text-lg font-bold text-[var(--color-primary)] mb-0.5">%</span>
            </div>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">女性÷男性賃金</p>
            {wageVsIndustry != null && (
              <span className={`inline-block text-xs font-semibold mt-1 px-2 py-0.5 rounded-full ${wageVsIndustry >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                業界比 {wageVsIndustry >= 0 ? "+" : ""}{wageVsIndustry.toFixed(1)}pt
              </span>
            )}
          </div>
        )}
        {femaleManager != null && (
          <div>
            <p className="text-xs text-[var(--color-text-muted)] mb-1">女性管理職比率</p>
            <div className="flex items-end gap-2">
              <span className="text-5xl font-black text-[var(--color-accent)] leading-none">
                {femaleManager.toFixed(1)}
              </span>
              <span className="text-lg font-bold text-[var(--color-accent)] mb-0.5">%</span>
            </div>
            {femaleVsIndustry != null && (
              <span className={`inline-block text-xs font-semibold mt-1 px-2 py-0.5 rounded-full ${femaleVsIndustry >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                業界比 {femaleVsIndustry >= 0 ? "+" : ""}{femaleVsIndustry.toFixed(1)}pt
              </span>
            )}
          </div>
        )}
      </div>
      {industryDei && (
        <p className="text-xs text-[var(--color-text-muted)] mt-3">業界{industryDei.companyCount}社平均との比較</p>
      )}
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
    <div className="glass rounded-2xl p-5">
      <div className="flex items-start justify-between mb-0.5">
        <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
          DEI・男女格差データ
        </h2>
        {industryDei && (
          <span className="text-xs text-[var(--color-text-muted)] shrink-0 ml-2 mt-0.5">
            業界{industryDei.companyCount}社平均比較
          </span>
        )}
      </div>
      <p className="text-xs text-[var(--color-text-muted)] mb-4">
        有価証券報告書ベース（2023年度以降開示義務化）
      </p>
      <div className="space-y-4">
        {items.map((item) => {
          const pct = item.value!;
          const isGood = pct >= item.good;
          const barColor = isGood
            ? "bg-[var(--color-success)]"
            : pct >= item.good * 0.7
            ? "bg-yellow-400"
            : "bg-[var(--color-danger)]";
          const industryPct = item.industryAvg;
          const vsIndustry = industryPct != null ? pct - industryPct : null;

          return (
            <div key={item.label}>
              <div className="flex justify-between items-baseline mb-1.5">
                <span className="text-sm text-[var(--color-text-secondary)]">{item.label}</span>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  {vsIndustry !== null && (
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                      vsIndustry >= 0
                        ? "bg-[var(--color-success-light)] text-[var(--color-success)]"
                        : "bg-red-50 text-[var(--color-danger)]"
                    }`}>
                      {vsIndustry >= 0 ? "+" : ""}{vsIndustry.toFixed(1)}%
                    </span>
                  )}
                  <span className={`text-base font-bold ${isGood ? "text-[var(--color-success)]" : "text-[var(--color-text-primary)]"}`}>
                    {pct.toFixed(1)}%
                  </span>
                </div>
              </div>
              {/* この企業のバー */}
              <div className="h-2.5 rounded-full bg-[var(--color-surface-secondary)] overflow-hidden mb-1">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
              {/* 業界平均のバー */}
              {industryPct != null && (
                <div className="h-1.5 rounded-full bg-[var(--color-surface-secondary)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gray-300 transition-all duration-700"
                    style={{ width: `${Math.min(industryPct, 100)}%` }}
                  />
                </div>
              )}
              <div className="flex justify-between mt-1">
                <p className="text-xs text-[var(--color-text-muted)]">{item.desc}</p>
                {industryPct != null && (
                  <p className="text-xs text-[var(--color-text-muted)]">業界平均 {industryPct.toFixed(1)}%</p>
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
    <div className="glass rounded-2xl p-5">
      <h2 className="text-base font-semibold text-[var(--color-text-primary)] mb-0.5">
        DEI指標の推移
      </h2>
      <p className="text-xs text-[var(--color-text-muted)] mb-3">
        男女賃金格差・女性管理職比率・男性育休取得率の年度推移
      </p>
      <div className="h-[220px] sm:h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="year" tick={{ fontSize: 10 }} tickFormatter={(v) => formatFiscalYear(v)} />
            <YAxis
              tick={{ fontSize: 10 }}
              tickFormatter={(v) => `${v}%`}
              domain={[0, 110]}
              width={40}
            />
            <Tooltip
              labelFormatter={(label) => formatFiscalYear(label)}
              contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: 12 }}
              formatter={(value, name) => [`${Number(value).toFixed(1)}%`, name as string]}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {hasWageGap && (
              <Line
                type="monotone"
                dataKey="男女賃金格差"
                stroke="#1a56db"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "#1a56db" }}
                connectNulls
              />
            )}
            {hasFemaleManager && (
              <Line
                type="monotone"
                dataKey="女性管理職比率"
                stroke="#7c3aed"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "#7c3aed" }}
                connectNulls
              />
            )}
            {hasMaleLeave && (
              <Line
                type="monotone"
                dataKey="男性育休取得率"
                stroke="#10b981"
                strokeWidth={2.5}
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

function FinancialsSection({
  financialsHistory,
  companyName,
  compact = false,
}: {
  financialsHistory: FinancialsRecord[];
  companyName: string;
  compact?: boolean;
}) {
  const trendData = financialsHistory
    .filter((f) => f.netSales || f.operatingIncome)
    .map((f) => ({
      year: f.fiscalYear,
      売上高: f.netSales ? Math.round(f.netSales / 100_000_000) : null,      // 億円
      営業利益: f.operatingIncome ? Math.round(f.operatingIncome / 100_000_000) : null,
      営業利益率:
        f.netSales && f.operatingIncome && f.netSales > 0
          ? Math.round((f.operatingIncome / f.netSales) * 1000) / 10
          : null,
    }));

  if (trendData.length === 0) return null;

  const latest = financialsHistory[financialsHistory.length - 1];
  const isConsolidated = latest?.isConsolidated;

  const allValues = trendData.flatMap((d) => [d.売上高, d.営業利益]).filter((v): v is number => v != null);
  const maxVal = allValues.length > 0 ? Math.ceil(Math.max(...allValues) * 1.15 / 100) * 100 : 1000;

  return (
    <div className="glass rounded-2xl p-5">
      <h2 className="text-base font-semibold text-[var(--color-text-primary)] mb-0.5">
        業績推移
      </h2>
      <p className="text-xs text-[var(--color-text-muted)] mb-3">
        {isConsolidated ? "連結" : "単体"}・億円ベース
      </p>

      {/* 最新KPI（compactでない場合のみ） */}
      {latest && !compact && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {[
            { label: "売上高", value: latest.netSales },
            { label: "営業利益", value: latest.operatingIncome },
            { label: "経常利益", value: latest.ordinaryIncome },
            { label: "純利益", value: latest.netIncome },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl bg-[var(--color-surface-secondary)] p-3">
              <p className="text-xs text-[var(--color-text-muted)] mb-1">{label}</p>
              <p className="text-sm font-bold text-[var(--color-text-primary)]">
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
        <div className={compact ? "h-[185px]" : "h-[200px] sm:h-[260px]"}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={trendData} margin={{ top: 5, right: 40, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="year" tick={{ fontSize: 10 }} tickFormatter={(v) => formatFiscalYear(v)} />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 10 }}
                tickFormatter={(v) => `${v}億`}
                domain={[0, maxVal]}
                width={45}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 10 }}
                tickFormatter={(v) => `${v}%`}
                domain={[-20, 60]}
                width={35}
              />
              <Tooltip
                labelFormatter={(label) => formatFiscalYear(label)}
                contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: 12 }}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(v: any, name: any) => {
                  if (name === "営業利益率") return [`${Number(v).toFixed(1)}%`, name];
                  return [`${Number(v).toLocaleString()}億円`, name];
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar yAxisId="left" dataKey="売上高" fill="#1a56db" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="left" dataKey="営業利益" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="営業利益率"
                stroke="#f59e0b"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "#f59e0b" }}
                connectNulls
              />
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
    <div className="glass rounded-2xl p-5">
      <h2 className="text-base font-semibold text-[var(--color-text-primary)] mb-0.5">
        役員報酬
      </h2>
      <p className="text-xs text-[var(--color-text-muted)] mb-4">
        {formatFiscalYear(fiscalYear)}・有価証券報告書より
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-[var(--color-surface-secondary)] p-4">
          <p className="text-xs text-[var(--color-text-muted)] mb-1.5">役員報酬総額</p>
          <p className="text-xl font-extrabold text-[var(--color-text-primary)]">
            {totalOkuMan >= 1
              ? `${totalOkuMan}億円`
              : `${Math.round(execCompTotal / 10_000).toLocaleString()}万円`}
          </p>
        </div>
        {execCompCount != null && (
          <div className="rounded-xl bg-[var(--color-surface-secondary)] p-4">
            <p className="text-xs text-[var(--color-text-muted)] mb-1.5">対象役員数</p>
            <p className="text-xl font-extrabold text-[var(--color-text-primary)]">{execCompCount}名</p>
          </div>
        )}
        {perPerson != null && (
          <div className="rounded-xl bg-[var(--color-surface-secondary)] p-4">
            <p className="text-xs text-[var(--color-text-muted)] mb-1.5">役員1人あたり</p>
            <p className="text-xl font-extrabold text-[var(--color-text-primary)]">
              {perPerson.toLocaleString()}万円
            </p>
          </div>
        )}
        {ratio != null && (
          <div className="rounded-xl bg-[var(--color-surface-secondary)] p-4">
            <p className="text-xs text-[var(--color-text-muted)] mb-1.5">一般社員との格差</p>
            <p className="text-xl font-extrabold text-[var(--color-danger)]">{ratio}倍</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              社員 {avgSalary.toLocaleString()}万円比
            </p>
          </div>
        )}
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
