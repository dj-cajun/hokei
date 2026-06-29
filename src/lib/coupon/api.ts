import { COUPON_API_URL, AGENCY_TOKEN_KEY, STAFF_TOKEN_KEY } from "./config";
import type { HokeiUserHeaders } from "./types";

function getAgencyToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AGENCY_TOKEN_KEY);
}

function getStaffToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STAFF_TOKEN_KEY);
}

export async function couponFetch<T>(
  path: string,
  init?: RequestInit & { user?: HokeiUserHeaders; agency?: boolean },
): Promise<T> {
  const isBrowser = typeof window !== "undefined";
  const base = isBrowser ? "/api/coupon" : COUPON_API_URL;
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string>),
  };

  if (!isBrowser && init?.user?.userId) {
    headers["X-User-Id"] = init.user.userId;
    if (init.user.email) headers["X-User-Email"] = init.user.email;
    if (init.user.name) headers["X-User-Name"] = init.user.name;
  }

  if (init?.agency) {
    const token = getAgencyToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    const staffToken = getStaffToken();
    if (staffToken) headers["X-Staff-Token"] = staffToken;
  }

  const res = await fetch(`${base}/${normalizedPath}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as {
      message?: string;
      code?: string;
    };
    const error = new Error(err.message ?? `Coupon API error ${res.status}`);
    (error as Error & { code?: string }).code = err.code;
    throw error;
  }

  return res.json() as Promise<T>;
}

export function saveAgencyToken(token: string) {
  localStorage.setItem(AGENCY_TOKEN_KEY, token);
}

export function clearAgencyToken() {
  localStorage.removeItem(AGENCY_TOKEN_KEY);
}

export function saveStaffToken(token: string) {
  localStorage.setItem(STAFF_TOKEN_KEY, token);
}

export function clearStaffToken() {
  localStorage.removeItem(STAFF_TOKEN_KEY);
}

export function getStoredStaffSession(): {
  token: string;
  staff: StaffSessionDto;
} | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem(STAFF_TOKEN_KEY);
  const raw = localStorage.getItem(`${STAFF_TOKEN_KEY}_profile`);
  if (!token || !raw) return null;
  try {
    return { token, staff: JSON.parse(raw) as StaffSessionDto };
  } catch {
    return null;
  }
}

export function saveStaffSession(staffToken: string, staff: StaffSessionDto) {
  saveStaffToken(staffToken);
  localStorage.setItem(`${STAFF_TOKEN_KEY}_profile`, JSON.stringify(staff));
}

export function clearStaffSession() {
  clearStaffToken();
  localStorage.removeItem(`${STAFF_TOKEN_KEY}_profile`);
}

export type StaffSessionDto = {
  id: string;
  name: string;
  role: "cashier" | "scanner" | "manager";
};

export { COUPON_API_URL };
