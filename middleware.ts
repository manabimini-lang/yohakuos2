import { NextResponse, type NextRequest } from "next/server";
// Avoid importing heavy, Node-only modules at top-level to keep middleware Edge-compatible.
// auth (next-auth) and some Redis libraries are Node-focused and can break middleware.
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

  // 2. Load auth middleware lazily to avoid bundling Node-only deps into Edge middleware.
  let authMiddleware: any = null;
  try {
    // Dynamic import — may fail in Edge if modules are Node-only; catch and fall back.
    const authModule = await import("@/lib/auth");
    authMiddleware = authModule.auth;
  } catch (e) {
    // If auth cannot be imported in Edge/dev, log and fall back to a simple pass-through.
    console.warn("[middleware] Could not import auth module in middleware (fallback):", e);
    // Return supabaseResponse directly for compatibility
    return supabaseResponse;
  }

  const handler = authMiddleware(async (req: any) => {
    const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
    const path = req.nextUrl.pathname;

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

    if (path === "/dialogue") {
      return NextResponse.redirect(new URL("/companion", req.nextUrl.origin));
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

  return (handler as any)(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
