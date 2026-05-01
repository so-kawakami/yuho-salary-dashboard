import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "お問い合わせ | 年収ダッシュボード",
  description: "年収ダッシュボードへのお問い合わせはこちらから。",
};

export const dynamic = "force-static";

export default function ContactPage() {
  return (
    <div className="flex flex-col min-h-full bg-mesh">
      <Header />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
        <nav className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] mb-8">
          <Link href="/" className="hover:text-[var(--color-primary)] transition-colors">
            ホーム
          </Link>
          <span>/</span>
          <span className="text-[var(--color-text-primary)]">お問い合わせ</span>
        </nav>

        <div className="glass rounded-2xl p-8 space-y-6">
          <div>
            <h1 className="text-2xl font-extrabold text-[var(--color-text-primary)] mb-2">
              お問い合わせ
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              データの誤りのご指摘、掲載に関するご要望、その他ご意見・ご質問がございましたら、
              以下のフォームからお気軽にご連絡ください。
            </p>
          </div>

          <div className="rounded-xl bg-[var(--color-surface-secondary)] p-5 space-y-3">
            <h2 className="text-sm font-bold text-[var(--color-text-primary)]">お問い合わせ内容の例</h2>
            <ul className="text-sm text-[var(--color-text-secondary)] space-y-1.5 list-disc list-inside">
              <li>掲載データの誤り・修正依頼</li>
              <li>企業情報の掲載削除依頼</li>
              <li>機能・改善のご要望</li>
              <li>その他ご意見・ご質問</li>
            </ul>
          </div>

          <div className="text-center py-4">
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSfVHRd1lIXFi7Lf5Z_eGWdAVvh7ChcqHmItuwGw79MI42qVUw/viewform"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] text-white font-bold text-base shadow-lg shadow-[var(--color-primary-glow)] hover:opacity-90 transition-opacity"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              お問い合わせフォームを開く
            </a>
            <p className="text-xs text-[var(--color-text-muted)] mt-3">
              Googleフォームが開きます（無料・登録不要）
            </p>
          </div>

          <div className="text-sm text-[var(--color-text-secondary)] leading-relaxed border-t border-white/10 pt-4">
            <p>
              ご返信にお時間をいただく場合がございます。あらかじめご了承ください。
            </p>
          </div>
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
