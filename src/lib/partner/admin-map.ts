import type {
  PartnerCategory,
  PartnerPlan,
  PartnerStatus,
} from "@/generated/prisma/client";

export type PartnerStorePrismaInput = {
  name: string;
  slug: string;
  category: PartnerCategory;
  tagline?: string | null;
  introText?: string | null;
  description?: string | null;
  menuText?: string | null;
  phone?: string | null;
  kakaoLink?: string | null;
  mapsUrl?: string | null;
  address?: string | null;
  locationTips?: string | null;
  hoursText?: string | null;
  commentPostId?: string | null;
  thumbnail?: string | null;
  ogImageUrl?: string | null;
  plan?: PartnerPlan;
  status?: PartnerStatus;
  sortOrder?: number;
  publishedAt?: Date | null;
  expiresAt?: Date | null;
};

export function nullIfEmpty(value?: string | null): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed || null;
}

export function partnerStoreToPrismaData(input: PartnerStorePrismaInput) {
  const status = input.status ?? "DRAFT";
  const publishedAt =
    status === "PUBLISHED"
      ? input.publishedAt ?? new Date()
      : input.publishedAt ?? null;

  return {
    name: input.name.trim(),
    slug: input.slug.trim(),
    tagline: nullIfEmpty(input.tagline),
    introText: nullIfEmpty(input.introText),
    description: nullIfEmpty(input.description),
    menuText: nullIfEmpty(input.menuText),
    category: input.category,
    phone: nullIfEmpty(input.phone),
    kakaoLink: nullIfEmpty(input.kakaoLink),
    mapsUrl: nullIfEmpty(input.mapsUrl),
    address: nullIfEmpty(input.address),
    locationTips: nullIfEmpty(input.locationTips),
    hoursText: nullIfEmpty(input.hoursText),
    commentPostId: nullIfEmpty(input.commentPostId),
    thumbnail: nullIfEmpty(input.thumbnail),
    ogImageUrl: nullIfEmpty(input.ogImageUrl),
    plan: input.plan ?? "BASIC",
    status,
    sortOrder: input.sortOrder ?? 0,
    publishedAt,
    expiresAt: input.expiresAt ?? null,
  };
}
