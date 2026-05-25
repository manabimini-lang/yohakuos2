import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { isPremiumRoute, hasPremiumAccess } from "@/lib/constants/plan";

const { auth } = NextAuth(authConfig);

// Env variables check to prevent server-side crash when not configured
const hasRedisConfig = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

let ratelimit: Ratelimit | null = null;
if (hasRedisConfig) {
  try {
    ratelimit = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(5, "1 m"),
      analytics: true,
    });
  } catch (e) {
    console.warn("Failed to initialize Upstash Redis Ratelimit:", e);
  }
}

export const middleware = auth(async (req) => {
  const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const path = req.nextUrl.pathname;

  // Rate Limiting の対象パスで、かつRedisが設定されている場合のみ適用
  if (
    ratelimit &&
    (path.startsWith("/api/auth") ||
      path.startsWith("/api/checkout") ||
      path === "/login" ||
      path === "/register")
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

  // RBAC route protection is handled by auth.config.ts authorized callback
  // which runs on every request matching the matcher

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};