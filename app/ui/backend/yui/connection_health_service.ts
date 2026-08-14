import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";

const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_, prop: keyof SupabaseClient) {
    const target = getSupabaseAdmin();
    const value = target[prop];
    return typeof value === "function" ? value.bind(target) : value;
  },
});

type GoogleConnectionMetadata = Record<string, unknown> & {
  googleAccount?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: string;
  scope?: string;
  lastSyncAt?: string;
  lastError?: string | null;
};

export type ConnectionHealthStatus =
  | "connected"
  | "syncing"
  | "maintenance"
  | "needs_reauth"
  | "error";

export type ConnectionHealth = {
  google: {
    status: ConnectionHealthStatus;
    calendarConnected: boolean;
    gmailConnected: boolean;
    scopes: string[];
    tokenValid: boolean;
    lastSyncAt: Date | null;
    lastError: string | null;
  };
};

function normalizeScopes(scopeText: string | undefined): string[] {
  return (scopeText ?? "")
    .split(" ")
    .map((scope) => scope.trim())
    .filter(Boolean);
}

function buildHealthResponse(input: Partial<ConnectionHealth["google"]>): ConnectionHealth["google"] {
  return {
    // default to needs_reauth when we don't have a confirmed connection
    status: input.status ?? "needs_reauth",
    calendarConnected: input.calendarConnected ?? false,
    gmailConnected: input.gmailConnected ?? false,
    scopes: input.scopes ?? [],
    tokenValid: input.tokenValid ?? false,
    lastSyncAt: input.lastSyncAt ?? null,
    lastError: input.lastError ?? null,
  };
}

export async function getConnectionHealth(userId: string): Promise<ConnectionHealth> {
  const { data: connection } = await supabaseAdmin
    .from("connections")
    .select("*")
    .eq("user_id", userId)
    .eq("provider", "google_calendar")
    .maybeSingle();

  if (!connection) {
    return {
      google: buildHealthResponse({
        status: "needs_reauth",
        calendarConnected: false,
        gmailConnected: false,
        tokenValid: false,
      }),
    };
  }

  const metadata = (connection.metadata as GoogleConnectionMetadata) || {};
  const scopes = normalizeScopes(typeof metadata.scope === "string" ? metadata.scope : "");
  const refreshToken = typeof metadata.refreshToken === "string" ? metadata.refreshToken : "";
  const accessToken = typeof metadata.accessToken === "string" ? metadata.accessToken : "";
  const lastSyncAt = typeof metadata.lastSyncAt === "string" && metadata.lastSyncAt ? new Date(metadata.lastSyncAt) : null;
  const tokenExpiresAt =
    typeof metadata.tokenExpiresAt === "string" && metadata.tokenExpiresAt
      ? new Date(metadata.tokenExpiresAt).getTime()
      : 0;

  if (connection.status !== "connected") {
    return {
      google: buildHealthResponse({
        status: "needs_reauth",
        calendarConnected: false,
        gmailConnected: false,
        scopes,
        tokenValid: false,
        lastSyncAt,
        lastError: "Google Calendar再接続が必要です",
      }),
    };
  }

  if (!refreshToken) {
    console.warn("[Connection Health Diagnostics] Google refresh token is missing for user", userId);
    return {
      google: buildHealthResponse({
        status: "needs_reauth",
        calendarConnected: false,
        gmailConnected: false,
        scopes,
        tokenValid: false,
        lastSyncAt,
        lastError: "Googleとの接続が切れている可能性があります。再接続してください。",
      }),
    };
  }

  // default to syncing when we are about to refresh
  let status: ConnectionHealthStatus = "syncing";
  let tokenValid = false;
  let lastError: string | null = null;

  try {
    if (!accessToken || Date.now() >= tokenExpiresAt - 60_000) {
      const clientId = process.env.GOOGLE_CLIENT_ID || "";
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";

      const refreshResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: "refresh_token",
        }),
      });

      if (!refreshResponse.ok) {
        const statusCode = refreshResponse.status;
        const errText = await refreshResponse.text();
        console.error("[Connection Health Diagnostics] Token refresh failed:", { statusCode, errText });

        if (statusCode === 401 || errText.includes("invalid_grant") || errText.includes("unauthorized")) {
          lastError = "Googleとの接続を更新できませんでした。もう一度接続してください。";
          status = "needs_reauth";
        } else if (statusCode >= 500) {
          lastError = "Googleサービスが一時的に利用できません。しばらく時間をおいてお試しください。";
          status = "maintenance";
        } else {
          lastError = "Googleサービスとの同期に失敗しました。再接続をお試しください。";
          status = "error";
        }
      } else {
        const refreshData = await refreshResponse.json();
        const refreshedAccessToken = typeof refreshData.access_token === "string" ? refreshData.access_token : "";
        const expiresIn = (refreshData.expires_in as number) || 3600;
        if (!refreshedAccessToken) {
          status = "needs_reauth";
          lastError = "Googleとの接続を更新できませんでした。もう一度接続してください。";
        } else {
          const updatedMetadata = {
            ...(metadata as Record<string, unknown>),
            accessToken: refreshedAccessToken,
            tokenExpiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
            lastError: null,
          } as GoogleConnectionMetadata;

          try {
            await supabaseAdmin
              .from("connections")
              .update({
                metadata: updatedMetadata,
                updated_at: new Date().toISOString(),
              })
              .eq("id", connection.id);

            status = "connected";
            tokenValid = true;
          } catch (e) {
            console.error("[Connection Health Diagnostics] Supabase update failed:", e);
            lastError = "データの更新に失敗しました。しばらくしてからもう一度お試しください。";
            status = "maintenance";
          }
        }
      }
    } else {
      status = "connected";
      tokenValid = true;
    }

    if (status === "connected" && !tokenValid && !accessToken) {
      status = "needs_reauth";
      lastError = lastError ?? "Googleとの接続を更新できませんでした。もう一度接続してください。";
    }
  } catch (e) {
    console.error("[Connection Health Diagnostics] Exception during health check:", e);
    status = "maintenance";
    lastError = "サービスの接続状態を確認できませんでした。";
  }

  const calendarConnected = scopes.includes("https://www.googleapis.com/auth/calendar.readonly");
  const gmailConnected = scopes.includes("https://www.googleapis.com/auth/gmail.readonly");

  if (status === "connected" && (!calendarConnected || !gmailConnected)) {
    status = "needs_reauth";
    lastError = lastError ?? "Google Calendar/Gmailの連携権限が不足しています。再接続してください。";
  }

  return {
    google: buildHealthResponse({
      status,
      calendarConnected: status === "connected" ? calendarConnected : false,
      gmailConnected: status === "connected" ? gmailConnected : false,
      scopes,
      tokenValid: status === "connected",
      lastSyncAt,
      lastError,
    }),
  };
}
