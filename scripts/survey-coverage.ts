/**
 * EDINET API で有価証券報告書がどのくらい網羅できるかを調査するスクリプト
 *
 * 書類一覧（JSON）だけ取得するので高速。CSVダウンロードはしない。
 */

import fs from "fs";
import path from "path";

const API_BASE = "https://api.edinet-fsa.go.jp/api/v2";

function getApiKey(): string {
  const envPath = path.join(process.cwd(), ".env");
  const envContent = fs.readFileSync(envPath, "utf-8");
  const match = envContent.match(/^EDINET_API_KEY=(.+)$/m);
  return match![1].trim();
}

interface DocInfo {
  docID: string;
  edinetCode: string;
  filerName: string;
  docTypeCode: string;
  docDescription: string;
  periodEnd: string;
  submitDateTime: string;
  secCode: string | null; // 証券コード（上場企業なら存在）
}

async function fetchDocList(date: string, apiKey: string): Promise<DocInfo[]> {
  const url = `${API_BASE}/documents.json?date=${date}&type=2&Subscription-Key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) {
    if (res.status === 404) return [];
    throw new Error(`${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  return data.results ?? [];
}

// 日付を YYYY-MM-DD 形式で生成
function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

// 日付範囲を生成
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

async function main() {
  const apiKey = getApiKey();

  console.log("📊 EDINET 有価証券報告書 網羅率調査\n");

  // 2025年度の有報提出シーズンを調査
  // 3月決算 → 6月提出、12月決算 → 3月提出 がメイン
  const periods = [
    { label: "2025年3月期（6月提出）", start: "2025-06-01", end: "2025-06-30" },
    { label: "2024年12月期（3月提出）", start: "2025-03-01", end: "2025-03-31" },
    { label: "その他（4-5月提出）", start: "2025-04-01", end: "2025-05-31" },
  ];

  // 全企業を追跡する Map（edinetCode → 企業情報）
  const allCompanies = new Map<string, {
    name: string;
    secCode: string | null;
    periodEnd: string;
    submitDate: string;
  }>();

  let totalYuho = 0;
  let totalDocs = 0;

  for (const period of periods) {
    console.log(`\n🗓️  ${period.label}`);
    console.log(`   期間: ${period.start} 〜 ${period.end}`);

    const dates = dateRange(period.start, period.end);
    let periodYuho = 0;
    let periodTotal = 0;

    for (const date of dates) {
      // APIレートリミット対策で少し待つ
      await new Promise((r) => setTimeout(r, 300));

      try {
        const docs = await fetchDocList(date, apiKey);
        const yuhoList = docs.filter((d) => d.docTypeCode === "120");

        periodTotal += docs.length;
        periodYuho += yuhoList.length;

        for (const doc of yuhoList) {
          if (doc.edinetCode && !allCompanies.has(doc.edinetCode)) {
            allCompanies.set(doc.edinetCode, {
              name: doc.filerName,
              secCode: doc.secCode,
              periodEnd: doc.periodEnd,
              submitDate: date,
            });
          }
        }

        // 進捗表示（提出が多い日だけ）
        if (yuhoList.length > 0) {
          process.stdout.write(`   ${date}: ${yuhoList.length}件  `);
        }
      } catch (e) {
        // 土日祝はデータなしの場合があるのでスキップ
      }
    }

    console.log(`\n   → この期間の有報: ${periodYuho}件 / 全書類${periodTotal}件`);
    totalYuho += periodYuho;
    totalDocs += periodTotal;
  }

  // 集計
  const listed = [...allCompanies.values()].filter((c) => c.secCode);
  const unlisted = [...allCompanies.values()].filter((c) => !c.secCode);

  console.log(`\n\n========== 調査結果 ==========`);
  console.log(`📄 有価証券報告書の総数: ${totalYuho}件`);
  console.log(`🏢 ユニーク企業数: ${allCompanies.size}社`);
  console.log(`   ├ 上場企業（証券コードあり）: ${listed.length}社`);
  console.log(`   └ 非上場企業: ${unlisted.length}社`);
  console.log(`📅 調査期間: 2025年3月〜6月（4ヶ月間）`);
  console.log(`==================================\n`);

  // 参考: 日本の上場企業数は約4,000社
  console.log(`💡 参考: 日本の上場企業は約4,000社`);
  console.log(`   → カバー率: 約${Math.round((listed.length / 4000) * 100)}%（上場企業ベース）\n`);

  // 月別の提出分布
  const byMonth = new Map<string, number>();
  for (const c of allCompanies.values()) {
    const month = c.submitDate.substring(0, 7);
    byMonth.set(month, (byMonth.get(month) ?? 0) + 1);
  }
  console.log("📅 月別提出数:");
  for (const [month, count] of [...byMonth.entries()].sort()) {
    const bar = "█".repeat(Math.round(count / 50));
    console.log(`   ${month}: ${count}社 ${bar}`);
  }
}

main().catch(console.error);
