"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleOneTap } from "@/components/auth/google-one-tap";
import { SocialLoginSection } from "@/components/auth/social-login-section";
import { useToast } from "@/components/providers/toast-provider";
import { parseApiError } from "@/lib/api-response";

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
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const callbackUrl =
    callbackUrlProp ?? searchParams.get("callbackUrl") ?? "/";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "signup") {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(parseApiError(data) ?? "회원가입에 실패했습니다.");
          return;
        }
        showToast("회원가입이 완료되었습니다.");
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(
          mode === "signup"
            ? "가입은 완료됐지만 로그인에 실패했습니다. 로그인 페이지에서 다시 시도해 주세요."
            : "이메일 또는 비밀번호가 올바르지 않습니다."
        );
        return;
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push(callbackUrl);
      }
      router.refresh();
    } catch {
      setError("요청 처리 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {mode === "login" && !embedded && <GoogleOneTap enabled />}
      {!embedded && <SocialLoginSection mode={mode} />}
      <form onSubmit={handleSubmit} className="space-y-4">
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

      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {mode === "login" ? "로그인" : "회원가입"}
      </Button>

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
