import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { isPremiumRoute, hasPremiumAccess } from "@/lib/constants/plan";
import { updateSession } from "@/lib/supabase/middleware";

// Env variables check to prevent server-side crash when not configured
const hasRedisConfig = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

let ratelimit: Ratelimit | null = null;
if (hasRedisConfig) {
  try {
    ratelimit = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(20, "1 m"),
      analytics: true,
    });
  } catch (e) {
    console.warn("Failed to initialize Upstash Redis Ratelimit:", e);
  }
}

export async function middleware(request: NextRequest) {
  // 1. Maintain Supabase Session
  const supabaseResponse = await updateSession(request);

  // 2. NextAuth & App logic
  const authMiddleware = auth(async (req) => {
    const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
    const path = req.nextUrl.pathname;

    const protectedRoutes = ["/settings"];

    // NextAuth paths should bypass rate limiting to prevent OAuth failure
    if (path.startsWith("/api/auth")) {
      return NextResponse.next();
    }

    // Rate Limiting
    if (
      ratelimit &&
      (path.startsWith("/api/checkout") ||
        path === "/login" ||
        path === "/register" ||
        path === "/forgot-password" ||
        path === "/reset-password")
    ) {
      try {
        const { success } = await ratelimit.limit(`ratelimit_${ip}`);
        if (!success) {
          return new NextResponse("Too Many Requests", { status: 429 });
        }
      } catch (e) {
        console.warn("Rate limit bypass due to Redis request error", e);
      }
    }

    // Centralized Premium route protection
    if (isPremiumRoute(path)) {
      const isLoggedIn = !!req.auth?.user;
      if (!isLoggedIn) {
        const loginUrl = new URL(`/login?callbackUrl=${encodeURIComponent(path)}`, req.nextUrl.origin);
        return NextResponse.redirect(loginUrl);
      }

      const plan = (req.auth?.user as any)?.plan;
      const role = (req.auth?.user as any)?.role;
      const isPremium = hasPremiumAccess(plan, role);

      if (!isPremium) {
        const pricingUrl = new URL("/pricing", req.nextUrl.origin);
        return NextResponse.redirect(pricingUrl);
      }
    }

    return supabaseResponse;
  });

  return (authMiddleware as any)(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};