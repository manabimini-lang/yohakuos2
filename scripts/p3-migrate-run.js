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
  const isDryRun = process.argv.includes("--dry-run");
  console.log(`\nStarting API Key Migration... ${isDryRun ? "[DRY-RUN]" : "[PRODUCTION]"}\n`);

  const client = new Client(DB_CONFIG);
  await client.connect();
  console.log("✅ DB接続成功\n");

  try {
    // ── Count Audit (Before) ────────────────────────────────
    const beforeApiKeys = await client.query(`SELECT COUNT(*) FROM user_api_keys`);
    const beforeSettings = await client.query(`SELECT COUNT(*) FROM user_ai_settings`);
    console.log(`[AUDIT BEFORE] user_api_keys    : ${beforeApiKeys.rows[0].count}`);
    console.log(`[AUDIT BEFORE] user_ai_settings : ${beforeSettings.rows[0].count}`);
    console.log();

    // ── Fetch all api keys ────────────────────────────────
    const apiKeysRes = await client.query(`
      SELECT user_id, api_provider, encrypted_key, created_at
      FROM user_api_keys
      ORDER BY created_at ASC
    `);
    const apiKeys = apiKeysRes.rows;
    console.log(`[INFO] 移行対象 user_api_keys: ${apiKeys.length}件\n`);

    // Group by user
    const keysByUser = {};
    for (const k of apiKeys) {
      if (!keysByUser[k.user_id]) keysByUser[k.user_id] = [];
      keysByUser[k.user_id].push(k);
    }

    let migrated = 0, skipped = 0, failed = 0;

    for (const userId of Object.keys(keysByUser)) {
      try {
        const userKeys = keysByUser[userId];
        // Priority: gemini_oauth > gemini
        const oauthKey = userKeys.find(k => k.api_provider === "gemini_oauth");
        const legacyKey = userKeys.find(k => k.api_provider === "gemini");
        const targetKey = oauthKey || legacyKey;

        if (!targetKey) { skipped++; continue; }

        // Check existing
        const existRes = await client.query(
          `SELECT encrypted_api_key FROM user_ai_settings WHERE user_id = $1`,
          [userId]
        );
        if (existRes.rows.length > 0 && existRes.rows[0].encrypted_api_key) {
          console.log(`[SKIP] User ${userId} - user_ai_settings に既に key あり`);
          skipped++;
          continue;
        }

        if (!isDryRun) {
          if (existRes.rows.length > 0) {
            // UPDATE
            await client.query(
              `UPDATE user_ai_settings
               SET encrypted_api_key = $1, provider = $2, is_enabled = true, updated_at = NOW()
               WHERE user_id = $3`,
              [targetKey.encrypted_key, targetKey.api_provider, userId]
            );
          } else {
            // INSERT
            await client.query(
              `INSERT INTO user_ai_settings
                 (id, user_id, encrypted_api_key, provider, is_enabled, created_at, updated_at,
                  daily_token_usage, monthly_token_usage,
                  starter_journey_companion_message_count, starter_journey_companion_message_limit)
               VALUES (gen_random_uuid()::text, $1, $2, $3, true, NOW(), NOW(), 0, 0, 0, 10)`,
              [userId, targetKey.encrypted_key, targetKey.api_provider]
            );
          }
        }

        console.log(`[${isDryRun ? "DRY-RUN" : "MIGRATED"}] User ${userId} from provider=${targetKey.api_provider}`);
        migrated++;
      } catch (err) {
        console.error(`[FAILED] User ${userId}: ${err.message}`);
        failed++;
      }
    }

    // ── Count Audit (After) ────────────────────────────────
    const afterSettings = await client.query(`SELECT COUNT(*) FROM user_ai_settings`);
    const afterWithKey = await client.query(
      `SELECT COUNT(*) FROM user_ai_settings WHERE encrypted_api_key IS NOT NULL`
    );
    const afterOAuth = await client.query(
      `SELECT COUNT(*) FROM user_ai_settings WHERE provider = 'gemini_oauth'`
    );

    console.log(`\n=== Migration Report ===`);
    console.log(`  migrated : ${migrated}`);
    console.log(`  skipped  : ${skipped}`);
    console.log(`  failed   : ${failed}`);
    console.log(`\n=== Count Audit (After) ===`);
    console.log(`  user_ai_settings (total)       : ${afterSettings.rows[0].count}`);
    console.log(`  user_ai_settings (with key)    : ${afterWithKey.rows[0].count}`);
    console.log(`  user_ai_settings (gemini_oauth): ${afterOAuth.rows[0].count}`);
    console.log(`  user_api_keys    (legacy)      : ${beforeApiKeys.rows[0].count} (unchanged)`);

    const expectedDiff = migrated;
    const actualDiff = parseInt(afterSettings.rows[0].count) - parseInt(beforeSettings.rows[0].count);
    console.log(`\n=== 整合性チェック ===`);
    console.log(`  期待増加数: +${expectedDiff}`);
    console.log(`  実際増加数: +${actualDiff}`);
    console.log(`  整合性: ${isDryRun ? "N/A (dry-run)" : (expectedDiff === actualDiff ? "✅ OK" : `❌ 不一致 (expected ${expectedDiff}, actual ${actualDiff})`)}`);

  } finally {
    await client.end();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
