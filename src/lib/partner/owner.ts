import { prisma } from "@/lib/prisma";
import { nullIfEmpty } from "@/lib/partner/admin-map";
import type { PartnerStoreOwnerUpdateInput } from "@/lib/partner/validate";

export type OwnerEmailResolveResult =
  | { action: "skip" }
  | { action: "clear" }
  | { action: "set"; ownerId: string }
  | { action: "error"; message: string };

export function extractOwnerEmailFromBody(body: unknown): {
  payload: Record<string, unknown>;
  ownerEmail?: string;
} {
  if (!body || typeof body !== "object") {
    return { payload: {} };
  }
  const record = body as Record<string, unknown>;
  const { ownerEmail, ...rest } = record;
  return {
    payload: rest,
    ownerEmail: typeof ownerEmail === "string" ? ownerEmail : undefined,
  };
}

export async function resolveOwnerEmailInput(
  ownerEmail: string | undefined
): Promise<OwnerEmailResolveResult> {
  return resolveOwnerAccountInputForForm(ownerEmail);
}

export async function resolveOwnerIdFromEmail(
  email: string
): Promise<string | null> {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return null;

  const user = await prisma.user.findUnique({
    where: { email: trimmed },
    select: { id: true },
  });
  return user?.id ?? null;
}

/** 회원 ID(cuid) 또는 이메일 → User */
export async function resolveOwnerAccountInput(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (trimmed.includes("@")) {
    return prisma.user.findUnique({
      where: { email: trimmed.toLowerCase() },
      select: { id: true, email: true, name: true },
    });
  }

  return prisma.user.findUnique({
    where: { id: trimmed },
    select: { id: true, email: true, name: true },
  });
}

export async function resolveOwnerAccountInputForForm(
  ownerAccount: string | undefined
): Promise<OwnerEmailResolveResult> {
  if (ownerAccount === undefined) {
    return { action: "skip" };
  }
  if (!ownerAccount.trim()) {
    return { action: "clear" };
  }

  const user = await resolveOwnerAccountInput(ownerAccount);
  if (!user) {
    return {
      action: "error",
      message: "해당 회원 ID·이메일을 찾을 수 없습니다.",
    };
  }

  return { action: "set", ownerId: user.id };
}

export function partnerStoreOwnerToPrismaData(
  input: PartnerStoreOwnerUpdateInput
) {
  const data: Record<string, string | null> = {};

  if (input.tagline !== undefined) {
    data.tagline = nullIfEmpty(input.tagline);
  }
  if (input.introText !== undefined) {
    data.introText = nullIfEmpty(input.introText);
  }
  if (input.description !== undefined) {
    data.description = nullIfEmpty(input.description);
  }
  if (input.menuText !== undefined) {
    data.menuText = nullIfEmpty(input.menuText);
  }
  if (input.phone !== undefined) {
    data.phone = nullIfEmpty(input.phone);
  }
  if (input.kakaoLink !== undefined) {
    data.kakaoLink = nullIfEmpty(input.kakaoLink);
  }
  if (input.mapsUrl !== undefined) {
    data.mapsUrl = nullIfEmpty(input.mapsUrl);
  }
  if (input.address !== undefined) {
    data.address = nullIfEmpty(input.address);
  }
  if (input.locationTips !== undefined) {
    data.locationTips = nullIfEmpty(input.locationTips);
  }
  if (input.hoursText !== undefined) {
    data.hoursText = nullIfEmpty(input.hoursText);
  }
  if (input.thumbnail !== undefined) {
    data.thumbnail = nullIfEmpty(input.thumbnail);
  }

  return data;
}
