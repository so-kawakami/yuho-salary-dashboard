import { sqliteTable, text, integer, real, uniqueIndex } from "drizzle-orm/sqlite-core";

// 企業マスタ
export const companies = sqliteTable(
  "companies",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    edinetCode: text("edinet_code").notNull(),
    secCode: text("sec_code"), // 証券コード（上場企業のみ）
    name: text("name").notNull(),
    industry: text("industry"),
    isListed: integer("is_listed", { mode: "boolean" }).default(false),
    createdAt: text("created_at").default("(datetime('now'))"),
    updatedAt: text("updated_at").default("(datetime('now'))"),
  },
  (table) => [
    uniqueIndex("edinet_code_idx").on(table.edinetCode),
  ]
);

// 年収データ（年度ごとに1レコード）
export const salaryData = sqliteTable(
  "salary_data",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    companyId: integer("company_id")
      .notNull()
      .references(() => companies.id),
    periodEnd: text("period_end").notNull(), // "2025-03-31"
    fiscalYear: text("fiscal_year").notNull(), // "2025-03"
    avgSalary: integer("avg_salary"), // 円
    employees: integer("employees"),
    avgAge: real("avg_age"),
    avgTenure: real("avg_tenure"), // 平均勤続年数
    tempWorkers: integer("temp_workers"), // 臨時雇用者数
    docId: text("doc_id").notNull(), // EDINET書類ID
    // DEI指標（2023年度以降の開示義務化データ）
    genderWageGapAll: real("gender_wage_gap_all"),    // 男女賃金差異（全労働者）女性/男性 %
    genderWageGapFull: real("gender_wage_gap_full"),  // 男女賃金差異（正規）%
    genderWageGapPart: real("gender_wage_gap_part"),  // 男女賃金差異（非正規）%
    maleParentalLeaveRate: real("male_parental_leave_rate"), // 男性育休取得率 %
    femaleManagerRate: real("female_manager_rate"),   // 女性管理職比率 %
    // 役員報酬
    execCompTotal: integer("exec_comp_total"),        // 役員報酬総額（円）
    execCompCount: integer("exec_comp_count"),        // 対象役員数
    createdAt: text("created_at").default("(datetime('now'))"),
  },
  (table) => [
    uniqueIndex("salary_company_year_idx").on(
      table.companyId,
      table.fiscalYear
    ),
  ]
);

// 財務データ（売上高・営業利益など）
export const financials = sqliteTable(
  "financials",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    companyId: integer("company_id")
      .notNull()
      .references(() => companies.id),
    fiscalYear: text("fiscal_year").notNull(), // "2025-03"
    netSales: integer("net_sales"),            // 売上高（円）
    operatingIncome: integer("operating_income"), // 営業利益（円）
    ordinaryIncome: integer("ordinary_income"),   // 経常利益（円）
    netIncome: integer("net_income"),             // 当期純利益（円）
    isConsolidated: integer("is_consolidated", { mode: "boolean" }).default(false),
    createdAt: text("created_at").default("(datetime('now'))"),
  },
  (table) => [
    uniqueIndex("financials_company_year_idx").on(
      table.companyId,
      table.fiscalYear
    ),
  ]
);
