#!/usr/bin/env tsx
/**
 * PartnerStore.ownerId 부여 (쿠폰 SSO · 결제 후 쪽지)
 *
 * STORE_SLUG=2d-sketch-cafe OWNER_EMAIL=owner@example.com npm run coupon:grant-owner
 */
import { prisma } from "../src/lib/prisma";

async function main() {
  const slug = process.env.STORE_SLUG?.trim();
  const email = process.env.OWNER_EMAIL?.trim().toLowerCase();

  if (!slug) {
    console.error("STORE_SLUG 환경 변수가 필요합니다. (예: 2d-sketch-cafe)");
    process.exit(1);
  }
  if (!email) {
    console.error("OWNER_EMAIL 환경 변수가 필요합니다.");
    process.exit(1);
  }

  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true, name: true, email: true },
  });
  if (!user) {
    console.error(`호케이 회원 없음: ${email}`);
    process.exit(1);
  }

  const store = await prisma.partnerStore.findUnique({
    where: { slug },
    select: { id: true, name: true, ownerId: true },
  });
  if (!store) {
    console.error(`PartnerStore 없음: ${slug}`);
    console.error("  → 호케이에 업소 페이지가 먼저 있어야 합니다.");
    process.exit(1);
  }

  await prisma.partnerStore.update({
    where: { slug },
    data: { ownerId: user.id },
  });

  console.log(`[coupon:grant-owner] OK`);
  console.log(`  업소: ${store.name} (${slug})`);
  console.log(`  owner: ${user.name} <${user.email}>`);
  console.log(`  Partner 쿠폰: /account/partner/coupon`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
