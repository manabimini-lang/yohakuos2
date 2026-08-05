// ===================================================
// YOHAKU Auth Core — Server-Side Auth
// ===================================================
//
// Server Components, API routes, Server Actions use these functions.
// They are the single entry point for server-side auth operations.
// ===================================================

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";

import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/infra/supabase/server";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/lib/auth";
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
  const supabase = await createSupabaseServerClient();

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
    const supabase = await createSupabaseServerClient();
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
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const result = await signIn("credentials", {
      email: normalizedEmail,
      password,
      redirect: false,
      callbackUrl: authConfig.redirectAfterLogin,
    });

    if (result?.error) {
      return {
        success: false,
        error: result.error,
      };
    }
  } catch (error) {
    console.error("[auth] Failed to sign in with credentials:", error);
    return {
      success: false,
      error: "Failed to sign in. Please try again.",
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
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail || password.length < 8) {
    return {
      success: false,
      error: "Password must be at least 8 characters long.",
    };
  }

  // Check existing user, with DB error fallback to dev store in development.
  let existing: { id: string } | null = null;
  try {
    existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });
  } catch (dbCheckError) {
    console.error("[auth] DB check failed during sign-up (falling back in dev):", dbCheckError);
    if (process.env.NODE_ENV === "development") {
      try {
        const { findUserByEmail } = await import("@/core/auth/server/dev-store");
        const devUser = await findUserByEmail(normalizedEmail);
        if (devUser) {
          return {
            success: false,
            error: "This email is already registered.",
          };
        }
      } catch (e) {
        console.error("[auth] Dev store lookup failed:", e);
        // proceed to attempt create via dev store below
      }
    } else {
      return {
        success: false,
        error: "Failed to create account. Please try again.",
      };
    }
  }

  if (existing) {
    return {
      success: false,
      error: "This email is already registered.",
    };
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: displayName?.trim() || normalizedEmail.split("@")[0],
        password: hashedPassword,
        role: UserRole.FREE_MEMBER,
      },
    });
  } catch (error) {
    console.error("[auth] Failed to create local user:", error);
    // Fallback to local dev store in development mode
    if (process.env.NODE_ENV === "development") {
      try {
        const { createUser } = await import("@/core/auth/server/dev-store");
        await createUser(normalizedEmail, password, displayName);
      } catch (e) {
        console.error("[auth] Dev store create user failed:", e);
        return {
          success: false,
          error: "Failed to create account. Please try again.",
        };
      }
    } else {
      return {
        success: false,
        error: "Failed to create account. Please try again.",
      };
    }
  }

  return {
    success: true,
    redirectTo: "/login?message=signup-success",
  };
}

/**
 * Signs in with Google OAuth.
 */
export async function signInWithGoogle(): Promise<AuthResult> {
  return {
    success: true,
    redirectTo: `/api/auth/signin/google?callbackUrl=${encodeURIComponent(authConfig.redirectAfterLogin)}`,
  };
}

/**
 * Signs in with GitHub OAuth.
 */
export async function signInWithGithub(): Promise<AuthResult> {
  const supabase = await createSupabaseServerClient();

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
  const supabase = await createSupabaseServerClient();

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
    const supabase = await createSupabaseServerClient();
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
  const supabase = await createSupabaseServerClient();

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
  const supabase = await createSupabaseServerClient();
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

  const supabase = await createSupabaseServerClient();
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