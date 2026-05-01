import { db, schema } from "./index";
import { desc, eq, and, isNotNull, sql } from "drizzle-orm";

// ランキング取得
export function getSalaryRanking(limit = 50) {
  return db
    .select({
      rank: sql<number>`0`.as("rank"), // アプリ側で振る
      code: schema.companies.secCode,
      name: schema.companies.name,
      industry: schema.companies.industry,
      salary: schema.salaryData.avgSalary,
      employees: schema.salaryData.employees,
      avgAge: schema.salaryData.avgAge,
      avgTenure: schema.salaryData.avgTenure,
      periodEnd: schema.salaryData.periodEnd,
      edinetCode: schema.companies.edinetCode,
    })
    .from(schema.salaryData)
    .innerJoin(
      schema.companies,
      eq(schema.salaryData.companyId, schema.companies.id)
    )
    .where(isNotNull(schema.salaryData.avgSalary))
    .orderBy(desc(schema.salaryData.avgSalary))
    .limit(limit)
    .all()
    .map((row, i) => ({
      ...row,
      rank: i + 1,
      salary: row.salary ? Math.round(row.salary / 10000) : 0, // 円→万円
      code: row.code ?? row.edinetCode,
    }));
}

// 企業詳細
export function getCompanyByCode(code: string) {
  // 証券コード or edinetCode で検索
  const company = db
    .select()
    .from(schema.companies)
    .where(
      sql`${schema.companies.secCode} = ${code} OR ${schema.companies.edinetCode} = ${code}`
    )
    .get();

  if (!company) return null;

  const salaryHistory = db
    .select()
    .from(schema.salaryData)
    .where(eq(schema.salaryData.companyId, company.id))
    .orderBy(schema.salaryData.fiscalYear)
    .all();

  return { company, salaryHistory };
}

// 業界別平均
export function getIndustryAverages() {
  return db
    .select({
      industry: schema.companies.industry,
      avgSalary: sql<number>`ROUND(AVG(${schema.salaryData.avgSalary}) / 10000)`,
      companies: sql<number>`COUNT(DISTINCT ${schema.companies.id})`,
    })
    .from(schema.salaryData)
    .innerJoin(
      schema.companies,
      eq(schema.salaryData.companyId, schema.companies.id)
    )
    .where(
      and(
        isNotNull(schema.salaryData.avgSalary),
        isNotNull(schema.companies.industry)
      )
    )
    .groupBy(schema.companies.industry)
    .orderBy(desc(sql`AVG(${schema.salaryData.avgSalary})`))
    .all();
}

// 全体統計
export function getStats() {
  const result = db
    .select({
      totalCompanies: sql<number>`COUNT(DISTINCT ${schema.companies.id})`,
      avgSalary: sql<number>`ROUND(AVG(${schema.salaryData.avgSalary}) / 10000)`,
      medianSalary: sql<number>`0`, // 別途計算
    })
    .from(schema.salaryData)
    .innerJoin(
      schema.companies,
      eq(schema.salaryData.companyId, schema.companies.id)
    )
    .where(isNotNull(schema.salaryData.avgSalary))
    .get();

  const listedCount = db
    .select({
      count: sql<number>`COUNT(DISTINCT ${schema.companies.id})`,
    })
    .from(schema.companies)
    .where(eq(schema.companies.isListed, true))
    .get();

  // 中央値の計算
  const allSalaries = db
    .select({ salary: schema.salaryData.avgSalary })
    .from(schema.salaryData)
    .where(isNotNull(schema.salaryData.avgSalary))
    .orderBy(schema.salaryData.avgSalary)
    .all()
    .map((r) => r.salary!);

  const median =
    allSalaries.length > 0
      ? Math.round(allSalaries[Math.floor(allSalaries.length / 2)] / 10000)
      : 0;

  return {
    totalCompanies: result?.totalCompanies ?? 0,
    listedCompanies: listedCount?.count ?? 0,
    averageSalary: result?.avgSalary ?? 0,
    medianSalary: median,
    dataYear: "2025年3月期",
  };
}

// 企業検索
export function searchCompanies(query: string, limit = 20) {
  return db
    .select({
      code: schema.companies.secCode,
      name: schema.companies.name,
      industry: schema.companies.industry,
      edinetCode: schema.companies.edinetCode,
      salary: schema.salaryData.avgSalary,
    })
    .from(schema.companies)
    .leftJoin(
      schema.salaryData,
      eq(schema.salaryData.companyId, schema.companies.id)
    )
    .where(sql`${schema.companies.name} LIKE ${"%" + query + "%"}`)
    .limit(limit)
    .all()
    .map((row) => ({
      ...row,
      code: row.code ?? row.edinetCode,
      salary: row.salary ? Math.round(row.salary / 10000) : null,
    }));
}
