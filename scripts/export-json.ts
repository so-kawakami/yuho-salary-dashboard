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

const db = new Database(DB_PATH, { readonly: true });

// ランキング TOP100
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
    ORDER BY s.avg_salary DESC
    LIMIT 100`
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

// 統計
const statsRow = db
  .prepare(
    `SELECT
      COUNT(DISTINCT company_id) as totalCompanies,
      ROUND(AVG(avg_salary) / 10000) as avgSalary
    FROM salary_data WHERE avg_salary IS NOT NULL`
  )
  .get() as any;

const listedRow = db
  .prepare(`SELECT COUNT(*) as cnt FROM companies WHERE is_listed = 1`)
  .get() as any;

const allSalaries = db
  .prepare(
    `SELECT avg_salary FROM salary_data WHERE avg_salary IS NOT NULL ORDER BY avg_salary`
  )
  .all()
  .map((r: any) => r.avg_salary);

const median = Math.round(
  allSalaries[Math.floor(allSalaries.length / 2)] / 10000
);

const stats = {
  totalCompanies: statsRow.totalCompanies,
  listedCompanies: listedRow.cnt,
  averageSalary: statsRow.avgSalary,
  medianSalary: median,
  dataYear: "2025年3月期",
};

// 業界別平均
const industries = db
  .prepare(
    `SELECT
      c.industry,
      ROUND(AVG(s.avg_salary) / 10000) as avgSalary,
      COUNT(DISTINCT c.id) as companies
    FROM salary_data s
    JOIN companies c ON s.company_id = c.id
    WHERE s.avg_salary IS NOT NULL AND c.industry IS NOT NULL
    GROUP BY c.industry
    ORDER BY AVG(s.avg_salary) DESC`
  )
  .all();

// 企業詳細（ランキングTOP100 + 主要企業）
const companyDetails: Record<string, any> = {};
for (const r of ranking) {
  const company = db
    .prepare(
      `SELECT * FROM companies WHERE sec_code = ? OR edinet_code = ?`
    )
    .get(r.code, r.code) as any;

  if (!company) continue;

  const history = db
    .prepare(
      `SELECT fiscal_year as fiscalYear, avg_salary as avgSalary,
              employees, avg_age as avgAge, avg_tenure as avgTenure
       FROM salary_data WHERE company_id = ? ORDER BY fiscal_year`
    )
    .all(company.id);

  companyDetails[r.code] = {
    company: {
      name: company.name,
      secCode: company.sec_code,
      edinetCode: company.edinet_code,
      industry: company.industry,
    },
    salaryHistory: history,
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
  path.join(OUT_DIR, "companies.json"),
  JSON.stringify(companyDetails, null, 2)
);

console.log("✅ JSON エクスポート完了!");
console.log(`   ランキング: ${ranking.length}社`);
console.log(`   企業詳細: ${Object.keys(companyDetails).length}社`);
console.log(`   業界: ${industries.length}件`);
console.log(`   出力先: ${OUT_DIR}`);

db.close();
