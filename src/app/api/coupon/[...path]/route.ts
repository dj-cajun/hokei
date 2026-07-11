import { auth } from "@/auth";
import { COUPON_API_URL } from "@/lib/coupon/config";
import { hokeiSessionHeaders } from "@/lib/coupon/headers";
import {
  handleCouponRequest,
  useInProcessCouponApi,
} from "@/lib/coupon/server";
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

function buildProxyHeaders(
  req: NextRequest,
  session: { user?: { id: string; email?: string | null; name?: string | null } } | null,
) {
  const headers: Record<string, string> = {
    "Content-Type": req.headers.get("content-type") ?? "application/json",
  };

  if (session?.user?.id) {
    Object.assign(headers, hokeiSessionHeaders(session.user));
  }

  const agencyAuth = req.headers.get("authorization");
  if (agencyAuth) headers.Authorization = agencyAuth;

  const staffToken = req.headers.get("x-staff-token");
  if (staffToken) headers["X-Staff-Token"] = staffToken;

  return headers;
}

function jsonResponse(
  status: number,
  body: unknown,
  extraHeaders?: Record<string, string>,
) {
  const response = NextResponse.json(body, { status });
  if (extraHeaders) {
    for (const [key, value] of Object.entries(extraHeaders)) {
      response.headers.set(key, value);
    }
  }
  return response;
}

async function handleRequest(req: NextRequest, pathSegments: string[]) {
  const path = pathSegments.join("/");
  const denied = await assertAdminCouponAccess(path);
  if (denied) return denied;

  if (useInProcessCouponApi()) {
    const body =
      req.method !== "GET" && req.method !== "HEAD"
        ? await req.json().catch(() => ({}))
        : undefined;

    const headerRecord: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      headerRecord[key] = value;
    });

    const result = await handleCouponRequest(
      req.method,
      path,
      headerRecord,
      body,
      req.nextUrl.searchParams,
    );

    return jsonResponse(result.status, result.body, result.headers);
  }

  const url = `${COUPON_API_URL}/${path}${req.nextUrl.search}`;
  const session = await auth();
  const headers = buildProxyHeaders(req, session);

  const bodyText =
    req.method !== "GET" && req.method !== "HEAD"
      ? await req.text()
      : undefined;

  const res = await fetch(url, {
    method: req.method,
    headers,
    body: bodyText || undefined,
    cache: "no-store",
  });

  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("content-type") ?? "application/json",
    },
  });
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const { path } = await ctx.params;
  return handleRequest(req, path);
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const { path } = await ctx.params;
  return handleRequest(req, path);
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const { path } = await ctx.params;
  return handleRequest(req, path);
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const { path } = await ctx.params;
  return handleRequest(req, path);
}
