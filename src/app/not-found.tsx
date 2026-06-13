import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function NotFound() {
  return (
    <div className="flex flex-col min-h-full bg-mesh">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="text-center max-w-md">
          <p className="text-6xl mb-4">🔍</p>
          <h1 className="text-3xl font-extrabold text-[var(--color-text-primary)] mb-3">
            ページが見つかりません
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mb-8 leading-relaxed">
            お探しのページは移動または削除された可能性があります。
            企業名で検索するか、ランキングからお探しください。
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/search"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] text-white text-sm font-bold shadow-lg shadow-[var(--color-primary-glow)] hover:opacity-90 transition-opacity"
            >
              企業を検索する
            </Link>
            <Link
              href="/ranking"
              className="px-6 py-3 rounded-xl glass text-sm font-bold text-[var(--color-primary)] hover:bg-[var(--color-primary-light)] transition-colors"
            >
              年収ランキングを見る
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
