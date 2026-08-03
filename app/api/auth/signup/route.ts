// ===================================================
// YOHAKU Auth Core — Sign-Up API Route
// ===================================================

import { NextResponse } from "next/server";
import { signUpWithEmail } from "@/core/auth/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const displayName = formData.get("displayName") as string | undefined;

    if (!email || !password) {
      return NextResponse.redirect(
        new URL("/signup?error=missing-fields", request.url),
      );
    }

    if (password.length < 8) {
      return NextResponse.redirect(
        new URL("/signup?error=password-too-short", request.url),
      );
    }

    const result = await signUpWithEmail(email, password, displayName);

    if (!result.success) {
      return NextResponse.redirect(
        new URL(`/signup?error=${encodeURIComponent(result.error ?? "unknown")}`, request.url),
      );
    }

    if (result.redirectTo) {
      return NextResponse.redirect(new URL(result.redirectTo, request.url));
    }

    return NextResponse.redirect(
      new URL("/signup?message=signup-success", request.url),
    );
  } catch (error) {
    console.error("[auth/signup] Error:", error);
    return NextResponse.redirect(
      new URL("/signup?error=server-error", request.url),
    );
  }
}