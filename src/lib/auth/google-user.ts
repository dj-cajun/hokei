import { hash } from "bcryptjs";
import type { Role } from "@/generated/prisma/client";
import type { GoogleTokenProfile } from "@/lib/auth/verify-google-token";
import { prisma } from "@/lib/prisma";

export async function findOrCreateUserFromGoogle(
  profile: GoogleTokenProfile
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
      `oauth-google-${profile.sub}-${process.env.AUTH_SECRET}`,
      12
    );
    user = await prisma.user.create({
      data: {
        email,
        name: profile.name,
        password: passwordHash,
        role: "USER",
        emailVerified: new Date(),
      },
    });
  } else if (!user.emailVerified) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    });
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}
