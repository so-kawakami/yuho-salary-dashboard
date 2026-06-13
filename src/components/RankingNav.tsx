import Link from "next/link";

const RANKING_PAGES = [
  { href: "/ranking", label: "年収ランキング", emoji: "💰" },
  { href: "/ranking/executive-pay", label: "役員報酬", emoji: "👔" },
  { href: "/ranking/sales-per-employee", label: "1人あたり売上高", emoji: "📈" },
  { href: "/ranking/female-managers", label: "女性管理職比率", emoji: "⚖️" },
  { href: "/ranking/long-tenure", label: "勤続年数×高年収", emoji: "🏆" },
  { href: "/ranking/young-high-income", label: "若手×高年収", emoji: "🚀" },
];

// 独自ランキングページ間の相互ナビ（current は現在のページのhref）
export function RankingNav({ current }: { current: string }) {
  return (
    <div className="glass rounded-2xl p-4">
      <p className="text-xs font-bold text-[var(--color-text-muted)] mb-2.5">
        その他のランキング
      </p>
      <div className="flex flex-wrap gap-2">
        {RANKING_PAGES.filter((p) => p.href !== current).map((p) => (
          <Link
            key={p.href}
            href={p.href}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-full bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-light)] font-medium transition-colors"
          >
            <span>{p.emoji}</span>
            {p.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
