import type { PostTopic } from "@/generated/prisma/client";
import { auth } from "@/auth";
import { enforcePreset } from "@/lib/api/enforce-rate-limit";
import { apiError, apiSuccess } from "@/lib/api-response";
import { log } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { normalizeKakaoLink, isValidKakaoLink } from "@/lib/kakao-link";
import { hashGuestPassword } from "@/lib/post-permissions";
import { indexPostInSearch } from "@/lib/search/index-post";
import { revalidatePostCaches } from "@/lib/revalidate-content";
import { resolveSectionSlugForCategory } from "@/lib/category-tree";
import { postCreateBodySchema } from "@/lib/validation/post-create";
import { enforceCanWrite } from "@/lib/user-moderation";
import {
  assertPartnerOwnerPromoStoreName,
  revalidatePromoStoreTimeline,
} from "@/lib/partner/promo-post-write";

function topicFromSection(sectionSlug: string): PostTopic {
  if (sectionSlug === "news") return "VIETNAM_POLICY";
  if (sectionSlug === "real-estate") return "TRAVEL";
  if (sectionSlug === "promo") return "KOREA";
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
      storeName,
      kakaoLink,
    } = parsed.data;

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: {
        id: true,
        href: true,
        parentId: true,
      },
    });

    if (!category?.parentId) {
      return apiError("선택한 분류를 사용할 수 없습니다.", 400);
    }

    const sectionSlug = await resolveSectionSlugForCategory(category.id);
    let normalizedKakao: string | null = null;
    if (kakaoLink?.trim()) {
      if (!isValidKakaoLink(kakaoLink)) {
        return apiError("카카오톡 링크 형식이 올바르지 않습니다.", 400);
      }
      normalizedKakao = normalizeKakaoLink(kakaoLink);
    }
    if (sectionSlug === "promo" && !storeName?.trim()) {
      return apiError("업소 홍보 글은 업체명을 입력해 주세요.", 400);
    }

    const userId = session?.user?.id;

    if (!userId) {
      if (!guestName?.trim() || !guestPassword?.trim()) {
        return apiError("로그인하거나 이름·비밀번호를 입력해 주세요.", 401);
      }
    } else {
      const allowed = await enforceCanWrite(userId);
      if (!allowed.ok) {
        return apiError(allowed.error, allowed.status);
      }

      if (sectionSlug === "promo") {
        const ownerCheck = await assertPartnerOwnerPromoStoreName(
          userId,
          session.user.role,
          storeName
        );
        if (!ownerCheck.ok) {
          return apiError(ownerCheck.message, 403);
        }
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
        topic: topicFromSection(sectionSlug ?? "community"),
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
        isCrawl: false,
        storeName:
          sectionSlug === "promo" ? storeName?.trim() || null : null,
        kakaoLink: sectionSlug === "promo" ? normalizedKakao : null,
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
      sectionSlug: sectionSlug ?? undefined,
      categoryHref: category.href,
    });

    if (sectionSlug === "promo" && post.storeName) {
      await revalidatePromoStoreTimeline(post.storeName);
    }

    return apiSuccess({ id: post.id }, 201);
  } catch (err) {
    log("error", "posts create failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return apiError("게시글 등록 중 오류가 발생했습니다.", 500);
  }
}
