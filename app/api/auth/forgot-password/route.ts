import { NextResponse } from "next/server";
import { requestPasswordReset } from "@/core/auth/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const email = formData.get("email") as string;

    if (!email) {
      return NextResponse.redirect(
        new URL("/forgot-password?error=missing-email", request.url)
      );
    }

    await requestPasswordReset(email);

    // Always redirect to success to prevent email enumeration
    return NextResponse.redirect(
      new URL("/forgot-password?status=sent", request.url)
    );
  } catch (error) {
    console.error("[auth/forgot-password] Error:", error);
    // Still redirect to success visually for security, or a generic error
    return NextResponse.redirect(
      new URL("/forgot-password?status=sent", request.url)
    );
  }
}
