import { NextResponse } from "next/server";
import { requireYuiSession } from "@/app/ui/backend/yui/api";
import { handleGoogleCallback } from "@/app/ui/backend/yui/google_calendar_service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await requireYuiSession();
    const urlObj = new URL(request.url);
    const code = urlObj.searchParams.get("code");
    const error = urlObj.searchParams.get("error");

    if (error || !code) {
      return NextResponse.redirect(`${urlObj.origin}/yui/settings?error=google_auth_failed`);
    }

    const redirectUri = `${urlObj.origin}/api/yui/google/callback`;
    await handleGoogleCallback(session.user.id, code, redirectUri);

    return NextResponse.redirect(`${urlObj.origin}/yui/settings?success=google_connected`);
  } catch (err) {
    console.error("Google Callback Error", err);
    const origin = new URL(request.url).origin;
    return NextResponse.redirect(`${origin}/yui/settings?error=google_auth_exception`);
  }
}
