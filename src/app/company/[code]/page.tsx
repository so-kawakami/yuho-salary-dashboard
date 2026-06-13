import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CompanyDetailFromDb } from "@/components/CompanyDetailFromDb";
import { getCompany, getPeers, getIndustryDeiAverage, getSimilarCompanies } from "@/db/safe-queries";

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
  const similarCompanies = data ? getSimilarCompanies(
    code,
    latestForSimilar?.avgSalary ? Math.round(latestForSimilar.avgSalary / 10000) : 0,
    latestForSimilar?.employees ?? 0,
    data.company.industry ?? ""
  ) : [];

  if (!data) {
    return (
      <div className="flex flex-col min-h-full bg-mesh">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
              企業が見つかりません
            </h2>
            <p className="text-[var(--color-text-muted)] mb-4">
              コード: {code}
            </p>
            <Link
              href="/"
              className="text-[var(--color-primary)] hover:underline"
            >
              トップに戻る
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const latest = data.salaryHistory[data.salaryHistory.length - 1];
  const salaryMan = latest?.avgSalary ? Math.round(latest.avgSalary / 10000) : null;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "ホーム", item: "https://yuho-salary-dashboard.vercel.app" },
      { "@type": "ListItem", position: 2, name: "ランキング", item: "https://yuho-salary-dashboard.vercel.app/ranking" },
      { "@type": "ListItem", position: 3, name: data.company.name, item: `https://yuho-salary-dashboard.vercel.app/company/${code}` },
    ],
  };

  return (
    <div className="flex flex-col min-h-full bg-mesh">
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="mx-auto w-full max-w-[1600px] flex-1 px-3 py-4 sm:px-5">
        <nav className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] mb-6">
          <Link
            href="/"
            className="hover:text-[var(--color-primary)] transition-colors"
          >
            ホーム
          </Link>
          <span>/</span>
          <Link
            href="/ranking"
            className="hover:text-[var(--color-primary)] transition-colors"
          >
            ランキング
          </Link>
          <span>/</span>
          <span className="text-[var(--color-text-primary)]">
            {data.company.name}
          </span>
        </nav>

        <CompanyDetailFromDb
          company={data.company}
          salaryHistory={data.salaryHistory}
          peers={peers}
          financialsHistory={data.financialsHistory ?? []}
          industryDei={industryDei}
          similarCompanies={similarCompanies}
        />
      </main>

      <Footer />
    </div>
  );
}
