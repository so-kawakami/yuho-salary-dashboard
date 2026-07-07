"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// ホームのヒーロー検索ボックス。送信で /search に遷移する
export function HeroSearch({
  placeholder = "企業名で検索（例: 任天堂）",
}: {
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const router = useRouter();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        router.push(
          query.trim()
            ? `/search?q=${encodeURIComponent(query.trim())}`
            : "/search"
        );
      }}
      className="flex max-w-[480px] bg-white border-[1.5px] border-[var(--color-border-input)] rounded-xl p-1"
    >
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="flex-1 min-w-0 border-none outline-none bg-transparent px-4 py-3 text-[15px] text-[var(--color-text)] placeholder:text-[var(--color-text-faint)]"
      />
      <button
        type="submit"
        className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white px-6 py-3 text-[15px] font-bold rounded-[9px] transition-colors"
      >
        検索
      </button>
    </form>
  );
}
