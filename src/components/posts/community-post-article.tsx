import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { getAuthorDisplayName } from "@/lib/community";
import { PostComments } from "@/components/posts/post-comments";
import { PostOwnerActions } from "@/components/posts/post-owner-actions";
import { mapPostComments } from "@/lib/map-post-comments";
import { isPostOwner } from "@/lib/post-permissions";
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
  sessionUserId?: string;
  isAdmin?: boolean;
};

export function CommunityPostArticle({
  post,
  sessionUserId,
  isAdmin,
}: CommunityPostArticleProps) {
  const authorName = getAuthorDisplayName(post);
  const images = post.attachments.filter((a) => a.kind === "IMAGE");
  const files = post.attachments.filter((a) => a.kind === "FILE");
  const canEditAsUser =
    isAdmin || isPostOwner(post, sessionUserId);
  const isGuestPost = Boolean(post.guestPasswordHash && !post.authorId);

  const initialComments = mapPostComments(
    post.comments,
    sessionUserId,
    isAdmin
  );

  return (
    <>
      <nav className="mb-1 flex flex-wrap items-center gap-1 px-1 text-[11px] text-gray-400">
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

      <article className="bg-white px-2 py-3 lg:rounded-2xl lg:p-8">
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
        </div>

        <h1 className="mt-1.5 text-base font-bold leading-snug lg:text-xl">
          {post.title}
        </h1>

        <p className="mt-1.5 text-[11px] text-gray-400">
          {post.publishedAt.toLocaleString("ko-KR", {
            timeZone: "Asia/Ho_Chi_Minh",
          })}
          {authorName && ` · ${authorName}`}
          {` · 조회 ${post.views + 1}`}
        </p>

        {images.length > 0 && (
          <div className="mt-3 space-y-2">
            {images.map((img) => (
                <Image
                  key={img.id}
                  src={img.url}
                  alt={img.fileName}
                  width={480}
                  height={320}
                  unoptimized
                  className="h-auto w-full rounded-sm object-cover"
                />
            ))}
          </div>
        )}

        {post.content && (
          <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
            {post.content}
          </div>
        )}

        {files.length > 0 && (
          <ul className="mt-3 space-y-1 border-t border-gray-100 pt-3">
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
          canEditAsUser={canEditAsUser}
          isGuestPost={isGuestPost}
        />

        <PostComments postId={post.id} initialComments={initialComments} />
      </article>
    </>
  );
}
