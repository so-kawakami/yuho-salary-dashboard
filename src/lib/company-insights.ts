/**
 * 企業ページの「データで読む年収」セクション用の分析文を組み立てる。
 *
 * 方針:
 * - 有報の数値から機械的に導ける事実だけを書く。推測や評価は書かない。
 *   （例: 「高収益だから年収が高い」とは書かず、「同じ時期に両方が伸びている」と書く）
 * - データが足りない項目は、その項目ごと出さない。歯抜けの文を作らない。
 */

export type SalaryPoint = {
  fiscalYear: string;
  avgSalary: number | null;
  employees: number | null;
  avgAge: number | null;
  avgTenure: number | null;
  execCompTotal?: number | null;
  execCompCount?: number | null;
};

export type FinancialPoint = {
  fiscalYear: string;
  netSales: number | null;
  operatingIncome: number | null;
};

export type Insight = { heading: string; body: string };

import { formatManYen } from "./format";

/** 円を「1億475万円」形式にする（表示は既存のランキングと揃える） */
const man = (yen: number) => formatManYen(Math.round(yen / 10000));
/** 売上など大きい金額は億円単位。10億円未満は小数第1位まで残す */
const oku = (yen: number) => {
  const v = yen / 100000000;
  return `${v.toLocaleString(undefined, { maximumFractionDigits: v < 10 ? 1 : 0 })}億円`;
};
const pct = (n: number) => `${n.toFixed(1)}%`;
const fyLabel = (fy: string) => `${fy.split("-")[0]}年${Number(fy.split("-")[1])}月期`;

/**
 * 前年比で年収が1.5倍超/3分の2未満に動いているのに従業員数がほぼ同じ場合、
 * 有報の記載ミスや開示範囲の変更（持株会社化など）が疑われる。
 * そのまま「◯◯万円増加しました」と書くと誤情報になるため、推移の分析は出さない。
 */
function hasSalaryAnomaly(sal: SalaryPoint[]): boolean {
  for (let i = 1; i < sal.length; i++) {
    const a = sal[i - 1];
    const b = sal[i];
    if (!a.avgSalary || !b.avgSalary || !a.employees || !b.employees) continue;
    const salaryRatio = b.avgSalary / a.avgSalary;
    const empRatio = b.employees / a.employees;
    if ((salaryRatio > 1.5 || salaryRatio < 0.67) && empRatio >= 0.8 && empRatio <= 1.25) {
      return true;
    }
  }
  return false;
}

