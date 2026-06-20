import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { unstable_noStore as noStore } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET(req: Request) {
  noStore();
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    const cookieStore = cookies();
    const savedState = cookieStore.get("discord_oauth_state")?.value;

    // CSRF Verification
    if (!state || state !== savedState) {
      return new NextResponse("State validation failed (CSRF check failed)", { status: 400 });
    }

    // Clean up oauth cookie
    cookieStore.delete("discord_oauth_state");

    if (!code) {
      return new NextResponse("Authorization code is missing", { status: 400 });
    }

    const clientId = process.env.DISCORD_CLIENT_ID;
    const clientSecret = process.env.DISCORD_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error("Missing Discord credentials configuration");
      return new NextResponse("Configuration error", { status: 500 });
    }

    const { origin } = new URL(req.url);
    const redirectUri = `${origin}/api/auth/discord/callback`;

    // 1. Exchange code for token
    const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("[DISCORD_TOKEN_EXCHANGE_FAILED]", {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        redirectUri,
        errorText,
      });
      return new NextResponse("Failed to exchange code for token", { status: 400 });
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // 2. Fetch User Profile
    const userResponse = await fetch("https://discord.com/api/users/@me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userResponse.ok) {
      console.error("[DISCORD_PROFILE_FETCH_FAILED]", {
        status: userResponse.status,
        statusText: userResponse.statusText,
      });
      return new NextResponse("Failed to fetch Discord user profile", { status: 400 });
    }

    const discordUser = await userResponse.json();

    // Construct Discord Avatar URL
    let avatarUrl = "";
    if (discordUser.avatar) {
      avatarUrl = `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`;
    } else {
      // Default avatar using index
      const defaultAvatarIndex = parseInt(discordUser.id) % 5;
      avatarUrl = `https://cdn.discordapp.com/embed/avatars/${defaultAvatarIndex}.png`;
    }

    // 3. Update Database User
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        discordId: discordUser.id,
        discordName: discordUser.username,
        discordAvatar: avatarUrl,
      },
    });

    // 4. Redirect user back to account settings
    return NextResponse.redirect(new URL("/member/settings/account?success=true", origin));
  } catch (error) {
    console.error("[DISCORD_CALLBACK_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
