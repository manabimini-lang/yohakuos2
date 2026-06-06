const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://gubxjsbxolcfecyhtjzn.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd1Ynhqc2J4b2xjZmVjeWh0anpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTc2NDIzMywiZXhwIjoyMDk1MzQwMjMzfQ.p8fS_QdiaQRTiTDjqwA4nI7LNfP3B1ey55PrdYaQR3E",
  { auth: { persistSession: false } }
);

async function main() {
  console.log("=== P3 最終検証 DB監査 ===\n");

  // Query 1: user_ai_settings columns
  const { data: cols, error: colsErr } = await supabase.rpc("query_columns");
  console.log("column query via rpc:", colsErr?.message || JSON.stringify(cols));

  // Query 2: user_ai_settings count
  const { data: aiSettings, error: e2, count: aiCount } = await supabase
    .from("user_ai_settings")
    .select("user_id, provider, is_enabled, encrypted_api_key", { count: "exact" });
  
  if (e2) {
    console.log("[user_ai_settings] ERROR:", e2.message, e2.code);
  } else {
    console.log("[user_ai_settings] TOTAL:", aiCount);
    const enabled = (aiSettings || []).filter(r => r.is_enabled).length;
    const oauth = (aiSettings || []).filter(r => r.provider === "gemini_oauth").length;
    const hasKey = (aiSettings || []).filter(r => r.encrypted_api_key).length;
    console.log("[user_ai_settings] enabled:", enabled);
    console.log("[user_ai_settings] provider=gemini_oauth:", oauth);
    console.log("[user_ai_settings] has encrypted_api_key:", hasKey);
    if ((aiSettings || []).length > 0) {
      const sample = aiSettings[0];
      console.log("[user_ai_settings] columns:", Object.keys(sample).join(", "));
      console.log("[user_ai_settings] has last_validated_at:", "last_validated_at" in sample ? "YES" : "NO");
    }
  }

  // Query 3: user_api_keys count
  const { data: apiKeys, error: e3, count: apiCount } = await supabase
    .from("user_api_keys")
    .select("api_provider", { count: "exact" });

  if (e3) {
    console.log("[user_api_keys] ERROR:", e3.message, e3.code);
  } else {
    console.log("[user_api_keys] TOTAL:", apiCount);
    const providers = {};
    for (const r of apiKeys || []) {
      providers[r.api_provider] = (providers[r.api_provider] || 0) + 1;
    }
    console.log("[user_api_keys] by provider:", JSON.stringify(providers));
  }
}

main().catch(console.error);
