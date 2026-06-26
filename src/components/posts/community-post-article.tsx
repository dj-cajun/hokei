import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getAuthorDisplayName } from "@/lib/community";
import { PostCrawlContactBar, PostCrawlNotice } from "@/components/posts/post-crawl-notice";
import { PostCommentsSession } from "@/components/posts/post-comments-session";
import { PostOwnerActions } from "@/components/posts/post-owner-actions";
import { PostTimelineBody } from "@/components/posts/post-timeline-body";
import { PostCopyGuard } from "@/components/posts/post-copy-guard";
import { PostImageGallery } from "@/components/posts/post-image-gallery";
import { RegionBadge } from "@/components/region/region-badge";
import { AdSenseUnit } from "@/components/ads/adsense-unit";
import { PostActionBar } from "@/components/posts/post-action-bar";
import { SendMessageButton } from "@/components/messages/send-message-button";
import { ReportContentButton } from "@/components/posts/report-content-button";
import { PostNextPostsSection } from "@/components/posts/post-next-posts-section";
import type { Post, PostAttachment, Comment, User } from "@/generated/prisma/client";
import type { FeedItem } from "@/types/feed";

type PostWithRelations = Post & {
  category: {
    label: string;
    colorClass: string;
    href: string;
    parent: { label: string; href: string; slug?: string } | null;
  };
  author: Pick<User, "id" | "name"> | null;
  attachments: PostAttachment[];
  comments: (Comment & { author: Pick<User, "name"> | null })[];
};

type CommunityPostArticleProps = {
  post: PostWithRelations;
  nextPosts?: FeedItem[];
};

export function CommunityPostArticle({ post, nextPosts = [] }: CommunityPostArticleProps) {
  const authorName = getAuthorDisplayName(post);
  const images = post.attachments.filter((a) => a.kind === "IMAGE");
  const files = post.attachments.filter((a) => a.kind === "FILE");
  const isGuestPost = Boolean(post.guestPasswordHash && !post.authorId);
  const sectionSlug = post.category.parent?.slug ?? null;

  return (
    <>
      <nav className="mb-1 flex flex-wrap items-center gap-1 px-1 text-[11px] text-muted-foreground">
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

      <article className="bg-surface px-2 py-3 lg:rounded-2xl lg:p-8">
        <div className="flex flex-wrap items-center gap-1">
          <span
            className={`rounded-sm px-1.5 py-0.5 text-[10px] font-medium ${post.category.colorClass}`}
          >
            {post.category.label}
          </span>
          {post.isNotice && (
            <span className="rounded-sm bg-[#0f172a] px-1.5 py-0.5 text-[10px] font-medium text-white">
              공지
            </span>
          )}
          <RegionBadge region={post.region} />
        </div>

        <PostCopyGuard>
          <h1 className="mt-1.5 text-base font-bold leading-snug lg:text-xl">
            {post.title}
          </h1>
        </PostCopyGuard>

        <PostCrawlNotice isCrawl={post.isCrawl} sectionSlug={sectionSlug} />
        <PostCrawlContactBar
          isCrawl={post.isCrawl}
          storeName={post.storeName}
          kakaoLink={post.kakaoLink}
          content={post.content}
          sourceName={post.sourceName}
          sectionSlug={sectionSlug}
        />

        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
          <p>
            {authorName && `${authorName} · `}
            {`조회 ${post.views + 1}`}
          </p>
          <PostActionBar
            postId={post.id}
            title={post.title}
            likeCount={post.likeCount ?? 0}
          />
        </div>

        {post.authorId && post.author && (
          <div className="mt-2">
            <SendMessageButton
              recipientId={post.authorId}
              recipientName={post.author.name}
              postId={post.id}
            />
          </div>
        )}

        {images.length > 0 && <PostImageGallery images={images} />}

        {post.content && (
          <PostCopyGuard>
            <PostTimelineBody
              publishedAt={post.publishedAt}
              content={post.content}
              authorName={authorName}
            />
          </PostCopyGuard>
        )}

        <AdSenseUnit slotKind="article" />

        {files.length > 0 && (
          <ul className="mt-3 space-y-1 border-t border-border-light pt-3">
            {files.map((f) => (
              <li key={f.id}>
                <a
                  href={f.url}
                  download={f.fileName}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  📎 {f.fileName}
                </a>
              </li>
            ))}
          </ul>
        )}

        <PostOwnerActions
          postId={post.id}
          authorId={post.authorId}
          isGuestPost={isGuestPost}
        />

        <div className="mt-2 border-t border-border-light pt-2">
          <ReportContentButton targetType="POST" targetId={post.id} />
        </div>

        <PostCommentsSession postId={post.id} comments={post.comments} />

        <PostNextPostsSection
          categoryLabel={post.category.label}
          categoryHref={post.category.href}
          items={nextPosts}
        />
      </article>
    </>
  );
}
