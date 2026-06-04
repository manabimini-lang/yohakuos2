const { Client } = require("pg");

async function main() {
  const client = new Client({
    host: "db.gubxjsbxolcfecyhtjzn.supabase.co",
    port: 6543,
    database: "postgres",
    user: "postgres",
    password: "xZUtN1EAyFmh7RVq",
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    await client.connect();
    console.log("✅ DB接続成功 (port 6543)\n");

    // Check if last_validated_at already exists
    const checkCol = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'user_ai_settings' AND column_name = 'last_validated_at'
    `);

    if (checkCol.rows.length > 0) {
      console.log("✅ last_validated_at は既に存在します。マイグレーション不要。");
    } else {
      console.log("last_validated_at が存在しません。追加します...");
      await client.query(`
        ALTER TABLE user_ai_settings
        ADD COLUMN IF NOT EXISTS last_validated_at TIMESTAMP WITHOUT TIME ZONE
      `);
      console.log("✅ last_validated_at カラムを追加しました。");
    }

    // Create a migration history record to keep prisma in sync
    // Check current migration state
    const migrationRes = await client.query(`
      SELECT migration_name, finished_at FROM _prisma_migrations
      ORDER BY finished_at DESC NULLS LAST
      LIMIT 5
    `).catch(() => ({ rows: [] }));
    
    console.log("\n=== Prisma Migration履歴 (直近5件) ===");
    if (migrationRes.rows.length === 0) {
      console.log("  (履歴なし、または_prisma_migrationsテーブル不存在)");
    } else {
      migrationRes.rows.forEach(r => console.log(`  ${r.migration_name} (${r.finished_at || 'pending'})`));
    }

    // Verify final column list
    const colRes = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'user_ai_settings'
      ORDER BY ordinal_position
    `);
    console.log("\n=== user_ai_settings カラム一覧（最終確認）===");
    colRes.rows.forEach(r => console.log(`  ${r.column_name} (${r.data_type})`));
    const hasLastValidated = colRes.rows.some(r => r.column_name === "last_validated_at");
    console.log(`\n  → last_validated_at: ${hasLastValidated ? "✅ 存在確認" : "❌ 未存在"}`);

  } catch (err) {
    console.error("❌ エラー:", err.message);
    if (err.code) console.error("  code:", err.code);
  } finally {
    await client.end();
  }
}

main();
