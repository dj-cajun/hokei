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
      createdAt: true,
    },
  });

  const serialized = users.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">회원 관리</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          총 {users.length}명 · 권한 변경 및 계정 삭제
        </p>
      </div>

      <UsersTable
        users={serialized}
        currentUserId={session!.user.id}
      />
    </div>
  );
}
