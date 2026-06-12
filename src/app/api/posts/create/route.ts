import type { PostTopic } from "@/generated/prisma/client";
import { auth } from "@/auth";
import { enforcePreset } from "@/lib/api/enforce-rate-limit";
import { apiError, apiSuccess } from "@/lib/api-response";
import { log } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { hashGuestPassword } from "@/lib/post-permissions";
import { indexPostInSearch } from "@/lib/search/index-post";
import { revalidatePostCaches } from "@/lib/revalidate-content";
import { postCreateBodySchema } from "@/lib/validation/post-create";

function topicFromSection(sectionSlug: string): PostTopic {
  if (sectionSlug === "news") return "VIETNAM_POLICY";
  if (sectionSlug === "real-estate") return "TRAVEL";
  return "KOREA";
}

export async function POST(request: Request) {
  const limited = await enforcePreset(request, "post");
  if (limited) return limited;

  try {
    const session = await auth();
    const json = await request.json();
    const parsed = postCreateBodySchema.safeParse(json);

    if (!parsed.success) {
      return apiError(
        parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다.",
        400
      );
    }

    const {
      categoryId,
      title,
      content,
      guestName,
      guestPassword,
      attachments = [],
      region,
    } = parsed.data;

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: {
        id: true,
        href: true,
        parentId: true,
        parent: { select: { slug: true } },
      },
    });

    if (!category?.parentId) {
      return apiError("선택한 분류를 사용할 수 없습니다.", 400);
    }

    const userId = session?.user?.id;

    if (!userId) {
      if (!guestName?.trim() || !guestPassword?.trim()) {
        return apiError("로그인하거나 이름·비밀번호를 입력해 주세요.", 401);
      }
    }

    const summary = content.replace(/\s+/g, " ").trim().slice(0, 160);
    const firstImage = attachments.find((a) => a.kind === "IMAGE");

    const post = await prisma.post.create({
      data: {
        title,
        summary: summary || title,
        content,
        sourceUrl: `hokei:community:${crypto.randomUUID()}`,
        sourceName: null,
        topic: topicFromSection(category.parent?.slug ?? "community"),
        categoryId: category.id,
        publishedAt: new Date(),
        isAutomated: false,
        status: "PUBLISHED",
        authorId: userId ?? null,
        guestName: userId ? null : guestName!.trim(),
        guestPasswordHash: userId
          ? null
          : await hashGuestPassword(guestPassword!),
        region: region || null,
        thumbnail: firstImage?.url ?? null,
        attachments: {
          create: attachments.map((a, i) => ({
            url: a.url,
            fileName: a.fileName,
            mimeType: a.mimeType,
            size: a.size,
            kind: a.kind,
            sortOrder: i,
          })),
        },
      },
    });

    await indexPostInSearch({
      id: post.id,
      title: post.title,
      summary: post.summary,
      content: post.content,
      status: post.status,
    });

    revalidatePostCaches(post.id, {
      sectionSlug: category.parent?.slug,
      categoryHref: category.href,
    });

    return apiSuccess({ id: post.id }, 201);
  } catch (err) {
    log("error", "posts create failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return apiError("게시글 등록 중 오류가 발생했습니다.", 500);
  }
}
