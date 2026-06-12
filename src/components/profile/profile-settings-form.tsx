"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { socialSignOut } from "@/lib/auth/social-sign-out";
import { parseApiError } from "@/lib/api-response";
import { Button } from "@/components/ui/button";

type ProfileSettingsFormProps = {
  initialName: string;
  initialAvatarUrl: string;
  email: string;
  canChangePassword: boolean;
};

export function ProfileSettingsForm({
  initialName,
  initialAvatarUrl,
  email,
  canChangePassword,
}: ProfileSettingsFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function saveProfile() {
    setBusy("profile");
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, avatarUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(parseApiError(data) ?? "저장에 실패했습니다.");
        return;
      }
      setMessage("프로필이 저장되었습니다. 헤더 이름은 재로그인 후 반영됩니다.");
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function changePassword() {
    setBusy("password");
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/profile/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(parseApiError(data) ?? "비밀번호 변경에 실패했습니다.");
        return;
      }
      setMessage("비밀번호가 변경되었습니다.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } finally {
      setBusy(null);
    }
  }

  async function deleteAccount() {
    if (deleteConfirm !== "탈퇴") {
      setError('확인란에 "탈퇴"를 입력해 주세요.');
      return;
    }
    if (!window.confirm("정말 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
      return;
    }
    setBusy("delete");
    setError(null);
    try {
      const res = await fetch("/api/profile", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(parseApiError(data) ?? "탈퇴에 실패했습니다.");
        return;
      }
      await socialSignOut({ callbackUrl: "/" });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-8">
      {message && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
          {message}
        </p>
      )}
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">프로필 수정</h3>
        <label className="block text-xs text-muted-foreground">
          이메일 (변경 불가)
          <input
            type="email"
            value={email}
            disabled
            className="mt-1 w-full rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm opacity-70"
          />
        </label>
        <label className="block text-xs text-muted-foreground">
          닉네임
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={30}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-xs text-muted-foreground">
          아바타 이미지 URL
          <input
            type="url"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://..."
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
        <Button
          type="button"
          onClick={() => void saveProfile()}
          disabled={busy !== null}
        >
          {busy === "profile" ? "저장 중…" : "프로필 저장"}
        </Button>
      </section>

      {canChangePassword && (
        <section className="space-y-3 border-t border-border-light pt-6">
          <h3 className="text-sm font-semibold">비밀번호 변경</h3>
          <label className="block text-xs text-muted-foreground">
            현재 비밀번호
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              autoComplete="current-password"
            />
          </label>
          <label className="block text-xs text-muted-foreground">
            새 비밀번호
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              autoComplete="new-password"
            />
          </label>
          <label className="block text-xs text-muted-foreground">
            새 비밀번호 확인
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              autoComplete="new-password"
            />
          </label>
          <Button
            type="button"
            variant="outline"
            onClick={() => void changePassword()}
            disabled={busy !== null}
          >
            {busy === "password" ? "변경 중…" : "비밀번호 변경"}
          </Button>
        </section>
      )}

      <section className="space-y-3 border-t border-border-light pt-6">
        <h3 className="text-sm font-semibold text-red-600">회원 탈퇴</h3>
        <p className="text-xs text-muted-foreground">
          탈퇴 시 작성 글·댓글 등 모든 활동 기록이 삭제됩니다.
        </p>
        <label className="block text-xs text-muted-foreground">
          확인 (탈퇴 입력)
          <input
            type="text"
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder="탈퇴"
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
        <Button
          type="button"
          variant="destructive"
          onClick={() => void deleteAccount()}
          disabled={busy !== null}
        >
          {busy === "delete" ? "처리 중…" : "회원 탈퇴"}
        </Button>
      </section>
    </div>
  );
}
