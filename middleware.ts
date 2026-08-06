import { NextResponse, type NextRequest } from "next/server";
// Avoid importing heavy, Node-only modules at top-level to keep middleware Edge-compatible.
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { isPremiumRoute, hasPremiumAccess } from "@/lib/constants/plan";
import { updateSession } from "@/lib/supabase/middleware";

// ---------------------------------------------------------------------------
// Inline diagnostics for Edge runtime (cannot import auth-diagnostics in Edge)
// ---------------------------------------------------------------------------

function mwLog(stage: string, data: Record<string, unknown> = {}): void {
  const parts = [`[auth] stage=middleware.${stage}`];
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) continue;
    if (key === "elapsed") {
      parts.push(`${key}=${value}ms`);
    } else {
      parts.push(`${key}=${value}`);
    }
  }
  console.info(parts.join(" "));
}

// ---------------------------------------------------------------------------
// Rate Limiting
// ---------------------------------------------------------------------------

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
    console.warn("[auth] stage=middleware.init result=ratelimit_init_failed");
  }
}

// ---------------------------------------------------------------------------
// Cookie Merge Utility
// ---------------------------------------------------------------------------

function mergeSetCookieHeaders(target: NextResponse, source: NextResponse): void {
  const sourceCookies = source.headers.getSetCookie();
  for (const cookie of sourceCookies) {
    target.headers.append("Set-Cookie", cookie);
  }
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

export async function middleware(request: NextRequest) {
  const start = Date.now();
  const path = request.nextUrl.pathname;
  const method = request.method;

  const isAuthApiPath = path.startsWith("/api/auth");

  // 1. Supabase Session
  let supabaseResponse: NextResponse | null = null;
  if (!isAuthApiPath) {
    try {
      supabaseResponse = await updateSession(request);
      mwLog("supabase_session", { path, result: "refreshed" });
    } catch (e) {
      mwLog("supabase_session", { path, result: "error_bypass", error: e instanceof Error ? e.message : String(e) });
    }
  } else {
    mwLog("request_received", { path, method, action: "skip_supabase" });
  }

  // 2. Load auth middleware
  let authMiddleware: any = null;
  try {
    const authModule = await import("@/lib/auth");
    authMiddleware = authModule.auth;
    mwLog("auth_import", { result: "success" });
  } catch (e) {
    mwLog("auth_import", {
      result: "failed",
      error: e instanceof Error ? e.message : String(e),
      elapsed: Date.now() - start,
    });
    return supabaseResponse ?? NextResponse.next();
  }

  // 3. Auth handler
  const handler = authMiddleware(async (req: any) => {
    const currentPath = req.nextUrl.pathname;

    // NextAuth paths bypass custom logic
    if (currentPath.startsWith("/api/auth")) {
      mwLog("auth_path_passthrough", { path: currentPath, elapsed: Date.now() - start });
      return NextResponse.next();
    }

    // Rate Limiting
    if (
      ratelimit &&
      (currentPath.startsWith("/api/checkout") ||
        currentPath === "/login" ||
        currentPath === "/register" ||
        currentPath === "/forgot-password" ||
        currentPath === "/reset-password")
    ) {
      const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
      try {
        const { success } = await ratelimit.limit(`ratelimit_${ip}`);
        if (!success) {
          mwLog("rate_limit", { path: currentPath, result: "blocked" });
          return new NextResponse("Too Many Requests", { status: 429 });
        }
      } catch (e) {
        mwLog("rate_limit", { path: currentPath, result: "error_bypass" });
      }
    }

    if (currentPath === "/dialogue") {
      return NextResponse.redirect(new URL("/companion", req.nextUrl.origin));
    }

    // Premium route protection
    if (isPremiumRoute(currentPath)) {
      const isLoggedIn = !!req.auth?.user;
      if (!isLoggedIn) {
        mwLog("premium_guard", { path: currentPath, result: "redirect_login" });
        const loginUrl = new URL(`/login?callbackUrl=${encodeURIComponent(currentPath)}`, req.nextUrl.origin);
        return NextResponse.redirect(loginUrl);
      }

      const plan = (req.auth?.user as any)?.plan;
      const role = (req.auth?.user as any)?.role;
      const isPremium = hasPremiumAccess(plan, role);

      if (!isPremium) {
        mwLog("premium_guard", { path: currentPath, result: "redirect_pricing" });
        const pricingUrl = new URL("/pricing", req.nextUrl.origin);
        return NextResponse.redirect(pricingUrl);
      }
    }

    // Default pass-through with Supabase cookies merged
    const response = NextResponse.next();
    if (supabaseResponse) {
      mergeSetCookieHeaders(response, supabaseResponse);
      mwLog("cookie_merge", { path: currentPath, result: "merged" });
    }
    return response;
  });

  const finalResponse: NextResponse = await (handler as any)(request);

  // Merge Supabase cookies into the final response
  if (supabaseResponse && finalResponse !== supabaseResponse) {
    mergeSetCookieHeaders(finalResponse, supabaseResponse);
  }

  mwLog("complete", { path, elapsed: Date.now() - start });
  return finalResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
