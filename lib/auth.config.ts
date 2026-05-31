import type { NextAuthConfig } from "next-auth";
import { ROLE, PLAN } from "@/lib/constants/plan";
import {
  resolvePermissions,
  extractPermissionsFromSession,
  hasMinRoleLevel,
} from "@/lib/permissions/helpers";
import { LEGACY_ROLE_MAP } from "@/lib/permissions/constants";
import type { Permission, SystemRole } from "@/lib/permissions/types";

// Validate secret configuration (must be set in production)
const getAuthSecret = () => {
  const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('NEXTAUTH_SECRET or AUTH_SECRET environment variable is required in production');
  }
  return secret || 'dev-only-fallback-secret-32-char-minimum-!!';
};

// Edge Runtime互換の設定（Prismaを使わない）
export const authConfig: NextAuthConfig = {
  secret: getAuthSecret(),
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnAdmin = nextUrl.pathname.startsWith("/admin");
      const isOnMember = nextUrl.pathname.startsWith("/member");
      const isOnPremium = nextUrl.pathname.startsWith("/premium");
      const isOnModeration = nextUrl.pathname.startsWith("/admin/moderation");

      if (isOnAdmin) {
        if (!isLoggedIn) return false;
        const extracted = extractPermissionsFromSession(auth as any);
        if (!extracted) return false;
        if (isOnModeration) {
          return hasMinRoleLevel(extracted.roles, "moderator");
        }
        return hasMinRoleLevel(extracted.roles, "admin");
      }

      // Premium route protection (handled client-side for friendly UX)
      if (nextUrl.pathname.startsWith("/member/ai")) {
        return isLoggedIn;
      }

      if (isOnMember || isOnPremium) {
        if (isLoggedIn) return true;
        return false;
      }

      return true;
    },
    async jwt({ token, user, trigger, session }) {
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
      }
      token.role = token.role || ROLE.FREE_MEMBER;
      token.plan = token.plan || PLAN.FREE;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.role = token.role as any;
        session.user.plan = token.plan as string;
        (session.user as any).roles = token.roles as SystemRole[];
        (session.user as any).permissions = token.permissions as Permission[];
      }
      return session;
    },
  },
  providers: [],
};