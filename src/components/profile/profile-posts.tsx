import Link from "next/link";
import { getUserPosts } from "@/lib/profile";

export async function ProfilePosts({ userId }: { userId: string }) {
  const posts = await getUserPosts(userId);

  if (posts.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        작성한 글이 없습니다.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border-light">
      {posts.map((post) => (
        <li key={post.id}>
          <Link
            href={`/posts/${post.id}`}
            className="block px-1 py-3 transition-colors hover:bg-card-hover"
          >
            <p className="line-clamp-2 text-sm font-medium">{post.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {post.category.label} ·{" "}
              {post.publishedAt.toLocaleDateString("ko-KR", {
                timeZone: "Asia/Ho_Chi_Minh",
              })}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
