import Link from "next/link";
import { auth } from "@/auth";
import { NewsIngestPanel } from "@/components/admin/news-ingest-panel";
import { HomeYoutubePanel } from "@/components/admin/home-youtube-panel";
import { SearchReindexPanel } from "@/components/admin/search-reindex-panel";
import { StatsCards } from "@/components/admin/stats-cards";
import { formatDailyCapLabel } from "@/lib/news/daily-cap";
import { getDatabaseKind, prisma } from "@/lib/prisma";

export default async function AdminDashboardPage() {
  const session = await auth();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalUsers, adminCount, todaySignups, newsToday, recentUsers] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "ADMIN" } }),
      prisma.user.count({ where: { createdAt: { gte: today } } }),
      prisma.post.count({
        where: { isAutomated: true, ingestedAt: { gte: today } },
      }),
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      }),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">관리자 대시보드</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          안녕하세요, {session?.user?.name}님
        </p>
      </div>

      <StatsCards
        totalUsers={totalUsers}
        adminCount={adminCount}
        todaySignups={todaySignups}
      />

      <HomeYoutubePanel />

      <NewsIngestPanel dailyCapLabel={formatDailyCapLabel()} />

      <SearchReindexPanel databaseKind={getDatabaseKind()} />

      <p className="text-sm text-muted-foreground">
        수집 이력·오류 로그는{" "}
        <Link href="/admin/ingest" className="font-medium text-primary hover:underline">
          뉴스 수집 관제
        </Link>
        에서 확인하세요.
      </p>

      <p className="text-xs text-muted-foreground">
        오늘 자동 수집된 뉴스: {newsToday}건 (일일 상한 {formatDailyCapLabel()})
      </p>

      <section className="rounded-2xl bg-surface">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-semibold">최근 가입 회원</h2>
        </div>
        <ul className="divide-y divide-border">
          {recentUsers.map((user) => (
            <li
              key={user.id}
              className="flex items-center justify-between px-5 py-3"
            >
              <div>
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-muted-foreground">
                  {user.role === "ADMIN" ? "관리자" : "일반"}
                </span>
                <p className="text-xs text-muted-foreground">
                  {user.createdAt.toLocaleDateString("ko-KR")}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
