import type { PartnerEventType } from "@/generated/prisma/client";

/** LP·배너 클릭·조회 — fire-and-forget */
export function trackPartnerEvent(
  slug: string,
  eventType: PartnerEventType
): void {
  const trimmed = slug.trim();
  if (!trimmed) return;

  void fetch("/api/partner/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug: trimmed, eventType }),
    keepalive: true,
  }).catch(() => {
    /* ignore */
  });
}
