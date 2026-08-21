import { NextResponse } from "next/server";
import { requireYuiSession } from "@/app/ui/backend/yui/api";
import { getGoogleAuthUrl } from "@/app/ui/backend/yui/google_calendar_service";
import {
  createGoogleOAuthState,
  GOOGLE_OAUTH_STATE_COOKIE,
  googleOAuthStateCookieOptions,
} from "@/app/ui/backend/yui/google_oauth_state";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireYuiSession();
    const urlObj = new URL(request.url);
    const redirectUri = `${urlObj.origin}/api/yui/google/callback`;
    const state = createGoogleOAuthState();
    const authUrl = getGoogleAuthUrl(redirectUri, state);
    const response = NextResponse.redirect(authUrl);
    response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, state, googleOAuthStateCookieOptions());

    return response;
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
