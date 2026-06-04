const { Client } = require("pg");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DB_CONFIG = {
  host: "db.gubxjsbxolcfecyhtjzn.supabase.co",
  port: 6543,
  database: "postgres",
  user: "postgres",
  password: "xZUtN1EAyFmh7RVq",
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
};

async function main() {
  const client = new Client(DB_CONFIG);
  await client.connect();
  console.log("✅ DB接続成功\n");

  // 1. _prisma_migrations テーブルを Prisma 仕様で作成
  console.log("=== [1] _prisma_migrations テーブル作成 ===");
  await client.query(`
    CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
      id                      VARCHAR(36)  PRIMARY KEY NOT NULL,
      checksum                VARCHAR(64)  NOT NULL,
      finished_at             TIMESTAMPTZ,
      migration_name          VARCHAR(255) NOT NULL,
      logs                    TEXT,
      rolled_back_at          TIMESTAMPTZ,
      started_at              TIMESTAMPTZ  NOT NULL DEFAULT now(),
      applied_steps_count     INTEGER      NOT NULL DEFAULT 0
    )
  `);
  console.log("  ✅ _prisma_migrations 作成（または既存確認）");

  // 2. ベースラインSQLファイルを読み込んでチェックサム計算
  const sqlPath = path.join(process.cwd(), "prisma/migrations/0_init/migration.sql");
  const migrationSql = fs.readFileSync(sqlPath, "utf8");
  const checksum = crypto.createHash("sha256").update(migrationSql).digest("hex");
  const migrationName = "0_init";
  const id = crypto.randomUUID();

  console.log(`\n=== [2] ベースラインエントリ登録 ===`);
  console.log(`  migration_name: ${migrationName}`);
  console.log(`  checksum: ${checksum.substring(0, 16)}...`);

  // 既存チェック
  const existing = await client.query(
    `SELECT id FROM _prisma_migrations WHERE migration_name = $1`,
    [migrationName]
  );

  if (existing.rows.length > 0) {
    console.log("  ⚠️  すでに登録済み。スキップします。");
  } else {
    await client.query(`
      INSERT INTO _prisma_migrations
        (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
      VALUES
        ($1, $2, now(), $3, NULL, NULL, now(), 1)
    `, [id, checksum, migrationName]);
    console.log("  ✅ ベースライン登録完了（applied_steps_count=1, finished_at=now）");
  }

  // 3. 結果確認
  console.log(`\n=== [3] _prisma_migrations 最終状態 ===`);
  const result = await client.query(`
    SELECT migration_name, finished_at, applied_steps_count
    FROM _prisma_migrations
    ORDER BY started_at
  `);
  result.rows.forEach(r => {
    const status = r.finished_at ? "✅ applied" : "❌ not applied";
    console.log(`  - ${r.migration_name} (${status}, steps=${r.applied_steps_count})`);
  });

  await client.end();
  console.log("\n✅ P3.5 ベースライン正常化 完了");
}

main().catch(e => { console.error("❌", e.message); process.exit(1); });
