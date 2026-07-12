/**
 * 年収帯別の一覧ページ（ロングテールSEO）の定義。
 * - band: 「年収XXX万円台の企業一覧」（[min, min+100) の範囲）
 * - over: 「年収XXX万円以上の企業一覧」（min 以上すべて）
 * すべて万円単位。
 */

export type SalaryBand = {
  slug: string;
  kind: "band" | "over";
  /** 下限（含む・万円） */
  min: number;
  /** 上限（含まない・万円）。over は null */
  max: number | null;
  /** 見出し用ラベル（例: "600万円台"／"1000万円以上"） */
  label: string;
};

// 「〜万円台」ページ：データが十分にある300〜1300万円台
const BAND_MINS = [300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300];

// 「〜万円以上」ページ：検索されやすいキリの良いしきい値
const OVER_MINS = [600, 700, 800, 900, 1000, 1200, 1500, 2000];

export const SALARY_BANDS: SalaryBand[] = [
  ...BAND_MINS.map((min) => ({
    slug: `${min}manyen-dai`,
    kind: "band" as const,
    min,
    max: min + 100,
    label: `${min.toLocaleString()}万円台`,
  })),
  ...OVER_MINS.map((min) => ({
    slug: `over-${min}manyen`,
    kind: "over" as const,
    min,
    max: null,
    label: `${min.toLocaleString()}万円以上`,
  })),
];

export function getSalaryBand(slug: string): SalaryBand | undefined {
  return SALARY_BANDS.find((b) => b.slug === slug);
}

/** 年収（万円）がこの帯に含まれるか */
export function isInBand(salary: number, band: SalaryBand): boolean {
  if (salary < band.min) return false;
  if (band.max != null && salary >= band.max) return false;
  return true;
}
