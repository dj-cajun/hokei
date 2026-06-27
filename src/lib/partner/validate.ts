import { z } from "zod";
import { isValidKakaoLink } from "@/lib/kakao-link";
import {
  isValidPartnerSlug,
  PARTNER_SLUG_MAX,
  PARTNER_SLUG_MIN,
} from "@/lib/partner/slug";

const MAPS_URL_RE =
  /^https:\/\/(maps\.google\.com|www\.google\.(?:com|[a-z]{2})\/maps|goo\.gl\/maps)/i;

const PARTNER_PHONE_RE = /^[\d+\s().-]{6,24}$/;

export function isValidMapsUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:") return false;
    return MAPS_URL_RE.test(trimmed);
  } catch {
    return false;
  }
}

export function isValidPartnerPhone(phone: string): boolean {
  const trimmed = phone.trim();
  if (!trimmed) return false;
  return PARTNER_PHONE_RE.test(trimmed);
}

export const partnerCategorySchema = z.enum([
  "FOOD",
  "BEAUTY",
  "CLINIC",
  "SERVICE",
  "OTHER",
]);

export const partnerPlanSchema = z.enum(["BASIC", "STANDARD", "PREMIUM"]);

export const partnerStatusSchema = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);

const optionalHttpsUrl = z
  .string()
  .max(500)
  .refine((v) => v === "" || /^https:\/\/.+/i.test(v), {
    message: "https URL만 입력할 수 있습니다.",
  })
  .optional();

const kakaoLinkField = z
  .string()
  .max(500)
  .refine((v) => v === "" || isValidKakaoLink(v), {
    message: "유효한 카카오톡 링크를 입력해 주세요.",
  })
  .optional();

const mapsUrlField = z
  .string()
  .max(500)
  .refine((v) => v === "" || isValidMapsUrl(v), {
    message: "Google Maps 공유 URL을 입력해 주세요.",
  })
  .optional();

const phoneField = z
  .string()
  .max(32)
  .refine((v) => v === "" || isValidPartnerPhone(v), {
    message: "유효한 전화번호를 입력해 주세요.",
  })
  .optional();

const partnerSlugField = z
  .string()
  .min(PARTNER_SLUG_MIN, `slug는 ${PARTNER_SLUG_MIN}자 이상이어야 합니다.`)
  .max(PARTNER_SLUG_MAX)
  .refine(isValidPartnerSlug, {
    message: "slug는 영문 소문자, 숫자, 하이픈만 사용할 수 있습니다.",
  });

export const partnerStoreCreateSchema = z.object({
  name: z.string().min(1, "업소명을 입력해 주세요.").max(120),
  slug: partnerSlugField,
  tagline: z.string().max(200).optional(),
  description: z.string().max(8000).optional(),
  category: partnerCategorySchema,
  phone: phoneField,
  kakaoLink: kakaoLinkField,
  mapsUrl: mapsUrlField,
  address: z.string().max(300).optional(),
  hoursText: z.string().max(300).optional(),
  thumbnail: optionalHttpsUrl,
  plan: partnerPlanSchema.default("BASIC"),
  status: partnerStatusSchema.default("DRAFT"),
  sortOrder: z.number().int().min(0).max(9999).default(0),
  publishedAt: z.coerce.date().optional().nullable(),
  expiresAt: z.coerce.date().optional().nullable(),
});

export const partnerStoreUpdateSchema = partnerStoreCreateSchema
  .partial()
  .extend({
    name: z.string().min(1).max(120).optional(),
    slug: partnerSlugField.optional(),
    category: partnerCategorySchema.optional(),
  });

export type PartnerStoreCreateInput = z.infer<typeof partnerStoreCreateSchema>;
export type PartnerStoreUpdateInput = z.infer<typeof partnerStoreUpdateSchema>;

export const partnerBannerSlotSchema = z.enum([
  "HOME_BOTTOM",
  "HOME_TOP",
  "NEWS_INLINE",
  "PROMO_TOP",
]);

export const partnerBannerCreateSchema = z.object({
  storeId: z.string().min(1),
  slot: partnerBannerSlotSchema.default("HOME_BOTTOM"),
  imageUrl: z.string().url("배너 이미지 URL을 입력해 주세요.").max(500),
  altText: z.string().max(200).optional(),
  linkSlug: z
    .string()
    .max(PARTNER_SLUG_MAX)
    .refine((v) => v === "" || isValidPartnerSlug(v), {
      message: "linkSlug 형식이 올바르지 않습니다.",
    })
    .optional(),
  sortOrder: z.number().int().min(0).max(9999).default(0),
  isActive: z.boolean().default(true),
  startsAt: z.coerce.date().optional().nullable(),
  endsAt: z.coerce.date().optional().nullable(),
});

export const partnerBannerUpdateSchema = partnerBannerCreateSchema
  .partial()
  .extend({
    storeId: z.string().min(1).optional(),
    slot: partnerBannerSlotSchema.optional(),
    imageUrl: z.string().url().max(500).optional(),
  });
