import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Ensure we don't crash if Redis is not configured, but block action by default if not available when required?
// Usually, we fall back to allow if Redis is misconfigured, but log a warning.
const hasRedisConfig = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

let minuteLimiter: Ratelimit | null = null;
let hourLimiter: Ratelimit | null = null;

if (hasRedisConfig) {
  try {
    const redis = Redis.fromEnv();
    
    // 1分間に5回まで
    minuteLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "1 m"),
      analytics: true,
      prefix: "@upstash/ratelimit/minute",
    });

    // 1時間に20回まで
    hourLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, "1 h"),
      analytics: true,
      prefix: "@upstash/ratelimit/hour",
    });
  } catch (e) {
    console.warn("Failed to initialize Upstash Redis Ratelimit for actions:", e);
  }
}

export async function checkActionRateLimit(ip: string): Promise<boolean> {
  if (!minuteLimiter || !hourLimiter) {
    // If Redis is not configured, we allow the request to prevent breaking functionality in dev,
    // but in production, you might want to strict block.
    return true; 
  }

  try {
    // Check minute limit first
    const minuteResult = await minuteLimiter.limit(`action_${ip}`);
    if (!minuteResult.success) {
      return false;
    }

    // Then check hour limit
    const hourResult = await hourLimiter.limit(`action_${ip}`);
    if (!hourResult.success) {
      return false;
    }

    return true;
  } catch (error) {
    console.error("Rate limit check failed:", error);
    // On Redis error, allow request
    return true;
  }
}
