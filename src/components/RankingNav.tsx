import Link from "next/link";

const RANKING_PAGES = [
  { href: "/ranking", label: "年収ランキング" },
  { href: "/ranking/executive-pay", label: "役員報酬" },
  { href: "/ranking/sales-per-employee", label: "1人あたり売上高" },
  { href: "/ranking/female-managers", label: "女性管理職比率" },
  { href: "/ranking/long-tenure", label: "勤続年数×高年収" },
  { href: "/ranking/young-high-income", label: "若手×高年収" },
];

// 独自ランキングページ間の相互ナビ（current は現在のページのhref）
export function RankingNav({ current }: { current: string }) {
  return (
    <div className="bg-white border border-[var(--color-border)] rounded-2xl px-5 py-4">
      <p className="text-[13px] font-bold text-[var(--color-text-muted)] mb-2.5">
        その他のランキング
      </p>
      <div className="flex flex-wrap gap-2">
        {RANKING_PAGES.filter((p) => p.href !== current).map((p) => (
          <Link
            key={p.href}
            href={p.href}
            className="inline-flex items-center text-[13px] px-3.5 py-[7px] rounded-full bg-white border border-[var(--color-border-input)] text-[var(--color-text-body)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] font-medium transition-colors"
          >
            {p.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
