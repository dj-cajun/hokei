import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, ExternalLink } from "lucide-react";
import { NewsThumbnail } from "@/components/news/thumbnail";
import { Sidebar } from "@/components/layout/sidebar";
import { CommunityPostArticle } from "@/components/posts/community-post-article";
import { PostComments } from "@/components/posts/post-comments";
import { ViewCounter } from "@/components/posts/view-counter";
import { mapPostComments } from "@/lib/map-post-comments";
import { auth } from "@/auth";
import { isCommunityPost } from "@/lib/community";
import { getPostById } from "@/lib/posts";
import { isNaverNewsAggregatorLink } from "@/lib/news/naver-news";
import { formatPostSourceLabel } from "@/lib/news/source-display";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const post = await getPostById(id);
  if (!post) return { title: "호케이 Hokei" };
  return {
    title: `${post.title} - 호케이 Hokei`,
    description: (post.content ?? post.title).replace(/\n/g, " ").slice(0, 160),
  };
}

export default async function PostPage({ params }: PageProps) {
  const { id } = await params;
  const [post, session] = await Promise.all([getPostById(id), auth()]);

  if (!post) notFound();

  const isCommunity = isCommunityPost(post.sourceUrl);

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col gap-1 px-2 py-2 lg:max-w-6xl lg:flex-row lg:gap-6 lg:px-4 lg:py-6">
      <ViewCounter postId={id} />
      <Sidebar />
      <main className="min-w-0 flex-1">
        {isCommunity ? (
          <CommunityPostArticle
            post={post}
            sessionUserId={session?.user?.id}
            isAdmin={session?.user?.role === "ADMIN"}
          />
        ) : (
          <NewsPostArticle
            post={post}
            sessionUserId={session?.user?.id}
            isAdmin={session?.user?.role === "ADMIN"}
          />
        )}
      </main>
    </div>
  );
}

function NewsPostArticle({
  post,
  sessionUserId,
  isAdmin,
}: {
  post: NonNullable<Awaited<ReturnType<typeof getPostById>>>;
  sessionUserId?: string;
  isAdmin?: boolean;
}) {
  const sourceLabel = formatPostSourceLabel(post.sourceName);
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
        </div>

        <h1 className="mt-1.5 text-base font-bold leading-snug lg:text-xl">
          {post.title}
        </h1>

        {post.thumbnail && (
          <div className="relative mt-2 aspect-[16/9] w-full overflow-hidden rounded-sm">
            <NewsThumbnail
              src={post.thumbnail}
              sourceUrl={post.sourceUrl}
              topic={post.topic}
              className="aspect-[16/9] w-full rounded-sm object-cover"
            />
          </div>
        )}

        <p className="mt-1.5 text-[11px] text-gray-400">
          {post.publishedAt.toLocaleString("ko-KR", {
            timeZone: "Asia/Ho_Chi_Minh",
          })}{" "}
          · 조회 {post.views}
          {sourceLabel && ` · ${sourceLabel}`}
        </p>

        {post.content ? (
          <div className="mt-3 whitespace-pre-wrap text-sm leading-snug text-foreground">
            {post.content}
          </div>
        ) : isNaverNewsAggregatorLink(post.sourceUrl) ? (
          <p className="mt-3 text-sm leading-snug text-gray-400">
            네이버 뉴스 요약만 제공됩니다. 아래 원문 링크에서 전체 내용을 확인해
            주세요.
          </p>
        ) : null}

        {!isCommunityPost(post.sourceUrl) && (
          <a
            href={post.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            원문 보기
            <ExternalLink className="h-4 w-4" />
          </a>
        )}

        <PostComments postId={post.id} initialComments={initialComments} />
      </article>
    </>
  );
}
