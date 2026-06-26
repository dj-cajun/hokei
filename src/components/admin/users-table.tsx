"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/providers/toast-provider";
import { parseApiError } from "@/lib/api-response";
import { cn } from "@/lib/utils";
import type { Role } from "@/generated/prisma/client";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  emailVerified: string | null;
  createdAt: string;
  postCount: number;
  commentCount: number;
}

interface UsersTableProps {
  users: AdminUser[];
  currentUserId: string;
}

export function UsersTable({ users, currentUserId }: UsersTableProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }, [users, query]);

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
    if (
      !confirm(
        `「${name}」 회원을 삭제할까요?\n작성 글·댓글 등 연결 데이터도 함께 삭제될 수 있습니다.`
      )
    ) {
      return;
    }
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
    <div className="space-y-3">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="이름·이메일 검색"
          className="pl-9"
        />
      </div>

      <div className="overflow-hidden rounded-2xl bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="px-4 py-3 font-medium">이름</th>
                <th className="px-4 py-3 font-medium">이메일</th>
                <th className="px-4 py-3 font-medium">인증</th>
                <th className="px-4 py-3 font-medium">활동</th>
                <th className="px-4 py-3 font-medium">권한</th>
                <th className="px-4 py-3 font-medium">가입일</th>
                <th className="px-4 py-3 font-medium">관리</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => {
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
                          user.emailVerified
                            ? "bg-green-50 text-green-700"
                            : "bg-amber-50 text-amber-800"
                        )}
                      >
                        {user.emailVerified ? "인증됨" : "미인증"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      글 {user.postCount} · 댓글 {user.commentCount}
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
        {filtered.length === 0 && (
          <p className="p-8 text-center text-sm text-muted-foreground">
            {users.length === 0
              ? "등록된 회원이 없습니다."
              : "검색 결과가 없습니다."}
          </p>
        )}
      </div>
    </div>
  );
}
