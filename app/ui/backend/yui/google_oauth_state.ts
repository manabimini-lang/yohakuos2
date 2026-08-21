import { randomBytes, timingSafeEqual } from "node:crypto";

export const GOOGLE_OAUTH_STATE_COOKIE = "yohaku_google_oauth_state";
export const GOOGLE_OAUTH_STATE_MAX_AGE_SECONDS = 10 * 60;

export function createGoogleOAuthState(): string {
  return randomBytes(32).toString("base64url");
}

export function verifyGoogleOAuthState(expected: string | undefined, received: string | null): boolean {
  if (!expected || !received) return false;

  const expectedBuffer = Buffer.from(expected, "utf8");
  const receivedBuffer = Buffer.from(received, "utf8");
  if (expectedBuffer.length !== receivedBuffer.length) return false;

  return timingSafeEqual(expectedBuffer, receivedBuffer);
}

export function googleOAuthStateCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: GOOGLE_OAUTH_STATE_MAX_AGE_SECONDS,
    path: "/api/yui/google/callback",
  };
}
