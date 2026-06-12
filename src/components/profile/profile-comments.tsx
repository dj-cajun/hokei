import Link from "next/link";
import { getUserComments } from "@/lib/profile";

export async function ProfileComments({ userId }: { userId: string }) {
  const comments = await getUserComments(userId);

  if (comments.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        작성한 댓글이 없습니다.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border-light">
      {comments.map((comment) => (
        <li key={comment.id}>
          <Link
            href={`/posts/${comment.post.id}`}
            className="block px-1 py-3 transition-colors hover:bg-card-hover"
          >
            <p className="line-clamp-2 text-sm">{comment.content}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {comment.post.title} ·{" "}
              {comment.createdAt.toLocaleDateString("ko-KR", {
                timeZone: "Asia/Ho_Chi_Minh",
              })}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
