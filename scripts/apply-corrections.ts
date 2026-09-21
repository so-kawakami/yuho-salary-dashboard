/**
 * データ修正パッチ
 *
 * EDINETの元データ（企業のXBRL入力ミス）に起因する異常値を修正する。
 * docId単位で管理し、何度実行しても安全（冪等）。
 *
 * 異常値の検出方法:
 *   - 前年比3倍超 or 1/3未満の変動をスキャン
 *   - 役員報酬は「1人あたり金額」「売上との比較」で桁違いを検出
 *   - 同一有報内の「前年比増減率」タグ（ChangeFromPreviousFiscalYearIn
 *     AverageAnnualSalary...）と突き合わせて正しい値を確定
 *
 * 使い方:
 *   npx tsx scripts/apply-corrections.ts
 */

import path from "path";
import Database from "better-sqlite3";

const DB_PATH = path.join(process.cwd(), "data", "yuho.db");

interface Correction {
  docId: string;
  company: string;
  field: "avg_salary" | "exec_comp_total";
  wrong: number;
  correct: number;
  reason: string;
}

const CORRECTIONS: Correction[] = [
  {
    docId: "S100XVK0",
    company: "株式会社ガーラ",
    field: "exec_comp_total",
    wrong: 89025505000,
    correct: 89025505,
    reason:
      "千円単位で取り込み1000倍に。役員9人で890億円は売上25.9億円・純損失5.3億円と矛盾" +
      "（前年は総額1.09億円＝1人1,210万円。修正後は989万円で連続性がある）",
  },
  {
    docId: "S100YG4R",
    company: "株式会社加藤製作所",
    field: "avg_salary",
    wrong: 60010000,
    correct: 6001000,
    reason:
      "XBRLにゼロ1個多く入力。同有報の前年比増減率+1.3%（前年592万円）と矛盾",
  },
  {
    docId: "S100W85Z",
    company: "昭和ホールディングス株式会社",
    field: "avg_salary",
    wrong: 1400000,
    correct: 14000000,
    reason:
      "XBRLにゼロ1個欠けて入力。履歴（920万→958万→1,399万→→1,400万）と矛盾",
  },
  {
    docId: "S100W6AS",
    company: "株式会社ダブルスタンダード",
    field: "avg_salary",
    wrong: 598000,
    correct: 5980000,
    reason:
      "XBRLにゼロ1個欠けて入力。履歴（583万→591万→591万→→608万）と矛盾",
  },
];

const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");

let applied = 0;
let skipped = 0;

for (const c of CORRECTIONS) {
  const result = sqlite
    .prepare(
      `UPDATE salary_data SET ${c.field} = ? WHERE doc_id = ? AND ${c.field} = ?`
    )
    .run(c.correct, c.docId, c.wrong);

  if (result.changes > 0) {
    console.log(`✅ ${c.company}: ${c.wrong} → ${c.correct}（${c.reason}）`);
    applied++;
  } else {
    skipped++;
  }
}

console.log(`\n修正 ${applied}件 / 適用済みスキップ ${skipped}件`);
sqlite.close();
