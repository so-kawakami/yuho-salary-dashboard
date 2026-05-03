/**
 * EDINETのCSVに含まれるXBRLタグ名を調査するスクリプト
 * 実際のタグ名を確認して、batch-fetch.tsの設定に使う
 *
 * 使い方: npx tsx scripts/discover-tags.ts
 */

import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";

const API_BASE = "https://api.edinet-fsa.go.jp/api/v2";

// 調査したいキーワード（部分一致で検索）
const KEYWORDS = [
  "gender", "wage", "female", "male", "parental", "childcare", "women",
  "賃金", "女性", "男性", "育児", "育休", "管理職",
  "NetSales", "OperatingIncome", "OrdinaryIncome", "ProfitLoss",
  "売上", "営業", "経常", "利益",
  "Remuneration", "Director", "Executive",
  "役員", "報酬",
];

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

async function main() {
  const apiKey = getApiKey();

  // 最近の有報を1件取得
  const date = "2025-06-25";
  console.log(`📄 ${date} の書類一覧を取得中...\n`);

  const listUrl = `${API_BASE}/documents.json?date=${date}&type=2&Subscription-Key=${apiKey}`;
  const listRes = await fetch(listUrl);
  const listData = await listRes.json();

  const docs = (listData.results ?? []).filter(
    (d: any) => d.docTypeCode === "120" && d.edinetCode && d.secCode
  );

  if (docs.length === 0) {
    console.log("⚠️  この日は有報が見つかりませんでした");
    return;
  }

  // 上場企業の1件を選ぶ
  const doc = docs[0];
  console.log(`🔍 対象: ${doc.filerName} (${doc.docID})\n`);

  // CSVダウンロード
  const csvUrl = `${API_BASE}/documents/${doc.docID}?type=5&Subscription-Key=${apiKey}`;
  const csvRes = await fetch(csvUrl);
  if (!csvRes.ok) { console.error("❌ ダウンロード失敗"); return; }

  const buf = Buffer.from(await csvRes.arrayBuffer());
  const zip = new AdmZip(buf);
  const entries = zip.getEntries();

  console.log(`📦 ZIPに含まれるファイル一覧:`);
  entries.forEach((e) => console.log(`   ${e.entryName}`));
  console.log();

  // 全CSVから対象タグを探す
  const foundTags = new Map<string, { value: string; context: string; file: string }>();

  for (const entry of entries) {
    if (!entry.entryName.endsWith(".csv") && !entry.entryName.includes("jpcrp")) continue;

    const content = decodeBuffer(entry.getData());
    const lines = content.split("\n");

    for (const line of lines) {
      const cols = line.split("\t").map((c) => c.replace(/"/g, "").trim());
      const tagId = cols[0];
      const context = cols[2] ?? "";
      const value = cols[8] ?? "";

      if (!tagId || !value) continue;

      const tagLower = tagId.toLowerCase();
      const isMatch = KEYWORDS.some((kw) => tagLower.includes(kw.toLowerCase()));

      if (isMatch && value && value !== "0") {
        if (!foundTags.has(tagId)) {
          foundTags.set(tagId, { value, context, file: entry.entryName });
        }
      }
    }
  }

  console.log(`\n🎯 キーワードにマッチしたタグ (${foundTags.size}件):\n`);

  const sorted = [...foundTags.entries()].sort(([a], [b]) => a.localeCompare(b));
  for (const [tag, { value, context, file }] of sorted) {
    console.log(`  タグ: ${tag}`);
    console.log(`  値:   ${value}  (コンテキスト: ${context})`);
    console.log(`  ファイル: ${path.basename(file)}`);
    console.log();
  }

  if (foundTags.size === 0) {
    console.log("  該当タグが見つかりませんでした。");
    console.log("  → この企業はDEI・財務タグが未記載か、テキストブロック形式の可能性があります。\n");

    // 全タグ一覧をファイルに出力して確認できるようにする
    console.log("📝 全タグ一覧を all-tags.txt に出力します...");
    const allTags = new Set<string>();
    for (const entry of entries) {
      if (!entry.entryName.endsWith(".csv") && !entry.entryName.includes("jpcrp")) continue;
      const content = decodeBuffer(entry.getData());
      for (const line of content.split("\n")) {
        const cols = line.split("\t");
        const tagId = cols[0]?.replace(/"/g, "").trim();
        if (tagId && tagId.includes(":")) allTags.add(tagId);
      }
    }
    fs.writeFileSync("all-tags.txt", [...allTags].sort().join("\n"));
    console.log(`✅ all-tags.txt に ${allTags.size}件のタグを出力しました。`);
    console.log("   grep で検索してみてください: grep -i 'gender\\|female\\|wage' all-tags.txt");
  }
}

main().catch(console.error);
