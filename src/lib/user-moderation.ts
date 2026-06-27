import { prisma } from "@/lib/prisma";

export type UserModerationFlags = {
  isSuspended: boolean;
  writeBanned: boolean;
};

export const USER_SUSPENDED_MESSAGE =
  "정지된 계정입니다. 문의가 필요하면 운영자에게 연락해 주세요.";
export const USER_WRITE_BANNED_MESSAGE =
  "글쓰기가 제한된 계정입니다. 운영자에게 문의해 주세요.";

export async function getUserModerationFlags(
  userId: string
): Promise<UserModerationFlags | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { isSuspended: true, writeBanned: true },
  });
}

type EnforcementResult =
  | { ok: true; flags: UserModerationFlags }
  | { ok: false; error: string; status: number };

export async function enforceActiveUser(
  userId: string
): Promise<EnforcementResult> {
  const flags = await getUserModerationFlags(userId);
  if (!flags) {
    return { ok: false, error: "회원 정보를 찾을 수 없습니다.", status: 404 };
  }
  if (flags.isSuspended) {
    return { ok: false, error: USER_SUSPENDED_MESSAGE, status: 403 };
  }
  return { ok: true, flags };
}

export async function enforceCanWrite(
  userId: string
): Promise<EnforcementResult> {
  const active = await enforceActiveUser(userId);
  if (!active.ok) return active;
  if (active.flags.writeBanned) {
    return { ok: false, error: USER_WRITE_BANNED_MESSAGE, status: 403 };
  }
  return active;
}
