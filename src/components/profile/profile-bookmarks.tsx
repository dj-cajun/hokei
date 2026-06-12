import Link from "next/link";
import { getUserBookmarks } from "@/lib/bookmarks";

export async function ProfileBookmarks({ userId }: { userId: string }) {
  const bookmarks = await getUserBookmarks(userId);

  if (bookmarks.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        스크랩한 글이 없습니다. 마음에 드는 글에서 🔖 버튼을 눌러 보세요.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border-light">
      {bookmarks.map((b) => (
        <li key={b.id}>
          <Link
            href={`/posts/${b.post.id}`}
            className="block px-1 py-3 transition-colors hover:bg-card-hover"
          >
            <p className="line-clamp-2 text-sm font-medium">{b.post.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {b.post.category.label} ·{" "}
              {b.post.publishedAt.toLocaleDateString("ko-KR", {
                timeZone: "Asia/Ho_Chi_Minh",
              })}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
