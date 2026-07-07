import Link from "next/link";

interface IndustryData {
  industry: string;
  avgSalary: number;
  companies: number;
}

// 業界別 平均年収の横棒チャート（純CSS・サーバーレンダリング）
// 単色系の濃淡のみ。全体平均の縦点線リファレンス付き。年収+社数は常時表示
export function IndustryChart({
  data,
  overallAvg,
}: {
  data: IndustryData[];
  overallAvg: number;
}) {
  const sorted = [...data]
    .filter((d) => d.industry && d.companies > 0)
    .sort((a, b) => b.avgSalary - a.avgSalary);
  if (sorted.length === 0) return null;

  const max = sorted[0].avgSalary || 1;
  const avgPos = Math.min(1, overallAvg / max);

  const barColor = (rank: number) =>
    rank === 0 ? "#1e56a0" : rank <= 4 ? "#6b93c4" : "#a3bedd";

  return (
    <div className="bg-white border border-[var(--color-border)] rounded-2xl px-5 py-6 sm:px-9 sm:py-8 relative [--label-w:92px] sm:[--label-w:174px] [--value-w:88px] sm:[--value-w:174px]">
      {/* 全体平均の縦点線リファレンス */}
      <div
        className="absolute top-6 bottom-[52px] border-l-2 border-dashed border-[#bccde2] pointer-events-none"
        style={{
          left: `calc(var(--label-w) + 1rem + (100% - var(--label-w) - var(--value-w) - 2rem) * ${avgPos})`,
        }}
      />
      <div className="flex flex-col gap-3.5 relative">
        {sorted.map((ind, i) => (
          <Link
            key={ind.industry}
            href={`/industries/${encodeURIComponent(ind.industry)}`}
            className="grid grid-cols-[var(--label-w)_1fr_var(--value-w)] gap-4 items-center group"
          >
            <span
              className={`text-[13px] sm:text-[15px] text-right truncate group-hover:text-[var(--color-primary)] transition-colors ${
                i === 0 ? "font-bold" : "font-medium"
              }`}
            >
              {ind.industry}
            </span>
            <div className="h-[16px] sm:h-[22px] bg-[var(--color-border-subtle)] rounded-full">
              <div
                className="h-full rounded-full bar-grow"
                style={{
                  width: `${Math.max(3, (ind.avgSalary / max) * 100)}%`,
                  background: barColor(i),
                }}
              />
            </div>
            <span className="text-[13px] sm:text-[15px] font-bold whitespace-nowrap">
              {ind.avgSalary.toLocaleString()}万{" "}
              <span className="text-[12px] text-[var(--color-text-faint)] font-normal">
                {ind.companies.toLocaleString()}社
              </span>
            </span>
          </Link>
        ))}
      </div>
      <div className="mt-4 pt-3.5 border-t border-[var(--color-border-subtle)] ml-[calc(var(--label-w)+1rem)] text-[13px] text-[var(--color-text-muted)]">
        ┈ 上場企業全体の平均 {overallAvg.toLocaleString()}万円
      </div>
    </div>
  );
}
