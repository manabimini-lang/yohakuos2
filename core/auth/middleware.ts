// ===================================================
// YOHAKU Auth Core — Middleware Auth Validator
// ===================================================
//
// This is used by the Next.js middleware (middleware.ts).
// It validates the session on every request and refreshes it if needed.
//
// For Edge runtime compatibility, we use a minimal Supabase client.
// ===================================================

import { createClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";

/**
 * Validates the auth session from a request.
 * Returns the user ID if authenticated, null otherwise.
 *
 * Designed for use in Edge Middleware.
 */
export async function validateSession(
  request: NextRequest,
): Promise<{ userId: string; email: string } | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        // Forward cookies from the request
        cookie: request.headers.get("cookie") ?? "",
      },
    },
  });

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session?.user) {
    return null;
  }

  return {
    userId: session.user.id,
    email: session.user.email ?? "",
  };
}

/**
 * Checks if the current request path should be protected.
 */
export function isProtectedPath(pathname: string): boolean {
  const protectedPaths = ["/admin", "/member", "/settings", "/profile"];
  return protectedPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

/**
 * Checks if the current request path is a public auth path.
 */
export function isAuthPath(pathname: string): boolean {
  return pathname.startsWith("/login") || pathname.startsWith("/signup") || pathname.startsWith("/auth/");
}