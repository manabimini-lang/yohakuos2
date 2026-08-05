import type { NextAuthConfig } from "next-auth";
import { ROLE, PLAN } from "@/lib/constants/plan";
import {
  resolvePermissions,
  extractPermissionsFromSession,
  hasMinRoleLevel,
} from "@/lib/permissions/helpers";
import { LEGACY_ROLE_MAP } from "@/lib/permissions/constants";
import type { Permission, SystemRole } from "@/lib/permissions/types";
import { authLog, maskEmail, startTimer } from "@/lib/auth-diagnostics";

const getSiteUrl = () => {
  return process.env.NEXTAUTH_URL
    || process.env.AUTH_URL
    || process.env.NEXT_PUBLIC_SITE_URL
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined)
    || "http://localhost:3000";
};

// Validate secret configuration but avoid crashing the app when a deployment is missing the secret.
const getAuthSecret = () => {
  const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
  if (!secret) {
    const fallback = process.env.VERCEL_GIT_COMMIT_SHA || "dev-only-fallback-secret-32-char-minimum-!!";
    authLog("warn", {
      stage: "config",
      result: "missing_secret",
      reason: "NEXTAUTH_SECRET/AUTH_SECRET not set, using fallback",
    });
    return fallback;
  }
  return secret;
};

const validateAuthEnvironment = () => {
  const required = [
    { name: "NEXTAUTH_URL", value: process.env.NEXTAUTH_URL || process.env.AUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL },
    { name: "GOOGLE_CLIENT_ID", value: process.env.GOOGLE_CLIENT_ID },
    { name: "GOOGLE_CLIENT_SECRET", value: process.env.GOOGLE_CLIENT_SECRET },
    { name: "NEXTAUTH_SECRET", value: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET },
  ];

  const missing = required.filter((item) => !item.value).map((item) => item.name);

  if (missing.length === 0) {
    return;
  }

  authLog("warn", {
    stage: "config",
    result: "missing_env_vars",
    missing: missing.join(", "),
  });
};

validateAuthEnvironment();

// Edge Runtime互換の設定（Prismaを使わない）
export const authConfig: NextAuthConfig = {
  secret: getAuthSecret(),
  trustHost: true,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;
      const isOnAdmin = pathname.startsWith("/admin");
      const isOnMember = pathname.startsWith("/member");
      const isOnPremium = pathname.startsWith("/premium");
      const isOnModeration = pathname.startsWith("/admin/moderation");

      if (isOnAdmin) {
        if (!isLoggedIn) {
          authLog("info", {
            stage: "authorized_callback",
            path: pathname,
            result: "rejected",
            reason: "not_logged_in",
          });
          return false;
        }
        const extracted = extractPermissionsFromSession(auth as any);
        if (!extracted) return false;
        if (isOnModeration) {
          return hasMinRoleLevel(extracted.roles, "moderator");
        }
        return hasMinRoleLevel(extracted.roles, "admin");
      }

      // Premium route protection (handled client-side for friendly UX)
      if (pathname.startsWith("/member/ai")) {
        return isLoggedIn;
      }

      if (isOnMember || isOnPremium) {
        if (isLoggedIn) return true;
        return false;
      }

      return true;
    },

    async jwt({ token, user, trigger, session }) {
      const elapsed = startTimer();

      if (user) {
        token.id = user.id;
        const email = user.email || "";
        const isAdminEmail = email === "manabi.mini@gmail.com" || email === "manabi.mini@gmaail.com";
        token.role = isAdminEmail ? ROLE.ADMIN : ((user as any).role || ROLE.FREE_MEMBER);
        token.plan = (user as any).plan || PLAN.FREE;

        // Inject RBAC roles & permissions into JWT
        const legacyRole = token.role as keyof typeof LEGACY_ROLE_MAP;
        const systemRoles = LEGACY_ROLE_MAP[legacyRole] ?? ["user"];
        const permissions = resolvePermissions(systemRoles);
        token.roles = systemRoles;
        token.permissions = permissions;

        authLog("info", {
          stage: "jwt_callback",
          trigger: "initial",
          userId: user.id,
          email: maskEmail(email),
          role: token.role as string,
          plan: token.plan as string,
          elapsed: elapsed(),
        });
      }

      if (trigger === "update" && session) {
        token.role = session.role;
        token.plan = session.plan;
        if (session.roles) {
          const sysRoles = session.roles as SystemRole[];
          token.roles = sysRoles;
          const permissions = resolvePermissions(sysRoles);
          token.permissions = permissions;
        }
        authLog("info", {
          stage: "jwt_callback",
          trigger: "update",
          userId: token.id,
          role: token.role as string,
          plan: token.plan as string,
          elapsed: elapsed(),
        });
      }

      token.role = token.role || ROLE.FREE_MEMBER;
      token.plan = token.plan || PLAN.FREE;
      return token;
    },

    async session({ session, token }) {
      const elapsed = startTimer();

      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.role = token.role as any;
        session.user.plan = token.plan as string;
        (session.user as any).roles = token.roles as SystemRole[];
        (session.user as any).permissions = token.permissions as Permission[];
      }

      authLog("info", {
        stage: "session_callback",
        userId: token?.id ?? "(none)",
        hasUser: !!session.user,
        role: token?.role as string,
        elapsed: elapsed(),
      });

      return session;
    },
  },
  providers: [],
};