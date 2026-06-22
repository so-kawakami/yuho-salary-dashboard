import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "プライバシーポリシー | 年収ダッシュボード",
  description: "有報年収ダッシュボードのプライバシーポリシー。アクセス解析・Google AdSenseによる広告配信・Cookieの取り扱いについて説明しています。",
};

export const dynamic = "force-static";

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-full bg-mesh">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
        <nav className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] mb-8">
          <Link href="/" className="hover:text-[var(--color-primary)] transition-colors">
            ホーム
          </Link>
          <span>/</span>
          <span className="text-[var(--color-text-primary)]">プライバシーポリシー</span>
        </nav>

        <div className="glass rounded-2xl p-8 space-y-8">
          <div>
            <h1 className="text-2xl font-extrabold text-[var(--color-text-primary)] mb-2">
              プライバシーポリシー
            </h1>
            <p className="text-sm text-[var(--color-text-muted)]">最終更新日：2026年6月22日</p>
          </div>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">1. はじめに</h2>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              有報年収ダッシュボード（以下「本サイト」）は、有報年収ダッシュボード運営事務局（以下「当方」）が運営しています。
              当方はユーザーのプライバシーを尊重し、個人情報の保護に努めます。
              本プライバシーポリシーでは、本サイトにおける情報の取り扱いについて説明します。
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">2. アクセス解析について</h2>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              本サイトでは、サービス改善のために Vercel Analytics および Vercel Speed Insights を
              アクセス解析ツールとして使用しています。これらのツールはページビュー数・表示速度・参照元などの
              統計情報を収集しますが、個人を特定する情報やCookieによる個人の追跡は行いません。
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">3. 広告配信について</h2>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              本サイトは、第三者配信の広告サービス「Google AdSense」を利用する予定です。
              Googleなどの第三者配信事業者は、Cookieを使用して、ユーザーが本サイトや他のサイトに過去に
              アクセスした際の情報に基づいて広告を配信することがあります。
            </p>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              ユーザーは、
              <a href="https://adssettings.google.com/" target="_blank" rel="noopener noreferrer" className="text-[var(--color-primary)] hover:underline mx-1">
                Googleの広告設定
              </a>
              でパーソナライズ広告を無効にできます。また、
              <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer" className="text-[var(--color-primary)] hover:underline mx-1">
                www.aboutads.info
              </a>
              にアクセスすることで、第三者配信事業者のCookie利用を無効にできます。
              Googleによる広告とCookieの取り扱いの詳細は、
              <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer" className="text-[var(--color-primary)] hover:underline mx-1">
                Googleの広告に関するポリシー
              </a>
              をご確認ください。
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">4. Cookieについて</h2>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              本サイトでは、上記の広告配信事業者がCookieを使用する場合があります。
              Cookieはブラウザの設定からいつでも無効にすることができます。
              無効にした場合でも本サイトの主要な機能はご利用いただけますが、一部の機能や広告の最適化が
              正常に動作しない場合があります。
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">5. 掲載データについて</h2>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              本サイトに掲載している企業の年収データは、金融庁EDINET（電子開示システム）に公開されている
              有価証券報告書から自動的に収集・集計したものです。データの正確性については万全を期していますが、
              実際の数値と異なる場合があります。投資判断等の重要な決定には、必ず原典をご確認ください。
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">6. 免責事項</h2>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              本サイトのデータは情報提供を目的としており、投資・転職等の意思決定に対する責任は負いかねます。
              また、予告なく内容を変更・削除する場合があります。
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">7. プライバシーポリシーの変更</h2>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              本プライバシーポリシーは必要に応じて変更することがあります。
              変更後のポリシーは本ページに掲載します。
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">8. お問い合わせ</h2>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              本ポリシーに関するお問い合わせは
              <Link href="/contact" className="text-[var(--color-primary)] hover:underline mx-1">
                お問い合わせページ
              </Link>
              からご連絡ください。
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
