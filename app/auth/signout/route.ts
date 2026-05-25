// ===================================================
// YOHAKU Auth Core — Sign Out Route
// ===================================================

import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/infra/supabase/client";

export const dynamic = "force-dynamic";

export async function POST() {
  const supabase = getSupabaseClient();
  await supabase.auth.signOut();

  return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"));
}