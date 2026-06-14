import { NextResponse } from "next/server";
import { getGeneratedPrismaActiveProvider } from "@/lib/prisma-generated-provider";
import { PRISMA_DATASOURCE_PROVIDER } from "@/lib/prisma-datasource";
import { getDatabaseKind } from "@/lib/prisma";
import { getPostById } from "@/lib/posts";

export const dynamic = "force-dynamic";

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  return request.headers.get("x-cron-secret") === secret;
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const id =
    new URL(request.url).searchParams.get("id") ??
    "cmqcnt4430000h4h7o4n0k0hn";

  const meta = {
    marker: PRISMA_DATASOURCE_PROVIDER,
    generated: getGeneratedPrismaActiveProvider(),
    runtime: getDatabaseKind(),
    vercel: process.env.VERCEL === "1",
  };

  try {
    const post = await getPostById(id);
    return NextResponse.json({
      ok: true,
      meta,
      found: Boolean(post),
      title: post?.title?.slice(0, 80) ?? null,
      category: post?.category?.label ?? null,
    });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json(
      {
        ok: false,
        meta,
        id,
        error: err.message,
        stack: err.stack?.split("\n").slice(0, 8),
      },
      { status: 500 }
    );
  }
}
