import { z } from "zod";
import { auth } from "@/auth";
import {
  enforceGuestPasswordAttempts,
  enforcePreset,
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
    if (!session?.user && parsed.data.guestPassword) {
      const blocked = enforceGuestPasswordAttempts(request, id);
      if (blocked) return blocked;
    }

    const allowed = await canModifyPost(post, {
      guestPassword: parsed.data.guestPassword,
    });
    if (!allowed) {
      return apiError("수정 권한이 없습니다.", 403);
    }

    const { title, content, categoryId, attachments, newGuestPassword } =
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
      for (const old of post.attachments) {
        await deleteUploadFile(old.url);
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
      },
    });

    await indexPostInSearch({
      id: updated.id,
      title: updated.title,
      summary: updated.summary,
      content: updated.content,
      status: updated.status,
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
      include: { attachments: true },
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
      const blocked = enforceGuestPasswordAttempts(request, id);
      if (blocked) return blocked;
    }

    const allowed = await canModifyPost(post, { guestPassword });
    if (!allowed) {
      return apiError("삭제 권한이 없습니다.", 403);
    }

    for (const att of post.attachments) {
      await deleteUploadFile(att.url);
    }

    await prisma.post.delete({ where: { id } });
    await removePostFromSearch(id);

    return apiSuccess({ deleted: true });
  } catch (err) {
    log("error", "posts delete failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return apiError("삭제 중 오류가 발생했습니다.", 500);
  }
}
