"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "ホーム", href: "/" },
  { label: "ランキング", href: "/ranking" },
  { label: "業界別", href: "/industries" },
  { label: "企業を探す", href: "/search" },
  { label: "トレンド", href: "/trends" },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="glass-header sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* ロゴ */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] text-white font-bold text-sm shadow-lg shadow-[var(--color-primary-glow)] group-hover:scale-105 transition-transform">
              ¥
            </div>
            <div>
              <h1 className="text-base font-bold text-[var(--color-text-primary)] leading-tight">
                年収ダッシュボード
              </h1>
              <p className="text-[10px] text-[var(--color-text-muted)] leading-tight tracking-wide">
                有価証券報告書データ
              </p>
            </div>
          </Link>

          {/* ナビゲーション */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                    isActive
                      ? "text-[var(--color-primary)] bg-[var(--color-primary-light)]"
                      : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-black/[0.03]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* 右側 */}
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-[var(--color-primary-light)] px-3 py-1 text-xs font-medium text-[var(--color-primary)] hidden sm:block">
              2025年3月期
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