export function buildCompanyInsights(
  name: string,
  salaryHistory: SalaryPoint[],
  financialsHistory: FinancialPoint[],
  industryAvgSalary: number | null
): Insight[] {
  const insights: Insight[] = [];
  const sal = salaryHistory.filter((s) => s.avgSalary && s.avgSalary > 0);
  const latest = sal[sal.length - 1];
  if (!latest?.avgSalary) return insights;

  const anomaly = hasSalaryAnomaly(sal);

  // 1. 年収の推移（データが不自然な企業では出さない）
  if (sal.length >= 2 && !anomaly) {
    const first = sal[0];
    const diff = latest.avgSalary - (first.avgSalary ?? 0);
    const rate = ((latest.avgSalary / (first.avgSalary ?? 1)) - 1) * 100;
    const years = sal.length - 1;
    const dir = diff >= 0 ? "増加" : "減少";
    insights.push({
      heading: `${years}年間で平均年収は${man(Math.abs(diff))}${dir}`,
      body:
        `${name}の平均年間給与は、${fyLabel(first.fiscalYear)}の${man(first.avgSalary ?? 0)}から` +
        `${fyLabel(latest.fiscalYear)}の${man(latest.avgSalary)}へ、${years}年間で${man(Math.abs(diff))}（${pct(Math.abs(rate))}）${dir}しました。` +
        `いずれも有価証券報告書に記載された従業員の平均年間給与で、賞与・基準外賃金を含みます。`,
    });
  }

  // 2. 業績との関係（売上・営業利益・営業利益率）
  const fin = financialsHistory.filter((f) => f.netSales && f.netSales > 0);
  const fLatest = fin[fin.length - 1];
  const fFirst = fin[0];
  if (fLatest?.netSales && fFirst?.netSales && fin.length >= 3 && !anomaly) {
    const salesRate = ((fLatest.netSales / fFirst.netSales) - 1) * 100;
    const marginText =
      fLatest.operatingIncome != null
        ? `${fyLabel(fLatest.fiscalYear)}の営業利益は${oku(fLatest.operatingIncome)}、売上高営業利益率は${pct((fLatest.operatingIncome / fLatest.netSales) * 100)}です。`
        : "";
    const salaryUp = (latest.avgSalary ?? 0) >= (sal[0].avgSalary ?? 0);
    const salesUp = salesRate >= 0;
    const sameWay = salaryUp === salesUp;
    insights.push({
      heading: sameWay
        ? `売上高と平均年収がともに${salesUp ? "増加" : "減少"}`
        : `売上高は${salesUp ? "増加" : "減少"}、平均年収は${salaryUp ? "増加" : "減少"}`,
      body:
        `売上高は${fyLabel(fFirst.fiscalYear)}の${oku(fFirst.netSales)}から${fyLabel(fLatest.fiscalYear)}は${oku(fLatest.netSales)}` +
        `（${salesUp ? "+" : "−"}${pct(Math.abs(salesRate))}）。${marginText}` +
        (sameWay
          ? `同じ期間に平均年収も${salaryUp ? "増え" : "減っ"}ており、業績と給与水準が同じ向きに動いています。`
          : `一方で平均年収は逆向きに動いており、業績がそのまま給与に反映されているわけではありません。`),
    });
  }

  // 3. 従業員1人あたり売上高
  if (fLatest?.netSales && latest.employees) {
    const perHead = fLatest.netSales / latest.employees;
    insights.push({
      heading: `従業員1人あたり売上高は${man(perHead)}`,
      body:
        `${fyLabel(fLatest.fiscalYear)}の売上高${oku(fLatest.netSales)}を従業員${latest.employees.toLocaleString()}名で割ると、` +
        `1人あたり${man(perHead)}になります。1人あたりの売上が大きいほど給与の原資に余裕が生まれやすく、` +
        `年収水準を比べるときの目安になります。`,
    });
  }

  // 4. 役員報酬との差
  if (latest.execCompTotal && latest.execCompCount) {
    const perExec = latest.execCompTotal / latest.execCompCount;
    const ratio = perExec / latest.avgSalary;
    insights.push({
      heading: `役員1人あたり報酬は従業員平均の${ratio.toFixed(1)}倍`,
      body:
        `${fyLabel(latest.fiscalYear)}の役員報酬等の総額は${oku(latest.execCompTotal)}、対象役員は${latest.execCompCount}名で、` +
        `1人あたり${man(perExec)}。従業員の平均年収${man(latest.avgSalary)}の${ratio.toFixed(1)}倍にあたります。`,
    });
  }

  // 5. 業界平均との比較
  if (industryAvgSalary && industryAvgSalary > 0) {
    const diff = latest.avgSalary - industryAvgSalary;
    insights.push({
      heading: `業界平均を${man(Math.abs(diff))}${diff >= 0 ? "上回る" : "下回る"}`,
      body:
        `同じ業界に分類される企業の平均年収は${man(industryAvgSalary)}で、${name}はこれを${man(Math.abs(diff))}` +
        `${diff >= 0 ? "上回って" : "下回って"}います。` +
        (latest.avgAge
          ? `平均年齢は${latest.avgAge}歳、平均勤続年数は${latest.avgTenure ?? "—"}年で、年齢構成の違いも年収差の要因になります。`
          : ""),
    });
  }

  return insights;
}
