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
    .filter((r: any) => r.industry === industry && r.code !== excludeCode)
    .slice(0, limit)
    .map((r: any) => ({
      code: r.code ?? "",
      name: r.name ?? "",
      salary: r.salary ?? 0,
      employees: r.employees ?? 0,
    }));
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
      },
    ],
  };
}
