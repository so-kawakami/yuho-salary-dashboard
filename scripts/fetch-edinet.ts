/**
 * EDINET API v2 から有価証券報告書の平均年収データを取得するスクリプト
 *
 * 使い方:
 *   1. .env に EDINET_API_KEY=your_key を設定
 *   2. npx tsx scripts/fetch-edinet.ts
 */

import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";

const API_BASE = "https://api.edinet-fsa.go.jp/api/v2";
const SALARY_TAG = "jpcrp_cor:AverageAnnualSalaryInformationAboutReportingCompanyInformationAboutEmployees";
const EMPLOYEES_TAG = "jpcrp_cor:NumberOfEmployees";

function getApiKey(): string {
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) {
    console.error("❌ .env ファイルが見つかりません。");
    process.exit(1);
  }
  const envContent = fs.readFileSync(envPath, "utf-8");
  const match = envContent.match(/^EDINET_API_KEY=(.+)$/m);
  if (!match) {
    console.error("❌ .env に EDINET_API_KEY が設定されていません。");
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

interface DocumentResult {
  docID: string;
  edinetCode: string;
  filerName: string;
  docDescription: string;
  docTypeCode: string;
  periodEnd: string;
}

// Step 1: 書類一覧を取得
async function fetchYuhoList(date: string, apiKey: string): Promise<DocumentResult[]> {
  const url = `${API_BASE}/documents.json?date=${date}&type=2&Subscription-Key=${apiKey}`;
  console.log(`📄 ${date} の書類一覧を取得中...`);

  const res = await fetch(url);
  if (!res.ok) throw new Error(`書類一覧の取得に失敗: ${res.status}`);

  const data = await res.json();

  // 有価証券報告書(120) かつ投資信託系を除外
  const yuhoList = data.results.filter(
    (doc: any) =>
      doc.docTypeCode === "120" &&
      doc.filerName &&
      !doc.filerName.includes("投信") &&
      !doc.filerName.includes("アセットマネジメント")
  );

  console.log(`  → 有価証券報告書: ${yuhoList.length}件（投信除外済）\n`);
  return yuhoList;
}

// Step 2-3: CSV をダウンロードして平均年収を抽出
interface SalaryResult {
  company: string;
  edinetCode: string;
  salary: number | null;       // 円
  employees: number | null;
  periodEnd: string;
}

async function extractSalary(doc: DocumentResult, apiKey: string): Promise<SalaryResult> {
  const result: SalaryResult = {
    company: doc.filerName,
    edinetCode: doc.edinetCode,
    salary: null,
    employees: null,
    periodEnd: doc.periodEnd,
  };

  try {
    const url = `${API_BASE}/documents/${doc.docID}?type=5&Subscription-Key=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${res.status}`);

    const buf = Buffer.from(await res.arrayBuffer());
    const zip = new AdmZip(buf);
    const entries = zip.getEntries();

    // 有報本体のCSVを探す
    const mainCsv = entries.find((e) => e.entryName.includes("jpcrp030000"));
    if (!mainCsv) return result;

    const content = decodeBuffer(mainCsv.getData());
    const lines = content.split("\n");

    for (const line of lines) {
      const cols = line.split("\t").map((c) => c.replace(/"/g, "").trim());
      const tagId = cols[0]; // 要素ID
      const value = cols[8]; // 値

      // 平均年間給与
      if (tagId === SALARY_TAG && value) {
        const num = parseInt(value, 10);
        if (num > 0) result.salary = num;
      }

      // 従業員数（当期末）
      if (
        tagId === EMPLOYEES_TAG &&
        cols[2]?.includes("CurrentYear") &&
        value
      ) {
        const num = parseInt(value, 10);
        if (num > 0) result.employees = num;
      }
    }
  } catch (e) {
    console.log(`  ⚠️ ${doc.filerName}: エラー - ${(e as Error).message}`);
  }

  return result;
}

// メイン処理
async function main() {
  const apiKey = getApiKey();

  console.log("🚀 EDINET API 平均年収取得スクリプト\n");

  // 3月決算企業は6月に有報を提出する
  const testDate = "2025-06-25";

  const yuhoList = await fetchYuhoList(testDate, apiKey);
  if (yuhoList.length === 0) {
    console.log("⚠️ この日は有価証券報告書の提出がありませんでした。");
    return;
  }

  // 最初の10件を取得
  const targets = yuhoList.slice(0, 10);
  console.log(`🔍 ${targets.length}件から平均年収を抽出中...\n`);

  const results: SalaryResult[] = [];
  for (const doc of targets) {
    const result = await extractSalary(doc, apiKey);
    results.push(result);

    if (result.salary) {
      const salaryMan = Math.round(result.salary / 10000);
      console.log(
        `  💰 ${result.company}: ${salaryMan}万円` +
        (result.employees ? ` (従業員${result.employees}名)` : "")
      );
    } else {
      console.log(`  ⏭️  ${result.company}: 年収データなし`);
    }
  }

  // サマリー
  const withSalary = results.filter((r) => r.salary);
  console.log(`\n========== 結果サマリー ==========`);
  console.log(`取得成功: ${withSalary.length} / ${results.length}件\n`);

  withSalary
    .sort((a, b) => (b.salary ?? 0) - (a.salary ?? 0))
    .forEach((r, i) => {
      const salaryMan = Math.round(r.salary! / 10000);
      console.log(
        `  ${i + 1}. ${r.company}: ${salaryMan}万円` +
        (r.employees ? ` (${r.employees}名)` : "")
      );
    });
  console.log(`==================================\n`);
}

main().catch(console.error);
