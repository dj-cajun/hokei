import { auth } from "@/auth";
import { COUPON_API_URL } from "@/lib/coupon/config";
import { hokeiSessionHeaders } from "@/lib/coupon/headers";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

async function assertAdminCouponAccess(path: string) {
  if (!path.startsWith("admin/")) return null;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (dbUser?.role !== "ADMIN") {
    return NextResponse.json({ message: "권한이 없습니다." }, { status: 403 });
  }

  return null;
}

async function proxy(req: NextRequest, pathSegments: string[]) {
  const path = pathSegments.join("/");
  const denied = await assertAdminCouponAccess(path);
  if (denied) return denied;
  const url = `${COUPON_API_URL}/${path}${req.nextUrl.search}`;

  const session = await auth();
  const headers: Record<string, string> = {
    "Content-Type": req.headers.get("content-type") ?? "application/json",
  };

  if (session?.user?.id) {
    Object.assign(headers, hokeiSessionHeaders(session.user));
  }

  const agencyAuth = req.headers.get("authorization");
  if (agencyAuth) headers.Authorization = agencyAuth;

  const body =
    req.method !== "GET" && req.method !== "HEAD"
      ? await req.text()
      : undefined;

  const res = await fetch(url, {
    method: req.method,
    headers,
    body: body || undefined,
    cache: "no-store",
  });

  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("content-type") ?? "application/json" },
  });
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const { path } = await ctx.params;
  return proxy(req, path);
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const { path } = await ctx.params;
  return proxy(req, path);
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const { path } = await ctx.params;
  return proxy(req, path);
}
