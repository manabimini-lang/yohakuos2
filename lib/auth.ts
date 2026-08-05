import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { UserRole } from "@prisma/client";

import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";

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
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const secret = process.env.TURNSTILE_SECRET_KEY;
        const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
        const turnstileToken = credentials.turnstileToken;

        if (secret && siteKey && turnstileToken) {
          try {
            const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: `secret=${encodeURIComponent(secret)}&response=${encodeURIComponent(turnstileToken as string)}`,
            });
            const outcome = await res.json();
            if (!outcome.success) {
              console.warn("Turnstile validation failed:", outcome);
              return null; // Turnstile failed
            }
          } catch (e) {
            console.error("Turnstile verification fetch failed:", e);
            if (process.env.NODE_ENV === "development") {
              console.warn("Bypassing Turnstile verification fetch failure in development mode");
            } else {
              return null;
            }
          }
        } else if (secret && siteKey && !turnstileToken) {
          console.warn("Turnstile token missing but siteKey is configured. Login blocked.");
          return null; // Turnstile required but missing
        }

        try {
          const normalizedEmail = ((credentials?.email as string) || "").trim().toLowerCase();
          const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
          });

          if (!user || !user.password) {
            return null;
          }

          // Check if account is suspended/locked
          if (user.lockedUntil && user.lockedUntil > new Date()) {
            console.warn(`Suspended user attempt to login: ${user.email}`);
            return null;
          }

          const isValid = await bcrypt.compare(
            credentials.password as string,
            user.password
          );

          if (!isValid) {
            return null;
          }

          return user;
        } catch (dbError) {
          console.error("Database connection failed during authorize:", dbError);
          // Fallback to local dev store in development mode
          if (process.env.NODE_ENV === "development") {
            try {
              const { findUserByEmail, comparePassword } = await import(
                "@/core/auth/server/dev-store"
              );
              const normalizedEmail = ((credentials?.email as string) || "").trim().toLowerCase();
              const devUser = await findUserByEmail(normalizedEmail);
              if (!devUser) return null;

              // lockedUntil check (string stored) — ignore if expired
              if (devUser.lockedUntil && new Date(devUser.lockedUntil) > new Date()) {
                console.warn(`Suspended dev user attempt to login: ${devUser.email}`);
                return null;
              }

              const isValid = await comparePassword(normalizedEmail, credentials.password as string);
              if (!isValid) return null;

              // Return shape similar to Prisma user
              return {
                id: devUser.id,
                email: devUser.email,
                name: devUser.name,
                password: devUser.password,
                lockedUntil: devUser.lockedUntil ? new Date(devUser.lockedUntil) : null,
              } as any;
            } catch (e) {
              console.error("Dev store fallback failed:", e);
              return null;
            }
          }

          // On DB errors in non-dev, authentication must fail safe.
          return null;
        }
      },
    }),
  ],
  events: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        console.log("[GOOGLE_CALLBACK_RECEIVED]", {
          provider: account.provider,
          email: user.email,
          userId: user.id,
        });
        console.log("[GOOGLE_USER_FOUND]", {
          email: user.email,
          userId: user.id,
          isNewUser: (user as any).isNewUser ?? false,
        });
        console.log("[GOOGLE_SESSION_CREATED]", {
          userId: user.id,
          provider: account.provider,
        });
      }
    },
  },
  logger: {
    error(code, ...metadata) {
      const message = metadata.length > 0 ? metadata : [];
      console.error("[GOOGLE_SSO_ERROR]", code, ...message);
    },
    warn(code, ...metadata) {
      console.warn(code, ...metadata);
    },
    debug(code, ...metadata) {
      console.debug(code, ...metadata);
    },
  },
});
