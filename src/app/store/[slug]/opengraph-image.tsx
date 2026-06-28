import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { PARTNER_CATEGORY_LABELS } from "@/lib/partner/labels";
import { getPartnerStoreBySlugCached } from "@/lib/partner/queries";

export const runtime = "nodejs";
export const alt = "호케이 제휴 업소";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

let fontDataPromise: Promise<ArrayBuffer> | null = null;

async function loadPretendardFont(): Promise<ArrayBuffer> {
  if (!fontDataPromise) {
    fontDataPromise = readFile(
      join(
        process.cwd(),
        "node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2"
      )
    ).then((buffer) =>
      buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
    );
  }
  return fontDataPromise;
}

function truncateLine(text: string | null | undefined, maxLen: number): string | null {
  const trimmed = text?.replace(/\s+/g, " ").trim();
  if (!trimmed) return null;
  if (trimmed.length <= maxLen) return trimmed;
  return `${trimmed.slice(0, maxLen - 1)}…`;
}

export default async function StoreOpenGraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const store = await getPartnerStoreBySlugCached(slug);
  const fontData = await loadPretendardFont();

  const name = store?.name?.trim() || "제휴 업소";
  const categoryLabel = store ? PARTNER_CATEGORY_LABELS[store.category] : "제휴 업소";
  const tagline = truncateLine(store?.tagline ?? store?.introText, 72);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(145deg, #f8fbff 0%, #eef4ff 55%, #ffffff 100%)",
          padding: "64px 72px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "#0064ff",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              fontWeight: 700,
              fontFamily: "Pretendard",
            }}
          >
            H
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 600,
              color: "#0064ff",
              fontFamily: "Pretendard",
            }}
          >
            호케이 Hokei
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              alignSelf: "flex-start",
              borderRadius: 999,
              background: "rgba(0, 100, 255, 0.12)",
              color: "#0064ff",
              fontSize: 24,
              fontWeight: 600,
              padding: "10px 22px",
              fontFamily: "Pretendard",
            }}
          >
            {categoryLabel}
          </div>
          <div
            style={{
              fontSize: name.length > 18 ? 64 : 76,
              fontWeight: 800,
              lineHeight: 1.15,
              color: "#111827",
              letterSpacing: "-0.02em",
              fontFamily: "Pretendard",
            }}
          >
            {name}
          </div>
          {tagline ? (
            <div
              style={{
                fontSize: 30,
                lineHeight: 1.4,
                color: "#4b5563",
                fontFamily: "Pretendard",
              }}
            >
              {tagline}
            </div>
          ) : null}
        </div>

        <div
          style={{
            fontSize: 22,
            color: "#9ca3af",
            fontFamily: "Pretendard",
          }}
        >
          hokei.vn/store/{store?.slug ?? slug}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Pretendard",
          data: fontData,
          style: "normal",
          weight: 400,
        },
        {
          name: "Pretendard",
          data: fontData,
          style: "normal",
          weight: 600,
        },
        {
          name: "Pretendard",
          data: fontData,
          style: "normal",
          weight: 700,
        },
        {
          name: "Pretendard",
          data: fontData,
          style: "normal",
          weight: 800,
        },
      ],
    }
  );
}
