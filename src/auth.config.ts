import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isLoggedIn = !!auth?.user;
      // /admin 권한(ADMIN) 검사는 서버 layout(requireAdmin)에서 DB 기준으로 처리
      if (pathname.startsWith("/admin") && !isLoggedIn) {
        return false;
      }

      if (
        (pathname === "/profile" || pathname.startsWith("/messages")) &&
        !isLoggedIn
      ) {
        return false;
      }

      return true;
    },
  },
};
