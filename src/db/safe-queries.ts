/**
 * データ取得のラッパー。
 * 生成済みJSONから読み込む（Vercel対応）。
 * JSONがなければモックデータにフォールバック。
 */

import {
  mockCompanies,
  mockIndustries,
  stats as mockStats,
  type CompanySalary,
  type IndustrySalary,
} from "@/data/mock";

// JSON読み込み（ビルド時に解決される）
let rankingJson: any[] = [];
let statsJson: any = null;
let industriesJson: any[] = [];
let companiesJson: Record<string, any> = {};

try {
  rankingJson = require("@/data/generated/ranking.json");
  statsJson = require("@/data/generated/stats.json");
  industriesJson = require("@/data/generated/industries.json");
  companiesJson = require("@/data/generated/companies.json");
} catch {
  // JSONがなければモックにフォールバック
}

export function getRanking(limit = 50): CompanySalary[] {
  if (rankingJson.length > 0) {
    return rankingJson.slice(0, limit).map((r: any, i: number) => ({
      rank: i + 1,
      code: r.code ?? "",
      name: r.name ?? "",
      industry: r.industry ?? "",
      salary: r.salary ?? 0,
      employees: r.employees ?? 0,
      change: 0,
      avgAge: r.avgAge ?? 0,
      avgTenure: r.avgTenure ?? 0,
      periodEnd: r.periodEnd ?? "",
    }));
  }
  return mockCompanies.slice(0, limit);
}

export function getIndustries(): IndustrySalary[] {
  if (industriesJson.length > 0) {
    return industriesJson.map((r: any) => ({
      industry: r.industry ?? "",
      avgSalary: r.avgSalary ?? 0,
      companies: r.companies ?? 0,
    }));
  }
  return mockIndustries;
}

export function getStatsData() {
  if (statsJson && statsJson.totalCompanies > 0) {
    return statsJson;
  }
  return mockStats;
}

// 同業他社比較（同じ業界の企業をランキングから取得）
export function getPeers(industry: string, excludeCode: string, limit = 5) {
  if (!industry || rankingJson.length === 0) return [];
  return rankingJson
    .filter((r: any) =>
      r.industry === industry &&
      r.code !== excludeCode &&
      (r.employees ?? 0) >= 1000
    )
    .slice(0, limit)
    .map((r: any) => ({
      code: r.code ?? "",
      name: r.name ?? "",
      salary: r.salary ?? 0,
      employees: r.employees ?? 0,
    }));
}

export function getCompaniesByIndustry(industry: string, limit = 100): CompanySalary[] {
  const all = getAllCompanies();
  return all
    .filter((c) => c.industry === industry && c.salary > 0)
    .sort((a, b) => b.salary - a.salary)
    .slice(0, limit);
}

export function getAllIndustrySlugs(): string[] {
  if (industriesJson.length > 0) {
    return industriesJson.map((r: any) => r.industry).filter(Boolean);
  }
  return [];
}

export function getAllCompanies(): CompanySalary[] {
  if (Object.keys(companiesJson).length > 0) {
    return Object.entries(companiesJson).map(([code, data]: [string, any]) => {
      const latest = data.salaryHistory?.[data.salaryHistory.length - 1];
      return {
        rank: 0,
        code,
        name: data.company?.name ?? "",
        industry: data.company?.industry ?? "",
        salary: latest?.avgSalary ? Math.round(latest.avgSalary / 10000) : 0,
        employees: latest?.employees ?? 0,
        change: 0,
        avgAge: latest?.avgAge ?? 0,
        avgTenure: latest?.avgTenure ?? 0,
        periodEnd: latest?.fiscalYear ?? "",
      };
    });
  }
  return mockCompanies;
}

export function getCompany(code: string) {
  const data = companiesJson[code];
  if (data) return data;

  // モックからフォールバック
  const mock = mockCompanies.find((c) => c.code === code);
  if (!mock) return null;
  return {
    company: {
      name: mock.name,
      secCode: mock.code,
      edinetCode: "",
      industry: mock.industry,
    },
    salaryHistory: [
      {
        fiscalYear: mock.periodEnd,
        avgSalary: mock.salary * 10000,
        employees: mock.employees,
        avgAge: mock.avgAge,
        avgTenure: mock.avgTenure,
        tempWorkers: null,
        genderWageGapAll: null,
        genderWageGapFull: null,
        genderWageGapPart: null,
        maleParentalLeaveRate: null,
        femaleManagerRate: null,
        execCompTotal: null,
        execCompCount: null,
      },
    ],
    financialsHistory: [],
  };
}

// 業界の DEI 平均データを取得（業界比較グラフ用）
export function getIndustryDeiAverage(industry: string) {
  if (!industry || Object.keys(companiesJson).length === 0) {
    return null;
  }

  const companiesInIndustry = Object.values(companiesJson).filter(
    (company: any) => company.company?.industry === industry
  );

  if (companiesInIndustry.length === 0) {
    return null;
  }

  // 各企業の最新年度データを取得
  const latestDeiData = companiesInIndustry
    .map((company: any) => {
      const latest = company.salaryHistory?.[company.salaryHistory.length - 1];
      return {
        genderWageGapAll: latest?.genderWageGapAll,
        genderWageGapFull: latest?.genderWageGapFull,
        genderWageGapPart: latest?.genderWageGapPart,
        maleParentalLeaveRate: latest?.maleParentalLeaveRate,
        femaleManagerRate: latest?.femaleManagerRate,
      };
    })
    .filter(
      (data) =>
        data.genderWageGapAll !== null ||
        data.maleParentalLeaveRate !== null ||
        data.femaleManagerRate !== null
    );

  if (latestDeiData.length === 0) {
    return null;
  }

  // 平均値を計算
  const avg = (values: (number | null)[]) => {
    const filtered = values.filter((v) => v !== null) as number[];
    return filtered.length > 0
      ? Math.round((filtered.reduce((a, b) => a + b, 0) / filtered.length) * 10) / 10
      : null;
  };

  return {
    genderWageGapAll: avg(
      latestDeiData.map((d) => d.genderWageGapAll)
    ),
    genderWageGapFull: avg(
      latestDeiData.map((d) => d.genderWageGapFull)
    ),
    genderWageGapPart: avg(
      latestDeiData.map((d) => d.genderWageGapPart)
    ),
    maleParentalLeaveRate: avg(
      latestDeiData.map((d) => d.maleParentalLeaveRate)
    ),
    femaleManagerRate: avg(latestDeiData.map((d) => d.femaleManagerRate)),
    companyCount: companiesInIndustry.length,
  };
}
