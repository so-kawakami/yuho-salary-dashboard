/**
 * データ取得のラッパー。
 * 生成済みJSONから読み込む（Vercel対応）。
 * JSONがなければモックデータにフォールバック。
 */

import {
  mockCompanies,
  mockIndustries,
  mockTrend,
  stats as mockStats,
  type CompanySalary,
  type IndustrySalary,
} from "@/data/mock";

// JSON読み込み（ビルド時に解決される）
let rankingJson: any[] = [];
let statsJson: any = null;
let industriesJson: any[] = [];
let companiesJson: Record<string, any> = {};
let trendJson: any[] = [];

try {
  rankingJson = require("@/data/generated/ranking.json");
  statsJson = require("@/data/generated/stats.json");
  industriesJson = require("@/data/generated/industries.json");
  companiesJson = require("@/data/generated/companies.json");
  trendJson = require("@/data/generated/trend.json");
} catch {
  // JSONがなければモックにフォールバック
}

// 全国平均（国税庁「民間給与実態統計調査」の平均給与・万円）
const NATIONAL_AVERAGE: Record<string, number> = {
  "2020": 433,
  "2021": 443,
  "2022": 458,
  "2023": 460,
  "2024": 478,
};

// 年度別の平均年収トレンド（実データ）
export function getSalaryTrend(): {
  year: string;
  listed: number;
  average: number | null;
  companies: number;
}[] {
  if (trendJson.length === 0) {
    return mockTrend.map((t) => ({
      year: t.year,
      listed: t.listed,
      average: t.average,
      companies: 0,
    }));
  }
  return trendJson.map((t: any) => ({
    year: t.year,
    listed: t.avgSalary,
    average: NATIONAL_AVERAGE[t.year] ?? null,
    companies: t.companies ?? 0,
  }));
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

// 同業他社比較（大手優先で取得し、足りなければ同業界の規模上位で補完）
export function getPeers(industry: string, excludeCode: string, limit = 5) {
  if (!industry) return [];
  const sameIndustry = getAllCompanies().filter(
    (c) => c.industry === industry && c.code !== excludeCode && c.salary > 0
  );
  if (sameIndustry.length === 0) return [];

  const large = sameIndustry
    .filter((c) => c.employees >= 1000)
    .sort((a, b) => b.salary - a.salary)
    .slice(0, limit);
  const rest =
    large.length < limit
      ? sameIndustry
          .filter((c) => c.employees < 1000)
          .sort((a, b) => b.employees - a.employees)
          .slice(0, limit - large.length)
      : [];

  return [...large, ...rest].map((c) => ({
    code: c.code,
    name: c.name,
    salary: c.salary,
    employees: c.employees,
  }));
}

export function getCompaniesByIndustry(industry: string, limit?: number): CompanySalary[] {
  const all = getAllCompanies();
  const filtered = all
    .filter((c) => c.industry === industry && c.salary > 0)
    .sort((a, b) => b.salary - a.salary);
  return limit !== undefined ? filtered.slice(0, limit) : filtered;
}

export function getAllIndustrySlugs(): string[] {
  if (industriesJson.length > 0) {
    return industriesJson
      .map((r: any) => r.industry)
      .filter((name: string) => name && name !== "-" && name.trim() !== "");
  }
  return [];
}

// 年収・規模が近い企業を取得（内部リンク強化用）
export function getSimilarCompanies(
  excludeCode: string,
  salary: number,
  employees: number,
  industry: string,
  limit = 6
): CompanySalary[] {
  const all = getAllCompanies().filter(
    (c) => c.code !== excludeCode && c.salary > 0
  );
  // 年収が±150万円以内 & 同業界優先
  const sameIndustry = all
    .filter((c) => c.industry === industry && Math.abs(c.salary - salary) <= 150)
    .sort((a, b) => Math.abs(a.salary - salary) - Math.abs(b.salary - salary))
    .slice(0, limit);
  if (sameIndustry.length >= limit) return sameIndustry;

  // 不足分を他業界から補完
  const others = all
    .filter(
      (c) =>
        c.industry !== industry &&
        Math.abs(c.salary - salary) <= 100 &&
        !sameIndustry.find((s) => s.code === c.code)
    )
    .sort((a, b) => Math.abs(a.salary - salary) - Math.abs(b.salary - salary))
    .slice(0, limit - sameIndustry.length);
  return [...sameIndustry, ...others];
}

// 役員報酬ランキング（industryを指定すると業界内ランキング）
export function getExecutivePayRanking(limit = 200, industry?: string) {
  if (Object.keys(companiesJson).length === 0) return [];
  return Object.entries(companiesJson)
    .map(([code, data]: [string, any]) => {
      const latest = data.salaryHistory?.[data.salaryHistory.length - 1];
      if (!latest?.execCompTotal || !latest?.execCompCount) return null;
      const perPerson = Math.round(latest.execCompTotal / latest.execCompCount / 10_000);
      const ratio = latest.avgSalary
        ? Math.round((perPerson / Math.round(latest.avgSalary / 10_000)) * 10) / 10
        : null;
      return {
        code,
        name: data.company?.name ?? "",
        industry: data.company?.industry ?? "",
        execCompTotal: latest.execCompTotal,
        execCompCount: latest.execCompCount,
        perPerson,
        ratio,
        avgSalary: latest.avgSalary ? Math.round(latest.avgSalary / 10_000) : 0,
        fiscalYear: latest.fiscalYear ?? "",
      };
    })
    .filter(Boolean)
    .filter((r: any) => !industry || r.industry === industry)
    .sort((a: any, b: any) => b.perPerson - a.perPerson)
    .slice(0, limit) as any[];
}

// 役員1人あたり報酬が1億円（10,000万円）以上の企業一覧
export function getExecPayOver1Oku() {
  return getExecutivePayRanking(Number.MAX_SAFE_INTEGER).filter(
    (r: any) => r.perPerson >= 10_000
  );
}

// 役員報酬データを持つ業界一覧（業界別ランキングの事前生成用、5社以上の業界のみ）
export function getExecPayIndustries(): { industry: string; count: number; topPay: number }[] {
  const all = getExecutivePayRanking(Number.MAX_SAFE_INTEGER);
  const map = new Map<string, { count: number; topPay: number }>();
  for (const r of all) {
    if (!r.industry) continue;
    const cur = map.get(r.industry) ?? { count: 0, topPay: 0 };
    cur.count++;
    cur.topPay = Math.max(cur.topPay, r.perPerson);
    map.set(r.industry, cur);
  }
  return Array.from(map.entries())
    .filter(([, v]) => v.count >= 5)
    .map(([industry, v]) => ({ industry, ...v }))
    .sort((a, b) => b.topPay - a.topPay);
}

// 従業員1人あたり売上高ランキング
export function getSalesPerEmployeeRanking(limit = 200) {
  if (Object.keys(companiesJson).length === 0) return [];
  return Object.entries(companiesJson)
    .map(([code, data]: [string, any]) => {
      const latest = data.salaryHistory?.[data.salaryHistory.length - 1];
      const latestFin = data.financialsHistory?.[data.financialsHistory?.length - 1];
      if (!latestFin?.netSales || !latest?.employees || latest.employees === 0) return null;
      const salesPerEmployee = Math.round(latestFin.netSales / latest.employees / 10_000);
      return {
        code,
        name: data.company?.name ?? "",
        industry: data.company?.industry ?? "",
        salesPerEmployee,
        netSales: latestFin.netSales,
        employees: latest.employees,
        avgSalary: latest.avgSalary ? Math.round(latest.avgSalary / 10_000) : 0,
        fiscalYear: latest.fiscalYear ?? "",
      };
    })
    .filter(Boolean)
    .sort((a: any, b: any) => b.salesPerEmployee - a.salesPerEmployee)
    .slice(0, limit) as any[];
}

// 女性管理職比率ランキング
export function getFemaleManagerRanking(limit = 200) {
  if (Object.keys(companiesJson).length === 0) return [];
  return Object.entries(companiesJson)
    .map(([code, data]: [string, any]) => {
      const latest = data.salaryHistory?.[data.salaryHistory.length - 1];
      if (latest?.femaleManagerRate == null) return null;
      return {
        code,
        name: data.company?.name ?? "",
        industry: data.company?.industry ?? "",
        femaleManagerRate: latest.femaleManagerRate,
        genderWageGapAll: latest.genderWageGapAll ?? null,
        maleParentalLeaveRate: latest.maleParentalLeaveRate ?? null,
        avgSalary: latest.avgSalary ? Math.round(latest.avgSalary / 10_000) : 0,
        employees: latest.employees ?? 0,
        fiscalYear: latest.fiscalYear ?? "",
      };
    })
    .filter(Boolean)
    .sort((a: any, b: any) => b.femaleManagerRate - a.femaleManagerRate)
    .slice(0, limit) as any[];
}

// 勤続年数×高年収ランキング
export function getLongTenureRanking(limit = 200) {
  return getAllCompanies()
    .filter((c) => c.avgTenure > 0 && c.salary >= 400)
    .sort((a, b) => b.avgTenure - a.avgTenure || b.salary - a.salary)
    .slice(0, limit);
}

// 若手×高年収ランキング
export function getYoungHighIncomeRanking(limit = 200) {
  return getAllCompanies()
    .filter((c) => c.avgAge > 0 && c.avgAge < 40 && c.salary >= 500)
    .sort((a, b) => b.salary - a.salary || a.avgAge - b.avgAge)
    .slice(0, limit);
}

// 人気比較ページ（同業界の年収上位企業ペア）を事前生成用に列挙する
// 戻り値は "code1-vs-code2" 形式（重複・自己比較を除外、code昇順で正規化）
export function getPopularComparisonCodes(): string[] {
  const all = getAllCompanies().filter((c) => c.salary > 0 && c.code);

  // 業界ごとに年収上位6社を抽出
  const byIndustry = new Map<string, CompanySalary[]>();
  for (const c of all) {
    if (!c.industry) continue;
    const list = byIndustry.get(c.industry) ?? [];
    list.push(c);
    byIndustry.set(c.industry, list);
  }

  const pairs = new Set<string>();
  const addPair = (a: string, b: string) => {
    if (a === b) return;
    const [x, y] = a < b ? [a, b] : [b, a];
    pairs.add(`${x}-vs-${y}`);
  };

  // 各業界トップ6社の総当たり
  for (const list of byIndustry.values()) {
    const top = [...list].sort((a, b) => b.salary - a.salary).slice(0, 6);
    for (let i = 0; i < top.length; i++) {
      for (let j = i + 1; j < top.length; j++) {
        addPair(top[i].code, top[j].code);
      }
    }
  }

  // 全体の年収トップ12社の総当たり（業界横断の注目比較）
  const overallTop = [...all].sort((a, b) => b.salary - a.salary).slice(0, 12);
  for (let i = 0; i < overallTop.length; i++) {
    for (let j = i + 1; j < overallTop.length; j++) {
      addPair(overallTop[i].code, overallTop[j].code);
    }
  }

  return Array.from(pairs);
}

// トップページ用の注目比較（主要業界の年収1位 vs 2位のペア）
export function getFeaturedComparisons(limit = 6): {
  codes: string;
  name1: string;
  salary1: number;
  name2: string;
  salary2: number;
  industry: string;
}[] {
  const all = getAllCompanies().filter((c) => c.salary > 0 && c.code);
  const byIndustry = new Map<string, CompanySalary[]>();
  for (const c of all) {
    if (!c.industry) continue;
    const list = byIndustry.get(c.industry) ?? [];
    list.push(c);
    byIndustry.set(c.industry, list);
  }

  // 各業界トップ2社のペアを作り、年収合計が高い順（＝注目度が高い）に並べる
  const featured = Array.from(byIndustry.values())
    .map((list) => [...list].sort((a, b) => b.salary - a.salary).slice(0, 2))
    .filter((top) => top.length === 2)
    .map((top) => {
      const [x, y] = top[0].code < top[1].code ? [top[0], top[1]] : [top[1], top[0]];
      return {
        codes: `${x.code}-vs-${y.code}`,
        name1: x.name,
        salary1: x.salary,
        name2: y.name,
        salary2: y.salary,
        industry: top[0].industry ?? "",
        score: top[0].salary + top[1].salary,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return featured.map(({ score: _score, ...rest }) => rest);
}

// 指定2社に関連する比較候補（同業界の他社との比較）を返す。回遊導線用。
export function getRelatedComparisons(
  code1: string,
  code2: string,
  industry: string,
  limit = 6
): { codes: string; name1: string; name2: string }[] {
  if (!industry) return [];
  const all = getAllCompanies().filter((c) => c.salary > 0 && c.code);
  const byCode = new Map(all.map((c) => [c.code, c]));
  const base = byCode.get(code1) ?? byCode.get(code2);
  if (!base) return [];

  const peers = all
    .filter((c) => c.industry === industry && c.code !== code1 && c.code !== code2)
    .sort((a, b) => b.salary - a.salary)
    .slice(0, limit);

  return peers.map((peer) => {
    const [x, y] = base.code < peer.code ? [base.code, peer.code] : [peer.code, base.code];
    const nx = byCode.get(x)?.name ?? "";
    const ny = byCode.get(y)?.name ?? "";
    return { codes: `${x}-vs-${y}`, name1: nx, name2: ny };
  });
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
