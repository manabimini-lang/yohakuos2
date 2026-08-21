import { NextRequest, NextResponse } from "next/server";
import { requireYuiSession } from "@/app/ui/backend/yui/api";
import { handleGoogleCallback } from "@/app/ui/backend/yui/google_calendar_service";
import {
  GOOGLE_OAUTH_STATE_COOKIE,
  googleOAuthStateCookieOptions,
  verifyGoogleOAuthState,
} from "@/app/ui/backend/yui/google_oauth_state";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const urlObj = new URL(request.url);
  const redirectWithClearedState = (path: string) => {
    const response = NextResponse.redirect(`${urlObj.origin}${path}`);
    response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, "", {
      ...googleOAuthStateCookieOptions(),
      maxAge: 0,
    });
    return response;
  };

  try {
    const session = await requireYuiSession();
    const code = urlObj.searchParams.get("code");
    const error = urlObj.searchParams.get("error");
    const receivedState = urlObj.searchParams.get("state");
    const expectedState = request.cookies.get(GOOGLE_OAUTH_STATE_COOKIE)?.value;

    if (!verifyGoogleOAuthState(expectedState, receivedState)) {
      return redirectWithClearedState("/yui/settings?error=google_oauth_state_invalid");
    }

    if (error || !code) {
      return redirectWithClearedState("/yui/settings?error=google_auth_failed");
    }

    const redirectUri = `${urlObj.origin}/api/yui/google/callback`;
    await handleGoogleCallback(session.user.id, code, redirectUri);

    return redirectWithClearedState("/yui/settings?success=google_connected");
  } catch (err) {
    console.error("Google callback failed", {
      name: err instanceof Error ? err.name : "UnknownError",
    });
    return redirectWithClearedState("/yui/settings?error=google_auth_exception");
  }
}
