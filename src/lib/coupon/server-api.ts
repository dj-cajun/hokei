import { auth } from "@/auth";
import { COUPON_API_URL, useInProcessCouponApi } from "./config";
import { hokeiSessionHeaders } from "./headers";
import { handleCouponRequest } from "./server";

export async function couponServerFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const session = await auth();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string>),
  };

  if (session?.user?.id) {
    Object.assign(headers, hokeiSessionHeaders(session.user));
  }

  const normalizedPath = path.replace(/^\//, "");

  if (useInProcessCouponApi()) {
    const method = init?.method ?? "GET";
    let body: unknown;
    if (init?.body) {
      body =
        typeof init.body === "string" ? JSON.parse(init.body) : init.body;
    }

    const result = await handleCouponRequest(method, normalizedPath, headers, body);
    if (result.status >= 400) {
      const err = (result.body ?? {}) as { message?: string };
      throw new Error(err.message ?? `Coupon API ${result.status}`);
    }
    return result.body as T;
  }

  const res = await fetch(`${COUPON_API_URL}${path.startsWith("/") ? path : `/${path}`}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(err.message ?? `Coupon API ${res.status}`);
  }

  return res.json() as Promise<T>;
}
