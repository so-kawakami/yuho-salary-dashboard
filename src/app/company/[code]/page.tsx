import Link from "next/link";
import { Header } from "@/components/Header";
import { CompanyDetailFromDb } from "@/components/CompanyDetailFromDb";
import { getCompany } from "@/db/safe-queries";

export const dynamic = "force-static";

// よくアクセスされる企業の静的生成
export function generateStaticParams() {
  const codes = [
    "6861", "8058", "8001", "8031", "8053",
    "6758", "6098", "8604", "7974", "9503",
  ];
  return codes.map((code) => ({ code }));
}

export default async function CompanyPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const data = getCompany(code);

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

  return (
    <div className="flex flex-col min-h-full bg-mesh">
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
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
        />
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
