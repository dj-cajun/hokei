import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { enforcePreset } from "@/lib/api/enforce-rate-limit";
import { apiError, apiSuccess } from "@/lib/api-response";
import {
  COMMENT_MAX_LENGTH,
  GUEST_NAME_MAX_LENGTH,
  GUEST_PASSWORD_MAX_LENGTH,
  GUEST_PASSWORD_MIN_LENGTH,
} from "@/lib/constants";
import { log } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { hashGuestPassword, isCommentOwner } from "@/lib/post-permissions";

const commentSchema = z.object({
  content: z.string().min(1).max(COMMENT_MAX_LENGTH),
  guestName: z.string().min(1).max(GUEST_NAME_MAX_LENGTH).optional(),
  guestPassword: z
    .string()
    .min(GUEST_PASSWORD_MIN_LENGTH)
    .max(GUEST_PASSWORD_MAX_LENGTH)
    .optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) {
    return apiError("글을 찾을 수 없습니다.", 404);
  }

  const [session, comments] = await Promise.all([
    auth(),
    prisma.comment.findMany({
      where: { postId: id },
      orderBy: { createdAt: "asc" },
      include: { author: { select: { id: true, name: true } } },
    }),
  ]);

  const isAdmin = session?.user?.role === "ADMIN";
  const userId = session?.user?.id;

  return NextResponse.json(
    comments.map((c) => ({
      id: c.id,
      content: c.content,
      createdAt: c.createdAt.toISOString(),
      authorName: c.author?.name ?? c.guestName ?? "익명",
      isOwner: isAdmin || isCommentOwner(c, userId),
      isGuestComment: !c.authorId && Boolean(c.guestPasswordHash),
    }))
  );
}

export async function POST(request: Request, context: RouteContext) {
  const limited = await enforcePreset(request, "comment");
  if (limited) return limited;

  try {
    const { id } = await context.params;
    const post = await prisma.post.findUnique({ where: { id } });

    if (!post || post.status !== "PUBLISHED") {
      return apiError("글을 찾을 수 없습니다.", 404);
    }

    const session = await auth();
    const json = await request.json();
    const parsed = commentSchema.safeParse(json);

    if (!parsed.success) {
      return apiError(
        parsed.error.issues[0]?.message ?? "댓글 내용을 확인해 주세요.",
        400
      );
    }

    const { content, guestName, guestPassword } = parsed.data;
    const userId = session?.user?.id;

    if (!userId && (!guestName?.trim() || !guestPassword?.trim())) {
      return apiError("로그인하거나 이름·비밀번호를 입력해 주세요.", 401);
    }

    const comment = await prisma.comment.create({
      data: {
        postId: id,
        content: content.trim(),
        authorId: userId ?? null,
        guestName: userId ? null : guestName!.trim(),
        guestPasswordHash: userId
          ? null
          : await hashGuestPassword(guestPassword!),
      },
      include: { author: { select: { name: true } } },
    });

    await prisma.post.update({
      where: { id },
      data: { commentCount: { increment: 1 } },
    });

    return apiSuccess(
      {
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt.toISOString(),
        authorName: comment.author?.name ?? comment.guestName ?? "익명",
      },
      201
    );
  } catch (err) {
    log("error", "posts comments create failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return apiError("댓글 등록 중 오류가 발생했습니다.", 500);
  }
}
