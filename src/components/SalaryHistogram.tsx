import type { HistogramBar } from "@/lib/distribution";

// 高さに応じて濃淡を変える（中央ほど濃く、外縁ほど薄く）
function barColor(pct: number, subdued: boolean): string {
  if (subdued) {
    // ハイライトありのとき、他のバーは soft 系のみ
    if (pct >= 55) return "#a3bedd";
    if (pct >= 25) return "#bccde2";
    if (pct >= 10) return "#cfdae9";
    if (pct >= 4) return "#dfe6ef";
    return "#e9eef4";
  }
  if (pct >= 85) return "#1e56a0";
  if (pct >= 55) return "#8fb0d6";
  if (pct >= 25) return "#bccde2";
  if (pct >= 10) return "#cfdae9";
  if (pct >= 4) return "#dfe6ef";
  return "#e9eef4";
}

export interface AxisLabel {
  text: string;
  highlight?: boolean;
}

/**
 * 年収分布ヒストグラム（純CSS・サーバーレンダリング可）
 * highlightIndex を指定すると該当バーだけ primary + ピルラベル表示
 */
export function SalaryHistogram({
  bars,
  height = 100,
  highlightIndex,
  highlightLabel,
  axisLabels,
}: {
  bars: HistogramBar[];
  height?: number;
  highlightIndex?: number;
  highlightLabel?: string;
  axisLabels: AxisLabel[];
}) {
  const hasHighlight = highlightIndex !== undefined && highlightIndex >= 0;

  return (
    <div className="relative">
      <div
        className="flex items-end gap-1"
        style={{ height, marginTop: hasHighlight ? 40 : 0 }}
      >
        {bars.map((bar, i) => {
          const isHighlight = hasHighlight && i === highlightIndex;
          // 端の区分ではピルが画面外にはみ出さないよう寄せる
          const pillPosition =
            i <= 1
              ? "left-0"
              : i >= bars.length - 2
                ? "right-0"
                : "left-1/2 -translate-x-1/2";
          return (
            <div
              key={bar.min}
              className="relative flex-1 rounded-t-[3px]"
              style={{
                height: `${bar.pct}%`,
                background: isHighlight
                  ? "#1e56a0"
                  : barColor(bar.pct, hasHighlight),
              }}
            >
              {isHighlight && highlightLabel && (
                <>
                  <div
                    className={`absolute ${pillPosition} bottom-[calc(100%+10px)] whitespace-nowrap bg-[var(--color-primary)] text-white text-[13.5px] font-bold rounded-full px-3.5 py-1`}
                  >
                    {highlightLabel}
                  </div>
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full w-0.5 h-2.5 bg-[var(--color-primary)]" />
                </>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-[13px] text-[var(--color-text-faint)] mt-2.5 pt-2.5 border-t border-[#dfe6ef]">
        {axisLabels.map((label) => (
          <span
            key={label.text}
            className={
              label.highlight ? "text-[var(--color-primary)] font-bold" : ""
            }
          >
            {label.text}
          </span>
        ))}
      </div>
    </div>
  );
}
