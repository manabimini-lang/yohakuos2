// ===================================================
// YOHAKU Auth Core — Configuration
// ===================================================

export const authConfig = {
  /** Redirect destination after successful login */
  redirectAfterLogin: "/",
  /** Redirect destination after logout */
  redirectAfterLogout: "/login",
  /** Redirect destination after sign-up */
  redirectAfterSignUp: "/onboarding",
  /** Session refresh interval in milliseconds (5 minutes) */
  sessionRefreshInterval: 5 * 60 * 1000,
  /** Cookie options for auth cookies */
  cookieOptions: {
    name: "yohaku-auth-token",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  },
  /** Protected routes that require authentication */
  protectedRoutes: [
    "/admin",
    "/member",
    "/settings",
    "/profile",
  ] as const,
  /** Public routes that don't require authentication */
  publicRoutes: [
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/pricing",
    "/about",
    "/",
    "/terms",
    "/privacy",
  ] as const,
} as const;

export type AuthConfigType = typeof authConfig;