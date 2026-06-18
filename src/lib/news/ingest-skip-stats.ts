/** ingest 오류 메시지에서 스킵 사유 코드 추출 — `[regex_short]` 등 */
export function parseSkipReasonFromMessage(message: string): string | null {
  const m = message.match(/\[([a-z_]+)\]/);
  return m?.[1] ?? null;
}

export function aggregateSkipReasons(
  messages: string[]
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const message of messages) {
    const reason = parseSkipReasonFromMessage(message) ?? "other";
    counts[reason] = (counts[reason] ?? 0) + 1;
  }
  return counts;
}

export type IngestErrorDetailsPayload = {
  meta?: Record<string, unknown>;
  issues?: { message: string; at?: string }[];
  skipStats?: Record<string, number>;
};

export function parseIngestErrorDetails(
  raw: string | null | undefined
): IngestErrorDetailsPayload | null {
  if (!raw?.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as IngestErrorDetailsPayload;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}
