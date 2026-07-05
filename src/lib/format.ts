// 万円単位の金額を「3億6,475万円」形式にフォーマットする
// 1億円未満は「9,800万円」、端数なしの億は「2億円」になる
export function formatManYen(man: number): string {
  if (man >= 10_000) {
    const oku = Math.floor(man / 10_000);
    const rest = man % 10_000;
    return rest > 0 ? `${oku}億${rest.toLocaleString()}万円` : `${oku}億円`;
  }
  return `${man.toLocaleString()}万円`;
}
