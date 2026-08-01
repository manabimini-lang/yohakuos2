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
    return {
      google: buildHealthResponse({
        status: "needs_reauth",
        calendarConnected: false,
        gmailConnected: false,
        scopes,
        tokenValid: false,
        lastSyncAt,
        lastError: "Google refresh token is missing. Please reconnect.",
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
      // Map HTTP status codes and response to health statuses
      const statusCode = refreshResponse.status;
      const errText = await refreshResponse.text();

      // 401 -> needs_reauth
      if (statusCode === 401 || errText.includes("invalid_grant") || errText.includes("unauthorized")) {
        lastError = "Google refresh token is invalid. Please reconnect.";
        status = "needs_reauth";
      } else if (statusCode >= 500) {
        // Server errors or network issues -> maintenance
        lastError = `Google token refresh service unavailable: ${errText}`;
        status = "maintenance";
      } else {
        lastError = `Google token refresh failed: ${errText}`;
        status = "error";
      }
    } else {
      const refreshData = await refreshResponse.json();
      const refreshedAccessToken = typeof refreshData.access_token === "string" ? refreshData.access_token : "";
      const expiresIn = (refreshData.expires_in as number) || 3600;
        if (!refreshedAccessToken) {
          status = "needs_reauth";
          lastError = "No valid Google access token available";
        } else {
          const updatedMetadata = {
            ...(metadata as Record<string, unknown>),
            accessToken: refreshedAccessToken,
            tokenExpiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
            lastError: null,
          } as GoogleConnectionMetadata;

          // attempt to persist refreshed token; if supabase is unavailable, treat as maintenance
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
            lastError = `Supabase update failed: ${e instanceof Error ? e.message : String(e)}`;
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
      lastError = lastError ?? "No valid Google access token available";
    }
  } catch (e) {
    // network or unexpected error -> maintenance
    status = "maintenance";
    lastError = e instanceof Error ? e.message : String(e);
  }

  const calendarConnected = scopes.includes("https://www.googleapis.com/auth/calendar.readonly");
  const gmailConnected = scopes.includes("https://www.googleapis.com/auth/gmail.readonly");

  if (status === "connected" && (!calendarConnected || !gmailConnected)) {
    status = "needs_reauth";
    lastError = lastError ?? "Google Calendar/Gmail scope is missing. Please reconnect.";
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
