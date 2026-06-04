const { Client } = require("pg");

async function main() {
  const password = process.env.DB_PASSWORD;
  const client = new Client({
    host: "db.gubxjsbxolcfecyhtjzn.supabase.co",
    port: 6543,
    database: "postgres",
    user: "postgres",
    password,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  console.log("=== P3 最終検証 DB監査 ===\n");

  try {
    await client.connect();
    console.log("✅ DB接続成功\n");

    // 1. user_ai_settings カラム一覧
    const colRes = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'user_ai_settings'
      ORDER BY ordinal_position
    `);
    console.log("=== [1] user_ai_settings カラム一覧 ===");
    colRes.rows.forEach(r => console.log(`  ${r.column_name} (${r.data_type}, nullable=${r.is_nullable})`));
    const hasLastValidated = colRes.rows.some(r => r.column_name === "last_validated_at");
    console.log(`  → last_validated_at: ${hasLastValidated ? "✅ 存在" : "❌ 未存在"}\n`);

    // 2. user_ai_settings 件数
    const statsRes = await client.query(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN is_enabled = true THEN 1 END) as enabled,
        COUNT(CASE WHEN provider = 'gemini_oauth' THEN 1 END) as oauth_count,
        COUNT(CASE WHEN encrypted_api_key IS NOT NULL THEN 1 END) as has_key
      FROM user_ai_settings
    `);
    console.log("=== [2] user_ai_settings 件数 ===");
    const s = statsRes.rows[0];
    console.log(`  total: ${s.total}`);
    console.log(`  enabled=true: ${s.enabled}`);
    console.log(`  provider=gemini_oauth: ${s.oauth_count}`);
    console.log(`  has encrypted_api_key: ${s.has_key}\n`);

    // 3. user_api_keys 件数
    const apiRes = await client.query(`
      SELECT api_provider, COUNT(*) as count
      FROM user_api_keys
      GROUP BY api_provider
      ORDER BY api_provider
    `);
    console.log("=== [3] user_api_keys 件数 (deprecated) ===");
    if (apiRes.rows.length === 0) {
      console.log("  (0件)");
    } else {
      apiRes.rows.forEach(r => console.log(`  ${r.api_provider}: ${r.count}件`));
    }
    const totalApiKeys = apiRes.rows.reduce((sum, r) => sum + parseInt(r.count), 0);
    console.log(`  合計: ${totalApiKeys}件\n`);

    // 4. 移行整合性チェック
    console.log("=== [4] 移行整合性チェック ===");
    const migrationCheck = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM user_api_keys) as legacy_count,
        (SELECT COUNT(*) FROM user_ai_settings WHERE encrypted_api_key IS NOT NULL) as migrated_count,
        (SELECT COUNT(*) FROM user_api_keys k
          LEFT JOIN user_ai_settings s ON k.user_id = s.user_id
          WHERE s.user_id IS NULL) as unmigrated_count
    `);
    const mc = migrationCheck.rows[0];
    console.log(`  legacy (user_api_keys) 件数: ${mc.legacy_count}`);
    console.log(`  migrated (user_ai_settings with key) 件数: ${mc.migrated_count}`);
    console.log(`  未移行ユーザー数: ${mc.unmigrated_count}`);

  } catch (err) {
    console.error("❌ DB接続エラー:", err.message);
    if (err.code) console.error("  code:", err.code);
  } finally {
    await client.end();
  }
}

main();
