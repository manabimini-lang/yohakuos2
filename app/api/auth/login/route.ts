// ===================================================
// YOHAKU Auth Core — Login API Route
// ===================================================

import { NextResponse } from "next/server";
import { signInWithEmail } from "@/core/auth/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
      return NextResponse.redirect(
        new URL("/login?error=missing-fields", request.url),
      );
    }

    const result = await signInWithEmail(email, password);

    if (!result.success) {
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(result.error ?? "invalid-credentials")}`, request.url),
      );
    }

    return NextResponse.redirect(
      new URL(result.redirectTo ?? "/", request.url),
    );
  } catch (error) {
    console.error("[auth/login] Error:", error);
    return NextResponse.redirect(
      new URL("/login?error=server-error", request.url),
    );
  }
}