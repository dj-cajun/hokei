import { revalidatePath } from "next/cache";

/** 홈·허브·배너·LP — admin/owner 저장 후 공통 invalidation */
export function revalidatePartnerPublicPaths(
  ...storeSlugs: (string | null | undefined)[]
) {
  revalidatePath("/");
  revalidatePath("/partners");
  for (const raw of storeSlugs) {
    const slug = raw?.trim();
    if (slug) revalidatePath(`/store/${slug}`);
  }
}
