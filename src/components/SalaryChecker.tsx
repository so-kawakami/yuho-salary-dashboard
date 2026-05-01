"use client";

import { useState } from "react";
import { calcSalaryPercentile } from "@/data/mock";

export function SalaryChecker() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<ReturnType<
    typeof calcSalaryPercentile
  > | null>(null);

  const handleCheck = () => {
    const salary = parseInt(input, 10);
    if (isNaN(salary) || salary <= 0) return;
    setResult(calcSalaryPercentile(salary));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleCheck();
  };

  return (
    <div className="glass rounded-2xl p-6 sm:p-8 glass-hover">
      <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-1">
        年収偏差値チェッカー
      </h2>
      <p className="text-sm text-[var(--color-text-muted)] mb-5">
        あなたの年収は上場企業の中でどのくらい？
      </p>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <input
            type="number"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setResult(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder="年収を入力（万円）"
            className="w-full h-12 rounded-xl border border-[var(--color-border)] bg-white/60 px-4 text-base outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)] transition placeholder:text-[var(--color-text-muted)]"
          />
          <span className="absolute right-4 top-3.5 text-sm text-[var(--color-text-muted)]">
            万円
          </span>
        </div>
        <button
          onClick={handleCheck}
          className="h-12 px-6 rounded-xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] text-white font-medium text-sm shadow-lg shadow-[var(--color-primary-glow)] hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          診断する
        </button>
      </div>

      {result && (
        <div className="mt-6 rounded-xl bg-gradient-to-r from-[var(--color-primary-light)] to-[var(--color-accent-light)] p-5 animate-[fadeIn_0.3s_ease-out]">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-sm text-[var(--color-text-secondary)] mb-1">
                あなたの年収偏差値
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-gradient">
                  {result.deviation}
                </span>
                <span className="text-sm font-medium text-[var(--color-text-secondary)]">
                  / {result.label}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-[var(--color-text-secondary)]">
                上場企業社員の中で
              </p>
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                上位{" "}
                <span className="text-[var(--color-primary)]">
                  {100 - result.percentile}%
                </span>
              </p>
            </div>
          </div>

          <div className="mt-4 h-3 rounded-full bg-white/50 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] transition-all duration-700 ease-out"
              style={{ width: `${result.percentile}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-[var(--color-text-muted)]">
            <span>0%</span>
            <span>あなたの位置</span>
            <span>100%</span>
          </div>
        </div>
      )}
    </div>
  );
}
