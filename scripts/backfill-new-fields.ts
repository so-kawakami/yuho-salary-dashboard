/**
 * 既存レコードに新しいフィールド（DEI・財務・役員報酬）を埋め戻すスクリプト
 *
 * 既存の年収・従業員データは一切上書きしない。
 * 新カラムがNULLのレコードだけを対象に、EDINETから再ダウンロードして
 * 新しいフィールドのみUPDATEする。
 *
 * 使い方: npx tsx scripts/backfill-new-fields.ts
 *         npx tsx scripts/backfill-new-fields.ts --limit 100
 */

import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import AdmZip from "adm-zip";

const API_BASE = "https://api.edinet-fsa.go.jp/api/v2";
const DB_PATH = path.join(process.cwd(), "data", "yuho.db");
const RATE_LIMIT_MS = 500;

// 確認済みXBRLタグ（discover-tags.tsで検証済み）
const TAGS = {
  // DEI（discover-tags-byidで三菱商事CSVから確認済み）
  genderWageGapAll:  "jpcrp_cor:AllEmployeesDifferencesInWagesBetweenMaleAndFemaleEmployeesMetricsOfReportingCompany",
  genderWageGapFull: "jpcrp_cor:RegularEmployeesDifferencesInWagesBetweenMaleAndFemaleEmployeesMetricsOfReportingCompany",
  genderWageGapPart: "jpcrp_cor:NonRegularEmployeesDifferencesInWagesBetweenMaleAndFemaleEmployeesMetricsOfReportingCompany",
  maleParentalLeave: "jpcrp_cor:AllEmployeesCalculatedBasedOnProvisionsOfArticle714Item2OfOrdinanceForEnforcementOfActOnChildcareLeaveCaregiverLeaveAndOtherMeasuresForTheWelfareOfWorkersCaringForChildrenOrOtherFamilyMembersRatioOfMaleEmployeesTakingChildcareLeaveMetricsOfReportingCompany",
  femaleManager:     "jpcrp_cor:RatioOfFemaleEmployeesInManagerialPositionsMetricsOfReportingCompany",
  femaleDirRatio:    "jpcrp_cor:RatioOfFemaleDirectorsAndOtherOfficers",
  // 役員報酬
  execCompTotal: "jpcrp_cor:TotalAmountOfRemunerationEtcRemunerationEtcByCategoryOfDirectorsAndOtherOfficers",
  execCompCount: "jpcrp_cor:NumberOfDirectorsAndOtherOfficersRemunerationEtcByCategoryOfDirectorsAndOtherOfficers",
  // 財務（jppfs_cor名前空間）
  netSales:        "jppfs_cor:NetSales",
  operatingIncome: "jppfs_cor:OperatingIncome",
  ordinaryIncome:  "jppfs_cor:OrdinaryIncome",
  netIncome:       "jppfs_cor:ProfitLoss",
  // フォールバック（jpcrp_corサマリー）
  netSalesSummary:       "jpcrp_cor:NetSalesSummaryOfBusinessResults",
  ordinaryIncomeSummary: "jpcrp_cor:OrdinaryIncomeLossSummaryOfBusinessResults",
  netIncomeSummary:      "jpcrp_cor:ProfitLossAttributableToOwnersOfParentSummaryOfBusinessResults",
};

function getApiKey(): string {
  const envPath = path.join(process.cwd(), ".env");
  const envContent = fs.readFileSync(envPath, "utf-8");
  const match = envContent.match(/^EDINET_API_KEY=(.+)$/m);
  if (!match) { console.error("❌ EDINET_API_KEY が .env に設定されていません"); process.exit(1); }
  return match[1].trim();
}

