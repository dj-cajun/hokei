"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, Loader2, Search, Trash2 } from "lucide-react";
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
  isSuspended: boolean;
  writeBanned: boolean;
  emailVerified: string | null;
  createdAt: string;
  postCount: number;
  commentCount: number;
}

interface UsersTableProps {
  users: AdminUser[];
  currentUserId: string;
}

type PatchBody = {
  role?: Role;
  writeBanned?: boolean;
  isSuspended?: boolean;
};

function accountStatusLabel(user: AdminUser) {
  if (user.isSuspended) return "계정 정지";
  if (user.writeBanned) return "글쓰기 금지";
  return "정상";
}

function accountStatusClass(user: AdminUser) {
  if (user.isSuspended) return "bg-red-50 text-red-700";
  if (user.writeBanned) return "bg-orange-50 text-orange-800";
  return "bg-green-50 text-green-700";
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

  async function patchUser(userId: string, body: PatchBody, success: string) {
    setLoadingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        showToast(success);
        router.refresh();
      } else {
        const data = await res.json();
        showToast(parseApiError(data) ?? "변경 실패", "error");
      }
    } finally {
      setLoadingId(null);
    }
  }

  async function updateRole(userId: string, role: Role) {
    await patchUser(userId, { role }, "권한이 변경되었습니다.");
  }

  async function toggleWriteBan(user: AdminUser) {
    const next = !user.writeBanned;
    const ok = confirm(
      next
        ? `「${user.name}」 회원의 글쓰기를 금지할까요?`
        : `「${user.name}」 회원의 글쓰기 제한을 해제할까요?`
    );
    if (!ok) return;
    await patchUser(
      user.id,
      { writeBanned: next },
      next ? "글쓰기가 금지되었습니다." : "글쓰기 제한이 해제되었습니다."
    );
  }

  async function toggleSuspend(user: AdminUser) {
    const next = !user.isSuspended;
    const ok = confirm(
      next
        ? `「${user.name}」 회원을 정지할까요?\n로그인·글쓰기가 모두 차단됩니다.`
        : `「${user.name}」 회원 정지를 해제할까요?`
    );
    if (!ok) return;
    await patchUser(
      user.id,
      { isSuspended: next },
      next ? "계정이 정지되었습니다." : "계정 정지가 해제되었습니다."
    );
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
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="px-4 py-3 font-medium">이름</th>
                <th className="px-4 py-3 font-medium">이메일</th>
                <th className="px-4 py-3 font-medium">상태</th>
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
                          accountStatusClass(user)
                        )}
                      >
                        {accountStatusLabel(user)}
                      </span>
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
                        <div className="flex flex-wrap items-center gap-1.5">
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
                            variant="outline"
                            size="sm"
                            className="h-8 px-2 text-xs"
                            disabled={isLoading || user.isSuspended}
                            onClick={() => void toggleWriteBan(user)}
                          >
                            {user.writeBanned ? "글쓰기 허용" : "글쓰기 금지"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className={cn(
                              "h-8 px-2 text-xs",
                              user.isSuspended &&
                                "border-red-200 text-red-600 hover:bg-red-50"
                            )}
                            disabled={isLoading}
                            onClick={() => void toggleSuspend(user)}
                          >
                            <Ban className="mr-1 h-3.5 w-3.5" />
                            {user.isSuspended ? "정지 해제" : "계정 정지"}
                          </Button>
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
