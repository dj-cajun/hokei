type StoreCopyFields = {
  introText?: string | null;
  tagline?: string | null;
  description?: string | null;
  address?: string | null;
  hoursText?: string | null;
  menuText?: string | null;
};

/** 소개 본문 — introText 우선, description에서 주소·영업 중복 줄 제거 */
export function storeIntroBody(store: StoreCopyFields): string | null {
  if (store.introText?.trim()) {
    return store.introText.trim();
  }

  const desc = store.description?.trim();
  if (!desc) {
    return store.tagline?.trim() || null;
  }

  const addr = store.address?.trim();
  const hours = store.hoursText?.trim();

  const lines = desc.split("\n").filter((line) => {
    const t = line.trim();
    if (!t) return false;
    if (addr && (t.includes(addr) || /^📍/.test(t))) return false;
    if (hours && (/^🕐/.test(t) || t.includes("영업"))) return false;
    if (store.menuText?.trim() && /^메뉴|^Menu/i.test(t)) return false;
    return true;
  });

  const body = lines.join("\n").trim();
  return body || store.tagline?.trim() || null;
}

/** tagline은 intro와 같으면 숨김 */
export function storeTaglineDisplay(
  store: StoreCopyFields
): string | null {
  const tag = store.tagline?.trim();
  if (!tag) return null;
  const intro = storeIntroBody(store);
  if (intro && intro.includes(tag)) return null;
  if (intro === tag) return null;
  return tag;
}
