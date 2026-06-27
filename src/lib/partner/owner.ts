import { prisma } from "@/lib/prisma";
import { nullIfEmpty } from "@/lib/partner/admin-map";
import {
  partnerStoreOwnerEmailSchema,
  type PartnerStoreOwnerUpdateInput,
} from "@/lib/partner/validate";

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
  if (ownerEmail === undefined) {
    return { action: "skip" };
  }
  if (!ownerEmail.trim()) {
    return { action: "clear" };
  }

  const parsed = partnerStoreOwnerEmailSchema.safeParse(ownerEmail);
  if (!parsed.success) {
    return {
      action: "error",
      message: parsed.error.issues[0]?.message ?? "이메일 형식이 올바르지 않습니다.",
    };
  }

  const ownerId = await resolveOwnerIdFromEmail(ownerEmail.trim());
  if (!ownerId) {
    return {
      action: "error",
      message: "해당 이메일의 회원을 찾을 수 없습니다.",
    };
  }

  return { action: "set", ownerId };
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
