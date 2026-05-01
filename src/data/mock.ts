export interface CompanySalary {
  rank: number;
  code: string; // 証券コード
  name: string;
  industry: string;
  salary: number; // 万円
  employees: number;
  change: number; // 前年比（万円）
  avgAge: number;
  avgTenure: number; // 平均勤続年数
  periodEnd: string;
}

export const mockCompanies: CompanySalary[] = [
  { rank: 1, code: "6861", name: "キーエンス", industry: "電気機器", salary: 2279, employees: 2788, change: 87, avgAge: 36.1, avgTenure: 12.3, periodEnd: "2025-03" },
  { rank: 2, code: "8058", name: "三菱商事", industry: "卸売業", salary: 2091, employees: 5448, change: -32, avgAge: 42.7, avgTenure: 18.4, periodEnd: "2025-03" },
  { rank: 3, code: "8001", name: "伊藤忠商事", industry: "卸売業", salary: 1962, employees: 4170, change: 45, avgAge: 42.2, avgTenure: 17.8, periodEnd: "2025-03" },
  { rank: 4, code: "8031", name: "三井物産", industry: "卸売業", salary: 1899, employees: 5449, change: 21, avgAge: 42.1, avgTenure: 18.1, periodEnd: "2025-03" },
  { rank: 5, code: "8053", name: "住友商事", industry: "卸売業", salary: 1867, employees: 5068, change: 38, avgAge: 43.1, avgTenure: 18.2, periodEnd: "2025-03" },
  { rank: 6, code: "6758", name: "ソニーグループ", industry: "電気機器", salary: 1113, employees: 2839, change: 15, avgAge: 42.4, avgTenure: 16.7, periodEnd: "2025-03" },
  { rank: 7, code: "6098", name: "リクルート", industry: "サービス", salary: 1139, employees: 4842, change: 56, avgAge: 38.9, avgTenure: 8.2, periodEnd: "2025-03" },
  { rank: 8, code: "8604", name: "野村證券", industry: "証券", salary: 1087, employees: 12842, change: -18, avgAge: 40.3, avgTenure: 15.4, periodEnd: "2025-03" },
  { rank: 9, code: "7974", name: "任天堂", industry: "その他製品", salary: 1009, employees: 2791, change: 22, avgAge: 40.2, avgTenure: 14.3, periodEnd: "2025-03" },
  { rank: 10, code: "9503", name: "関西電力", industry: "電気・ガス", salary: 973, employees: 8258, change: 11, avgAge: 43.6, avgTenure: 21.2, periodEnd: "2025-03" },
  { rank: 11, code: "9984", name: "ソフトバンクG", industry: "情報・通信", salary: 1405, employees: 264, change: 120, avgAge: 41.0, avgTenure: 9.8, periodEnd: "2025-03" },
  { rank: 12, code: "6501", name: "日立製作所", industry: "電気機器", salary: 936, employees: 28672, change: 19, avgAge: 42.9, avgTenure: 19.1, periodEnd: "2025-03" },
  { rank: 13, code: "9432", name: "NTT", industry: "情報・通信", salary: 952, employees: 2454, change: 12, avgAge: 41.8, avgTenure: 16.9, periodEnd: "2025-03" },
  { rank: 14, code: "9433", name: "KDDI", industry: "情報・通信", salary: 986, employees: 11353, change: 17, avgAge: 42.8, avgTenure: 17.6, periodEnd: "2025-03" },
  { rank: 15, code: "7203", name: "トヨタ自動車", industry: "輸送用機器", salary: 895, employees: 70710, change: 8, avgAge: 40.6, avgTenure: 16.2, periodEnd: "2025-03" },
];

export interface IndustrySalary {
  industry: string;
  avgSalary: number;
  companies: number;
}

export const mockIndustries: IndustrySalary[] = [
  { industry: "卸売業", avgSalary: 892, companies: 321 },
  { industry: "情報・通信", avgSalary: 742, companies: 587 },
  { industry: "電気機器", avgSalary: 734, companies: 243 },
  { industry: "医薬品", avgSalary: 856, companies: 72 },
  { industry: "証券", avgSalary: 815, companies: 45 },
  { industry: "銀行", avgSalary: 743, companies: 78 },
  { industry: "サービス", avgSalary: 612, companies: 498 },
  { industry: "輸送用機器", avgSalary: 654, companies: 89 },
  { industry: "建設", avgSalary: 687, companies: 156 },
  { industry: "小売", avgSalary: 498, companies: 342 },
];

export interface SalaryTrend {
  year: string;
  average: number;
  listed: number;
}

export const mockTrend: SalaryTrend[] = [
  { year: "2020", average: 433, listed: 614 },
  { year: "2021", average: 443, listed: 623 },
  { year: "2022", average: 458, listed: 638 },
  { year: "2023", average: 468, listed: 651 },
  { year: "2024", average: 480, listed: 665 },
  { year: "2025", average: 492, listed: 678 },
];

// 注目企業（前年比の変動が大きい企業）
export interface SpotlightCompany {
  code: string;
  name: string;
  industry: string;
  salary: number;
  change: number;
  tag: "up" | "down" | "new";
  tagLabel: string;
}

export const spotlightCompanies: SpotlightCompany[] = [
  { code: "9984", name: "ソフトバンクG", industry: "情報・通信", salary: 1405, change: 120, tag: "up", tagLabel: "急上昇" },
  { code: "6861", name: "キーエンス", industry: "電気機器", salary: 2279, change: 87, tag: "up", tagLabel: "最高値更新" },
  { code: "6098", name: "リクルート", industry: "サービス", salary: 1139, change: 56, tag: "up", tagLabel: "上昇トレンド" },
  { code: "8058", name: "三菱商事", industry: "卸売業", salary: 2091, change: -32, tag: "down", tagLabel: "前年比減" },
  { code: "8604", name: "野村證券", industry: "証券", salary: 1087, change: -18, tag: "down", tagLabel: "前年比減" },
];

export const stats = {
  totalCompanies: 3687,
  listedCompanies: 3121,
  averageSalary: 678,
  medianSalary: 612,
  dataYear: "2025年3月期",
};

// 年収偏差値の計算用（上場企業の年収分布を正規分布で近似）
export const salaryDistribution = {
  mean: 678,    // 万円
  stddev: 180,  // 標準偏差
};

export function calcSalaryPercentile(salary: number): {
  percentile: number;
  deviation: number;
  label: string;
} {
  const { mean, stddev } = salaryDistribution;
  const z = (salary - mean) / stddev;
  const deviation = Math.round(z * 10 + 50);

  // 正規分布のCDFを近似
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const sign = z < 0 ? -1 : 1;
  const absZ = Math.abs(z);
  const t = 1.0 / (1.0 + p * absZ);
  const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-absZ * absZ / 2);
  const percentile = Math.round((0.5 * (1.0 + sign * y)) * 100);

  let label: string;
  if (deviation >= 70) label = "トップクラス";
  else if (deviation >= 60) label = "かなり高い";
  else if (deviation >= 55) label = "やや高い";
  else if (deviation >= 45) label = "平均的";
  else if (deviation >= 40) label = "やや低い";
  else label = "低め";

  return { percentile, deviation, label };
}
