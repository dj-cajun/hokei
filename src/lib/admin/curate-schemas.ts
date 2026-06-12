import { z } from "zod";

export const curateFetchSchema = z.object({
  sourceUrl: z.string().url("올바른 URL을 입력하세요."),
  sourceName: z.string().max(80).optional(),
});

export const curateRewriteSchema = z.object({
  title: z.string().min(1).max(300),
  content: z.string().min(1).max(50_000),
  sourceName: z.string().max(80).optional(),
});

export const curatePublishSchema = z.object({
  title: z.string().min(1).max(300),
  content: z.string().min(40, "본문은 40자 이상 입력하세요."),
  sourceUrl: z.string().url(),
  sourceName: z.string().min(1).max(80),
  categoryId: z.string().min(1),
  thumbnail: z.string().url().optional().nullable(),
  originalTitle: z.string().max(300).optional(),
});
