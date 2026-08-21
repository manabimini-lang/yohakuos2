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
import { refreshMorningBriefCache } from "./brief_service";
import {
  readGoogleTokens,
  withEncryptedGoogleTokens,
  type GoogleTokenMetadata,
} from "./google_token_vault";

export type GoogleCalendarConnectionState = "connected" | "disconnected" | "needs_reauth" | "sync_error" | "syncing";

export type GoogleCalendarStatus = {
  connected: boolean;
  status: GoogleCalendarConnectionState;
  account: string;
  lastSyncAt: string | null;
  message: string;
};

type GoogleConnectionMetadata = GoogleTokenMetadata & {
  googleAccount?: string;
  tokenExpiresAt?: string;
  scope?: string;
  lastSyncAt?: string;
};

export type GoogleOAuthTraceEvent = {
  stage:
    | "token_exchange"
    | "user_info"
    | "connection_read"
    | "token_encryption"
    | "connection_persistence"
    | "calendar_initial_sync";
  outcome: "start" | "success" | "failure";
  elapsedMs: number;
  httpStatus?: number;
  googleErrorCode?: string;
};

export class GoogleOAuthRuntimeError extends Error {
  constructor(
    public readonly stage: GoogleOAuthTraceEvent["stage"],
    public readonly safeCode: string,
    public readonly httpStatus?: number,
  ) {
    super(`Google OAuth failed during ${stage}`);
    this.name = "GoogleOAuthRuntimeError";
  }
}

type GoogleOAuthTrace = (event: GoogleOAuthTraceEvent) => void;

const GOOGLE_OAUTH_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/gmail.readonly",
];

