/**
 * EDINET 一括取得バッチ
 *
 * 指定期間の有価証券報告書をスキャンし、平均年収データをDBに保存する。
 *
 * 使い方:
 *   npx tsx scripts/batch-fetch.ts
 *   npx tsx scripts/batch-fetch.ts --start 2025-06-01 --end 2025-06-30
 */

import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq, and } from "drizzle-orm";
import AdmZip from "adm-zip";
import * as schema from "../src/db/schema";

// ---- 設定 ----
const API_BASE = "https://api.edinet-fsa.go.jp/api/v2";
const DB_PATH = path.join(process.cwd(), "data", "yuho.db");
const RATE_LIMIT_MS = 500; // API呼び出し間隔

// XBRLタグ名
const TAGS = {
  // 既存: 年収・従業員情報
  salary: "jpcrp_cor:AverageAnnualSalaryInformationAboutReportingCompanyInformationAboutEmployees",
  employees: "jpcrp_cor:NumberOfEmployees",
  avgAge: "jpcrp_cor:AverageAgeYearsInformationAboutReportingCompanyInformationAboutEmployees",
  avgTenure: "jpcrp_cor:AverageLengthOfServiceYearsInformationAboutReportingCompanyInformationAboutEmployees",
  tempWorkers: "jpcrp_cor:AverageNumberOfTemporaryWorkers",

  // DEI指標（2023年度以降の開示義務化）
  genderWageGapAll:  "jpcrp_cor:RatioOfAnnualWagesBetweenMaleAndFemaleAllWorkers",
  genderWageGapFull: "jpcrp_cor:RatioOfAnnualWagesBetweenMaleAndFemaleFullTimeWorkers",
  genderWageGapPart: "jpcrp_cor:RatioOfAnnualWagesBetweenMaleAndFemalePartTimeWorkers",
  maleParentalLeave: "jpcrp_cor:RateOfMaleEmployeesWhoTookChildcareLeave",
  femaleManager:     "jpcrp_cor:RatioOfWomenInManagerialPositions",

  // 役員報酬
  execCompTotal: "jpcrp_cor:TotalAmountOfRemunerationEtcOfDirectors",
  execCompCount: "jpcrp_cor:NumberOfDirectors",

  // 財務諸表（売上高・営業利益）※複数タグ候補を一括チェック
  netSalesNonConsolidated: "jpcrp_cor:NetSales",
  netSalesConsolidated:    "jpcrp_cor:ConsolidatedNetSales",
  operatingIncomeNonCon:   "jpcrp_cor:OperatingIncome",
  operatingIncomeConCon:   "jpcrp_cor:ConsolidatedOperatingIncome",
  ordinaryIncomeNonCon:    "jpcrp_cor:OrdinaryIncome",
  netIncomeNonCon:         "jpcrp_cor:ProfitLoss",
};

// ---- ユーティリティ ----
function getApiKey(): string {
  const envPath = path.join(process.cwd(), ".env");
  const envContent = fs.readFileSync(envPath, "utf-8");
  const match = envContent.match(/^EDINET_API_KEY=(.+)$/m);
  if (!match) {
    console.error("❌ EDINET_API_KEY が .env に設定されていません");
    process.exit(1);
  }
  return match[1].trim();
}

