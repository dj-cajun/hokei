export type AdSenseSlotKind = "home" | "article" | "feed";

const SLOT_ENV_KEYS: Record<AdSenseSlotKind, string> = {
  home: "NEXT_PUBLIC_ADSENSE_SLOT_HOME",
  article: "NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE",
  feed: "NEXT_PUBLIC_ADSENSE_SLOT_FEED",
};

/** 미설정 시 상위 슬롯으로 폴백 (AdSense에서 슬롯 2~3개만 써도 동작) */
const SLOT_FALLBACK: Partial<Record<AdSenseSlotKind, AdSenseSlotKind>> = {
  feed: "home",
};

export function getAdSenseClientId(): string | undefined {
  return process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim() || undefined;
}

export function getAdSenseSlot(kind: AdSenseSlotKind): string | undefined {
  const direct = process.env[SLOT_ENV_KEYS[kind]]?.trim();
  if (direct) return direct;

  const fallbackKind = SLOT_FALLBACK[kind];
  if (!fallbackKind) return undefined;

  return process.env[SLOT_ENV_KEYS[fallbackKind]]?.trim() || undefined;
}

export function isAdSenseEnabled(): boolean {
  return Boolean(getAdSenseClientId());
}
