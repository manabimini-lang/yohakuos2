import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { UserRole } from "@prisma/client";

import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";
import {
  authLog,
  maskEmail,
  startTimer,
  TURNSTILE_CODE,
  classifyTurnstileError,
} from "@/lib/auth-diagnostics";

import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

const allowDevAuthFallback =
  process.env.NODE_ENV === "development" && process.env.YOHAKU_ALLOW_DEV_AUTH_FALLBACK === "true";

const googleProvider = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  ? [Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // Avoid dangerous automatic email-based account linking in production
      allowDangerousEmailAccountLinking: false,
    })]
  : [];

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    ...googleProvider,
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        turnstileToken: { label: "Turnstile Token", type: "text" },
        authRequestId: { label: "Request ID", type: "text" },
      },
      async authorize(credentials) {
        const elapsed = startTimer();
        const requestId = (credentials?.authRequestId as string) || "UNKNOWN";
        const email = maskEmail(credentials?.email as string);

        authLog("info", {
          stage: "authorize",
          requestId,
          email,
          hasPassword: !!credentials?.password,
          hasTurnstile: !!(credentials?.turnstileToken),
        });

        if (!credentials?.email || !credentials?.password) {
          authLog("warn", {
            stage: "authorize",
            requestId,
            email,
            result: "rejected",
            reason: "missing_credentials",
            elapsed: elapsed(),
          });
          return null;
        }

        // ---------------------------------------------------------------
        // Turnstile Validation
        // ---------------------------------------------------------------
        const secret = process.env.TURNSTILE_SECRET_KEY;
        const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
        const turnstileToken = credentials.turnstileToken as string | undefined;
        // Preview deployments use a stable Vercel alias that cannot be added to
        // the production Turnstile allow-list. Do not require a token there;
        // production continues to enforce Turnstile whenever it is configured.
        const hasTurnstileConfig =
          process.env.NODE_ENV === "production" &&
          process.env.VERCEL_ENV !== "preview" &&
          !!(secret && siteKey);
        const hasValidToken = !!(turnstileToken && turnstileToken.length > 0);

        if (hasTurnstileConfig && hasValidToken) {
          const tsElapsed = startTimer();
          try {
            const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: `secret=${encodeURIComponent(secret)}&response=${encodeURIComponent(turnstileToken)}`,
            });
            const outcome = await res.json();
            if (!outcome.success) {
              const code = classifyTurnstileError(outcome["error-codes"]);
              authLog("warn", {
                stage: "turnstile",
                requestId,
                email,
                result: "rejected",
                code,
                errorCodes: (outcome["error-codes"] || []).join(","),
                elapsed: tsElapsed(),
              });
              return null;
            }
            authLog("info", {
              stage: "turnstile",
              requestId,
              email,
              result: TURNSTILE_CODE.PASS,
              elapsed: tsElapsed(),
            });
          } catch (e) {
            authLog("error", {
              stage: "turnstile",
              requestId,
              email,
              result: "error",
              code: TURNSTILE_CODE.API_ERROR,
              error: e instanceof Error ? e.message : String(e),
              elapsed: tsElapsed(),
            });
            if (allowDevAuthFallback) {
              authLog("warn", { stage: "turnstile", requestId, result: "dev_bypass" });
            } else {
              return null;
            }
          }
        } else if (hasTurnstileConfig && !hasValidToken) {
          authLog("warn", {
            stage: "turnstile",
            requestId,
            email,
            result: "rejected",
            code: TURNSTILE_CODE.MISSING,
          });
          if (allowDevAuthFallback) {
            authLog("warn", { stage: "turnstile", requestId, result: "dev_bypass" });
          } else {
            return null;
          }
        } else {
          authLog("info", {
            stage: "turnstile",
            requestId,
            result: TURNSTILE_CODE.SKIPPED,
            reason: "not_configured",
          });
        }

        // ---------------------------------------------------------------
        // User Lookup & Password Verification
        // ---------------------------------------------------------------
        try {
          const normalizedEmail = ((credentials?.email as string) || "").trim().toLowerCase();
          const maskedEmail = maskEmail(normalizedEmail);

          const dbElapsed = startTimer();
          const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
          });
          authLog("info", {
            stage: "user_lookup",
            requestId,
            email: maskedEmail,
            found: !!user,
            hasPassword: !!user?.password,
            elapsed: dbElapsed(),
          });

          if (!user || !user.password) {
            authLog("warn", {
              stage: "authorize",
              requestId,
              email: maskedEmail,
              result: "rejected",
              reason: user ? "no_password_set" : "user_not_found",
              elapsed: elapsed(),
            });
            return null;
          }

          // Check if account is suspended/locked
          if (user.lockedUntil && user.lockedUntil > new Date()) {
            authLog("warn", {
              stage: "authorize",
              requestId,
              email: maskedEmail,
              result: "rejected",
              reason: "account_suspended",
              elapsed: elapsed(),
            });
            return null;
          }

          const pwElapsed = startTimer();
          const isValid = await bcrypt.compare(
            credentials.password as string,
            user.password
          );
          authLog("info", {
            stage: "password_verify",
            requestId,
            email: maskedEmail,
            valid: isValid,
            elapsed: pwElapsed(),
          });

          if (!isValid) {
            authLog("warn", {
              stage: "authorize",
              requestId,
              email: maskedEmail,
              result: "rejected",
              reason: "invalid_password",
              elapsed: elapsed(),
            });
            return null;
          }

          authLog("info", {
            stage: "authorize",
            requestId,
            email: maskedEmail,
            result: "success",
            userId: user.id,
            elapsed: elapsed(),
          });
          return user;
        } catch (dbError) {
          authLog("error", {
            stage: "authorize",
            requestId,
            email,
            result: "error",
            reason: "database_error",
            error: dbError instanceof Error ? dbError.message : String(dbError),
            elapsed: elapsed(),
          });

          return null;
        }
      },
    }),
  ],
  events: {
    async createUser({ user }) {
      if (user.id) {
        try {
          const { recordSignup } = await import('@/lib/analytics/funnel-server');
          await recordSignup(user.id, 'oauth');
        } catch {
          console.warn('[product-funnel] signup instrumentation unavailable');
        }
      }
    },
    async signIn({ user, account }) {
      authLog("info", {
        stage: "event_signin",
        provider: account?.provider ?? "unknown",
        userId: user.id ?? "(none)",
        email: maskEmail(user.email),
      });
    },
    async signOut(message) {
      const token = "token" in message ? message.token : undefined;
      authLog("info", {
        stage: "event_signout",
        userId: (token as any)?.id ?? "(none)",
      });
    },
    async session(message) {
      // Session event fires frequently — only log at debug level
      const session = "session" in message ? message.session : undefined;
      if (process.env.NODE_ENV === "development") {
        authLog("info", {
          stage: "event_session",
          userId: (session as any)?.user?.id ?? "(none)",
        });
      }
    },
  },
  logger: {
    error(code, ...metadata) {
      console.error("[auth] nextauth_error", code, ...(metadata.length > 0 ? metadata : []));
    },
    warn(code, ...metadata) {
      console.warn("[auth] nextauth_warn", code, ...(metadata.length > 0 ? metadata : []));
    },
    debug(code, ...metadata) {
      if (process.env.NODE_ENV === "development") {
        console.debug("[auth] nextauth_debug", code, ...(metadata.length > 0 ? metadata : []));
      }
    },
  },
});