function decodeBuffer(buf: Buffer): string {
  if (buf[0] === 0xff && buf[1] === 0xfe) return buf.toString("utf16le");
  return buf.toString("utf-8");
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

interface BackfillData {
  genderWageGapAll: number | null;
  genderWageGapFull: number | null;
  genderWageGapPart: number | null;
  maleParentalLeaveRate: number | null;
  femaleManagerRate: number | null;
  execCompTotal: number | null;
  execCompCount: number | null;
  netSales: number | null;
  operatingIncome: number | null;
  ordinaryIncome: number | null;
  netIncome: number | null;
}

async function downloadAndParse(docId: string, apiKey: string): Promise<BackfillData | null> {
  const url = `${API_BASE}/documents/${docId}?type=5&Subscription-Key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) return null;

  const buf = Buffer.from(await res.arrayBuffer());
  let zip: AdmZip;
  try { zip = new AdmZip(buf); } catch { return null; }

  const result: BackfillData = {
    genderWageGapAll: null, genderWageGapFull: null, genderWageGapPart: null,
    maleParentalLeaveRate: null, femaleManagerRate: null,
    execCompTotal: null, execCompCount: null,
    netSales: null, operatingIncome: null, ordinaryIncome: null, netIncome: null,
  };

  const entries = zip.getEntries().filter((e) =>
    e.entryName.endsWith(".csv") || e.entryName.includes("jpcrp")
  );

  for (const entry of entries) {
    const content = decodeBuffer(entry.getData());
    for (const line of content.split("\n")) {
      const cols = line.split("\t").map((c) => c.replace(/"/g, "").trim());
      const tagId = cols[0];
      const context = cols[2] ?? "";
      const value = cols[8];
      if (!value || !tagId) continue;

      // DEI: 男女賃金格差（0〜1の小数 → %に変換）
      if (tagId === TAGS.genderWageGapAll)  { const n = parseFloat(value); if (n > 0 && n <= 2) result.genderWageGapAll = Math.round(n * 1000) / 10; }
      if (tagId === TAGS.genderWageGapFull) { const n = parseFloat(value); if (n > 0 && n <= 2) result.genderWageGapFull = Math.round(n * 1000) / 10; }
      if (tagId === TAGS.genderWageGapPart) { const n = parseFloat(value); if (n > 0 && n <= 2) result.genderWageGapPart = Math.round(n * 1000) / 10; }

      // DEI: 男性育休取得率（0〜の小数 → %に変換。100%超もあり得る）
      if (tagId === TAGS.maleParentalLeave) { const n = parseFloat(value); if (n >= 0) result.maleParentalLeaveRate = Math.round(n * 1000) / 10; }

      // DEI: 女性管理職比率（0〜1の小数 → %に変換）
      if (tagId === TAGS.femaleManager) { const n = parseFloat(value); if (n >= 0 && n <= 1) result.femaleManagerRate = Math.round(n * 1000) / 10; }

      // DEI: 女性役員比率（フォールバック）
      if (tagId === TAGS.femaleDirRatio && result.femaleManagerRate === null) {
        const n = parseFloat(value);
        if (n >= 0 && n <= 1) result.femaleManagerRate = Math.round(n * 1000) / 10;
      }

      // 役員報酬（複数区分を合算）
      if (tagId === TAGS.execCompTotal && context.includes("CurrentYear")) {
        const n = parseInt(value, 10);
        if (n > 0 && n <= 100_000_000_000) result.execCompTotal = (result.execCompTotal ?? 0) + n;
      }
      if (tagId === TAGS.execCompCount && context.includes("CurrentYear")) {
        const n = parseInt(value, 10);
        if (n > 0) result.execCompCount = (result.execCompCount ?? 0) + n;
      }

      // 財務（jppfs_cor）
      if (tagId === TAGS.netSales && context.includes("CurrentYear") && result.netSales === null) {
        const n = parseInt(value, 10); if (n > 0) result.netSales = n;
      }
      if (tagId === TAGS.operatingIncome && context.includes("CurrentYear") && result.operatingIncome === null) {
        const n = parseInt(value, 10); if (!isNaN(n)) result.operatingIncome = n;
      }
      if (tagId === TAGS.ordinaryIncome && context.includes("CurrentYear") && result.ordinaryIncome === null) {
        const n = parseInt(value, 10); if (!isNaN(n)) result.ordinaryIncome = n;
      }
      if (tagId === TAGS.netIncome && context.includes("CurrentYear") && result.netIncome === null) {
        const n = parseInt(value, 10); if (!isNaN(n)) result.netIncome = n;
      }

      // フォールバック（jpcrp_corサマリー）
      if (tagId === TAGS.netSalesSummary && context.includes("CurrentYear") && result.netSales === null) {
        const n = parseInt(value, 10); if (n > 0) result.netSales = n;
      }
      if (tagId === TAGS.ordinaryIncomeSummary && context.includes("CurrentYear") && result.ordinaryIncome === null) {
        const n = parseInt(value, 10); if (!isNaN(n)) result.ordinaryIncome = n;
      }
      if (tagId === TAGS.netIncomeSummary && context.includes("CurrentYear") && result.netIncome === null) {
        const n = parseInt(value, 10); if (!isNaN(n)) result.netIncome = n;
      }
    }
  }

  return result;
}

async function main() {
  const apiKey = getApiKey();
  const args = process.argv.slice(2);
  let limit = 0; // 0 = 全件
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--limit" && args[i + 1]) limit = parseInt(args[i + 1], 10);
  }

  console.log("🔄 新フィールド埋め戻しスクリプト\n");

  if (!fs.existsSync(DB_PATH)) {
    console.log("❌ DBファイルが見つかりません"); process.exit(1);
  }

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");

  // 新カラムがすべてNULLかつdocIdがあるレコードを取得
  const targets = db.prepare(`
    SELECT s.id, s.doc_id, s.company_id, s.fiscal_year, c.name
    FROM salary_data s
    JOIN companies c ON s.company_id = c.id
    WHERE s.exec_comp_total IS NULL
      AND s.doc_id IS NOT NULL
      AND s.avg_salary IS NOT NULL
    ORDER BY s.avg_salary DESC
    ${limit > 0 ? `LIMIT ${limit}` : ""}
  `).all() as { id: number; doc_id: string; company_id: number; fiscal_year: string; name: string }[];

  console.log(`📊 対象レコード: ${targets.length}件${limit > 0 ? `（上限${limit}件）` : ""}\n`);

  const updateStmt = db.prepare(`
    UPDATE salary_data SET
      gender_wage_gap_all = ?,
      gender_wage_gap_full = ?,
      gender_wage_gap_part = ?,
      male_parental_leave_rate = ?,
      female_manager_rate = ?,
      exec_comp_total = ?,
      exec_comp_count = ?
    WHERE id = ?
  `);

  // financialsテーブルが存在するかチェック
  const hasFinancials = db.prepare(
    `SELECT name FROM sqlite_master WHERE type='table' AND name='financials'`
  ).get();

  const insertFinancials = hasFinancials
    ? db.prepare(`
        INSERT OR REPLACE INTO financials (company_id, fiscal_year, net_sales, operating_income, ordinary_income, net_income)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
    : null;

  let updated = 0;
  let withExecComp = 0;
  let withFinancials = 0;
  let withDei = 0;
  let errors = 0;

  for (let i = 0; i < targets.length; i++) {
    const target = targets[i];

    await sleep(RATE_LIMIT_MS);

    const parsed = await downloadAndParse(target.doc_id, apiKey);
    if (!parsed) {
      errors++;
      continue;
    }

    // salary_data の新カラムをUPDATE
    updateStmt.run(
      parsed.genderWageGapAll,
      parsed.genderWageGapFull,
      parsed.genderWageGapPart,
      parsed.maleParentalLeaveRate,
      parsed.femaleManagerRate,
      parsed.execCompTotal,
      parsed.execCompCount,
      target.id,
    );

    // financials テーブルにINSERT
    if (insertFinancials && (parsed.netSales || parsed.operatingIncome)) {
      insertFinancials.run(
        target.company_id,
        target.fiscal_year,
        parsed.netSales,
        parsed.operatingIncome,
        parsed.ordinaryIncome,
        parsed.netIncome,
      );
      withFinancials++;
    }

    updated++;
    if (parsed.execCompTotal) withExecComp++;
    if (parsed.genderWageGapAll || parsed.femaleManagerRate) withDei++;

    // 進捗表示（50件ごと）
    if ((i + 1) % 50 === 0 || i === targets.length - 1) {
      console.log(`  ${i + 1}/${targets.length} 処理完了 (更新${updated} / 役員報酬${withExecComp} / 財務${withFinancials} / DEI${withDei} / エラー${errors})`);
    }
  }

  db.close();

  console.log(`\n========== 完了 ==========`);
  console.log(`📄 処理レコード: ${targets.length}件`);
  console.log(`✅ 更新成功: ${updated}件`);
  console.log(`💰 役員報酬あり: ${withExecComp}件`);
  console.log(`📊 財務データあり: ${withFinancials}件`);
  console.log(`🌈 DEIデータあり: ${withDei}件`);
  console.log(`❌ エラー: ${errors}件`);
  console.log(`==========================\n`);
}

main().catch(console.error);
