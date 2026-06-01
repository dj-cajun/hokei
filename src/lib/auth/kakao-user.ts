import { hash } from "bcryptjs";
import type { Role } from "@/generated/prisma/client";
import type { KakaoProfile } from "@/lib/auth/kakao-oauth";
import { prisma } from "@/lib/prisma";

export async function findOrCreateUserFromKakao(
  profile: KakaoProfile
): Promise<{
  id: string;
  email: string;
  name: string;
  role: Role;
} | null> {
  const email = profile.email.toLowerCase();

  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    const passwordHash = await hash(
      `oauth-kakao-${profile.id}-${process.env.AUTH_SECRET}`,
      12
    );
    user = await prisma.user.create({
      data: {
        email,
        name: profile.name,
        password: passwordHash,
        role: "USER",
      },
    });
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}
