import { auth } from "@/auth";
import { UsersTable } from "@/components/admin/users-table";
import { prisma } from "@/lib/prisma";

export default async function AdminUsersPage() {
  const session = await auth();

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isSuspended: true,
      writeBanned: true,
      emailVerified: true,
      createdAt: true,
      _count: { select: { posts: true, comments: true } },
    },
  });

  const serialized = users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    isSuspended: u.isSuspended,
    writeBanned: u.writeBanned,
    emailVerified: u.emailVerified?.toISOString() ?? null,
    createdAt: u.createdAt.toISOString(),
    postCount: u._count.posts,
    commentCount: u._count.comments,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">회원 관리</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          총 {users.length}명 · 권한 변경 · 글쓰기 제한 · 계정 정지 · 삭제
        </p>
      </div>

      <UsersTable
        users={serialized}
        currentUserId={session!.user.id}
      />
    </div>
  );
}
