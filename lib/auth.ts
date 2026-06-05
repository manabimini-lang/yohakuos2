import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { UserRole } from "@prisma/client";

import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";

import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // Avoid dangerous automatic email-based account linking in production
      allowDangerousEmailAccountLinking: false,
    }),
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
          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string },
          });

          if (!user || !user.password) {
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
          // On DB errors, do NOT allow any fallback — authentication must fail safe.
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
