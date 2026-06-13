import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getStatsData } from "@/db/safe-queries";

export const metadata: Metadata = {
  title: "このサイトについて | 有報年収ダッシュボード",
  description:
    "有報年収ダッシュボードは、金融庁EDINETに公開されている有価証券報告書をもとに、上場企業を含む4,000社以上の平均年収・DEI指標・財務データをわかりやすく可視化したサービスです。",
};

export const dynamic = "force-static";

export default function AboutPage() {
  const stats = getStatsData();

  return (
    <div className="flex flex-col min-h-full bg-mesh">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
        <nav className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] mb-8">
          <Link href="/" className="hover:text-[var(--color-primary)] transition-colors">
            ホーム
          </Link>
          <span>/</span>
          <span className="text-[var(--color-text-primary)]">このサイトについて</span>
        </nav>

        <div className="space-y-6">
          {/* ヘッダーカード */}
          <div className="glass rounded-2xl p-8">
            <h1 className="text-2xl font-extrabold text-[var(--color-text-primary)] mb-3">
              有報年収ダッシュボードとは
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              有報年収ダッシュボードは、金融庁が運営する電子開示システム「EDINET」に公開されている
              有価証券報告書のデータをもとに、上場企業を中心とする{stats.totalCompanies.toLocaleString()}社の
              平均年収・従業員情報・DEI指標・財務データを一覧できるサービスです。
              転職・就職活動の参考情報として、また企業研究・業界分析のツールとして、
              どなたでも無料でご利用いただけます。
            </p>
          </div>

          {/* このサイトでできること */}
          <div className="glass rounded-2xl p-8 space-y-5">
            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
              このサイトでできること
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  icon: "💰",
                  title: "企業の平均年収を調べる",
                  desc: "上場企業を含む4,000社以上の平均年収を有価証券報告書の公式データで確認できます。年度ごとの推移グラフで、給与トレンドも把握できます。",
                },
                {
                  icon: "📊",
                  title: "業界別に比較する",
                  desc: "情報・通信業、製造業、金融業など業界ごとの平均年収を比較。同業他社との年収差をグラフで視覚的に確認できます。",
                },
                {
                  icon: "📈",
                  title: "DEI指標を確認する",
                  desc: "男女賃金格差・男性育休取得率・女性管理職比率など、2023年度以降に開示義務化されたDEI（多様性・公平性・包括性）データを掲載しています。",
                },
                {
                  icon: "🏢",
                  title: "財務情報と年収を照合する",
                  desc: "売上高・営業利益の推移と年収を並べて確認できます。「業績が上がっても年収が変わらない企業」や「効率よく稼ぐ企業」を見つけることができます。",
                },
                {
                  icon: "🎯",
                  title: "年収偏差値を計算する",
                  desc: "自分の年収が上場企業全体の中でどの位置にあるかを偏差値で確認できます。転職・交渉時の参考情報としてご活用ください。",
                },
                {
                  icon: "🔍",
                  title: "企業を横断検索する",
                  desc: "社名・業種での検索や、年収・従業員数・平均年齢によるランキングフィルタリングが可能です。",
                },
              ].map((item) => (
                <div key={item.title} className="rounded-xl bg-[var(--color-surface-secondary)] p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{item.icon}</span>
                    <h3 className="text-sm font-bold text-[var(--color-text-primary)]">{item.title}</h3>
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* データについて */}
          <div className="glass rounded-2xl p-8 space-y-4">
            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
              データの出典と収集方法
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              掲載しているデータはすべて、金融庁が運営する電子開示システム「EDINET（Electronic Disclosure for Investors' NETwork）」に
              上場企業が法定開示書類として提出した有価証券報告書から収集しています。
              有価証券報告書は金融商品取引法に基づいて毎年提出が義務づけられており、
              内容は法的根拠のある公式な開示情報です。
            </p>
            <div className="rounded-xl bg-[var(--color-surface-secondary)] p-4 space-y-2">
              <h3 className="text-sm font-bold text-[var(--color-text-primary)]">収集・加工の流れ</h3>
              <ol className="text-xs text-[var(--color-text-secondary)] space-y-1.5 list-decimal list-inside">
                <li>EDINET APIから各社の有価証券報告書（XBRL形式）を取得</li>
                <li>XBRL内の標準タグ（jpcrp_cor / jppfs_cor）から数値データを抽出</li>
                <li>抽出したデータをデータベースに格納し、集計・分析処理を実施</li>
                <li>業界平均・偏差値・前年比などの2次指標を計算</li>
                <li>グラフ・ランキング形式でWeb上に公開</li>
              </ol>
            </div>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              なお、原典データは
              <a
                href="https://disclosure.edinet-fsa.go.jp/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--color-primary)] hover:underline mx-1"
              >
                EDINET公式サイト
              </a>
              でどなたでも無料で確認できます。重要な意思決定の際は必ず原典をご参照ください。
            </p>
          </div>

          {/* データの見方・注意事項 */}
          <div className="glass rounded-2xl p-8 space-y-4">
            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
              データの見方と注意事項
            </h2>
            <div className="space-y-3">
              {[
                {
                  title: "「平均年収」は単体・正社員のデータです",
                  body: "有価証券報告書に記載される「平均年間給与」は、提出会社（単体）の正規従業員のものです。連結子会社の社員・パート・アルバイトは含まれません。持株会社形式の企業は従業員数が少なく年収が高く見える場合があります。",
                },
                {
                  title: "年度は「提出期」で表示しています",
                  body: "「2024年3月期」は2023年4月〜2024年3月の事業年度を指します。企業によって決算月が異なるため、同年度でも実際の期間が異なる場合があります。",
                },
                {
                  title: "DEIデータは2023年度以降の大企業が対象です",
                  body: "男女賃金格差・男性育休取得率・女性管理職比率などのDEI指標は、2023年度から開示が義務化されました。中小企業や開示前の年度ではデータが存在しない場合があります。",
                },
                {
                  title: "財務データは連結・単体が混在します",
                  body: "売上高・営業利益などの財務データは企業によって連結または単体のいずれかが掲載されます。表示時に「連結」「単体」の区別を明記しています。",
                },
              ].map((item) => (
                <div key={item.title} className="rounded-xl bg-[var(--color-surface-secondary)] p-4">
                  <h3 className="text-sm font-bold text-[var(--color-text-primary)] mb-1.5">{item.title}</h3>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 免責・お問い合わせ */}
          <div className="glass rounded-2xl p-8 space-y-4">
            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
              免責事項・お問い合わせ
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              本サービスのデータは情報提供を目的としており、転職・投資・その他の意思決定に際しての
              結果についていかなる責任も負いかねます。掲載データに誤りを発見した場合や、
              企業情報の掲載に関するご要望は、下記お問い合わせページよりご連絡ください。
            </p>
            <div className="flex gap-3">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-sm font-bold hover:opacity-90 transition-opacity"
              >
                お問い合わせ
              </Link>
              <Link
                href="/privacy"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl glass text-[var(--color-text-secondary)] text-sm font-medium hover:text-[var(--color-primary)] transition-colors"
              >
                プライバシーポリシー
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
