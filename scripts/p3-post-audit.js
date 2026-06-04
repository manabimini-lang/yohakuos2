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

  console.log("=== [5] 移行後監査 ===\n");

  // user_api_keys
  const apiKeys = await client.query(`SELECT api_provider, COUNT(*) FROM user_api_keys GROUP BY api_provider`);
  const totalApiKeys = await client.query(`SELECT COUNT(*) FROM user_api_keys`);
  console.log(`userApiKey 件数: ${totalApiKeys.rows[0].count}`);
  apiKeys.rows.forEach(r => console.log(`  - ${r.api_provider}: ${r.count}件`));

  // user_ai_settings
  const totalSettings = await client.query(`SELECT COUNT(*) FROM user_ai_settings`);
  const enabledSettings = await client.query(`SELECT COUNT(*) FROM user_ai_settings WHERE is_enabled = true`);
  const oauthSettings = await client.query(`SELECT COUNT(*) FROM user_ai_settings WHERE provider = 'gemini_oauth'`);
  const withKey = await client.query(`SELECT COUNT(*) FROM user_ai_settings WHERE encrypted_api_key IS NOT NULL`);
  console.log(`\nuser_ai_settings 件数: ${totalSettings.rows[0].count}`);
  console.log(`  - is_enabled=true: ${enabledSettings.rows[0].count}件`);
  console.log(`  - provider='gemini_oauth': ${oauthSettings.rows[0].count}件`);
  console.log(`  - encrypted_api_key あり: ${withKey.rows[0].count}件`);

  // Sample
  const sample = await client.query(`SELECT user_id, provider, is_enabled FROM user_ai_settings LIMIT 3`);
  console.log("\n[user_ai_settings サンプル]");
  sample.rows.forEach(r => console.log(`  userId=${r.user_id.slice(0,12)}... provider=${r.provider} enabled=${r.is_enabled}`));

  // Integrity
  const unmigrated = await client.query(`
    SELECT COUNT(*) FROM user_api_keys k
    LEFT JOIN user_ai_settings s ON k.user_id = s.user_id
    WHERE s.user_id IS NULL
  `);
  console.log(`\n[整合性] 未移行ユーザー数: ${unmigrated.rows[0].count}`);
  console.log(`[整合性] 判定: ${parseInt(unmigrated.rows[0].count) === 0 ? "✅ 全ユーザー移行済み" : "❌ 未移行ユーザーあり"}`);

  await client.end();
}

main().catch(e => { console.error("❌", e.message); process.exit(1); });
