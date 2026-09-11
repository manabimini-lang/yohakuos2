export type HealthStatus = "connected" | "disconnected" | "error" | "loading" | "needs_reauth" | "syncing" | "maintenance" | "unknown";
export type SystemHealth = {
  googleCalendar: { status: HealthStatus; detail: string };
  aiIntegration: { status: HealthStatus; detail: string; mode: string };
  notifications: { status: HealthStatus; detail: string };
};

// Read each endpoint independently: one invalid response must not hide the others.
export async function loadYuiHealth(request: typeof fetch = fetch): Promise<SystemHealth> {
  async function read(url: string) {
    try {
      const response = await request(url, { cache: "no-store" });
      return response.ok ? await response.json() : null;
    } catch {
      return null;
    }
  }
  const [connection, ai, notifications] = await Promise.all([
    read("/api/yui/health"), read("/api/ai/status"), read("/api/yui/notification-settings"),
  ]);
  const result: SystemHealth = {
    googleCalendar: { status: "unknown", detail: "接続状態を確認できません。状態を更新して再確認してください。" },
    aiIntegration: { status: "unknown", detail: "AI設定を確認できません。状態を更新して再確認してください。", mode: "未確認" },
    notifications: { status: "unknown", detail: "通知設定を確認できません。状態を更新して再確認してください。" },
  };
  const google = connection?.google;
  const googleLabels: Record<string, string> = {
    connected: "接続済み", disconnected: "未接続", syncing: "Googleを同期しています…",
    needs_reauth: "Googleを再連携してください", maintenance: "一時的に利用できません", error: "Googleの同期エラー",
  };
  if (google && Object.hasOwn(googleLabels, google.status)) {
    result.googleCalendar = { status: google.status, detail: google.lastError || googleLabels[google.status] };
  }
  if (typeof ai?.configured === "boolean") {
    result.aiIntegration = ai.configured
      ? {
          status: "connected",
          mode: ai.source === "managed" ? "Premiumの管理接続" : "登録済みのAPIキー",
          detail: ai.source === "managed" ? "API利用料込みのPremium接続です。" : "設定済みです。実際に応答できるかは、AI設定の接続テストで確認できます。",
        }
      : { status: "disconnected", mode: "基本機能のみ", detail: "AI相談は未設定または無効です。メモ・タスク・振り返りは使えます。" };
  }
  if (typeof notifications?.enabled === "boolean") {
    result.notifications = {
      status: notifications.enabled ? "connected" : "disconnected",
      detail: notifications.enabled ? "朝晩のまとめの自動更新はオンです。" : "朝晩のまとめの自動更新はオフです。",
    };
  }
  return result;
}
