/**
 * EDINETコードリスト（EdinetcodeDlInfo.csv）から業種・上場区分を補完する
 *
 * JPXの東証銘柄一覧（import-industry.ts）でカバーできない企業
 * （名証・福証・札証単独上場、持株会社化した旧事業会社、非上場化した企業など）の
 * 業種を「提出者業種」から補完し、上場区分（is_listed）も最新化する。
 *
 * 使い方:
 *   curl -sL -o /tmp/edinetcode.zip "https://disclosure2dl.edinet-fsa.go.jp/searchdocument/codelist/Edinetcode.zip"
 *   cd /tmp && unzip -o edinetcode.zip -d edinetcode
 *   iconv -f CP932 -t UTF-8 /tmp/edinetcode/EdinetcodeDlInfo.csv > /tmp/edinetcode/edinet_utf8.csv
 *   npx tsx scripts/backfill-industry-edinet.ts
 */

import fs from "fs";
import path from "path";
import Database from "better-sqlite3";

const DB_PATH = path.join(process.cwd(), "data", "yuho.db");
const CSV_PATH = "/tmp/edinetcode/edinet_utf8.csv";

// EDINETの提出者業種（33業種ベース）→ サイト内の短い業種名
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
  "倉庫・運輸関連": "倉庫・運輸",
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

// 単純なCSVパーサ（ダブルクォート対応）
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      fields.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  fields.push(cur);
  return fields;
}

function main() {
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`❌ ${CSV_PATH} が見つかりません。ヘッダのコメントの手順でダウンロードしてください。`);
    process.exit(1);
  }

  const lines = fs.readFileSync(CSV_PATH, "utf-8").split(/\r?\n/);
  // 1行目はダウンロード日、2行目がヘッダ
  const header = parseCsvLine(lines[1]);
  const idxEdinet = header.indexOf("ＥＤＩＮＥＴコード");
  const idxListed = header.indexOf("上場区分");
  const idxIndustry = header.indexOf("提出者業種");

  const byEdinetCode = new Map<string, { industry: string; listed: boolean }>();
  for (let i = 2; i < lines.length; i++) {
    if (!lines[i]) continue;
    const f = parseCsvLine(lines[i]);
    const code = f[idxEdinet];
    if (!code) continue;
    byEdinetCode.set(code, {
      industry: f[idxIndustry] ?? "",
      listed: f[idxListed] === "上場",
    });
  }
  console.log(`✅ EDINETコードリスト読み込み: ${byEdinetCode.size}件`);

  const db = new Database(DB_PATH);
  const companies = db
    .prepare("SELECT id, edinet_code as edinetCode, industry, is_listed as isListed FROM companies")
    .all() as { id: number; edinetCode: string; industry: string | null; isListed: number }[];

  const updateIndustry = db.prepare("UPDATE companies SET industry = ? WHERE id = ?");
  const updateListed = db.prepare("UPDATE companies SET is_listed = ? WHERE id = ?");

  let industryFilled = 0;
  let listedFixed = 0;
  let unknownIndustry = 0;

  for (const c of companies) {
    const info = byEdinetCode.get(c.edinetCode);
    if (!info) continue;

    if (!c.industry || c.industry === "" || c.industry === "-") {
      const mapped = INDUSTRY_MAP[info.industry];
      if (mapped) {
        updateIndustry.run(mapped, c.id);
        industryFilled++;
      } else if (info.industry) {
        unknownIndustry++;
      }
    }

    const listedFlag = info.listed ? 1 : 0;
    if (c.isListed !== listedFlag) {
      updateListed.run(listedFlag, c.id);
      listedFixed++;
    }
  }

  const remaining = (
    db
      .prepare(
        `SELECT COUNT(*) as c FROM companies c
         WHERE (industry IS NULL OR industry = '')
           AND EXISTS (SELECT 1 FROM salary_data s WHERE s.company_id = c.id AND s.avg_salary IS NOT NULL)`
      )
      .get() as { c: number }
  ).c;
  db.close();

  console.log(`📝 業種を補完: ${industryFilled}社`);
  console.log(`📝 上場区分を更新: ${listedFixed}社`);
  console.log(`⚠️  マップ外の業種: ${unknownIndustry}社`);
  console.log(`🏢 業種なしで年収データありの残り: ${remaining}社`);
}

main();
