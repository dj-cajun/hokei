import { NextResponse } from "next/server";
import { fetchNaverNewsSearchPreview } from "@/lib/news/naver-scrape";

export const dynamic = "force-dynamic";

const DEFAULT_QUERY = "호치민 한인";

/**
 * 네이버 뉴스 검색 미리보기 (Open API 없이 Python 스크래퍼)
 * GET /api/news?q=호치민+한인&limit=5
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") ?? DEFAULT_QUERY).trim() || DEFAULT_QUERY;
  const limit = Math.min(
    10,
    Math.max(1, Number.parseInt(searchParams.get("limit") ?? "5", 10) || 5)
  );

  try {
    const items = await fetchNaverNewsSearchPreview(query, limit);

    if (items.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          query,
          items: [],
          hint:
            "pip3 install -r scripts/python/requirements.txt 후 재시도. Playwright 폴백은 npm run news:scrape:setup",
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      ok: true,
      query,
      count: items.length,
      items,
      source: "naver-scrape (requests → playwright fallback)",
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        query,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
