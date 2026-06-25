import type { CurateKakaoItem } from "@/lib/ai/curate-kakao-schemas";

function formatVnd(n: number): string {
  return `${n.toLocaleString("ko-KR")} VND`;
}

const LISTING_LABELS: Record<string, string> = {
  RENT: "임대",
  SELL: "팝니다",
  BUY: "삽니다",
  HIRE: "구인",
  SEEK: "구직",
  PROMO: "홍보",
};

/** AI 추출 메타를 본문 하단에 정리 (필터·상세 표시용) */
export function enrichCurateBody(item: CurateKakaoItem): string {
  const lines: string[] = [item.body.trim()];
  const meta: string[] = [];

  if (item.region) meta.push(`- **지역:** ${item.region}`);
  if (item.priceVnd != null && item.priceVnd > 0) {
    meta.push(`- **가격:** ${formatVnd(item.priceVnd)}`);
  }
  if (item.listingIntent) {
    meta.push(
      `- **구분:** ${LISTING_LABELS[item.listingIntent] ?? item.listingIntent}`
    );
  }
  if (item.itemKind) meta.push(`- **종류:** ${item.itemKind}`);
  if (item.contactPhone) meta.push(`- **연락처:** ${item.contactPhone}`);
  if (item.contactKakaoId) {
    meta.push(`- **카톡 ID:** ${item.contactKakaoId}`);
  }
  if (item.kakaoLink) meta.push(`- **카톡 링크:** ${item.kakaoLink}`);
  if (item.senderName) meta.push(`- **발신:** ${item.senderName}`);
  if (item.messageAt) {
    try {
      const d = new Date(item.messageAt);
      if (!Number.isNaN(d.getTime())) {
        meta.push(
          `- **단톡 시각:** ${d.toLocaleString("ko-KR", { timeZone: "Asia/Ho_Chi_Minh" })}`
        );
      }
    } catch {
      /* ignore */
    }
  }

  if (meta.length > 0) {
    lines.push("", "---", "", ...meta);
  }

  return lines.join("\n");
}

export function enrichCurateTitle(item: CurateKakaoItem): string {
  const t = item.title.trim();
  if (item.contentType === "PROMO" && item.storeName) {
    const store = item.storeName.trim();
    if (!t.includes(store)) {
      return `[${store}] ${t}`;
    }
  }
  if (item.region && !t.includes(item.region)) {
    return `[${item.region}] ${t}`;
  }
  return t;
}
