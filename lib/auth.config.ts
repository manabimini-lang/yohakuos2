import type { NextAuthConfig } from "next-auth";

// Edge Runtime互換の設定（Prismaを使わない）
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnAdmin = nextUrl.pathname.startsWith("/admin");
      const isOnMember = nextUrl.pathname.startsWith("/member");
      const isOnPremium = nextUrl.pathname.startsWith("/premium");

      if (isOnAdmin || isOnMember || isOnPremium) {
        if (isLoggedIn) return true;
        return false; // ログインページへリダイレクト
      }

      return true;
    },
    async session({ session, user }) {
      if (session.user && user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  providers: [], // auth.tsで定義するため空にする
};
