"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useAuthSessionSync } from "@/hooks/use-auth-session-sync";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SocialLoginSection } from "@/components/auth/social-login-section";
import { useToast } from "@/components/providers/toast-provider";
import { parseApiError } from "@/lib/api-response";
import { isSocialPlaceholderEmail } from "@/lib/auth/oauth-email";
import { safeCallbackPath } from "@/lib/auth/safe-callback-url";

interface AuthFormProps {
  mode: "login" | "signup";
  /** 로그인 모달 등 — URL 쿼리 대신 직접 지정 */
  callbackUrl?: string;
  onSuccess?: () => void;
  /** 모달 안에서는 원탭·상단 소셜 블록 생략 */
  embedded?: boolean;
}

export function AuthForm({
  mode,
  callbackUrl: callbackUrlProp,
  onSuccess,
  embedded = false,
}: AuthFormProps) {
  const router = useRouter();
  const { completeLogin } = useAuthSessionSync();
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const callbackUrl = safeCallbackPath(
    callbackUrlProp ?? searchParams.get("callbackUrl")
  );
  const verified = mode === "login" && searchParams.get("verified") === "1";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "signup") {
        if (password !== confirmPassword) {
          setError("비밀번호가 일치하지 않습니다.");
          return;
        }

        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password, confirmPassword }),
        });
        const data = (await res.json()) as {
          error?: string;
          message?: string;
          devLogged?: boolean;
          requiresVerification?: boolean;
        };
        if (!res.ok) {
          setError(parseApiError(data) ?? "회원가입에 실패했습니다.");
          return;
        }

        if (data.devLogged) {
          showToast("개발 모드: 서버 로그에 인증 링크가 출력되었습니다.");
        } else {
          showToast("인증 메일을 보냈습니다. 메일함을 확인해 주세요.");
        }

        router.push(
          `/verify-email?email=${encodeURIComponent(email.toLowerCase().trim())}`
        );
        return;
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        if (isSocialPlaceholderEmail(email)) {
          setError(
            "이 계정은 구글 간편 로그인으로 가입되었습니다. 구글 버튼을 이용해 주세요."
          );
        } else {
          setError(
            "이메일 또는 비밀번호가 올바르지 않습니다. 이메일 인증을 완료했는지 확인해 주세요."
          );
        }
        return;
      }

      showToast("로그인이 완료되었습니다.");
      await completeLogin({
        callbackUrl,
        onSuccess,
        refreshServer: true,
      });
    } catch {
      setError("요청 처리 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {!embedded && (
        <SocialLoginSection mode={mode} callbackUrl={callbackUrl} />
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
      {verified && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          이메일 인증이 완료되었습니다. 로그인해 주세요.
        </p>
      )}

      {mode === "signup" && (
        <div className="space-y-2">
          <Label htmlFor="name">이름</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="홍길동"
            required
            minLength={2}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">이메일</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          autoComplete="email"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">비밀번호</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={mode === "signup" ? "8자 이상, 영문+숫자" : "••••••••"}
          required
          minLength={mode === "signup" ? 8 : 1}
          autoComplete={
            mode === "signup" ? "new-password" : "current-password"
          }
        />
      </div>

      {mode === "signup" && (
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">비밀번호 확인</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="비밀번호 다시 입력"
            required
            minLength={8}
            autoComplete="new-password"
          />
        </div>
      )}

      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {mode === "login" ? "로그인" : "회원가입"}
      </Button>

      {mode === "login" && (
        <p className="text-center text-sm text-muted-foreground">
          인증 메일을 받지 못하셨나요?{" "}
          <Link
            href="/verify-email"
            className="font-medium text-primary hover:underline"
          >
            인증 메일 다시 받기
          </Link>
        </p>
      )}

      <p className="text-center text-sm text-muted-foreground">
        {mode === "login" ? (
          <>
            계정이 없으신가요?{" "}
            <Link href="/signup" className="font-medium text-primary hover:underline">
              회원가입
            </Link>
          </>
        ) : (
          <>
            이미 계정이 있으신가요?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              로그인
            </Link>
          </>
        )}
      </p>
    </form>
    </div>
  );
}
