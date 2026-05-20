import type { NextAuthConfig } from "next-auth";
import { NextResponse } from "next/server";
import { ROLE, PLAN, hasAdminAccess } from "@/lib/constants/plan";

// Edge Runtime互換の設定（Prismaを使わない）
export const authConfig: NextAuthConfig = {
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

      if (isOnAdmin) {
        if (!isLoggedIn) return false;
        const role = (auth.user as any).role;
        return hasAdminAccess(role);
      }

      // Premium route protection (handled client-side for friendly UX)
      if (nextUrl.pathname.startsWith("/member/ai")) {
        return isLoggedIn;
      }

      if (isOnMember || isOnPremium) {
        if (isLoggedIn) return true;
        return false; // ログインページへリダイレクト
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
      }
      if (trigger === "update" && session) {
        token.role = session.role;
        token.plan = session.plan;
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
      }
      return session;
    },
  },
  providers: [], // auth.tsで定義するため空にする
};
