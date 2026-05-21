import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const clientId = process.env.DISCORD_CLIENT_ID;
    if (!clientId) {
      console.error("DISCORD_CLIENT_ID is not configured");
      return new NextResponse("Discord Client ID is missing", { status: 500 });
    }

    // Generate secure CSRF state
    const state = crypto.randomBytes(16).toString("hex");

    const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/discord/callback`;
    const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=identify&state=${state}`;

    const response = NextResponse.redirect(discordAuthUrl);
    
    // Save state in cookie for callback verification
    response.cookies.set("discord_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[DISCORD_CONNECT_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
