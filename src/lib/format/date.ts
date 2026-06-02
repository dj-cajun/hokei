import { TIMEZONE } from "@/lib/constants";

function hoChiMinhDateKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** 목록용 날짜 (2026-06-01) — 서버 로컬 */
export function formatDateLabel(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** 호치민 기준 날짜 라벨 (수집일·아카이브 그룹용) */
export function formatDateLabelHoChiMinh(date: Date): string {
  return hoChiMinhDateKey(date);
}

/** 오늘 올라온 글 — N 뱃지용 */
export function isTodayInHoChiMinh(date: Date): boolean {
  return hoChiMinhDateKey(date) === hoChiMinhDateKey(new Date());
}

export function formatRelativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "방금 전";
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return formatDateLabelHoChiMinh(date);
}
