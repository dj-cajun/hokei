import { z } from "zod";

export const curateFetchSchema = z.object({
  sourceUrl: z.string().url("올바른 URL을 입력하세요."),
  sourceName: z.string().max(80).optional(),
});

export const curateOutlinkPreviewSchema = z.object({
  sourceUrl: z.string().url("올바른 URL을 입력하세요."),
  sourceName: z.string().max(80).optional(),
});

export const curateRewriteSchema = z.object({
  title: z.string().min(1).max(300),
  content: z.string().min(1).max(50_000),
  sourceName: z.string().max(80).optional(),
});

export const curatePublishSchema = z
  .object({
    title: z.string().min(1).max(300),
    content: z.string().min(1).max(50_000),
    sourceUrl: z.string().url(),
    sourceName: z.string().min(1).max(80),
    categoryId: z.string().min(1),
    thumbnail: z.string().url().optional().nullable(),
    originalTitle: z.string().max(300).optional(),
    mode: z.enum(["full", "outlink"]).optional(),
    summary: z.string().max(500).optional(),
    topic: z
      .enum(["KOREA", "TRAVEL", "VIETNAM_POLICY", "TOURIST"])
      .optional(),
  })
  .superRefine((data, ctx) => {
    const min = data.mode === "outlink" ? 20 : 40;
    if (data.content.trim().length < min) {
      ctx.addIssue({
        code: "custom",
        message:
          data.mode === "outlink"
            ? "요약 본문은 20자 이상 입력하세요."
            : "본문은 40자 이상 입력하세요.",
        path: ["content"],
      });
    }
  });