function decodeBuffer(buf: Buffer): string {
  if (buf[0] === 0xff && buf[1] === 0xfe) {
    return buf.toString("utf16le");
  }
  return buf.toString("utf-8");
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function dateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const current = new Date(start);
  const last = new Date(end);
  while (current <= last) {
    dates.push(formatDate(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

// ---- CLI引数パース ----
function parseArgs() {
  const args = process.argv.slice(2);
  let start = "2025-06-01";
  let end = "2025-06-30";

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--start" && args[i + 1]) start = args[i + 1];
    if (args[i] === "--end" && args[i + 1]) end = args[i + 1];
  }

  return { start, end };
}

// ---- EDINET API ----
interface DocInfo {
  docID: string;
  edinetCode: string;
  filerName: string;
  docTypeCode: string;
  secCode: string | null;
  periodEnd: string;
}

async function fetchDocList(date: string, apiKey: string): Promise<DocInfo[]> {
  const url = `${API_BASE}/documents.json?date=${date}&type=2&Subscription-Key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.results ?? []).filter(
    (d: DocInfo) =>
      d.docTypeCode === "120" &&
      d.edinetCode &&
      d.filerName
  );
}

interface ParsedData {
  salary: number | null;
  employees: number | null;
  avgAge: number | null;
  avgTenure: number | null;
  tempWorkers: number | null;
  // DEI指標
  genderWageGapAll: number | null;
  genderWageGapFull: number | null;
  genderWageGapPart: number | null;
  maleParentalLeaveRate: number | null;
  femaleManagerRate: number | null;
  // 役員報酬
  execCompTotal: number | null;
  execCompCount: number | null;
  // 財務諸表
  netSales: number | null;
  operatingIncome: number | null;
  ordinaryIncome: number | null;
  netIncome: number | null;
  financialsConsolidated: boolean;
}

async function downloadAndParse(docId: string, apiKey: string): Promise<ParsedData | null> {
  const url = `${API_BASE}/documents/${docId}?type=5&Subscription-Key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) return null;

  const buf = Buffer.from(await res.arrayBuffer());

  let zip: AdmZip;
  try {
    zip = new AdmZip(buf);
  } catch {
    return null;
  }

  const entries = zip.getEntries();
  const mainCsv = entries.find((e) => e.entryName.includes("jpcrp030000"));
  if (!mainCsv) return null;

  const result: ParsedData = {
    salary: null, employees: null, avgAge: null, avgTenure: null, tempWorkers: null,
    genderWageGapAll: null, genderWageGapFull: null, genderWageGapPart: null,
    maleParentalLeaveRate: null, femaleManagerRate: null,
    execCompTotal: null, execCompCount: null,
    netSales: null, operatingIncome: null, ordinaryIncome: null, netIncome: null,
    financialsConsolidated: false,
  };

  // すべてのCSVを走査してタグ値を抽出（財務データが別ファイルに含まれる場合に対応）
  const csvEntries = entries.filter((e) => e.entryName.endsWith(".csv") || e.entryName.includes("jpcrp"));

  for (const entry of csvEntries) {
    const content = decodeBuffer(entry.getData());
    const lines = content.split("\n");

    for (const line of lines) {
      const cols = line.split("\t").map((c) => c.replace(/"/g, "").trim());
      const tagId = cols[0];
      const context = cols[2] ?? "";
      const value = cols[8];

      if (!value || !tagId) continue;

      // 年収（100万〜1億円の異常値除外）
      if (tagId === TAGS.salary) {
        const n = parseInt(value, 10);
        if (n >= 1000000 && n <= 100000000) result.salary = n;
      }

      // 従業員数
      if (tagId === TAGS.employees && context.includes("CurrentYear")) {
        const n = parseInt(value, 10);
        if (n > 0 && (result.employees === null || !context.includes("Consolidated"))) {
          result.employees = n;
        }
      }

      // 平均年齢・勤続年数・臨時従業員
      if (tagId === TAGS.avgAge) { const n = parseFloat(value); if (n > 0) result.avgAge = n; }
      if (tagId === TAGS.avgTenure) { const n = parseFloat(value); if (n > 0) result.avgTenure = n; }
      if (tagId === TAGS.tempWorkers && context.includes("CurrentYear")) {
        const n = parseInt(value, 10); if (n >= 0) result.tempWorkers = n;
      }

      // DEI: 男女賃金格差（0より大きく200以下の数値 = %)
      if (tagId === TAGS.genderWageGapAll)  { const n = parseFloat(value); if (n > 0 && n <= 200) result.genderWageGapAll = n; }
      if (tagId === TAGS.genderWageGapFull) { const n = parseFloat(value); if (n > 0 && n <= 200) result.genderWageGapFull = n; }
      if (tagId === TAGS.genderWageGapPart) { const n = parseFloat(value); if (n > 0 && n <= 200) result.genderWageGapPart = n; }

      // DEI: 男性育休取得率（0〜100%)
      if (tagId === TAGS.maleParentalLeave) { const n = parseFloat(value); if (n >= 0 && n <= 100) result.maleParentalLeaveRate = n; }

      // DEI: 女性管理職比率（0〜100%)
      if (tagId === TAGS.femaleManager) { const n = parseFloat(value); if (n >= 0 && n <= 100) result.femaleManagerRate = n; }

      // 役員報酬総額（1万円〜1000億円の範囲）
      if (tagId === TAGS.execCompTotal) {
        const n = parseInt(value, 10);
        if (n > 0 && n <= 100_000_000_000) result.execCompTotal = n;
      }
      if (tagId === TAGS.execCompCount) { const n = parseInt(value, 10); if (n > 0) result.execCompCount = n; }

      // 財務諸表: 売上高
      if (tagId === TAGS.netSalesConsolidated && context.includes("CurrentYear")) {
        const n = parseInt(value, 10);
        if (n > 0) { result.netSales = n; result.financialsConsolidated = true; }
      }
      if (tagId === TAGS.netSalesNonConsolidated && context.includes("CurrentYear") && result.netSales === null) {
        const n = parseInt(value, 10);
        if (n > 0) result.netSales = n;
      }

      // 財務諸表: 営業利益
      if (tagId === TAGS.operatingIncomeConCon && context.includes("CurrentYear")) {
        const n = parseInt(value, 10);
        if (n !== 0 && result.operatingIncome === null) result.operatingIncome = n;
      }
      if (tagId === TAGS.operatingIncomeNonCon && context.includes("CurrentYear") && result.operatingIncome === null) {
        const n = parseInt(value, 10);
        if (n !== 0) result.operatingIncome = n;
      }

      // 財務諸表: 経常利益・純利益
      if (tagId === TAGS.ordinaryIncomeNonCon && context.includes("CurrentYear")) {
        const n = parseInt(value, 10); if (n !== 0) result.ordinaryIncome = n;
      }
      if (tagId === TAGS.netIncomeNonCon && context.includes("CurrentYear")) {
        const n = parseInt(value, 10); if (n !== 0) result.netIncome = n;
      }
    }
  }

  return result;
}

// ---- メイン処理 ----
async function main() {
  const apiKey = getApiKey();
  const { start, end } = parseArgs();
  const dates = dateRange(start, end);

  console.log(`🚀 EDINET 一括取得バッチ`);
  console.log(`   期間: ${start} 〜 ${end} (${dates.length}日間)\n`);

  // DB接続
  const sqlite = new Database(DB_PATH);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  const database = drizzle(sqlite, { schema });

  let totalProcessed = 0;
  let totalSaved = 0;
  let totalSkipped = 0;

  for (const date of dates) {
    await sleep(RATE_LIMIT_MS);

    let docs: DocInfo[];
    try {
      docs = await fetchDocList(date, apiKey);
    } catch {
      continue;
    }

    if (docs.length === 0) continue;

    process.stdout.write(`📅 ${date}: ${docs.length}件の有報`);

    let daySaved = 0;
    let daySkipped = 0;

    for (const doc of docs) {
      totalProcessed++;

      // 企業をupsert
      const existing = database
        .select()
        .from(schema.companies)
        .where(eq(schema.companies.edinetCode, doc.edinetCode))
        .get();

      let companyId: number;

      if (existing) {
        companyId = existing.id;
        // secCode が更新された場合のみ更新
        if (doc.secCode && !existing.secCode) {
          database
            .update(schema.companies)
            .set({ secCode: doc.secCode, isListed: true })
            .where(eq(schema.companies.id, companyId))
            .run();
        }
      } else {
        const result = database
          .insert(schema.companies)
          .values({
            edinetCode: doc.edinetCode,
            secCode: doc.secCode || null,
            name: doc.filerName,
            isListed: !!doc.secCode,
          })
          .returning({ id: schema.companies.id })
          .get();
        companyId = result.id;
      }

      // 期末日からfiscalYearを生成
      const fiscalYear = doc.periodEnd
        ? doc.periodEnd.substring(0, 7)
        : date.substring(0, 4) + "-03";

      // 既にデータがあればスキップ
      const existingData = database
        .select()
        .from(schema.salaryData)
        .where(
          and(
            eq(schema.salaryData.companyId, companyId),
            eq(schema.salaryData.fiscalYear, fiscalYear)
          )
        )
        .get();

      if (existingData) {
        daySkipped++;
        totalSkipped++;
        continue;
      }

      // CSVダウンロード＆パース
      await sleep(RATE_LIMIT_MS);
      const parsed = await downloadAndParse(doc.docID, apiKey);
      if (!parsed) continue;

      // salary_data に保存
      database
        .insert(schema.salaryData)
        .values({
          companyId,
          periodEnd: doc.periodEnd || `${fiscalYear}-31`,
          fiscalYear,
          avgSalary: parsed.salary,
          employees: parsed.employees,
          avgAge: parsed.avgAge,
          avgTenure: parsed.avgTenure,
          tempWorkers: parsed.tempWorkers,
          genderWageGapAll: parsed.genderWageGapAll,
          genderWageGapFull: parsed.genderWageGapFull,
          genderWageGapPart: parsed.genderWageGapPart,
          maleParentalLeaveRate: parsed.maleParentalLeaveRate,
          femaleManagerRate: parsed.femaleManagerRate,
          execCompTotal: parsed.execCompTotal,
          execCompCount: parsed.execCompCount,
          docId: doc.docID,
        })
        .run();

      // financials に保存（財務データがある場合のみ）
      if (parsed.netSales || parsed.operatingIncome) {
        database
          .insert(schema.financials)
          .values({
            companyId,
            fiscalYear,
            netSales: parsed.netSales,
            operatingIncome: parsed.operatingIncome,
            ordinaryIncome: parsed.ordinaryIncome,
            netIncome: parsed.netIncome,
            isConsolidated: parsed.financialsConsolidated,
          })
          .onConflictDoUpdate({
            target: [schema.financials.companyId, schema.financials.fiscalYear],
            set: {
              netSales: parsed.netSales,
              operatingIncome: parsed.operatingIncome,
              ordinaryIncome: parsed.ordinaryIncome,
              netIncome: parsed.netIncome,
              isConsolidated: parsed.financialsConsolidated,
            },
          })
          .run();
      }

      daySaved++;
      totalSaved++;
    }

    console.log(` → 保存${daySaved} / スキップ${daySkipped}`);
  }

  // 統計を表示
  const companyCount = database
    .select()
    .from(schema.companies)
    .all().length;

  const withSalary = sqlite
    .prepare("SELECT COUNT(DISTINCT company_id) as cnt FROM salary_data WHERE avg_salary IS NOT NULL")
    .get() as { cnt: number };

  console.log(`\n========== 完了 ==========`);
  console.log(`📄 処理した有報: ${totalProcessed}件`);
  console.log(`💾 新規保存: ${totalSaved}件`);
  console.log(`⏭️  スキップ: ${totalSkipped}件`);
  console.log(`🏢 DB内の企業数: ${companyCount}社`);
  console.log(`💰 年収データあり: ${withSalary.cnt}社`);
  console.log(`==========================\n`);

  sqlite.close();
}

main().catch(console.error);