export function getGoogleAuthUrl(redirectUri: string, state: string): string {
  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  const scopes = GOOGLE_OAUTH_SCOPES.join(" ");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: scopes,
    access_type: "offline",
    prompt: "consent",
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

function buildGoogleConnectionStatus(
  input: Partial<GoogleCalendarStatus> & { connected?: boolean; status?: GoogleCalendarConnectionState; message?: string },
): GoogleCalendarStatus {
  return {
    connected: input.connected ?? false,
    status: input.status ?? "disconnected",
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
      status: "disconnected",
      message: "Google Calendar未接続",
    });
  }

  const metadata = (connection.metadata as Record<string, unknown>) || {};
  const scope = typeof metadata.scope === "string" ? metadata.scope : "";
  if (connection.status !== "connected") {
    return buildGoogleConnectionStatus({
      connected: false,
      status: "needs_reauth",
      message: "Google Calendar再接続が必要です",
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

export async function handleGoogleCallback(
  userId: string,
  code: string,
  redirectUri: string,
  trace?: GoogleOAuthTrace,
) {
  const startedAt = Date.now();
  const emit = (
    stage: GoogleOAuthTraceEvent["stage"],
    outcome: GoogleOAuthTraceEvent["outcome"],
    details: Pick<GoogleOAuthTraceEvent, "httpStatus" | "googleErrorCode"> = {},
  ) => trace?.({ stage, outcome, elapsedMs: Date.now() - startedAt, ...details });
  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";

  emit("token_exchange", "start");
  let tokenResponse: Response;
  try {
    tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
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
  } catch {
    emit("token_exchange", "failure", { googleErrorCode: "network_error" });
    throw new GoogleOAuthRuntimeError("token_exchange", "network_error");
  }

  if (!tokenResponse.ok) {
    const errorPayload = await tokenResponse.json().catch(() => null) as { error?: unknown } | null;
    const googleErrorCode = typeof errorPayload?.error === "string" ? errorPayload.error : "unknown_error";
    emit("token_exchange", "failure", {
      httpStatus: tokenResponse.status,
      googleErrorCode,
    });
    throw new GoogleOAuthRuntimeError("token_exchange", googleErrorCode, tokenResponse.status);
  }

  const tokenData = await tokenResponse.json();
  const accessToken = typeof tokenData.access_token === "string" ? tokenData.access_token : "";
  const refreshToken = tokenData.refresh_token as string | undefined;
  if (!accessToken) {
    emit("token_exchange", "failure", {
      httpStatus: tokenResponse.status,
      googleErrorCode: "missing_access_token",
    });
    throw new GoogleOAuthRuntimeError("token_exchange", "missing_access_token", tokenResponse.status);
  }
  emit("token_exchange", "success", { httpStatus: tokenResponse.status });
  const expiresIn = (tokenData.expires_in as number) || 3600;
  const scope =
    typeof tokenData.scope === "string" && tokenData.scope.trim()
      ? tokenData.scope
      : GOOGLE_OAUTH_SCOPES.join(" ");

  // Fetch User Info to get email
  let googleAccount = "";
  emit("user_info", "start");
  try {
    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (userRes.ok) {
      const userData = await userRes.json();
      googleAccount = userData.email || "";
    }
    emit("user_info", userRes.ok ? "success" : "failure", { httpStatus: userRes.status });
  } catch (e) {
    emit("user_info", "failure", { googleErrorCode: "network_error" });
    console.error("Failed to fetch Google user info", {
      name: e instanceof Error ? e.name : "UnknownError",
    });
  }

  // Get or create connection
  emit("connection_read", "start");
  const { data: existingConnection } = await supabaseAdmin
    .from("connections")
    .select("*")
    .eq("user_id", userId)
    .eq("provider", "google_calendar")
    .maybeSingle();
  emit("connection_read", "success");

  const existingMeta = (existingConnection?.metadata as GoogleConnectionMetadata) || {};
  const existingTokens = readGoogleTokens(existingMeta);
  emit("token_encryption", "start");
  let newMetadata: GoogleConnectionMetadata;
  try {
    newMetadata = withEncryptedGoogleTokens({
      ...existingMeta,
      googleAccount: googleAccount || existingMeta.googleAccount || "",
      tokenExpiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
      scope: scope || existingMeta.scope || "",
    }, {
      accessToken,
      refreshToken: refreshToken || existingTokens.refreshToken,
    });
    emit("token_encryption", "success");
  } catch {
    emit("token_encryption", "failure", { googleErrorCode: "encryption_failed" });
    throw new GoogleOAuthRuntimeError("token_encryption", "encryption_failed");
  }

  emit("connection_persistence", "start");
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
      emit("connection_persistence", "failure", { googleErrorCode: "update_failed" });
      throw new GoogleOAuthRuntimeError("connection_persistence", "update_failed");
    }
  } else {
    const { error } = await supabaseAdmin.from("connections").insert({
      user_id: userId,
      provider: "google_calendar",
      status: "connected",
      permissions: { readonly: true },
      metadata: newMetadata,
      connected_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error) {
      emit("connection_persistence", "failure", { googleErrorCode: "insert_failed" });
      throw new GoogleOAuthRuntimeError("connection_persistence", "insert_failed");
    }
  }
  emit("connection_persistence", "success");

  // Await the initial sync so serverless execution cannot discard it after redirect.
  emit("calendar_initial_sync", "start");
  try {
    await syncGoogleCalendarEvents(userId);
    emit("calendar_initial_sync", "success");
  } catch {
    emit("calendar_initial_sync", "failure", { googleErrorCode: "sync_failed" });
    throw new GoogleOAuthRuntimeError("calendar_initial_sync", "sync_failed");
  }

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

  const metadata = (connection.metadata as GoogleConnectionMetadata) || {};
  const storedTokens = readGoogleTokens(metadata);
  let accessToken = storedTokens.accessToken;
  const refreshToken = storedTokens.refreshToken;
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
      if (refreshRes.status === 400 || refreshRes.status === 401) {
        throw new Error("Google refresh token is invalid. Please reconnect.");
      }
      throw new Error(`Google token refresh failed with status ${refreshRes.status}`);
    }

    const refreshData = await refreshRes.json();
    accessToken = refreshData.access_token as string;
    const expiresIn = (refreshData.expires_in as number) || 3600;

    const updatedMeta = withEncryptedGoogleTokens({
      ...metadata,
      tokenExpiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
    }, { accessToken, refreshToken });

    const { error } = await supabaseAdmin
      .from("connections")
      .update({ metadata: updatedMeta, updated_at: new Date().toISOString() })
      .eq("id", connection.id);
    if (error) throw new Error("Failed to persist refreshed Google credentials");
  } else if (storedTokens.needsMigration) {
    const migratedMetadata = withEncryptedGoogleTokens(metadata, { accessToken, refreshToken });
    const { error } = await supabaseAdmin
      .from("connections")
      .update({ metadata: migratedMetadata, updated_at: new Date().toISOString() })
      .eq("id", connection.id);
    if (error) throw new Error("Failed to secure stored Google credentials");
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
    if (response.status === 401) {
      throw new Error("Google access token expired. Please reconnect.");
    }
    if (response.status === 403) {
      throw new Error("Google Calendar/Gmail scope is missing. Please reconnect.");
    }
    throw new Error(`Failed to fetch Google Calendar events with status ${response.status}`);
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

  try {
    await refreshMorningBriefCache(userId);
  } catch (error) {
    console.error("Failed to refresh cached morning brief after calendar sync", error);
  }

  return { syncedCount, lastSyncAt };
}
