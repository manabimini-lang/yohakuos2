import type { NextAuthConfig } from "next-auth";

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
        return role === "ADMIN" || role === "SUPER_ADMIN";
      }

      if (isOnMember || isOnPremium) {
        if (isLoggedIn) return true;
        return false; // ログインページへリダイレクト
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // admin role check
        if (
          user.email === "manabi.mini@gmail.com" ||
          user.email === "manabi.mini@gmaail.com"
        ) {
          token.role = "ADMIN";
        } else {
          token.role = "FREE_MEMBER";
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.role = token.role as any;
      }
      return session;
    },
  },
  providers: [], // auth.tsで定義するため空にする
};
