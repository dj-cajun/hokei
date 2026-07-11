const TZ = "Asia/Ho_Chi_Minh";

/** 베트남 현지 기준 오늘 00:00 ~ 내일 00:00 (UTC Date) */
export function getVietnamDayBounds(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const y = parts.find((p) => p.type === "year")?.value ?? "1970";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  const d = parts.find((p) => p.type === "day")?.value ?? "01";

  const start = new Date(`${y}-${m}-${d}T00:00:00+07:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end, dateLabel: `${y}-${m}-${d}` };
}

export function formatVietnamDateLabel(now = new Date()): string {
  return getVietnamDayBounds(now).dateLabel;
}
