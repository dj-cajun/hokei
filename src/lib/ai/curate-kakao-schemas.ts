import { z } from "zod";
import type { CurateKakaoContentType } from "@/lib/ai/curate-kakao-types";

const optionalVnd = z.preprocess((v) => {
  if (v == null || v === "") return undefined;
  if (typeof v === "number" && Number.isFinite(v)) return Math.round(v);
  const digits = String(v).replace(/[^\d]/g, "");
  if (!digits) return undefined;
  const n = Number(digits);
  return Number.isFinite(n) ? n : undefined;
}, z.number().int().nonnegative().optional());

const optionalListingIntent = z.preprocess((v) => {
  if (v == null || v === "") return undefined;
  const s = String(v).toUpperCase();
  if (["RENT", "SELL", "BUY", "HIRE", "SEEK", "PROMO"].includes(s)) return s;
  return undefined;
}, z.enum(["RENT", "SELL", "BUY", "HIRE", "SEEK", "PROMO"]).optional());

const clip = (max: number) =>
  z.preprocess((v) => {
    if (v == null) return "";
    return String(v).trim().slice(0, max);
  }, z.string());

export const curateKakaoItemSchema = z.object({
  contentType: z.enum([
    "VIETNAMESE_STUDY",
    "REAL_ESTATE",
    "CLASSIFIED",
    "JOBS",
    "PROMO",
    "UNKNOWN",
  ]),
  title: clip(200).pipe(z.string().min(1).max(200)),
  vnText: clip(500).optional(),
  body: clip(20000).pipe(z.string().min(1).max(20000)),
  slugSuggestion: z.string().max(80).optional(),
  categorySlug: z.string().max(80).optional(),
  storeName: z.string().max(120).optional(),
  kakaoLink: z.string().max(500).optional(),
  region: z.string().max(80).optional(),
  sourceLabel: z.string().max(120).optional(),
  summary: z.string().max(500).optional(),
  priceVnd: optionalVnd,
  listingIntent: optionalListingIntent,
  itemKind: z.string().max(40).optional(),
  contactPhone: z.string().max(30).optional(),
  contactKakaoId: z.string().max(80).optional(),
  senderName: z.string().max(80).optional(),
  messageAt: z.string().max(40).optional(),
});

export const curateKakaoChunkResponseSchema = z.object({
  items: z.array(curateKakaoItemSchema).max(30),
  notes: z.string().max(2000).optional(),
});

export const curateKakaoAnalyzeResponseSchema = curateKakaoChunkResponseSchema;

export type CurateKakaoItem = z.infer<typeof curateKakaoItemSchema>;

export type CurateKakaoAnalyzeResult = z.infer<
  typeof curateKakaoAnalyzeResponseSchema
>;

export const curateKakaoPublishSchema = z.object({
  title: z.string().min(1).max(200),
  vnText: z.string().max(500).optional(),
  body: z.string().min(1).max(20000),
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  imageUrl: z.string().url().max(500).optional(),
  sourceLabel: z.string().max(120).optional(),
  contentType: z.custom<CurateKakaoContentType>(),
  categorySlug: z.string().max(80).optional(),
  storeName: z.string().max(120).optional(),
  kakaoLink: z.string().max(500).optional(),
  region: z.string().max(80).optional(),
  isCrawl: z.boolean().default(true),
  priceVnd: z.number().int().nonnegative().optional(),
  listingIntent: z
    .enum(["RENT", "SELL", "BUY", "HIRE", "SEEK", "PROMO"])
    .optional(),
  itemKind: z.string().max(40).optional(),
  contactPhone: z.string().max(30).optional(),
  contactKakaoId: z.string().max(80).optional(),
  senderName: z.string().max(80).optional(),
  messageAt: z.string().max(40).optional(),
  /** 기존 타임라인 글 업데이트 시 */
  updatePostId: z.string().optional(),
  mergedBody: z.string().max(20000).optional(),
  /** 기존 공부 글 업데이트 시 */
  guideUpdateId: z.string().optional(),
});

export const curateKakaoPublishBatchSchema = z.object({
  items: z.array(curateKakaoPublishSchema).min(1).max(50),
});
