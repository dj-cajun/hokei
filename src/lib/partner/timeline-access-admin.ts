import { parsePartnerStoreSlugFromInput } from "@/lib/partner/parse-store-url";
import { resolveOwnerAccountInput } from "@/lib/partner/owner";
import { revalidatePartnerPublicPaths } from "@/lib/partner/revalidate-paths";
import { prisma } from "@/lib/prisma";

export type TimelineAccessActionResult =
  | {
      ok: true;
      store: { id: string; slug: string; name: string };
      user: { id: string; email: string; name: string } | null;
    }
  | { ok: false; message: string };

export async function grantPartnerStoreTimelineAccess(
  storeInput: string,
  userInput: string
): Promise<TimelineAccessActionResult> {
  const slug = parsePartnerStoreSlugFromInput(storeInput);
  if (!slug) {
    return {
      ok: false,
      message:
        "업소 주소 형식이 올바르지 않습니다. 예: /store/2d-sketch-cafe 또는 https://www.hokei.vn/store/2d-sketch-cafe",
    };
  }

  const user = await resolveOwnerAccountInput(userInput);
  if (!user) {
    return { ok: false, message: "해당 회원 ID·이메일을 찾을 수 없습니다." };
  }

  const store = await prisma.partnerStore.findUnique({
    where: { slug },
    select: { id: true, slug: true, name: true, ownerId: true },
  });
  if (!store) {
    return { ok: false, message: `업소(/store/${slug})를 찾을 수 없습니다.` };
  }

  const otherStore = await prisma.partnerStore.findFirst({
    where: {
      ownerId: user.id,
      id: { not: store.id },
      status: { not: "ARCHIVED" },
    },
    select: { slug: true, name: true },
  });
  if (otherStore) {
    return {
      ok: false,
      message: `이미 ${otherStore.name}(/store/${otherStore.slug})에 연결된 계정입니다. 먼저 해제하세요.`,
    };
  }

  await prisma.partnerStore.update({
    where: { id: store.id },
    data: { ownerId: user.id },
  });

  revalidatePartnerPublicPaths(store.slug);

  return { ok: true, store, user };
}

export async function revokePartnerStoreTimelineAccess(
  storeInput: string
): Promise<TimelineAccessActionResult> {
  const slug = parsePartnerStoreSlugFromInput(storeInput);
  if (!slug) {
    return {
      ok: false,
      message:
        "업소 주소 형식이 올바르지 않습니다. 예: /store/2d-sketch-cafe",
    };
  }

  const store = await prisma.partnerStore.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      owner: { select: { id: true, email: true, name: true } },
    },
  });
  if (!store) {
    return { ok: false, message: `업소(/store/${slug})를 찾을 수 없습니다.` };
  }

  if (!store.owner) {
    return {
      ok: false,
      message: `${store.name}에는 연결된 사장님 계정이 없습니다.`,
    };
  }

  const previousUser = store.owner;

  await prisma.partnerStore.update({
    where: { id: store.id },
    data: { ownerId: null },
  });

  revalidatePartnerPublicPaths(store.slug);

  return {
    ok: true,
    store: { id: store.id, slug: store.slug, name: store.name },
    user: previousUser,
  };
}
