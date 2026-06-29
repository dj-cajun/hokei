import { auth } from "@/auth";
import { COUPON_API_URL } from "./config";
import { hokeiSessionHeaders } from "./headers";

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

  const res = await fetch(`${COUPON_API_URL}${path}`, {
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
