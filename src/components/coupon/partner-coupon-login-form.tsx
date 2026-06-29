"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { couponFetch, saveAgencyToken } from "@/lib/coupon/api";
import { PARTNER_COUPON_BASE } from "@/lib/coupon/config";

export function PartnerCouponLoginForm() {
  const router = useRouter();
  const [loginId, setLoginId] = useState("2d_sketch_cafe");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSso, setCheckingSso] = useState(true);

  useEffect(() => {
    fetch("/api/coupon/auth/partner-token", { method: "POST" })
      .then(async (res) => {
        if (!res.ok) return;
        const data = (await res.json()) as { token?: string };
        if (data.token) {
          saveAgencyToken(data.token);
          router.replace(`${PARTNER_COUPON_BASE}/scan`);
        }
      })
      .finally(() => setCheckingSso(false));
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await couponFetch<{
        success: boolean;
        token?: string;
        message?: string;
      }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ loginId, password }),
      });
      if (!res.success || !res.token) {
        setError(res.message ?? "로그인 실패");
        return;
      }
      saveAgencyToken(res.token);
      router.push(`${PARTNER_COUPON_BASE}/scan`);
    } catch {
      setError("로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {checkingSso ? (
        <p className="text-sm text-muted-foreground">호케이 계정 연동 확인 중...</p>
      ) : null}
      <input
        className="w-full rounded-lg border border-border px-3 py-2 text-sm"
        placeholder="아이디"
        value={loginId}
        onChange={(e) => setLoginId(e.target.value)}
      />
      <input
        type="password"
        className="w-full rounded-lg border border-border px-3 py-2 text-sm"
        placeholder="비밀번호"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="min-h-11 w-full rounded-lg bg-primary text-sm font-bold text-primary-foreground disabled:opacity-50"
      >
        {loading ? "로그인 중..." : "로그인"}
      </button>
      <p className="text-xs text-muted-foreground">
        제휴 업소 소유자는 호케이 로그인만으로 자동 연동됩니다. 아래는 데모·대리 로그인입니다.
      </p>
      <p className="text-xs text-muted-foreground">데모: 2d_sketch_cafe / password123</p>
      <Link href={PARTNER_COUPON_BASE} className="block text-center text-sm text-muted-foreground">
        ← 돌아가기
      </Link>
    </form>
  );
}
