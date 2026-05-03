import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { CompanyComparison } from "@/components/CompanyComparison";
import { getCompany, getPeers } from "@/db/safe-queries";

export const dynamic = "force-static";

function parseCodes(codes: string): [string, string] | null {
  const parts = codes.split("-vs-");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  return [parts[0], parts[1]];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ codes: string }>;
}): Promise<Metadata> {
  const { codes } = await params;
  const parsed = parseCodes(codes);
  if (!parsed) return { title: "企業比較 | 年収ダッシュボード" };

  const [data1, data2] = [getCompany(parsed[0]), getCompany(parsed[1])];
  if (!data1 || !data2) return { title: "企業比較 | 年収ダッシュボード" };

  const name1 = data1.company.name;
  const name2 = data2.company.name;
  const latest1 = data1.salaryHistory[data1.salaryHistory.length - 1];
  const latest2 = data2.salaryHistory[data2.salaryHistory.length - 1];
  const s1 = latest1?.avgSalary ? Math.round(latest1.avgSalary / 10000) : null;
  const s2 = latest2?.avgSalary ? Math.round(latest2.avgSalary / 10000) : null;

  const title = `${name1} vs ${name2} 年収比較【有価証券報告書】`;
  const description = s1 && s2
    ? `${name1}（${s1.toLocaleString()}万円）と${name2}（${s2.toLocaleString()}万円）の平均年収・従業員数・平均年齢などを有価証券報告書データで徹底比較。`
    : `${name1}と${name2}の年収データを有価証券報告書で比較。`;

  return {
    title,
    description,
    openGraph: { title, description },
    twitter: { title, description },
  };
}

export function generateStaticParams() {
  // 静的生成は行わず、動的に生成（組み合わせが膨大なため）
  return [];
}

export default async function ComparePage({
  params,
}: {
  params: Promise<{ codes: string }>;
}) {
  const { codes } = await params;
  const parsed = parseCodes(codes);

  if (!parsed) {
    return (
      <div className="flex flex-col min-h-full bg-mesh">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
              URLの形式が正しくありません
            </h2>
            <p className="text-[var(--color-text-muted)] mb-4">
              /compare/証券コード1-vs-証券コード2 の形式で指定してください
            </p>
            <Link href="/search" className="text-[var(--color-primary)] hover:underline">
              企業を探す
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const [code1, code2] = parsed;
  const data1 = getCompany(code1);
  const data2 = getCompany(code2);

  if (!data1 || !data2) {
    return (
      <div className="flex flex-col min-h-full bg-mesh">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
              企業が見つかりません
            </h2>
            <p className="text-[var(--color-text-muted)] mb-4">
              {!data1 && `コード ${code1} `}
              {!data1 && !data2 && "・"}
              {!data2 && `コード ${code2} `}
              が見つかりませんでした
            </p>
            <Link href="/search" className="text-[var(--color-primary)] hover:underline">
              企業を探す
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "ホーム", item: "https://yuho-salary-dashboard.vercel.app" },
      { "@type": "ListItem", position: 2, name: "企業比較", item: `https://yuho-salary-dashboard.vercel.app/compare/${codes}` },
    ],
  };

  return (
    <div className="flex flex-col min-h-full bg-mesh">
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <nav className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] mb-6">
          <Link href="/" className="hover:text-[var(--color-primary)] transition-colors">
            ホーム
          </Link>
          <span>/</span>
          <span className="text-[var(--color-text-primary)]">
            {data1.company.name} vs {data2.company.name}
          </span>
        </nav>

        <CompanyComparison data1={data1} data2={data2} />
      </main>

      <footer className="glass-header py-6">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-sm text-[var(--color-text-muted)]">
            データ出典：
            <a href="https://disclosure.edinet-fsa.go.jp/" className="text-[var(--color-primary)] hover:underline" target="_blank" rel="noopener noreferrer">
              EDINET（金融庁）
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
