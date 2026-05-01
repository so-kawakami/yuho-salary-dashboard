/**
 * DB接続のラッパー。DBが存在しない場合はモックデータにフォールバック。
 * Vercelデプロイ時など、SQLiteが使えない環境でもビルドできるようにする。
 */

import {
  mockCompanies,
  mockIndustries,
  stats as mockStats,
  type CompanySalary,
  type IndustrySalary,
} from "@/data/mock";

function tryRequireDb() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const queries = require("./queries");
    return queries;
  } catch {
    return null;
  }
}

export function getRanking(limit = 50): CompanySalary[] {
  const q = tryRequireDb();
  if (q) {
    try {
      const rows = q.getSalaryRanking(limit);
      if (rows.length > 0) {
        return rows.map((r: Record<string, unknown>, i: number) => ({
          rank: i + 1,
          code: (r.code as string) ?? "",
          name: (r.name as string) ?? "",
          industry: (r.industry as string) ?? "",
          salary: r.salary as number,
          employees: (r.employees as number) ?? 0,
          change: 0,
          avgAge: (r.avgAge as number) ?? 0,
          avgTenure: (r.avgTenure as number) ?? 0,
          periodEnd: (r.periodEnd as string) ?? "",
        }));
      }
    } catch { /* fall through to mock */ }
  }
  return mockCompanies.slice(0, limit);
}

export function getIndustries(): IndustrySalary[] {
  const q = tryRequireDb();
  if (q) {
    try {
      const rows = q.getIndustryAverages();
      if (rows.length > 0) {
        return rows.map((r: Record<string, unknown>) => ({
          industry: (r.industry as string) ?? "",
          avgSalary: r.avgSalary as number,
          companies: (r.companies as number) ?? 0,
        }));
      }
    } catch { /* fall through */ }
  }
  return mockIndustries;
}

export function getStatsData() {
  const q = tryRequireDb();
  if (q) {
    try {
      const s = q.getStats();
      if (s.totalCompanies > 0) return s;
    } catch { /* fall through */ }
  }
  return mockStats;
}

export function getCompany(code: string) {
  const q = tryRequireDb();
  if (q) {
    try {
      const result = q.getCompanyByCode(code);
      if (result) return result;
    } catch { /* fall through */ }
  }

  // モックからフォールバック
  const mock = mockCompanies.find((c) => c.code === code);
  if (!mock) return null;
  return {
    company: {
      id: 0,
      edinetCode: "",
      secCode: mock.code,
      name: mock.name,
      industry: mock.industry,
      isListed: true,
    },
    salaryHistory: [
      {
        fiscalYear: mock.periodEnd,
        avgSalary: mock.salary * 10000,
        employees: mock.employees,
        avgAge: mock.avgAge,
        avgTenure: mock.avgTenure,
      },
    ],
  };
}
