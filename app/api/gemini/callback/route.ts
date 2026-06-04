import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { unstable_noStore as noStore } from "next/cache";
import { encryptKey } from "@/lib/encryption";
import { prisma } from "@/lib/prisma";
import { log } from "@/core/audit/logger";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  noStore();
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    const userId = session.user.id;

    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    
    if (!code) {
      return NextResponse.redirect(new URL("/member/settings?gemini=error", req.url));
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const nextAuthUrl = process.env.NEXTAUTH_URL;

    if (!clientId || !clientSecret || !nextAuthUrl) {
      console.error("Missing Google OAuth configuration");
      return NextResponse.redirect(new URL("/member/settings?gemini=error", req.url));
    }

    const redirectUri = `${nextAuthUrl}/api/gemini/callback`;

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      console.error("Failed to exchange token", await tokenResponse.text());
      return NextResponse.redirect(new URL("/member/settings?gemini=error", req.url));
    }

    const tokenData = await tokenResponse.json();

    const tokenPayload = {
      type: "oauth",
      provider: "google",
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: Date.now() + tokenData.expires_in * 1000,
    };

    const encryptedPayload = encryptKey(JSON.stringify(tokenPayload));

    await prisma.userAISettings.upsert({
      where: { userId },
      update: {
        encryptedApiKey: encryptedPayload,
        provider: "gemini_oauth",
        isEnabled: true,
      },
      create: {
        userId,
        encryptedApiKey: encryptedPayload,
        provider: "gemini_oauth",
        isEnabled: true,
      },
    });

    await log({
      actorId: userId,
      category: "ai",
      action: "gemini_connected",
      targetType: "user_api_key",
      targetId: userId,
      metadata: {
        provider: "gemini_oauth",
        method: "oauth",
      },
    });

    const response = NextResponse.redirect(new URL("/member/settings?gemini=connected", req.url));
    response.cookies.delete("gemini_oauth_state");
    return response;

  } catch (error) {
    console.error("[GEMINI_CALLBACK]", error);
    return NextResponse.redirect(new URL("/member/settings?gemini=error", req.url));
  }
}
