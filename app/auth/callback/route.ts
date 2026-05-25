// ===================================================
// YOHAKU Auth Core — OAuth Callback
// ===================================================
//
// Handles OAuth (Google, GitHub) and magic link callbacks.
// This route is called by Supabase after a user authenticates via OAuth.
// It exchanges the auth code for a session and creates a profile if needed.
// ===================================================

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/infra/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    // Exchange the auth code for a session
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Ensure profile exists for OAuth users
      await ensureProfile(data.user.id, data.user.email ?? "");
    }
  }

  // URL to redirect to after sign-in
  const redirectTo = new URL(next, origin);
  return NextResponse.redirect(redirectTo);
}

/**
 * Ensures a profile record exists for the user.
 * OAuth users may not have a profile yet.
 */
async function ensureProfile(authUserId: string, email: string) {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    // Check if profile exists
    const { data: existing } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("auth_user_id", authUserId)
      .single();

    if (!existing) {
      // Create profile
      await supabaseAdmin.from("profiles").insert({
        auth_user_id: authUserId,
        display_name: email.split("@")[0],
        avatar_url: null,
      });
    }
  } catch (error) {
    console.error("[auth/callback] Failed to ensure profile:", error);
  }
}