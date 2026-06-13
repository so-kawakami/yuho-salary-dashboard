"use client";

import Link from "next/link";
import { useState } from "react";
import { calcSalaryPercentile } from "@/data/mock";

interface CheckerStats {
  totalCompanies: number;
  salaryMean?: number;
  salaryStddev?: number;
}

interface SampleCompany {
  code: string;
  name: string;
  salary: number;
}

export function SalaryChecker({
  stats,
  sampleCompanies = [],
}: {
  stats?: CheckerStats;
  sampleCompanies?: SampleCompany[];
}) {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<ReturnType<
    typeof calcSalaryPercentile
  > | null>(null);
  const [checkedSalary, setCheckedSalary] = useState(0);

  const handleCheck = () => {
    const salary = parseInt(input, 10);
    if (isNaN(salary) || salary <= 0) return;
    setCheckedSalary(salary);
    setResult(calcSalaryPercentile(salary, stats?.salaryMean, stats?.salaryStddev));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleCheck();
  };

  // 診断した年収に近い企業（±60万円 → 足りなければ±100万円）
  const nearbyCompanies = (() => {
    if (!result || checkedSalary <= 0 || sampleCompanies.length === 0) return [];
    const within = (range: number) =>
      sampleCompanies
        .filter((c) => Math.abs(c.salary - checkedSalary) <= range)
        .sort((a, b) => Math.abs(a.salary - checkedSalary) - Math.abs(b.salary - checkedSalary));
    const near = within(60);
    return (near.length >= 3 ? near : within(100)).slice(0, 6);
  })();

  return (
    <div className="glass rounded-2xl p-6 sm:p-8 glass-hover">
      <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-1">
        年収偏差値チェッカー
      </h2>
      <p className="text-sm text-[var(--color-text-muted)] mb-5">
        あなたの年収は上場企業{stats ? ` ${stats.totalCompanies.toLocaleString()}社` : ""}の中でどのくらい？
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

          {/* あなたと同じ年収帯の企業 */}
          {nearbyCompanies.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/30">
              <p className="text-xs text-[var(--color-text-muted)] mb-2">
                あなたと同じ年収帯の上場企業（平均年収）
              </p>
              <div className="flex gap-2 flex-wrap">
                {nearbyCompanies.map((c) => (
                  <Link
                    key={c.code}
                    href={`/company/${c.code}`}
                    className="text-xs px-3 py-1.5 rounded-full bg-white/70 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:bg-white transition-colors"
                  >
                    {c.name}{" "}
                    <span className="font-bold">{c.salary.toLocaleString()}万</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* シェアボタン */}
          <div className="mt-4 pt-4 border-t border-white/30">
            <p className="text-xs text-[var(--color-text-muted)] mb-2">結果をシェア</p>
            <div className="flex gap-2 flex-wrap">
              <a
                href={`https://x.com/intent/tweet?text=${encodeURIComponent(`私の年収偏差値は${result.deviation}！上場企業の中で上位${100 - result.percentile}%でした。あなたの年収偏差値は？`)}&url=${encodeURIComponent(`https://yuho-salary-dashboard.vercel.app/checker/${checkedSalary}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-black text-white text-xs font-bold hover:bg-gray-800 transition-colors"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                Xでシェア
              </a>
              <a
                href={`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(`https://yuho-salary-dashboard.vercel.app/checker/${checkedSalary}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#06C755] text-white text-xs font-bold hover:bg-[#05b34c] transition-colors"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.508-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.508.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                </svg>
                LINEで送る
              </a>
              <Link
                href={`/checker/${checkedSalary}`}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg glass text-[var(--color-primary)] text-xs font-bold hover:bg-[var(--color-primary-light)] transition-colors"
              >
                詳しい結果ページを見る →
              </Link>
              <Link
                href="/ranking"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg glass text-[var(--color-primary)] text-xs font-bold hover:bg-[var(--color-primary-light)] transition-colors"
              >
                年収ランキングを見る →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
