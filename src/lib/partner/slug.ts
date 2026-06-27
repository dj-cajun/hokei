import { slugifyStoreName } from "@/lib/admin/publish-curated-trade";
import { PARTNER_SLUG_MAX, PARTNER_SLUG_MIN } from "@/lib/partner/slugify-name";

export { PARTNER_SLUG_MIN, PARTNER_SLUG_MAX } from "@/lib/partner/slugify-name";

/** lowercase ASCII, digits, hyphens (no leading/trailing hyphen) */
export const PARTNER_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** 가게명 → URL slug (ASCII kebab). 한글만이면 slugifyStoreName 폴백 후 ASCII 정규화 */
export function slugifyPartnerName(name: string): string {
  const ascii = name
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, PARTNER_SLUG_MAX);

  if (ascii.length >= PARTNER_SLUG_MIN) {
    return ascii;
  }

  const fallback = slugifyStoreName(name)
    .replace(/[^a-z0-9-]/gi, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, PARTNER_SLUG_MAX);

  return fallback.length >= PARTNER_SLUG_MIN ? fallback : "store";
}

export function isValidPartnerSlug(slug: string): boolean {
  const trimmed = slug.trim();
  return (
    trimmed.length >= PARTNER_SLUG_MIN &&
    trimmed.length <= PARTNER_SLUG_MAX &&
    PARTNER_SLUG_RE.test(trimmed)
  );
}

export function normalizePartnerSlug(input: string): string {
  return slugifyPartnerName(input);
}

/** slug 충돌 시 `-2`, `-3` … suffix */
export async function resolveUniquePartnerSlug(
  baseName: string,
  isTaken: (slug: string) => boolean | Promise<boolean>
): Promise<string> {
  const base = slugifyPartnerName(baseName);
  if (!(await isTaken(base))) {
    return base;
  }

  for (let n = 2; n < 100; n++) {
    const suffix = `-${n}`;
    const maxBaseLen = PARTNER_SLUG_MAX - suffix.length;
    const candidate = `${base.slice(0, maxBaseLen)}${suffix}`;
    if (!(await isTaken(candidate))) {
      return candidate;
    }
  }

  throw new Error("Partner slug collision exhausted");
}
