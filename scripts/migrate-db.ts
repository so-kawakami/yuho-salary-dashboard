/**
 * DBマイグレーションスクリプト
 * 既存のyuho.dbに新しいカラム・テーブルを安全に追加する
 *
 * 使い方: npx tsx scripts/migrate-db.ts
 */

import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "data", "yuho.db");

if (!fs.existsSync(DB_PATH)) {
  console.log("⚠️  DBファイルが見つかりません。スキップします。");
  process.exit(0);
}

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

function columnExists(table: string, column: string): boolean {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  return cols.some((c) => c.name === column);
}

function tableExists(table: string): boolean {
  const result = db
    .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`)
    .get(table);
  return !!result;
}

function addColumn(table: string, column: string, type: string) {
  if (!columnExists(table, column)) {
    db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`).run();
    console.log(`  ✅ ${table}.${column} を追加`);
  } else {
    console.log(`  ⏭️  ${table}.${column} は既に存在`);
  }
}

console.log("🔧 DBマイグレーション開始\n");

// salary_data に新カラムを追加
console.log("📋 salary_data テーブルを更新中...");
addColumn("salary_data", "gender_wage_gap_all",         "REAL");
addColumn("salary_data", "gender_wage_gap_full",        "REAL");
addColumn("salary_data", "gender_wage_gap_part",        "REAL");
addColumn("salary_data", "male_parental_leave_rate",    "REAL");
addColumn("salary_data", "female_manager_rate",         "REAL");
addColumn("salary_data", "exec_comp_total",             "INTEGER");
addColumn("salary_data", "exec_comp_count",             "INTEGER");

// financials テーブルを新規作成
console.log("\n📋 financials テーブルを確認中...");
if (!tableExists("financials")) {
  db.prepare(`
    CREATE TABLE financials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER NOT NULL REFERENCES companies(id),
      fiscal_year TEXT NOT NULL,
      net_sales INTEGER,
      operating_income INTEGER,
      ordinary_income INTEGER,
      net_income INTEGER,
      is_consolidated INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(company_id, fiscal_year)
    )
  `).run();
  console.log("  ✅ financials テーブルを作成");
} else {
  console.log("  ⏭️  financials テーブルは既に存在");
}

db.close();
console.log("\n✅ マイグレーション完了！");
