import { z } from "zod";
import {
  GUEST_NAME_MAX_LENGTH,
  GUEST_PASSWORD_MAX_LENGTH,
  GUEST_PASSWORD_MIN_LENGTH,
  MAX_ATTACHMENTS_PER_POST,
  POST_CONTENT_MAX_LENGTH,
  POST_TITLE_MAX_LENGTH,
} from "@/lib/constants";

export const postAttachmentSchema = z.object({
  url: z.string().min(1),
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  size: z.number().int().positive(),
  kind: z.enum(["IMAGE", "FILE"]),
});

export const postCreateBodySchema = z.object({
  categoryId: z.string().min(1),
  title: z.string().min(2).max(POST_TITLE_MAX_LENGTH),
  content: z.string().min(10).max(POST_CONTENT_MAX_LENGTH),
  guestName: z.string().min(1).max(GUEST_NAME_MAX_LENGTH).optional(),
  guestPassword: z
    .string()
    .min(GUEST_PASSWORD_MIN_LENGTH)
    .max(GUEST_PASSWORD_MAX_LENGTH)
    .optional(),
  attachments: z
    .array(postAttachmentSchema)
    .max(MAX_ATTACHMENTS_PER_POST)
    .optional(),
});

export type PostCreateBody = z.infer<typeof postCreateBodySchema>;
