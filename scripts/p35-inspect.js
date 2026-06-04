const { Client } = require("pg");

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

  // 1. _prisma_migrations テーブル存在確認
  const tableCheck = await client.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = '_prisma_migrations'
    ) as exists
  `);
  const hasMigrationsTable = tableCheck.rows[0].exists;
  console.log(`=== [1] _prisma_migrations テーブル ===`);
  console.log(`  存在: ${hasMigrationsTable ? "✅ あり" : "❌ なし"}`);

  if (hasMigrationsTable) {
    const migrations = await client.query(`
      SELECT id, migration_name, finished_at, applied_steps_count, logs
      FROM _prisma_migrations
      ORDER BY started_at ASC
    `);
    console.log(`  件数: ${migrations.rows.length}`);
    if (migrations.rows.length > 0) {
      migrations.rows.forEach(r => {
        const status = r.finished_at ? "✅ applied" : "⏳ pending/failed";
        console.log(`  - ${r.migration_name} (${status}, steps=${r.applied_steps_count})`);
      });
    }
  }

  // 2. 実際のテーブル一覧
  console.log(`\n=== [2] 実DB テーブル一覧 ===`);
  const tables = await client.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);
  tables.rows.forEach(r => console.log(`  - ${r.table_name}`));

  // 3. user_ai_settings 全カラム
  console.log(`\n=== [3] user_ai_settings カラム（実DB）===`);
  const aiCols = await client.query(`
    SELECT column_name, data_type, column_default, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'user_ai_settings'
    ORDER BY ordinal_position
  `);
  aiCols.rows.forEach(r => console.log(`  ${r.column_name}: ${r.data_type} (nullable=${r.is_nullable})`));

  // 4. user_api_keys 全カラム
  console.log(`\n=== [4] user_api_keys カラム（実DB）===`);
  const apiKeyCols = await client.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'user_api_keys'
    ORDER BY ordinal_position
  `);
  apiKeyCols.rows.forEach(r => console.log(`  ${r.column_name}: ${r.data_type} (nullable=${r.is_nullable})`));

  await client.end();
}

main().catch(e => { console.error("❌", e.message); process.exit(1); });
