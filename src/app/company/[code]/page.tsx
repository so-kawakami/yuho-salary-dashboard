import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CompanyDetailFromDb, type RankContext } from "@/components/CompanyDetailFromDb";
import { buildHistogram, bucketIndexFor } from "@/lib/distribution";
import { buildCompanyFaq, buildCompanyJsonLd } from "@/lib/company-jsonld";
import {
  getCompany,
  getPeers,
  getIndustryDeiAverage,
  getSimilarCompanies,
  getAllCompanies,
  getStatsData,
} from "@/db/safe-queries";

export const dynamic = "force-static";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const data = getCompany(code);
  if (!data) return { title: "企業が見つかりません" };

  const { company, salaryHistory } = data;
  const latest = salaryHistory[salaryHistory.length - 1];
  const salaryMan = latest?.avgSalary
    ? Math.round(latest.avgSalary / 10000)
    : null;

  const yearStr = latest?.fiscalYear
    ? latest.fiscalYear.split("-")[0] + "年版"
    : "最新版";

  const title = salaryMan
    ? `${company.name}の平均年収は${salaryMan.toLocaleString()}万円【${yearStr}】業界順位・推移も解説`
    : `${company.name}の平均年収【有価証券報告書】`;

  const description = salaryMan
    ? `${company.name}の平均年収は${salaryMan.toLocaleString()}万円（${latest?.fiscalYear ?? ""}期・有価証券報告書より）。年収推移グラフ・業界内ランキング・同業他社比較・DEI指標・財務データを掲載。転職・就職の企業研究に。`
    : `${company.name}の平均年収・従業員数・平均年齢・勤続年数など有価証券報告書の詳細データ。業界内順位・同業他社比較も確認できます。`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
    },
    twitter: {
      title,
      description,
    },
  };
}

// 全企業分を静的生成
export function generateStaticParams() {
  try {
    const codes: string[] = require("@/data/generated/company-codes.json");
    return codes.map((code) => ({ code }));
  } catch {
    // JSONがなければフォールバック
    return ["6861", "8058", "8001", "8031", "8053"].map((code) => ({ code }));
  }
}

// 全社ランキング・業界内順位・分布などファーストビュー用の集計
function buildRankContext(code: string, industry: string, salaryMan: number): RankContext | null {
  if (salaryMan <= 0) return null;

  const ranked = getAllCompanies()
    .filter((c) => c.salary > 0)
    .sort((a, b) => b.salary - a.salary);
  if (ranked.length === 0) return null;

  const rank = ranked.findIndex((c) => c.code === code) + 1;
  if (rank === 0) return null;

  const inIndustry = industry
    ? ranked.filter((c) => c.industry === industry)
    : [];
  const industryRank = industry
    ? inIndustry.findIndex((c) => c.code === code) + 1
    : 0;
  const industryAvg =
    inIndustry.length > 0
      ? Math.round(inIndustry.reduce((s, c) => s + c.salary, 0) / inIndustry.length)
      : null;

  return {
    rank,
    totalRanked: ranked.length,
    industryAvg,
    industryRank: industryRank > 0 ? industryRank : null,
    industryCount: inIndustry.length,
    median: getStatsData().medianSalary,
    histogram: buildHistogram(ranked.map((c) => c.salary)),
    highlightIndex: bucketIndexFor(salaryMan),
  };
}

export default async function CompanyPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const data = getCompany(code);
  const peers = data ? getPeers(data.company.industry ?? "", code) : [];
  const industryDei = data ? getIndustryDeiAverage(data.company.industry ?? "") : null;
  const latestForSimilar = data?.salaryHistory[data.salaryHistory.length - 1];
  const salaryMan = latestForSimilar?.avgSalary
    ? Math.round(latestForSimilar.avgSalary / 10000)
    : 0;
  const similarCompanies = data ? getSimilarCompanies(
    code,
    salaryMan,
    latestForSimilar?.employees ?? 0,
    data.company.industry ?? ""
  ) : [];
  const context = data
    ? buildRankContext(code, data.company.industry ?? "", salaryMan)
    : null;

  if (!data) {
    return (
      <div className="flex flex-col min-h-full">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-black text-[var(--color-text)] mb-2">
              企業が見つかりません
            </h2>
            <p className="text-[var(--color-text-faint)] mb-4">
              コード: {code}
            </p>
            <Link
              href="/"
              className="text-[var(--color-primary)] font-bold hover:underline"
            >
              トップに戻る
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const faqFacts = {
    name: data.company.name,
    code,
    industry: data.company.industry ?? null,
    latest: {
      fiscalYear: latestForSimilar?.fiscalYear ?? "",
      salaryMan: salaryMan > 0 ? salaryMan : null,
      avgAge: latestForSimilar?.avgAge ?? null,
      avgTenure: latestForSimilar?.avgTenure ?? null,
      employees: latestForSimilar?.employees ?? null,
    },
    context: context
      ? {
          rank: context.rank,
          totalRanked: context.totalRanked,
          industryRank: context.industryRank,
          industryCount: context.industryCount,
        }
      : null,
  };
  const faq = buildCompanyFaq(faqFacts);
  const jsonLd = buildCompanyJsonLd(faqFacts, faq);

  return (
    <div className="flex flex-col min-h-full">
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-5 sm:px-8 lg:px-12 py-6 sm:py-8">
        <CompanyDetailFromDb
          company={data.company}
          salaryHistory={data.salaryHistory}
          peers={peers}
          financialsHistory={data.financialsHistory ?? []}
          industryDei={industryDei}
          similarCompanies={similarCompanies}
          context={context}
          faq={faq}
        />
      </main>

      <Footer />
    </div>
  );
}
