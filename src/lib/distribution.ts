// 年収分布ヒストグラム（13区分）の集計ロジック
// デザイン仕様: 〜300万 から 2,500万+ までの13本バー

export interface HistogramBar {
  /** 区分の下限（万円） */
  min: number;
  /** 区分の上限（万円、最終区分は Infinity） */
  max: number;
  /** 該当企業数 */
  count: number;
  /** 最大区分を100とした相対高さ（%） */
  pct: number;
}

const BUCKET_EDGES = [
  0, 300, 400, 500, 600, 700, 800, 900, 1000, 1200, 1500, 2000, 2500,
];

/** 年収（万円）が属する区分のインデックスを返す */
export function bucketIndexFor(salary: number): number {
  for (let i = BUCKET_EDGES.length - 1; i >= 0; i--) {
    if (salary >= BUCKET_EDGES[i]) return i;
  }
  return 0;
}

/** 年収リスト（万円）から13区分のヒストグラムを作る */
export function buildHistogram(salaries: number[]): HistogramBar[] {
  const counts = new Array(BUCKET_EDGES.length).fill(0);
  for (const s of salaries) {
    if (s > 0) counts[bucketIndexFor(s)]++;
  }
  const maxCount = Math.max(1, ...counts);
  return counts.map((count, i) => ({
    min: BUCKET_EDGES[i],
    max: i === BUCKET_EDGES.length - 1 ? Infinity : BUCKET_EDGES[i + 1],
    count,
    pct: Math.max(2, Math.round((count / maxCount) * 100)),
  }));
}
