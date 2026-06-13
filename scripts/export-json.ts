/**
 * DBからJSONにエクスポートするスクリプト
 * ビルド前に実行して、Vercelではこの JSON を使って静的ページを生成する。
 *
 * 使い方: npx tsx scripts/export-json.ts
 */

import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "yuho.db");
const OUT_DIR = path.join(process.cwd(), "src", "data", "generated");

if (!fs.existsSync(DB_PATH)) {
  console.log("⚠️  DBファイルが見つかりません。モックデータでビルドします。");
  process.exit(0);
}

const db = new Database(DB_PATH, { readonly: true });

// ランキング TOP200（ページ表示用）
const ranking = db
  .prepare(
    `SELECT
      c.sec_code as code,
      c.edinet_code as edinetCode,
      c.name,
      c.industry,
      ROUND(s.avg_salary / 10000) as salary,
      s.employees,
      s.avg_age as avgAge,
      s.avg_tenure as avgTenure,
      s.period_end as periodEnd
    FROM salary_data s
    JOIN companies c ON s.company_id = c.id
    WHERE s.avg_salary IS NOT NULL
      AND s.fiscal_year = (
        SELECT MAX(s2.fiscal_year)
        FROM salary_data s2
        WHERE s2.company_id = s.company_id
          AND s2.avg_salary IS NOT NULL
      )
    ORDER BY s.avg_salary DESC
    LIMIT 200`
  )
  .all()
  .map((row: any, i: number) => ({
    rank: i + 1,
    code: row.code ?? row.edinetCode,
    name: row.name,
    industry: row.industry ?? "",
    salary: row.salary,
    employees: row.employees ?? 0,
    avgAge: row.avgAge ?? 0,
    avgTenure: row.avgTenure ?? 0,
    periodEnd: row.periodEnd ?? "",
  }));

// 統計（各社の最新年度の値のみで集計し、全ページで同じ母数を使う）
const latestSalaries = db
  .prepare(
    `SELECT s.avg_salary as avgSalary
    FROM salary_data s
    WHERE s.avg_salary IS NOT NULL
      AND s.fiscal_year = (
        SELECT MAX(s2.fiscal_year)
        FROM salary_data s2
        WHERE s2.company_id = s.company_id
          AND s2.avg_salary IS NOT NULL
      )
    ORDER BY s.avg_salary`
  )
  .all()
  .map((r: any) => r.avgSalary as number);

const listedRow = db
  .prepare(
    `SELECT COUNT(*) as cnt FROM companies c
     WHERE c.is_listed = 1
       AND EXISTS (SELECT 1 FROM salary_data s WHERE s.company_id = c.id AND s.avg_salary IS NOT NULL)`
  )
  .get() as any;

const mean =
  latestSalaries.reduce((a, b) => a + b, 0) / latestSalaries.length;
const stddev = Math.sqrt(
  latestSalaries.reduce((sum, v) => sum + (v - mean) ** 2, 0) /
    latestSalaries.length
);
const median = latestSalaries[Math.floor(latestSalaries.length / 2)];

const stats = {
  totalCompanies: latestSalaries.length,
  listedCompanies: listedRow.cnt,
  averageSalary: Math.round(mean / 10000),
  medianSalary: Math.round(median / 10000),
  // 年収偏差値の計算用（実データの分布・万円）
  salaryMean: Math.round(mean / 10000),
  salaryStddev: Math.round(stddev / 10000),
  dataYear: "2025年3月期",
};

// 年度別の平均年収トレンド（3月期決算で集計、十分なサンプル数がある年度のみ）
const trend = db
  .prepare(
    `SELECT
      substr(fiscal_year, 1, 4) as year,
      ROUND(AVG(avg_salary) / 10000) as avgSalary,
      COUNT(*) as companies
    FROM salary_data
    WHERE avg_salary IS NOT NULL
    GROUP BY substr(fiscal_year, 1, 4)
    HAVING COUNT(*) >= 300
    ORDER BY year`
  )
  .all();

