/**
 * 特定のdocIdのCSVからDEI関連タグを調査するスクリプト
 *
 * 使い方: npx tsx scripts/discover-tags-byid.ts S100VYM1
 */

import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";

const API_BASE = "https://api.edinet-fsa.go.jp/api/v2";

const KEYWORDS = [
  "wage", "gender", "gap", "female", "male", "childcare", "parental", "women", "ratio",
  "賃金", "格差", "女性", "男性", "育児", "育休", "管理職", "差異",
  "WageGap", "PayGap", "Difference",
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
  const docId = process.argv[2];
  if (!docId) { console.error("使い方: npx tsx scripts/discover-tags-byid.ts <docId>"); process.exit(1); }

  const apiKey = getApiKey();
  console.log(`🔍 docId: ${docId} のCSVを調査中...\n`);

  const url = `${API_BASE}/documents/${docId}?type=5&Subscription-Key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) { console.error(`❌ ダウンロード失敗: ${res.status}`); return; }

  const buf = Buffer.from(await res.arrayBuffer());
  const zip = new AdmZip(buf);
  const entries = zip.getEntries();

  console.log(`📦 ZIPファイル一覧:`);
  entries.forEach((e) => console.log(`   ${e.entryName}`));
  console.log();

  // 全タグ収集＋キーワード検索
  const allTags = new Set<string>();
  const matchedTags = new Map<string, { value: string; context: string }>();

  for (const entry of entries) {
    if (!entry.entryName.endsWith(".csv")) continue;
    const content = decodeBuffer(entry.getData());
    for (const line of content.split("\n")) {
      const cols = line.split("\t").map((c) => c.replace(/"/g, "").trim());
      const tagId = cols[0];
      const context = cols[2] ?? "";
      const value = cols[8] ?? "";
      if (!tagId || !tagId.includes(":")) continue;

      allTags.add(tagId);

      if (!value) continue;
      const tagLower = tagId.toLowerCase();
      if (KEYWORDS.some((kw) => tagLower.includes(kw.toLowerCase()))) {
        if (!matchedTags.has(tagId)) {
          matchedTags.set(tagId, { value: value.substring(0, 100), context });
        }
      }
    }
  }

  console.log(`🎯 キーワードマッチしたタグ (${matchedTags.size}件):\n`);
  for (const [tag, { value, context }] of [...matchedTags.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    console.log(`  ${tag}`);
    console.log(`    値: ${value}`);
    console.log(`    ctx: ${context}\n`);
  }

  // 全タグをファイルに出力
  const outFile = `all-tags-${docId}.txt`;
  fs.writeFileSync(outFile, [...allTags].sort().join("\n"));
  console.log(`📝 全${allTags.size}タグを ${outFile} に出力しました`);
  console.log(`   grep -i 'wage\\|gap\\|差異\\|childcare' ${outFile}`);
}

main().catch(console.error);
