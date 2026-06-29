"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { couponFetch, clearAgencyToken, saveAgencyToken } from "@/lib/coupon/api";
import { AGENCY_TOKEN_KEY, PARTNER_COUPON_BASE } from "@/lib/coupon/config";

type PartnerAuthState =
  | { status: "loading" }
  | { status: "ready"; agencyName?: string }
  | { status: "needs_login" };

function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AGENCY_TOKEN_KEY);
}

export function usePartnerCouponAuth() {
  const router = useRouter();
  const [state, setState] = useState<PartnerAuthState>({ status: "loading" });

  const ensureAuth = useCallback(async () => {
    setState({ status: "loading" });

    const existing = getStoredToken();
    if (existing) {
      try {
        await couponFetch("/dashboard/summary", { agency: true });
        setState({ status: "ready" });
        return true;
      } catch {
        clearAgencyToken();
      }
    }

    const res = await fetch("/api/coupon/auth/partner-token", { method: "POST" });
    if (res.ok) {
      const data = (await res.json()) as { token?: string; agencyName?: string };
      if (data.token) {
        saveAgencyToken(data.token);
        setState({ status: "ready", agencyName: data.agencyName });
        return true;
      }
    }

    if (res.status === 401 || res.status === 403) {
      setState({ status: "needs_login" });
      return false;
    }

    setState({ status: "needs_login" });
    return false;
  }, []);

  useEffect(() => {
    ensureAuth().then((ok) => {
      if (!ok) {
        router.replace(`${PARTNER_COUPON_BASE}/login`);
      }
    });
  }, [ensureAuth, router]);

  return { state, ensureAuth };
}
