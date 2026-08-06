// ===================================================
// YOHAKU Auth Core — Client-Side Auth
// ===================================================
//
// Client Components use these functions.
// They wrap the Supabase client with the app's auth types.
// ===================================================

"use client";

import { signIn as nextAuthSignIn } from "next-auth/react";
import { getSupabaseClient } from "@/infra/supabase/client";
import type { AuthResult } from "../types";
import { authConfig } from "../config";

/**
 * Signs in with email and password from the client.
 */
export async function clientSignInWithEmail(
  email: string,
  password: string,
): Promise<AuthResult> {
  const supabase = getSupabaseClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, redirectTo: authConfig.redirectAfterLogin };
}

/**
 * Signs up with email and password from the client.
 */
export async function clientSignUpWithEmail(
  email: string,
  password: string,
  displayName?: string,
): Promise<AuthResult> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName ?? null },
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    redirectTo: data.user?.identities?.length === 0
      ? undefined // Already registered, confirmation email sent
      : authConfig.redirectAfterSignUp,
  };
}

/**
 * Signs in with Google OAuth from the client.
 */
export async function clientSignInWithGoogle(callbackUrl?: string): Promise<AuthResult> {
  try {
    const targetUrl = callbackUrl || authConfig.redirectAfterLogin;
    await nextAuthSignIn("google", { callbackUrl: targetUrl });
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Google sign in failed",
    };
  }
}

/**
 * Signs in with GitHub OAuth from the client.
 */
export async function clientSignInWithGithub(): Promise<void> {
  const supabase = getSupabaseClient();

  await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: `${window.location.origin}/api/auth/callback`,
    },
  });
}

/**
 * Sends a magic link email from the client.
 */
export async function clientSendMagicLink(email: string): Promise<AuthResult> {
  const supabase = getSupabaseClient();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${window.location.origin}/api/auth/callback`,
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Signs out the current user from the client.
 */
export async function clientSignOut(): Promise<void> {
  const supabase = getSupabaseClient();
  await supabase.auth.signOut();
}