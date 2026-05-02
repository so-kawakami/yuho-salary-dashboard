import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { getCompaniesByIndustry, getAllIndustrySlugs, getIndustries } from "@/db/safe-queries";

export const dynamic = "force-static";

export function generateStaticParams() {
  return getAllIndustrySlugs().map((industry) => ({
    slug: encodeURIComponent(industry),
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const industry = decodeURIComponent(slug);
  return {
    title: `${industry}の平均年収ランキング | 有価証券報告書`,
    description: `${industry}業界の上場企業平均年収ランキング。有価証券報告書のデータをもとに各社の年収・従業員数・平均年齢を比較できます。`,
  };
}

export default async function IndustryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const industry = decodeURIComponent(slug);
  const companies = getCompaniesByIndustry(industry);
  const industries = getIndustries();
  const industryData = industries.find((i) => i.industry === industry);
  const avgSalary = industryData?.avgSalary ?? 0;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "ホーム", item: "https://yuho-salary-dashboard.vercel.app" },
      { "@type": "ListItem", position: 2, name: "業界別", item: "https://yuho-salary-dashboard.vercel.app/industries" },
      { "@type": "ListItem", position: 3, name: industry, item: `https://yuho-salary-dashboard.vercel.app/industries/${slug}` },
    ],
  };

  return (
    <div className="flex flex-col min-h-full bg-mesh">
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        <nav className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
          <Link href="/" className="hover:text-[var(--color-primary)] transition-colors">
            ホーム
          </Link>
          <span>/</span>
          <Link href="/industries" className="hover:text-[var(--color-primary)] transition-colors">
            業界別
          </Link>
          <span>/</span>
          <span className="text-[var(--color-text-primary)]">{industry}</span>
        </nav>

        {/* ヘッダー */}
        <div className="glass rounded-2xl p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] font-medium">
                {industry}
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text-primary)] mt-3">
                {industry}の年収ランキング
              </h1>
              <p className="text-sm text-[var(--color-text-muted)] mt-1">
                有価証券報告書ベース・{companies.length}社
              </p>
            </div>
            {avgSalary > 0 && (
              <div className="text-right">
                <p className="text-xs text-[var(--color-text-muted)] mb-1">業界平均年収</p>
                <div className="flex items-baseline gap-1 justify-end">
                  <span className="text-4xl font-extrabold text-gradient">
                    {avgSalary.toLocaleString()}
                  </span>
                  <span className="text-lg text-[var(--color-text-secondary)]">万円</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 企業ランキング */}
        {companies.length > 0 ? (
          <div className="glass rounded-2xl overflow-hidden">
            <div className="divide-y divide-white/10">
              {companies.map((company, i) => (
                <Link
                  key={company.code}
                  href={`/company/${company.code}`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-white/5 transition-colors"
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
                    <p className="font-bold text-[var(--color-text-primary)] truncate">{company.name}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {company.employees > 0 ? `従業員 ${company.employees.toLocaleString()}名` : ""}
                      {company.avgAge > 0 ? ` · 平均 ${company.avgAge}歳` : ""}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-extrabold text-gradient">
                      {company.salary.toLocaleString()}<span className="text-sm font-normal text-[var(--color-text-secondary)]">万円</span>
                    </p>
                    {avgSalary > 0 && (
                      <p className={`text-xs ${company.salary >= avgSalary ? "text-[var(--color-success)]" : "text-[var(--color-text-muted)]"}`}>
                        業界平均比 {company.salary >= avgSalary ? "+" : ""}{company.salary - avgSalary}万
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-[var(--color-text-muted)]">データがありません</p>
          </div>
        )}

        {/* 他の業界へのリンク */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-base font-bold text-[var(--color-text-primary)] mb-4">他の業界を見る</h2>
          <Link
            href="/industries"
            className="inline-flex items-center gap-1 text-sm text-[var(--color-primary)] hover:underline"
          >
            業界別ランキング一覧へ
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </main>

      <footer className="glass-header py-6">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-sm text-[var(--color-text-muted)]">
            データ出典：
            <a
              href="https://disclosure.edinet-fsa.go.jp/"
              className="text-[var(--color-primary)] hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              EDINET（金融庁）
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
