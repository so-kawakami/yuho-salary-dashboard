import Link from "next/link";

const footerSections = [
  {
    title: "ランキング",
    links: [
      { label: "年収ランキング", href: "/ranking" },
      { label: "役員報酬ランキング", href: "/ranking/executive-pay" },
      { label: "1人あたり売上高", href: "/ranking/sales-per-employee" },
      { label: "女性管理職比率", href: "/ranking/female-managers" },
      { label: "勤続年数×高年収", href: "/ranking/long-tenure" },
      { label: "若手×高年収", href: "/ranking/young-high-income" },
    ],
  },
  {
    title: "調べる",
    links: [
      { label: "企業を探す", href: "/search" },
      { label: "業界別 平均年収", href: "/industries" },
      { label: "年収トレンド", href: "/trends" },
      { label: "年収偏差値チェッカー", href: "/#checker" },
    ],
  },
  {
    title: "人気の業界",
    links: [
      { label: "情報・通信", href: "/industries/情報・通信" },
      { label: "卸売（商社）", href: "/industries/卸売" },
      { label: "電気機器", href: "/industries/電気機器" },
      { label: "銀行", href: "/industries/銀行" },
      { label: "医薬品", href: "/industries/医薬品" },
    ],
  },
  {
    title: "サイト情報",
    links: [
      { label: "このサイトについて", href: "/about" },
      { label: "プライバシーポリシー", href: "/privacy" },
      { label: "お問い合わせ", href: "/contact" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="glass-header mt-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {footerSections.map((section) => (
            <div key={section.title}>
              <h2 className="text-xs font-bold text-[var(--color-text-primary)] uppercase tracking-wider mb-3">
                {section.title}
              </h2>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-[var(--color-border)] pt-6 text-center space-y-2">
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
            の有価証券報告書より自動集計
          </p>
          <p className="text-xs text-[var(--color-text-muted)]">
            ※ 平均年収は各企業の有価証券報告書に記載された「平均年間給与」（単体・正社員）の値です
          </p>
          <p className="text-xs text-[var(--color-text-muted)]">
            © {new Date().getFullYear()} 有報年収ダッシュボード 運営事務局 ·{" "}
            <Link href="/about" className="hover:text-[var(--color-primary)] transition-colors">運営者情報</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
