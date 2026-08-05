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
        const hasTurnstileConfig = !!(secret && siteKey);
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
            if (process.env.NODE_ENV === "development") {
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
          if (process.env.NODE_ENV === "development") {
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

          // Fallback to local dev store in development mode
          if (process.env.NODE_ENV === "development") {
            try {
              const { findUserByEmail, comparePassword } = await import(
                "@/core/auth/server/dev-store"
              );
              const normalizedEmail = ((credentials?.email as string) || "").trim().toLowerCase();
              const devUser = await findUserByEmail(normalizedEmail);
              if (!devUser) return null;

              if (devUser.lockedUntil && new Date(devUser.lockedUntil) > new Date()) {
                return null;
              }

              const isValid = await comparePassword(normalizedEmail, credentials.password as string);
              if (!isValid) return null;

              authLog("info", {
                stage: "authorize",
                requestId,
                result: "success",
                reason: "dev_store_fallback",
              });

              return {
                id: devUser.id,
                email: devUser.email,
                name: devUser.name,
                password: devUser.password,
                lockedUntil: devUser.lockedUntil ? new Date(devUser.lockedUntil) : null,
              } as any;
            } catch (e) {
              authLog("error", {
                stage: "authorize",
                requestId,
                result: "error",
                reason: "dev_store_failed",
                elapsed: elapsed(),
              });
              return null;
            }
          }

          return null;
        }
      },
    }),
  ],
  events: {
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
