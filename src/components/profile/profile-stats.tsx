import { getUserActivityStats } from "@/lib/profile";

export async function ProfileStats({ userId }: { userId: string }) {
  const stats = await getUserActivityStats(userId);

  const items = [
    { label: "작성 글", value: stats.posts },
    { label: "댓글", value: stats.comments },
    { label: "좋아요", value: stats.likes },
    { label: "스크랩", value: stats.bookmarks },
  ];

  return (
    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl bg-secondary/60 px-4 py-3 text-center"
        >
          <p className="text-lg font-bold text-foreground">{item.value}</p>
          <p className="text-xs text-muted-foreground">{item.label}</p>
        </div>
      ))}
    </div>
  );
}
