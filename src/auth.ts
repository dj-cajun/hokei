import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { z } from "zod";
import { authConfig } from "@/auth.config";
import { findOrCreateUserFromGoogle } from "@/lib/auth/google-user";
import { verifyGoogleIdToken } from "@/lib/auth/verify-google-token";
import { prisma } from "@/lib/prisma";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  trustHost: true,
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role;
        token.isSuspended = user.isSuspended ?? false;
        token.writeBanned = user.writeBanned ?? false;
      }
      if (token.id) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { role: true, isSuspended: true, writeBanned: true },
          });
          if (dbUser) {
            token.role = dbUser.role;
            token.isSuspended = dbUser.isSuspended;
            token.writeBanned = dbUser.writeBanned;
          }
        } catch {
          /* DB 일시 오류 시 authorize·기존 토큰 값 유지 */
        }
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
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "이메일", type: "email" },
        password: { label: "비밀번호", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;

        const valid = await compare(password, user.password);
        if (!valid) return null;

        if (!user.emailVerified) {
          return null;
        }

        if (user.isSuspended) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isSuspended: user.isSuspended,
          writeBanned: user.writeBanned,
        };
      },
    }),
    Credentials({
      id: "google-id-token",
      credentials: {
        credential: { label: "Google ID Token", type: "text" },
      },
      async authorize(credentials) {
        const token =
          typeof credentials?.credential === "string"
            ? credentials.credential
            : null;
        if (!token) return null;

        const profile = await verifyGoogleIdToken(token);
        if (!profile) return null;

        return findOrCreateUserFromGoogle(profile);
      },
    }),
  ],
});
