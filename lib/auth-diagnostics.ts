// ===================================================
// YOHAKU Auth Diagnostics — Structured Logging Utility
// ===================================================
//
// Provides correlation IDs, email masking, and structured
// diagnostic logging for the entire authentication flow.
//
// NEVER logs: passwords, tokens, cookies, secrets.
// ===================================================

// ---------------------------------------------------------------------------
// Correlation ID
// ---------------------------------------------------------------------------

/**
 * Generates a unique request ID for tracing a single login attempt.
 * Format: AUTH-YYYYMMDD-XXXXXX
 *
 * Works in both browser and Edge/Node runtime.
 */
export function generateAuthRequestId(): string {
  const now = new Date();
  const date = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");

  const hex = Math.random().toString(16).slice(2, 8).toUpperCase();
  return `AUTH-${date}-${hex}`;
}

// ---------------------------------------------------------------------------
// Email Masking
// ---------------------------------------------------------------------------

/**
 * Masks an email for safe logging.
 * Example: "yohaku@example.com" → "yo***@example.com"
 */
export function maskEmail(email: string | undefined | null): string {
  if (!email) return "(none)";
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  const visible = local.slice(0, 2);
  return `${visible}***@${domain}`;
}

// ---------------------------------------------------------------------------
// Structured Log
// ---------------------------------------------------------------------------

export type AuthLogLevel = "info" | "warn" | "error";

export interface AuthLogData {
  stage: string;
  requestId?: string;
  elapsed?: number;
  [key: string]: unknown;
}

/**
 * Emits one structured diagnostic log line.
 *
 * Format:
 *   [auth] stage=authorize requestId=AUTH-... email=yo***@example.com success=true elapsed=124ms
 */
export function authLog(level: AuthLogLevel, data: AuthLogData): void {
  const parts = ["[auth]"];

  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) continue;
    if (key === "elapsed") {
      parts.push(`${key}=${value}ms`);
    } else {
      parts.push(`${key}=${value}`);
    }
  }

  const message = parts.join(" ");

  switch (level) {
    case "info":
      console.info(message);
      break;
    case "warn":
      console.warn(message);
      break;
    case "error":
      console.error(message);
      break;
  }
}

// ---------------------------------------------------------------------------
// Timer
// ---------------------------------------------------------------------------

/**
 * Returns a function that, when called, returns elapsed ms since creation.
 */
export function startTimer(): () => number {
  const start = Date.now();
  return () => Date.now() - start;
}

// ---------------------------------------------------------------------------
// Turnstile Diagnostic Codes
// ---------------------------------------------------------------------------

export const TURNSTILE_CODE = {
  MISSING: "TURNSTILE_MISSING",
  INVALID: "TURNSTILE_INVALID",
  TIMEOUT: "TURNSTILE_TIMEOUT",
  API_ERROR: "TURNSTILE_API_ERROR",
  SKIPPED: "TURNSTILE_SKIPPED",
  PASS: "TURNSTILE_PASS",
} as const;

export type TurnstileCode = (typeof TURNSTILE_CODE)[keyof typeof TURNSTILE_CODE];

/**
 * Maps Cloudflare Turnstile error codes to our diagnostic codes.
 */
export function classifyTurnstileError(
  errorCodes: string[] | undefined,
): TurnstileCode {
  if (!errorCodes || errorCodes.length === 0) return TURNSTILE_CODE.INVALID;

  if (errorCodes.includes("timeout-or-duplicate")) return TURNSTILE_CODE.TIMEOUT;
  if (errorCodes.includes("internal-error")) return TURNSTILE_CODE.API_ERROR;

  return TURNSTILE_CODE.INVALID;
}
