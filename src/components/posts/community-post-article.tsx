import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getAuthorDisplayName } from "@/lib/community";
import { PostCommentsSession } from "@/components/posts/post-comments-session";
import { PostOwnerActions } from "@/components/posts/post-owner-actions";
import { PostContent } from "@/components/posts/post-content";
import { PostImageGallery } from "@/components/posts/post-image-gallery";
import { RegionBadge } from "@/components/region/region-badge";
import { AdSenseUnit } from "@/components/ads/adsense-unit";
import { PostActionBar } from "@/components/posts/post-action-bar";
import { SendMessageButton } from "@/components/messages/send-message-button";
import { ReportContentButton } from "@/components/posts/report-content-button";
import type { Post, PostAttachment, Comment, User } from "@/generated/prisma/client";

type PostWithRelations = Post & {
  category: {
    label: string;
    colorClass: string;
    href: string;
    parent: { label: string; href: string } | null;
  };
  author: Pick<User, "id" | "name"> | null;
  attachments: PostAttachment[];
  comments: (Comment & { author: Pick<User, "name"> | null })[];
};

type CommunityPostArticleProps = {
  post: PostWithRelations;
};

export function CommunityPostArticle({ post }: CommunityPostArticleProps) {
  const authorName = getAuthorDisplayName(post);
  const images = post.attachments.filter((a) => a.kind === "IMAGE");
  const files = post.attachments.filter((a) => a.kind === "FILE");
  const isGuestPost = Boolean(post.guestPasswordHash && !post.authorId);

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

        <h1 className="mt-1.5 text-base font-bold leading-snug lg:text-xl">
          {post.title}
        </h1>

        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
          <p>
            {post.publishedAt.toLocaleString("ko-KR", {
              timeZone: "Asia/Ho_Chi_Minh",
            })}
            {authorName && ` · ${authorName}`}
            {` · 조회 ${post.views + 1}`}
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
          <PostContent
            content={post.content}
            className="mt-3 text-sm leading-relaxed text-gray-800"
          />
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
      </article>
    </>
  );
}