// 業界別平均
const industries = db
  .prepare(
    `SELECT
      c.industry,
      ROUND(AVG(s.avg_salary) / 10000) as avgSalary,
      COUNT(DISTINCT c.id) as companies
    FROM salary_data s
    JOIN companies c ON s.company_id = c.id
    WHERE s.avg_salary IS NOT NULL AND c.industry IS NOT NULL AND c.industry != ''
      AND s.fiscal_year = (
        SELECT MAX(s2.fiscal_year)
        FROM salary_data s2
        WHERE s2.company_id = s.company_id
          AND s2.avg_salary IS NOT NULL
      )
    GROUP BY c.industry
    ORDER BY AVG(s.avg_salary) DESC`
  )
  .all();

// 全企業の詳細データ（静的ページ生成 + 企業ページ表示に使用）
console.log("📦 全企業データをエクスポート中...");

const allCompanies = db
  .prepare(
    `SELECT
      c.id,
      c.sec_code as secCode,
      c.edinet_code as edinetCode,
      c.name,
      c.industry,
      c.is_listed as isListed
    FROM companies c
    WHERE EXISTS (SELECT 1 FROM salary_data s WHERE s.company_id = c.id AND s.avg_salary IS NOT NULL)`
  )
  .all() as any[];

const companyDetails: Record<string, any> = {};
const companyCodes: string[] = []; // 静的ページ生成用のコード一覧

// financialsテーブルが存在するか確認
const hasFinancials = db
  .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='financials'`)
  .get();

for (const company of allCompanies) {
  const history = db
    .prepare(
      `SELECT fiscal_year as fiscalYear, avg_salary as avgSalary,
              employees, avg_age as avgAge, avg_tenure as avgTenure,
              temp_workers as tempWorkers,
              gender_wage_gap_all as genderWageGapAll,
              gender_wage_gap_full as genderWageGapFull,
              gender_wage_gap_part as genderWageGapPart,
              male_parental_leave_rate as maleParentalLeaveRate,
              female_manager_rate as femaleManagerRate,
              exec_comp_total as execCompTotal,
              exec_comp_count as execCompCount
       FROM salary_data WHERE company_id = ? ORDER BY fiscal_year`
    )
    .all(company.id) as any[];

  // 財務データ（存在する場合のみ）
  const financialsHistory = hasFinancials
    ? db
        .prepare(
          `SELECT fiscal_year as fiscalYear,
                  net_sales as netSales,
                  operating_income as operatingIncome,
                  ordinary_income as ordinaryIncome,
                  net_income as netIncome,
                  is_consolidated as isConsolidated
           FROM financials WHERE company_id = ? ORDER BY fiscal_year`
        )
        .all(company.id) as any[]
    : [];

  const code = company.secCode ?? company.edinetCode;
  companyCodes.push(code);

  companyDetails[code] = {
    company: {
      name: company.name,
      secCode: company.secCode,
      edinetCode: company.edinetCode,
      industry: company.industry,
    },
    salaryHistory: history,
    financialsHistory,
  };
}

// 出力
fs.mkdirSync(OUT_DIR, { recursive: true });

fs.writeFileSync(
  path.join(OUT_DIR, "ranking.json"),
  JSON.stringify(ranking, null, 2)
);
fs.writeFileSync(
  path.join(OUT_DIR, "stats.json"),
  JSON.stringify(stats, null, 2)
);
fs.writeFileSync(
  path.join(OUT_DIR, "industries.json"),
  JSON.stringify(industries, null, 2)
);
fs.writeFileSync(
  path.join(OUT_DIR, "trend.json"),
  JSON.stringify(trend, null, 2)
);
fs.writeFileSync(
  path.join(OUT_DIR, "companies.json"),
  JSON.stringify(companyDetails, null, 2)
);
// 静的ページ生成用のコード一覧
fs.writeFileSync(
  path.join(OUT_DIR, "company-codes.json"),
  JSON.stringify(companyCodes, null, 2)
);

db.close();

console.log("✅ JSON エクスポート完了!");
console.log(`   ランキング: ${ranking.length}社`);
console.log(`   企業詳細: ${Object.keys(companyDetails).length}社`);
console.log(`   業界: ${industries.length}件`);
console.log(`   静的ページ対象: ${companyCodes.length}社`);
console.log(`   出力先: ${OUT_DIR}`);
