import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";

const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_, prop: keyof SupabaseClient) {
    const target = getSupabaseAdmin();
    const value = target[prop];
    return typeof value === "function" ? value.bind(target) : value;
  },
});
import { upsertYuiCalendarEvent } from "./service";

export type GoogleCalendarConnectionState = "connected" | "needs_reauth" | "sync_error" | "syncing";

export type GoogleCalendarStatus = {
  connected: boolean;
  status: GoogleCalendarConnectionState;
  account: string;
  lastSyncAt: string | null;
  message: string;
};

type GoogleConnectionMetadata = Record<string, unknown> & {
  googleAccount?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: string;
  scope?: string;
  lastSyncAt?: string;
};

const GOOGLE_OAUTH_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/gmail.readonly",
];

export function getGoogleAuthUrl(redirectUri: string): string {
  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  const scopes = GOOGLE_OAUTH_SCOPES.join(" ");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: scopes,
    access_type: "offline",
    prompt: "consent",
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

function buildGoogleConnectionStatus(
  input: Partial<GoogleCalendarStatus> & { connected?: boolean; status?: GoogleCalendarConnectionState; message?: string },
): GoogleCalendarStatus {
  return {
    connected: input.connected ?? false,
    status: input.status ?? "needs_reauth",
    account: input.account ?? "",
    lastSyncAt: input.lastSyncAt ?? null,
    message: input.message ?? "Google Calendar status unavailable",
  };
}

export async function getGoogleCalendarStatus(userId: string): Promise<GoogleCalendarStatus> {
  const { data: connection } = await supabaseAdmin
    .from("connections")
    .select("*")
    .eq("user_id", userId)
    .eq("provider", "google_calendar")
    .maybeSingle();

  if (!connection) {
    return buildGoogleConnectionStatus({
      connected: false,
      status: "needs_reauth",
      message: "Google Calendar未接続",
    });
  }

  const metadata = (connection.metadata as Record<string, unknown>) || {};
  const scope = typeof metadata.scope === "string" ? metadata.scope : "";
  const refreshToken = typeof metadata.refreshToken === "string" ? metadata.refreshToken : "";
  const accessToken = typeof metadata.accessToken === "string" ? metadata.accessToken : "";
  const tokenExpiresAt = typeof metadata.tokenExpiresAt === "string" ? new Date(metadata.tokenExpiresAt).getTime() : 0;

  if (connection.status !== "connected") {
    return buildGoogleConnectionStatus({
      connected: false,
      status: "needs_reauth",
      message: "Google Calendar再接続が必要です",
      account: typeof metadata.googleAccount === "string" ? metadata.googleAccount : "",
      lastSyncAt: typeof metadata.lastSyncAt === "string" ? metadata.lastSyncAt : null,
    });
  }

  if (!refreshToken) {
    return buildGoogleConnectionStatus({
      connected: false,
      status: "needs_reauth",
      message: "Googleアカウントを再連携してください",
      account: typeof metadata.googleAccount === "string" ? metadata.googleAccount : "",
      lastSyncAt: typeof metadata.lastSyncAt === "string" ? metadata.lastSyncAt : null,
    });
  }

  if (!scope.includes("calendar.readonly") || !scope.includes("gmail.readonly")) {
    return buildGoogleConnectionStatus({
      connected: false,
      status: "needs_reauth",
      message: "Gmail/Calendar権限が不足しています。再接続してください",
      account: typeof metadata.googleAccount === "string" ? metadata.googleAccount : "",
      lastSyncAt: typeof metadata.lastSyncAt === "string" ? metadata.lastSyncAt : null,
    });
  }

  try {
    await getValidAccessToken(userId);
    return buildGoogleConnectionStatus({
      connected: true,
      status: "connected",
      message: "Google Calendar同期済み",
      account: typeof metadata.googleAccount === "string" ? metadata.googleAccount : "",
      lastSyncAt: typeof metadata.lastSyncAt === "string" ? metadata.lastSyncAt : null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Google Calendar sync failed";
    return buildGoogleConnectionStatus({
      connected: false,
      status: message.includes("refresh") || message.includes("re-auth") || message.includes("access token")
        ? "needs_reauth"
        : "sync_error",
      message,
      account: typeof metadata.googleAccount === "string" ? metadata.googleAccount : "",
      lastSyncAt: typeof metadata.lastSyncAt === "string" ? metadata.lastSyncAt : null,
    });
  }
}

export async function handleGoogleCallback(userId: string, code: string, redirectUri: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenResponse.ok) {
    const errText = await tokenResponse.text();
    throw new Error(`Google token exchange failed: ${errText}`);
  }

  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.access_token as string;
  const refreshToken = tokenData.refresh_token as string | undefined;
  const expiresIn = (tokenData.expires_in as number) || 3600;
  const scope =
    typeof tokenData.scope === "string" && tokenData.scope.trim()
      ? tokenData.scope
      : GOOGLE_OAUTH_SCOPES.join(" ");

  // Fetch User Info to get email
  let googleAccount = "";
  try {
    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (userRes.ok) {
      const userData = await userRes.json();
      googleAccount = userData.email || "";
    }
  } catch (e) {
    console.error("Failed to fetch Google user info", e);
  }

  // Get or create connection
  const { data: existingConnection } = await supabaseAdmin
    .from("connections")
    .select("*")
    .eq("user_id", userId)
    .eq("provider", "google_calendar")
    .maybeSingle();

  const existingMeta = (existingConnection?.metadata as GoogleConnectionMetadata) || {};
  const newMetadata: GoogleConnectionMetadata = {
    ...existingMeta,
    googleAccount: googleAccount || existingMeta.googleAccount || "",
    accessToken,
    refreshToken: refreshToken || existingMeta.refreshToken || "",
    tokenExpiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
    scope: scope || existingMeta.scope || "",
  };

  if (existingConnection) {
    const { error } = await supabaseAdmin
      .from("connections")
      .update({
        status: "connected",
        connected_at: new Date().toISOString(),
        metadata: newMetadata,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingConnection.id);

    if (error) {
      throw new Error(`Failed to update Google connection: ${error.message}`);
    }
  } else {
    const { error } = await supabaseAdmin.from("connections").insert({
      user_id: userId,
      provider: "google_calendar",
      status: "connected",
      permissions: { readonly: true },
      metadata: newMetadata,
      connected_at: new Date().toISOString(),
    });

    if (error) {
      throw new Error(`Failed to create Google connection: ${error.message}`);
    }
  }

  // Automatically trigger sync and complete onboarding
  void syncGoogleCalendarEvents(userId);

  try {
    const { completeYuiOnboarding } = await import("./service");
    await completeYuiOnboarding(userId);
  } catch (e) {
    console.error("Failed to complete onboarding on Google callback", e);
  }
}

export async function getValidAccessToken(userId: string): Promise<{ accessToken: string; connectionId: string }> {
  const { data: connection } = await supabaseAdmin
    .from("connections")
    .select("*")
    .eq("user_id", userId)
    .eq("provider", "google_calendar")
    .maybeSingle();

  if (!connection || connection.status !== "connected") {
    throw new Error("Google Calendar is not connected");
  }

  const metadata = (connection.metadata as Record<string, unknown>) || {};
  let accessToken = typeof metadata.accessToken === "string" ? metadata.accessToken : "";
  const refreshToken = typeof metadata.refreshToken === "string" ? metadata.refreshToken : "";
  const scope = typeof metadata.scope === "string" ? metadata.scope : "";
  const tokenExpiresAt = typeof metadata.tokenExpiresAt === "string" ? new Date(metadata.tokenExpiresAt).getTime() : 0;

  if (!refreshToken) {
    throw new Error("Google Calendar needs re-authentication");
  }

  if (!scope.includes("calendar.readonly") || !scope.includes("gmail.readonly")) {
    throw new Error("Google Calendar/Gmail scope is missing. Please reconnect.");
  }

  if ((!accessToken || Date.now() >= tokenExpiresAt - 60000) && refreshToken) {
    const clientId = process.env.GOOGLE_CLIENT_ID || "";
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";

    const refreshRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!refreshRes.ok) {
      const errText = await refreshRes.text();
      if (errText.includes("invalid_grant") || errText.includes("unauthorized")) {
        throw new Error("Google refresh token is invalid. Please reconnect.");
      }
      throw new Error(`Google token refresh failed: ${errText}`);
    }

    const refreshData = await refreshRes.json();
    accessToken = refreshData.access_token as string;
    const expiresIn = (refreshData.expires_in as number) || 3600;

    const updatedMeta = {
      ...metadata,
      accessToken,
      tokenExpiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
    };

    await supabaseAdmin
      .from("connections")
      .update({ metadata: updatedMeta, updated_at: new Date().toISOString() })
      .eq("id", connection.id);
  }

  if (!accessToken) {
    throw new Error("No valid Google access token available");
  }

  return { accessToken, connectionId: connection.id };
}

export async function syncGoogleCalendarEvents(userId: string): Promise<{ syncedCount: number; lastSyncAt: string }> {
  let accessToken: string;
  let connectionId: string;

  try {
    ({ accessToken, connectionId } = await getValidAccessToken(userId));
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Google Calendar sync failed because the connection is invalid",
    );
  }

  const now = new Date();
  const timeMin = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const timeMax = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
    timeMin,
  )}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const errText = await response.text();
    if (errText.includes("401") || errText.includes("invalid_token")) {
      throw new Error("Google access token expired. Please reconnect.");
    }
    if (errText.includes("403") || errText.includes("access_denied") || errText.includes("insufficient_scope")) {
      throw new Error("Google Calendar/Gmail scope is missing. Please reconnect.");
    }
    throw new Error(`Failed to fetch Google Calendar events: ${errText}`);
  }

  const data = await response.json();
  const items = Array.isArray(data.items) ? data.items : [];

  let syncedCount = 0;

  for (const item of items) {
    if (!item.id || item.status === "cancelled") continue;

    const startAt = item.start?.dateTime || item.start?.date;
    const endAt = item.end?.dateTime || item.end?.date;

    if (!startAt || !endAt) continue;

    await upsertYuiCalendarEvent(userId, {
      connection_id: connectionId,
      provider: "google_calendar",
      external_id: item.id,
      title: item.summary || "無題の予定",
      description: item.description || "",
      start_at: new Date(startAt).toISOString(),
      end_at: new Date(endAt).toISOString(),
      location: item.location || "",
      status: "confirmed",
      source: "external",
      metadata: { googleHtmlLink: item.htmlLink || "" },
    });

    syncedCount++;
  }

  const lastSyncAt = new Date().toISOString();

  const { data: connection } = await supabaseAdmin
    .from("connections")
    .select("*")
    .eq("id", connectionId)
    .single();

  if (connection) {
    const meta = (connection.metadata as Record<string, unknown>) || {};
    await supabaseAdmin
      .from("connections")
      .update({
        metadata: { ...meta, lastSyncAt },
        updated_at: lastSyncAt,
      })
      .eq("id", connectionId);
  }

  return { syncedCount, lastSyncAt };
}
