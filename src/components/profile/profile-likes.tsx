import Link from "next/link";
import { getUserLikedPosts } from "@/lib/profile";

export async function ProfileLikes({ userId }: { userId: string }) {
  const likes = await getUserLikedPosts(userId);

  if (likes.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        좋아요한 글이 없습니다.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border-light">
      {likes.map((like) => (
        <li key={like.id}>
          <Link
            href={`/posts/${like.post.id}`}
            className="block px-1 py-3 transition-colors hover:bg-card-hover"
          >
            <p className="line-clamp-2 text-sm font-medium">{like.post.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {like.post.category.label} ·{" "}
              {like.createdAt.toLocaleDateString("ko-KR", {
                timeZone: "Asia/Ho_Chi_Minh",
              })}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
