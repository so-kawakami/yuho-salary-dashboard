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
    createdAt: text("created_at").default("(datetime('now'))"),
  },
  (table) => [
    uniqueIndex("salary_company_year_idx").on(
      table.companyId,
      table.fiscalYear
    ),
  ]
);
