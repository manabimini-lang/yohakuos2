// ===================================================
// YOHAKU Auth Core — Server-Side Auth
// ===================================================
//
// Server Components, API routes, Server Actions use these functions.
// They are the single entry point for server-side auth operations.
// ===================================================

import { redirect } from "next/navigation";
import { getSupabaseClient, getSupabaseAdmin } from "@/infra/supabase";
import type { AuthSession, AuthResult } from "../types";
import { authConfig } from "../config";

// ---------------------------------------------------------------------------
// Session Retrieval
// ---------------------------------------------------------------------------

/**
 * Gets the current authenticated user's session.
 * Must be called from Server Components, API routes, or Server Actions.
 *
 * Returns null if not authenticated.
 */
export async function getCurrentSession(): Promise<AuthSession | null> {
  const supabase = getSupabaseClient();

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session?.user) {
    return null;
  }

  const user = session.user;
  const profile = await getProfile(user.id);

  return {
    id: user.id,
    email: user.email ?? "",
    profile,
  };
}

/**
 * Gets the current user's profile from the profiles table.
 */
async function getProfile(authUserId: string) {
  try {
    const supabase = getSupabaseClient();
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("auth_user_id", authUserId)
      .single();

    return data ?? null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Auth Helpers
// ---------------------------------------------------------------------------

/**
 * Gets the current authenticated user.
 * Throws an error if not authenticated.
 *
 * Use in API routes and Server Actions where auth is required.
 */
export async function requireAuth(): Promise<AuthSession> {
  const session = await getCurrentSession();

  if (!session) {
    throw new AuthRequiredError("Authentication required");
  }

  return session;
}

/**
 * Gets the current session, or redirects to login if not authenticated.
 *
 * Use in Server Components for route protection.
 */
export async function requireSession(redirectTo?: string): Promise<AuthSession> {
  const session = await getCurrentSession();

  if (!session) {
    redirect(redirectTo ?? authConfig.redirectAfterLogout);
  }

  return session;
}

// ---------------------------------------------------------------------------
// Auth Actions
// ---------------------------------------------------------------------------

/**
 * Signs in with email and password.
 */
export async function signInWithEmail(
  email: string,
  password: string,
): Promise<AuthResult> {
  const supabase = getSupabaseClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    redirectTo: authConfig.redirectAfterLogin,
  };
}

/**
 * Signs up with email and password.
 * Optionally creates a profile entry.
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  displayName?: string,
): Promise<AuthResult> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName ?? null,
      },
    },
  });

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  // Create profile record if sign-up succeeded and user was created
  if (data.user) {
    await createProfile(data.user.id, email, displayName);
  }

  return {
    success: true,
    redirectTo: authConfig.redirectAfterSignUp,
  };
}

/**
 * Signs in with Google OAuth.
 */
export async function signInWithGoogle(): Promise<AuthResult> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/auth/callback`,
    },
  });

  if (error || !data.url) {
    return {
      success: false,
      error: error?.message ?? "Failed to initiate Google sign-in",
    };
  }

  return {
    success: true,
    redirectTo: data.url,
  };
}

/**
 * Signs in with GitHub OAuth.
 */
export async function signInWithGithub(): Promise<AuthResult> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/auth/callback`,
    },
  });

  if (error || !data.url) {
    return {
      success: false,
      error: error?.message ?? "Failed to initiate GitHub sign-in",
    };
  }

  return {
    success: true,
    redirectTo: data.url,
  };
}

/**
 * Sends a magic link email.
 */
export async function sendMagicLink(email: string): Promise<AuthResult> {
  const supabase = getSupabaseClient();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/auth/callback`,
    },
  });

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    redirectTo: undefined, // Stay on page to show "check your email"
  };
}

/**
 * Requests a password reset email.
 * Always returns success to prevent email enumeration attacks.
 */
export async function requestPasswordReset(email: string): Promise<AuthResult> {
  try {
    const supabase = getSupabaseClient();
    const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/reset-password`;

    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
  } catch (error) {
    // Silently ignore errors to prevent email enumeration
    console.error("[auth] Password reset request error (silent):", error);
  }

  // Always return success regardless of outcome
  return { success: true };
}

/**
 * Updates the current user's password.
 * Requires an active session (set by Supabase when the reset link is clicked).
 */
export async function updatePassword(newPassword: string): Promise<AuthResult> {
  const supabase = getSupabaseClient();

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return { success: true };
}

/**
 * Signs out the current user.
 */
export async function signOut(): Promise<void> {
  const supabase = getSupabaseClient();
  await supabase.auth.signOut();
}

// ---------------------------------------------------------------------------
// Profile Management
// ---------------------------------------------------------------------------

/**
 * Creates a profile entry for a new user.
 * Uses admin client to bypass RLS during creation.
 */
async function createProfile(
  authUserId: string,
  email: string,
  displayName?: string,
): Promise<void> {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    await supabaseAdmin.from("profiles").insert({
      auth_user_id: authUserId,
      display_name: displayName || email.split("@")[0],
      avatar_url: null,
    });
  } catch (error) {
    console.error("[auth] Failed to create profile:", error);
    // Non-critical: profile creation failure shouldn't block auth
  }
}

/**
 * Updates the current user's profile.
 */
export async function updateProfile(data: {
  displayName?: string;
  avatarUrl?: string;
}): Promise<AuthResult> {
  const session = await requireAuth();

  const supabase = getSupabaseClient();
  const { error } = await (supabase
    .from("profiles") as any)
    .update({
      display_name: data.displayName,
      avatar_url: data.avatarUrl,
    })
    .eq("auth_user_id", session.id);

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return { success: true };
}

// ---------------------------------------------------------------------------
// Error Classes
// ---------------------------------------------------------------------------

export class AuthRequiredError extends Error {
  public readonly code = "AUTH_REQUIRED";
  public readonly statusCode = 401;

  constructor(message = "Authentication required") {
    super(message);
    this.name = "AuthRequiredError";
  }
}