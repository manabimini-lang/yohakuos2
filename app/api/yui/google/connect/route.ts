import { NextResponse } from "next/server";
import { getGoogleAuthUrl } from "@/app/ui/backend/yui/google_calendar_service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const urlObj = new URL(request.url);
  const redirectUri = `${urlObj.origin}/api/yui/google/callback`;
  const authUrl = getGoogleAuthUrl(redirectUri);

  return NextResponse.redirect(authUrl);
}
