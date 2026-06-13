import type { Metadata } from "next";
import { Suspense } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SearchForm } from "@/components/SearchForm";
import { getAllCompanies } from "@/db/safe-queries";

export const metadata: Metadata = {
  title: "企業を探す | 上場企業の年収検索",
  description:
    "企業名・業種・証券コードで上場企業の平均年収を検索。有価証券報告書の公式データをもとにした正確な年収情報を確認できます。",
};

export const dynamic = "force-static";

export default function SearchPage() {
  const allCompanies = getAllCompanies();

  return (
    <div className="flex flex-col min-h-full bg-mesh">
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        <div>
          <h2 className="text-2xl font-extrabold text-[var(--color-text-primary)] mb-1">
            企業を探す
          </h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            全{allCompanies.length.toLocaleString()}社の年収データを企業名・業種・証券コードで検索
          </p>
        </div>

        <Suspense>
          <SearchForm companies={allCompanies} />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
