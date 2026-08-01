import { NextResponse } from "next/server";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/infra/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      await ensureProfile(data.user.id, data.user.email ?? "");
    }
  }

  const redirectTo = new URL(next, origin);
  return NextResponse.redirect(redirectTo);
}

async function ensureProfile(authUserId: string, email: string) {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    const { data: existing } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("auth_user_id", authUserId)
      .single();

    if (!existing) {
      await supabaseAdmin.from("profiles").insert({
        auth_user_id: authUserId,
        display_name: email.split("@")[0],
        avatar_url: null,
      });
    }
  } catch (error) {
    console.error("[api/auth/callback] Failed to ensure profile:", error);
  }
}
