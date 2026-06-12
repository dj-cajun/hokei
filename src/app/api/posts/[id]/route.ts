import { z } from "zod";
import { auth } from "@/auth";
import {
  enforcePreset,
  guestPasswordBlockedResponse,
  isGuestPasswordBlocked,
  recordGuestPasswordFailure,
} from "@/lib/api/enforce-rate-limit";
import { apiError, apiSuccess } from "@/lib/api-response";
import {
  GUEST_PASSWORD_MAX_LENGTH,
  GUEST_PASSWORD_MIN_LENGTH,
  MAX_ATTACHMENTS_PER_POST,
  POST_CONTENT_MAX_LENGTH,
  POST_TITLE_MAX_LENGTH,
} from "@/lib/constants";
import { log } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { isCommunityPost } from "@/lib/community";
import { canModifyPost, hashGuestPassword } from "@/lib/post-permissions";
import {
  indexPostInSearch,
  removePostFromSearch,
} from "@/lib/search/index-post";
import { attachmentUrlsToDelete } from "@/lib/posts/attachment-sync";
import { isValidRegion } from "@/lib/regions";
import { revalidatePostCaches } from "@/lib/revalidate-content";
import { deleteUploadFile } from "@/lib/upload";

const attachmentSchema = z.object({
  url: z.string().min(1),
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  size: z.number().int().positive(),
  kind: z.enum(["IMAGE", "FILE"]),
});

const patchSchema = z.object({
  categoryId: z.string().min(1).optional(),
  title: z.string().min(2).max(POST_TITLE_MAX_LENGTH).optional(),
  content: z.string().min(10).max(POST_CONTENT_MAX_LENGTH).optional(),
  guestPassword: z
    .string()
    .min(GUEST_PASSWORD_MIN_LENGTH)
    .max(GUEST_PASSWORD_MAX_LENGTH)
    .optional(),
  newGuestPassword: z
    .string()
    .min(GUEST_PASSWORD_MIN_LENGTH)
    .max(GUEST_PASSWORD_MAX_LENGTH)
    .optional(),
  attachments: z.array(attachmentSchema).max(MAX_ATTACHMENTS_PER_POST).optional(),
  region: z
    .string()
    .nullable()
    .optional()
    .refine((v) => v === null || v === undefined || v === "" || isValidRegion(v), {
      message: "올바른 지역을 선택해 주세요.",
    }),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const limited = await enforcePreset(request, "postsPatch");
  if (limited) return limited;

  try {
    const { id } = await context.params;
    const post = await prisma.post.findUnique({
      where: { id },
      include: { attachments: true },
    });

    if (!post || !isCommunityPost(post.sourceUrl)) {
      return apiError("글을 찾을 수 없습니다.", 404);
    }

    const json = await request.json();
    const parsed = patchSchema.safeParse(json);
    if (!parsed.success) {
      return apiError(
        parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다.",
        400
      );
    }

    const session = await auth();
    const guestPw = parsed.data.guestPassword;
    if (!session?.user && guestPw) {
      if (isGuestPasswordBlocked(request, id)) {
        return guestPasswordBlockedResponse();
      }
    }

    const allowed = await canModifyPost(post, {
      guestPassword: guestPw,
    });
    if (!allowed) {
      if (!session?.user && guestPw) {
        recordGuestPasswordFailure(request, id);
      }
      return apiError("수정 권한이 없습니다.", 403);
    }

    const { title, content, categoryId, attachments, newGuestPassword, region } =
      parsed.data;

    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
        include: { parent: { select: { slug: true } } },
      });
      if (!category?.parentId || category.parent?.slug === "news") {
        return apiError("선택한 분류를 사용할 수 없습니다.", 400);
      }
    }

    const summary =
      content !== undefined
        ? content.replace(/\s+/g, " ").trim().slice(0, 160)
        : undefined;

    const firstImage = attachments?.find((a) => a.kind === "IMAGE");

    if (attachments) {
      for (const url of attachmentUrlsToDelete(post.attachments, attachments)) {
        await deleteUploadFile(url);
      }
      await prisma.postAttachment.deleteMany({ where: { postId: id } });
      if (attachments.length > 0) {
        await prisma.postAttachment.createMany({
          data: attachments.map((a, i) => ({
            postId: id,
            url: a.url,
            fileName: a.fileName,
            mimeType: a.mimeType,
            size: a.size,
            kind: a.kind,
            sortOrder: i,
          })),
        });
      }
    }

    const updated = await prisma.post.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(content !== undefined ? { content } : {}),
        ...(summary !== undefined ? { summary: summary || title || post.title } : {}),
        ...(categoryId !== undefined ? { categoryId } : {}),
        ...(firstImage !== undefined
          ? { thumbnail: firstImage?.url ?? null }
          : attachments
            ? { thumbnail: null }
            : {}),
        ...(newGuestPassword && !session?.user?.id
          ? { guestPasswordHash: await hashGuestPassword(newGuestPassword) }
          : {}),
        ...(region !== undefined
          ? { region: region || null }
          : {}),
      },
    });

    await indexPostInSearch({
      id: updated.id,
      title: updated.title,
      summary: updated.summary,
      content: updated.content,
      status: updated.status,
    });

    const withCategory = await prisma.post.findUnique({
      where: { id: updated.id },
      select: {
        category: {
          select: { href: true, parent: { select: { slug: true } } },
        },
      },
    });
    revalidatePostCaches(updated.id, {
      sectionSlug: withCategory?.category.parent?.slug,
      categoryHref: withCategory?.category.href,
    });

    return apiSuccess({ id: updated.id });
  } catch (err) {
    log("error", "posts patch failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return apiError("수정 중 오류가 발생했습니다.", 500);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const limited = await enforcePreset(request, "postsDelete");
  if (limited) return limited;

  try {
    const { id } = await context.params;
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        attachments: true,
        category: {
          select: { href: true, parent: { select: { slug: true } } },
        },
      },
    });

    if (!post || !isCommunityPost(post.sourceUrl)) {
      return apiError("글을 찾을 수 없습니다.", 404);
    }

    let guestPassword: string | undefined;
    try {
      const json = await request.json();
      guestPassword =
        typeof json?.guestPassword === "string" ? json.guestPassword : undefined;
    } catch {
      /* empty body */
    }

    const session = await auth();
    if (!session?.user && guestPassword) {
      if (isGuestPasswordBlocked(request, id)) {
        return guestPasswordBlockedResponse();
      }
    }

    const allowed = await canModifyPost(post, { guestPassword });
    if (!allowed) {
      if (!session?.user && guestPassword) {
        recordGuestPasswordFailure(request, id);
      }
      return apiError("삭제 권한이 없습니다.", 403);
    }

    for (const att of post.attachments) {
      await deleteUploadFile(att.url);
    }

    await prisma.post.delete({ where: { id } });
    await removePostFromSearch(id);

    revalidatePostCaches(id, {
      sectionSlug: post.category.parent?.slug,
      categoryHref: post.category.href,
    });

    return apiSuccess({ deleted: true });
  } catch (err) {
    log("error", "posts delete failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return apiError("삭제 중 오류가 발생했습니다.", 500);
  }
}
