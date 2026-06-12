"use client";

const KEY = "hokei-recent-searches";
const MAX = 8;

export function getRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is string => typeof v === "string").slice(0, MAX);
  } catch {
    return [];
  }
}

export function saveRecentSearch(query: string) {
  const trimmed = query.trim();
  if (!trimmed) return;
  try {
    const prev = getRecentSearches().filter((q) => q !== trimmed);
    localStorage.setItem(
      KEY,
      JSON.stringify([trimmed, ...prev].slice(0, MAX))
    );
  } catch {
    /* ignore */
  }
}

export function clearRecentSearches() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
