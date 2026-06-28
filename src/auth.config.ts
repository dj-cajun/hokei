import type { NextAuthConfig } from "next-auth";
import { authSessionOptions } from "@/lib/auth/session-config";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  session: authSessionOptions,
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role;
        token.isSuspended = user.isSuspended ?? false;
        token.writeBanned = user.writeBanned ?? false;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.isSuspended = Boolean(token.isSuspended);
        session.user.writeBanned = Boolean(token.writeBanned);
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
