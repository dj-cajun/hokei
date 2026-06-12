"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/providers/toast-provider";
import { parseApiError } from "@/lib/api-response";
import { cn } from "@/lib/utils";
import type { Role } from "@/generated/prisma/client";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
}

interface UsersTableProps {
  users: AdminUser[];
  currentUserId: string;
}

export function UsersTable({ users, currentUserId }: UsersTableProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function updateRole(userId: string, role: Role) {
    setLoadingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (res.ok) {
        showToast("권한이 변경되었습니다.");
        router.refresh();
      } else {
        const data = await res.json();
        showToast(parseApiError(data) ?? "변경 실패", "error");
      }
    } finally {
      setLoadingId(null);
    }
  }

  async function deleteUser(userId: string, name: string) {
    if (!confirm(`'${name}' 회원을 삭제하시겠습니까?`)) return;
    setLoadingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        showToast("회원이 삭제되었습니다.");
        router.refresh();
      } else {
        const data = await res.json();
        showToast(parseApiError(data) ?? "삭제 실패", "error");
      }
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="px-4 py-3 font-medium">이름</th>
              <th className="px-4 py-3 font-medium">이메일</th>
              <th className="px-4 py-3 font-medium">권한</th>
              <th className="px-4 py-3 font-medium">가입일</th>
              <th className="px-4 py-3 font-medium">관리</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const isSelf = user.id === currentUserId;
              const isLoading = loadingId === user.id;

              return (
                <tr
                  key={user.id}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-4 py-3 font-medium">{user.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {user.email}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-block rounded-md px-2 py-0.5 text-xs font-medium",
                        user.role === "ADMIN"
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-secondary text-muted-foreground"
                      )}
                    >
                      {user.role === "ADMIN" ? "관리자" : "일반"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString("ko-KR")}
                  </td>
                  <td className="px-4 py-3">
                    {isSelf ? (
                      <span className="text-xs text-muted-foreground">
                        본인
                      </span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <select
                          value={user.role}
                          disabled={isLoading}
                          onChange={(e) =>
                            updateRole(user.id, e.target.value as Role)
                          }
                          className="rounded-lg border border-border bg-surface px-2 py-1 text-xs"
                        >
                          <option value="USER">일반</option>
                          <option value="ADMIN">관리자</option>
                        </select>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          disabled={isLoading}
                          onClick={() => deleteUser(user.id, user.name)}
                          aria-label={`${user.name} 삭제`}
                        >
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {users.length === 0 && (
        <p className="p-8 text-center text-sm text-muted-foreground">
          등록된 회원이 없습니다.
        </p>
      )}
    </div>
  );
}
