import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { ViewCounter } from "@/components/posts/view-counter";
import { CommunityPostArticle } from "@/components/posts/community-post-article";
import { NewsPostClientBlocks } from "@/components/posts/news-post-client-blocks";
import { PostNextPostsSection } from "@/components/posts/post-next-posts-section";
import { PostCopyGuard } from "@/components/posts/post-copy-guard";
import { PostTimelineBody } from "@/components/posts/post-timeline-body";
import { PostCommentsSession } from "@/components/posts/post-comments-session";
import { PostOutlinkCta } from "@/components/posts/post-outlink-cta";
import { AdSenseUnit } from "@/components/ads/adsense-unit";
import { isCommunityPost, isUserBoardPost } from "@/lib/community";
import { getNextPostsInBoard, getPostById } from "@/lib/posts";
import { sanitizeNewsPostTitle } from "@/lib/news/source-display";
import { isOfficialNoticeSource } from "@/lib/news/official-notice-feeds";
import { isNaverNewsAggregatorLink } from "@/lib/news/naver-news";
import { getFallbackThumbnail } from "@/lib/news/default-thumbnails";
import { ArticleJsonLd } from "@/components/seo/article-json-ld";
import type { PostTopic } from "@/lib/post-topic";
import { resolveSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const post = await getPostById(id, { includeHiddenComments: false });
  if (!post || post.moderationStatus !== "VISIBLE") {
    return { title: "호케이 Hokei" };
  }
  const description = (post.content ?? post.title)
    .replace(/\n/g, " ")
    .slice(0, 160);
  const ogImage =
    post.thumbnail?.trim() || getFallbackThumbnail(post.topic);
  const displayTitle = isCommunityPost(post.sourceUrl)
    ? post.title
    : sanitizeNewsPostTitle(post.title, {
        sourceName: post.sourceName,
        sourceUrl: post.sourceUrl,
      });
  const canonical = `${resolveSiteUrl()}/posts/${id}`;
  return {
    title: `${displayTitle} - 호케이 Hokei`,
    description,
    alternates: { canonical },
    openGraph: {
      title: displayTitle,
      description,
      url: canonical,
      type: "article",
      locale: "ko_KR",
      siteName: "호케이 Hokei",
      images: [{ url: ogImage, alt: displayTitle }],
    },
    twitter: {
      card: "summary_large_image",
      title: displayTitle,
      description,
      images: [ogImage],
    },
  };
}

function serializeComments(
  comments: NonNullable<Awaited<ReturnType<typeof getPostById>>>["comments"]
) {
  return comments.map((c) => ({
    id: c.id,
    parentId: c.parentId,
    content: c.content,
    createdAt: c.createdAt.toISOString(),
    authorId: c.authorId,
    guestName: c.guestName,
    guestPasswordHash: c.guestPasswordHash,
    author: c.author,
  }));
}

export default async function PostPage({ params }: PageProps) {
  const { id } = await params;
  const post = await getPostById(id, { includeHiddenComments: false });

  if (!post) notFound();
  if (post.moderationStatus !== "VISIBLE") notFound();

  const description = (post.content ?? post.title)
    .replace(/\n/g, " ")
    .slice(0, 160);
  const comments = serializeComments(post.comments);
  const community = isUserBoardPost(post.sourceUrl);
  const nextPosts = await getNextPostsInBoard(post.id, post.categoryId);
  const displayTitle = community
    ? post.title
    : sanitizeNewsPostTitle(post.title, {
        sourceName: post.sourceName,
        sourceUrl: post.sourceUrl,
      });

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col gap-1 px-2 py-2 lg:max-w-6xl lg:flex-row lg:gap-6 lg:px-4 lg:py-6">
      <ArticleJsonLd
        id={post.id}
        title={displayTitle}
        description={description}
        publishedAt={post.publishedAt}
        thumbnail={post.thumbnail}
        authorName={post.author?.name}
      />
      <ViewCounter postId={id} />
      <Sidebar />
      <div className="min-w-0 flex-1">
        {community ? (
          <CommunityPostArticle post={post} nextPosts={nextPosts} />
        ) : (
          <article className="bg-surface px-2 py-3 lg:rounded-2xl lg:p-8">
            <nav className="mb-1 flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground">
              <Link href="/" className="hover:text-primary">
                홈
              </Link>
              {post.category.parent && (
                <>
                  <ChevronRight className="h-3 w-3" />
                  <Link
                    href={post.category.parent.href}
                    className="hover:text-primary"
                  >
                    {post.category.parent.label}
                  </Link>
                </>
              )}
              <ChevronRight className="h-3 w-3" />
              <Link href={post.category.href} className="hover:text-primary">
                {post.category.label}
              </Link>
            </nav>

            <PostCopyGuard>
              <h1 className="mt-1.5 text-base font-bold leading-snug lg:text-xl">
                {displayTitle}
              </h1>
            </PostCopyGuard>

            <p className="mt-1.5 text-[11px] text-muted-foreground">
              조회 {post.views}
            </p>

            <NewsPostClientBlocks
              postId={post.id}
              title={displayTitle}
              likeCount={post.likeCount ?? 0}
              thumbnail={post.thumbnail}
              sourceUrl={post.sourceUrl}
              sourceName={post.sourceName}
              topic={post.topic as PostTopic}
              showThumbnail={Boolean(post.thumbnail || post.isAutomated)}
            />

            {post.content ? (
              <PostCopyGuard>
                <PostTimelineBody
                  publishedAt={post.publishedAt}
                  content={post.content}
                />
              </PostCopyGuard>
            ) : isNaverNewsAggregatorLink(post.sourceUrl) ? (
              <p className="mt-3 text-sm text-muted-foreground">
                네이버 뉴스 요약만 제공됩니다. 원문 링크에서 전체 내용을 확인해
                주세요.
              </p>
            ) : null}

            {post.sourceUrl.startsWith("http") &&
            (post.isOutlink ||
              (post.content &&
                isOfficialNoticeSource(
                  post.sourceName ?? undefined,
                  post.sourceUrl
                ))) ? (
              <PostOutlinkCta
                sourceUrl={post.sourceUrl}
                sourceName={post.sourceName}
                withFullBody={Boolean(post.content) && !post.isOutlink}
              />
            ) : null}

            <AdSenseUnit slotKind="article" />
            <PostCommentsSession postId={post.id} comments={comments} />
            <PostNextPostsSection
              categoryLabel={post.category.label}
              categoryHref={post.category.href}
              items={nextPosts}
            />
          </article>
        )}
      </div>
    </div>
  );
}
