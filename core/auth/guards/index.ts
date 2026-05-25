// ===================================================
// YOHAKU Auth Core — Route & Component Guards
// ===================================================
//
// Client-side route guards and component-level auth checks.
// For server-side guards, use core/auth/server.
// ===================================================

import type { AuthSession } from "../types";

/**
 * Checks if a route is protected (requires authentication).
 */
export function isProtectedRoute(pathname: string): boolean {
  const protectedPrefixes = ["/admin", "/member", "/settings", "/profile"];
  return protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/"),
  );
}

/**
 * Checks if a route is public (no authentication required).
 */
export function isPublicRoute(pathname: string): boolean {
  const publicRoutes = ["/login", "/signup", "/", "/pricing", "/about", "/terms", "/privacy"];
  return publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );
}

/**
 * Type-safe check if user has a valid session.
 */
export function isAuthenticated(session: AuthSession | null): session is AuthSession {
  return session !== null && session.id !== "";
}

/**
 * Returns the redirect path for unauthenticated users.
 */
export function getLoginRedirect(currentPath: string): string {
  if (currentPath === "/") return "/login";
  return `/login?redirect=${encodeURIComponent(currentPath)}`;
}