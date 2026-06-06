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
      const isAdmin = auth?.user?.role === "ADMIN";

      if (pathname.startsWith("/admin")) {
        if (!isLoggedIn) return false;
        if (!isAdmin) {
          return Response.redirect(new URL("/", request.nextUrl));
        }
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
