import { notFound, redirect } from "next/navigation";
import { WriteForm } from "@/components/write/write-form";
import { slugifyStoreName } from "@/lib/admin/publish-curated-trade";
import { getWritableCategories } from "@/lib/categories";
import { isUserBoardPost } from "@/lib/community";
import { getPartnerStoreBySlugAnyStatus } from "@/lib/partner/queries";
import { canModifyPost } from "@/lib/post-permissions";
import { getPostById } from "@/lib/posts";

export const metadata = {
  title: "글 수정 - 호케이",
};

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ returnTo?: string }>;
}

function resolveReturnHref(
  returnTo: string | undefined,
  partnerSlug: string | undefined
): string | undefined {
  const trimmed = returnTo?.trim();
  if (trimmed?.startsWith("/") && !trimmed.startsWith("//")) {
    return trimmed;
  }
  if (partnerSlug) {
    return `/promo/timeline/${partnerSlug}`;
  }
  return undefined;
}

export default async function EditPostPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { returnTo } = await searchParams;
  const [post, categories] = await Promise.all([
    getPostById(id),
    getWritableCategories(),
  ]);

  if (!post || !isUserBoardPost(post.sourceUrl)) notFound();

  const isGuestPost = !post.authorId && Boolean(post.guestPasswordHash);
  const canModify = await canModifyPost(post, {});

  if (!canModify && !isGuestPost) {
    redirect(`/posts/${id}`);
  }

  const storeName = post.storeName?.trim() || undefined;
  const partnerStore = storeName
    ? await getPartnerStoreBySlugAnyStatus(slugifyStoreName(storeName))
    : null;

  return (
    <div className="mx-auto min-h-[100dvh] w-full max-w-[480px] bg-surface">
      <WriteForm
        mode="edit"
        postId={id}
        pageTitle={storeName ? `${storeName} · 타임라인 수정` : "글 수정"}
        categories={categories}
        sectionSlug={storeName ? "promo" : undefined}
        lockedStoreName={storeName}
        successRedirectHref={resolveReturnHref(
          returnTo,
          partnerStore?.slug
        )}
        initial={{
          categoryId: post.categoryId,
          title: post.title,
          body: post.content ?? "",
          region: post.region,
          attachments: post.attachments.map((a) => ({
            url: a.url,
            fileName: a.fileName,
            mimeType: a.mimeType,
            size: a.size,
            kind: a.kind,
          })),
        }}
      />
    </div>
  );
}
