"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  { label: "ホーム", href: "/" },
  { label: "ランキング", href: "/ranking" },
  { label: "業界別", href: "/industries" },
  { label: "企業を探す", href: "/search" },
  { label: "偏差値チェッカー", href: "/#checker" },
];

// 収録社数バッジ用（ビルド時に生成されるJSON。なければ非表示）
let totalCompanies = 0;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  totalCompanies = require("@/data/generated/stats.json").totalCompanies ?? 0;
} catch {
  // 生成前はバッジを出さない
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  if (href === "/#checker") return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-[var(--color-surface-raised)] border-b border-[var(--color-border)]">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <div className="flex h-14 md:h-[68px] items-center justify-between">
          {/* ロゴ */}
          <Link
            href="/"
            className="flex items-center gap-2"
            onClick={() => setOpen(false)}
          >
            <span className="w-3 h-3 rounded-[3px] bg-[var(--color-primary)]" />
            <span className="text-[18px] font-black text-[var(--color-text)]">
              有報年収
            </span>
          </Link>

          {/* デスクトップナビ */}
          <nav className="hidden md:flex items-center gap-[30px] text-[15px] whitespace-nowrap">
            {navItems.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    active
                      ? "text-[var(--color-primary)] font-bold"
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                  }
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* 右側: 収録社数バッジ（デスクトップ）/ ハンバーガー（モバイル） */}
          <div className="flex items-center">
            {totalCompanies > 0 && (
              <span className="hidden md:inline-block bg-[var(--color-primary-tint)] text-[var(--color-text-body)] text-[13px] rounded-full px-3.5 py-1.5">
                {totalCompanies.toLocaleString()}社収録
              </span>
            )}
            <button
              onClick={() => setOpen(!open)}
              className="md:hidden flex flex-col items-center justify-center gap-[4.5px] w-11 h-11 -mr-2"
              aria-label="メニュー"
              aria-expanded={open}
            >
              {open ? (
                <svg
                  className="h-5 w-5 text-[var(--color-text)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <>
                  <span className="block w-5 h-0.5 rounded-full bg-[var(--color-text)]" />
                  <span className="block w-5 h-0.5 rounded-full bg-[var(--color-text)]" />
                  <span className="block w-[13px] h-0.5 rounded-full bg-[var(--color-text)] self-start ml-3" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* モバイルメニュー */}
      {open && (
        <nav className="md:hidden border-t border-[var(--color-border)] bg-[var(--color-surface-raised)]">
          <div className="px-5 py-2">
            {navItems.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`block py-3 min-h-11 text-[15px] border-b border-[var(--color-border-subtle)] last:border-b-0 ${
                    active
                      ? "text-[var(--color-primary)] font-bold"
                      : "text-[var(--color-text-body)]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
}
