// 年収推移の単色ラインチャート（SVG・サーバーレンダリング可）
// デザイン仕様: グリッド線・凡例・Y軸なし。データ点は白抜き丸、最新値のみ塗り丸+数値ラベル

export interface TrendPoint {
  /** X軸ラベル（例: FY2025） */
  label: string;
  /** 値（万円） */
  value: number;
}

export function TrendLine({ points }: { points: TrendPoint[] }) {
  if (points.length === 0) return null;

  const W = 480;
  const H = 200;
  const BASELINE = 164;
  const X_MIN = 55;
  const X_MAX = 445;

  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  // min→y140 / max→y66 にマッピング（上に数値ラベルの余白を残す）
  const yFor = (v: number) => 140 - ((v - min) / range) * 74;
  const xFor = (i: number) =>
    points.length === 1 ? W / 2 : X_MIN + ((X_MAX - X_MIN) * i) / (points.length - 1);

  const coords = points.map((p, i) => ({ ...p, x: xFor(i), y: yFor(p.value) }));
  const last = coords[coords.length - 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full block" role="img" aria-label="年収推移グラフ">
      <line x1={30} y1={BASELINE} x2={W - 20} y2={BASELINE} stroke="#e3e6ea" strokeWidth={1.5} />
      {coords.length > 1 && (
        <polyline
          points={coords.map((c) => `${c.x},${c.y}`).join(" ")}
          fill="none"
          stroke="#1e56a0"
          strokeWidth={3.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {coords.map((c, i) => {
        const isLast = i === coords.length - 1;
        return (
          <g key={c.label}>
            {isLast ? (
              <circle cx={c.x} cy={c.y} r={7} fill="#1e56a0" />
            ) : (
              <circle cx={c.x} cy={c.y} r={5} fill="#fff" stroke="#1e56a0" strokeWidth={2.5} />
            )}
            <text
              x={c.x}
              y={c.y - (isLast ? 22 : 16)}
              textAnchor="middle"
              fontWeight={700}
              fontSize={isLast ? 16 : 13}
              fill={isLast ? "#1e56a0" : "#8a929d"}
            >
              {isLast ? `${c.value.toLocaleString()}万` : c.value.toLocaleString()}
            </text>
            <text
              x={c.x}
              y={186}
              textAnchor="middle"
              fontWeight={700}
              fontSize={12.5}
              fill="#8a929d"
            >
              {c.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
