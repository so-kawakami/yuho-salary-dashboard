/**
 * 東証上場銘柄一覧から証券コード→業種の対応をDBに反映する
 *
 * 使い方: npx tsx scripts/import-industry.ts
 */

import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import * as XLSX from "xlsx";

const DB_PATH = path.join(process.cwd(), "data", "yuho.db");
const XLS_PATH = "/tmp/jpx_listed.xlsx";

// 東証の業種コード → わかりやすい業種名に変換
const INDUSTRY_MAP: Record<string, string> = {
  "水産・農林業": "水産・農林",
  "鉱業": "鉱業",
  "建設業": "建設",
  "食料品": "食料品",
  "繊維製品": "繊維",
  "パルプ・紙": "パルプ・紙",
  "化学": "化学",
  "医薬品": "医薬品",
  "石油・石炭製品": "石油・石炭",
  "ゴム製品": "ゴム",
  "ガラス・土石製品": "ガラス・土石",
  "鉄鋼": "鉄鋼",
  "非鉄金属": "非鉄金属",
  "金属製品": "金属製品",
  "機械": "機械",
  "電気機器": "電気機器",
  "輸送用機器": "輸送用機器",
  "精密機器": "精密機器",
  "その他製品": "その他製品",
  "電気・ガス業": "電気・ガス",
  "陸運業": "陸運",
  "海運業": "海運",
  "空運業": "空運",
  "倉庫・運輸関連業": "倉庫・運輸",
  "情報・通信業": "情報・通信",
  "卸売業": "卸売",
  "小売業": "小売",
  "銀行業": "銀行",
  "証券、商品先物取引業": "証券",
  "保険業": "保険",
  "その他金融業": "その他金融",
  "不動産業": "不動産",
  "サービス業": "サービス",
};

async function main() {
  console.log("📊 東証上場銘柄一覧から業種データを取得中...\n");

  // Excelを読み込む
  if (!fs.existsSync(XLS_PATH)) {
    console.error(`❌ ${XLS_PATH} が見つかりません`);
    console.log("以下のコマンドでダウンロードしてください:");
    console.log('curl -L -o /tmp/jpx_listed.xlsx "https://www.jpx.co.jp/markets/statistics-equities/misc/tvdivq0000001vg2-att/data_j.xls"');
    process.exit(1);
  }

  const workbook = XLSX.readFile(XLS_PATH);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<any>(sheet, { defval: "" });

  // 証券コード→業種のマップを作成
  const codeToIndustry = new Map<string, string>();
  let parsed = 0;

  for (const row of rows) {
    // 列名が日本語なので様々なキーを試す
    const rawCode =
      row["コード"] ?? row["証券コード"] ?? row["銘柄コード"] ?? "";
    const rawIndustry =
      row["業種"] ?? row["33業種区分"] ?? row["業種区分"] ?? "";

    if (!rawCode || !rawIndustry) continue;

    // 東証は4桁コード、EDINETは末尾に0を付けた5桁
    const code4 = String(rawCode).trim().replace(/\.0$/, "");
    const code5 = code4.padStart(4, "0") + "0";
    const industry = INDUSTRY_MAP[rawIndustry] ?? rawIndustry;

    if (code4) {
      codeToIndustry.set(code5, industry);  // 5桁で登録
      codeToIndustry.set(code4, industry);  // 4桁でも登録（念のため）
      parsed++;
    }
  }

  console.log(`✅ 東証データ読み込み: ${parsed}社`);

  // DBに反映
  const db = new Database(DB_PATH);
  let updated = 0;
  let notFound = 0;

  const updateStmt = db.prepare(
    "UPDATE companies SET industry = ? WHERE sec_code = ?"
  );

  for (const [secCode, industry] of codeToIndustry) {
    const result = updateStmt.run(industry, secCode);
    if (result.changes > 0) {
      updated++;
    } else {
      notFound++;
    }
  }

  db.close();

  console.log(`\n📝 DB更新結果:`);
  console.log(`   更新成功: ${updated}社`);
  console.log(`   DB未登録（非上場等）: ${notFound}社`);

  // 確認
  const db2 = new Database(DB_PATH);
  const withIndustry = (
    db2
      .prepare("SELECT COUNT(*) as cnt FROM companies WHERE industry IS NOT NULL AND industry != ''")
      .get() as any
  ).cnt;
  const total = (db2.prepare("SELECT COUNT(*) as cnt FROM companies").get() as any).cnt;
  db2.close();

  console.log(`\n🏢 DB内の業種データ: ${withIndustry} / ${total}社`);
}

main().catch(console.error);
