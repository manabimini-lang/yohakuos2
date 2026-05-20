import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const nextAuthUrl = process.env.NEXTAUTH_URL;

    if (!clientId || !nextAuthUrl) {
      console.error("Missing Google OAuth configuration");
      return new NextResponse("Server Configuration Error", { status: 500 });
    }

    const redirectUri = `${nextAuthUrl}/api/gemini/callback`;
    const scope = "https://www.googleapis.com/auth/generative-language";

    const state = crypto.randomUUID();
    
    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", scope);
    authUrl.searchParams.set("access_type", "offline");
    authUrl.searchParams.set("prompt", "consent");
    authUrl.searchParams.set("state", state);

    const response = NextResponse.redirect(authUrl.toString());
    response.cookies.set("gemini_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 10,
    });

    return response;
  } catch (error) {
    console.error("[GEMINI_CONNECT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
