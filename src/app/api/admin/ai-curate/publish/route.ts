import { enforcePreset } from "@/lib/api/enforce-rate-limit";
import { apiError, apiSuccess } from "@/lib/api-response";
import { writeAdminAudit } from "@/lib/admin/audit-log";
import { publishCuratedTradePost, updateCuratedTradePost } from "@/lib/admin/publish-curated-trade";
import { requireAdminApi } from "@/lib/admin/require-admin-api";
import { curateKakaoPublishSchema } from "@/lib/ai/curate-kakao-schemas";
import { POST_CURATE_TYPES } from "@/lib/ai/curate-category-map";
import { classifyCurateItems } from "@/lib/ai/curate-item-dedupe";
import { PUBLISHABLE_CURATE_TYPES } from "@/lib/ai/curate-kakao-types";
import { slugifyLifeTitle } from "@/lib/life/slugify-title";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const limited = await enforcePreset(request, "general");
  if (limited) return limited;
  const { session, error } = await requireAdminApi();
  if (error) return error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("잘못된 JSON입니다.", 400);
  }

  const parsed = curateKakaoPublishSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "입력값 오류", 400);
  }

  const data = parsed.data;

  if (!PUBLISHABLE_CURATE_TYPES.includes(data.contentType)) {
    return apiError(`${data.contentType}는 아직 발행할 수 없습니다.`, 400);
  }

  if (data.updatePostId) {
    try {
      const result = await updateCuratedTradePost(data.updatePostId, {
        title: data.title,
        body: (data.mergedBody ?? data.body).trim(),
        kakaoLink: data.kakaoLink,
        region: data.region,
        imageUrl: data.imageUrl,
      });
      await writeAdminAudit({
        actorId: session!.user!.id,
        action: "AI_CURATE_UPDATE",
        targetType: "Post",
        targetId: result.id,
        request,
      });
      return apiSuccess({
        kind: "post",
        updated: true,
        item: { id: result.id, href: result.href },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "업데이트 실패";
      return apiError(message, 400);
    }
  }

  if (data.guideUpdateId && data.contentType === "VIETNAMESE_STUDY") {
    const guide = await prisma.lifeGuide.update({
      where: { id: data.guideUpdateId },
      data: {
        title: data.title,
        vnText: data.vnText ?? undefined,
        body: (data.mergedBody ?? data.body).trim(),
        publishedAt: new Date(),
      },
    });
    await writeAdminAudit({
      actorId: session!.user!.id,
      action: "AI_CURATE_UPDATE",
      targetType: "LifeGuide",
      targetId: guide.id,
      request,
    });
    return apiSuccess({
      kind: "life",
      updated: true,
      item: { id: guide.id, slug: guide.slug, href: `/life/${guide.slug}` },
    });
  }

  const classified = await classifyCurateItems([
    {
      contentType: data.contentType,
      title: data.title,
      vnText: data.vnText,
      body: data.body,
      categorySlug: data.categorySlug,
      storeName: data.storeName,
      kakaoLink: data.kakaoLink,
      region: data.region,
      sourceLabel: data.sourceLabel,
    },
  ]);

  if (
    classified.newItems.length === 0 &&
    classified.updateItems.length === 0 &&
    classified.lifeUpdateItems.length === 0
  ) {
    return apiError("이미 타임라인에 동일한 글이 있습니다.", 409);
  }

  if (classified.updateItems.length > 0 || classified.lifeUpdateItems.length > 0) {
    return apiError(
      "기존 글에 추가 내용이 있습니다. 「타임라인 반영」으로 업데이트하세요.",
      409
    );
  }

  if (data.contentType === "VIETNAMESE_STUDY") {
    const slug = data.slug ?? slugifyLifeTitle(data.title);
    const existing = await prisma.lifeGuide.findUnique({ where: { slug } });
    if (existing) {
      return apiError("이미 사용 중인 slug입니다.", 409);
    }

    const item = await prisma.lifeGuide.create({
      data: {
        slug,
        kind: "PHRASE",
        domain: "STUDY",
        title: data.title,
        vnText: data.vnText ?? null,
        body: data.body,
        imageUrl: data.imageUrl ?? null,
        sourceLabel: data.sourceLabel ?? "카톡 단톡방",
        isCrawl: data.isCrawl,
      },
    });

    await writeAdminAudit({
      actorId: session!.user!.id,
      action: "AI_CURATE_PUBLISH",
      targetType: "LifeGuide",
      targetId: item.id,
      request,
    });

    return apiSuccess({
      kind: "life",
      item: { id: item.id, slug: item.slug, href: `/life/${item.slug}` },
    });
  }

  if (!POST_CURATE_TYPES.includes(data.contentType)) {
    return apiError("지원하지 않는 유형입니다.", 400);
  }

  if (data.contentType === "PROMO" && !data.storeName?.trim()) {
    return apiError("업소 홍보는 업체명(storeName)이 필요합니다.", 400);
  }

  try {
    const result = await publishCuratedTradePost({
      title: data.title,
      body: data.body,
      contentType: data.contentType,
      categorySlug: data.categorySlug,
      authorId: session!.user!.id,
      imageUrl: data.imageUrl,
      storeName: data.storeName,
      kakaoLink: data.kakaoLink,
      region: data.region,
      sourceLabel: data.sourceLabel,
      isCrawl: data.isCrawl,
    });

    await writeAdminAudit({
      actorId: session!.user!.id,
      action: "AI_CURATE_PUBLISH",
      targetType: "Post",
      targetId: result.id,
      request,
    });

    return apiSuccess({
      kind: "post",
      item: { id: result.id, href: result.href },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "발행 실패";
    return apiError(message, 400);
  }
}
