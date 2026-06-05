import { createHash, randomBytes } from "crypto";
import { sendVerificationEmail, buildVerifyEmailUrl } from "@/lib/email/send-verification-email";
import { prisma } from "@/lib/prisma";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function createRawToken(): string {
  return randomBytes(32).toString("hex");
}

export async function issueEmailVerification(
  userId: string,
  email: string,
  name: string
): Promise<{ devLogged?: boolean }> {
  const token = createRawToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  await prisma.emailVerification.upsert({
    where: { userId },
    create: { userId, tokenHash, expiresAt },
    update: { tokenHash, expiresAt, createdAt: new Date() },
  });

  const result = await sendVerificationEmail({
    to: email,
    name,
    verifyUrl: buildVerifyEmailUrl(token),
  });

  return { devLogged: result.devLogged };
}

export async function verifyEmailToken(
  rawToken: string
): Promise<{ ok: true; email: string } | { ok: false; reason: string }> {
  const token = rawToken.trim();
  if (!token) {
    return { ok: false, reason: "invalid" };
  }

  const tokenHash = hashToken(token);
  const record = await prisma.emailVerification.findUnique({
    where: { tokenHash },
    include: { user: { select: { id: true, email: true, emailVerified: true } } },
  });

  if (!record) {
    return { ok: false, reason: "invalid" };
  }

  if (record.expiresAt.getTime() < Date.now()) {
    await prisma.emailVerification.delete({ where: { id: record.id } }).catch(() => {});
    return { ok: false, reason: "expired" };
  }

  if (record.user.emailVerified) {
    await prisma.emailVerification.delete({ where: { id: record.id } }).catch(() => {});
    return { ok: true, email: record.user.email };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.user.id },
      data: { emailVerified: new Date() },
    }),
    prisma.emailVerification.delete({ where: { id: record.id } }),
  ]);

  return { ok: true, email: record.user.email };
}

export async function resendVerificationEmail(
  email: string
): Promise<{ sent: boolean; devLogged?: boolean }> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    select: { id: true, email: true, name: true, emailVerified: true },
  });

  if (!user || user.emailVerified) {
    return { sent: true };
  }

  const result = await issueEmailVerification(user.id, user.email, user.name);
  return { sent: true, devLogged: result.devLogged };
}
