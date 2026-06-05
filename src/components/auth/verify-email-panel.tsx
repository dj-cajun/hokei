"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/providers/toast-provider";
import { parseApiError } from "@/lib/api-response";

export function VerifyEmailPanel() {
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const initialEmail = searchParams.get("email") ?? "";
  const error = searchParams.get("error");

  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);

  async function handleResend(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(parseApiError(data) ?? "재발송 실패", "error");
        return;
      }
      showToast(
        data.devLogged
          ? "개발 모드: 서버 로그에 인증 링크가 출력되었습니다."
          : "인증 메일을 보냈습니다. 메일함을 확인해 주세요."
      );
    } catch {
      showToast("요청 처리 중 오류가 발생했습니다.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-primary">
        <Mail className="h-5 w-5" />
        <p className="text-sm font-medium">이메일 인증이 필요합니다</p>
      </div>

      {error === "expired" && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          인증 링크가 만료되었습니다. 아래에서 인증 메일을 다시 받아 주세요.
        </p>
      )}
      {error === "invalid" && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          유효하지 않은 인증 링크입니다. 인증 메일을 다시 요청해 주세요.
        </p>
      )}

      <p className="text-sm text-muted-foreground">
        가입 시 입력한 이메일로 인증 링크를 보냈습니다. 메일함(스팸함 포함)에서
        링크를 클릭한 뒤 로그인해 주세요.
      </p>

      <form onSubmit={handleResend} className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="verify-email">이메일</Label>
          <Input
            id="verify-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          인증 메일 다시 받기
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        인증을 마쳤나요?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          로그인
        </Link>
      </p>
    </div>
  );
}
