import "dotenv/config";
import { MENU, STORE } from "../coupon-pilot/packages/shared/src/store";
import { createPostgresPrisma } from "../src/lib/prisma-pg";
import bcrypt from "bcryptjs";

const DEMO_CAFE_MENU = [
  {
    id: "00000000-0000-4000-8000-000000000101",
    name: "에스프레소",
    price: 40000,
    description: "데모 업소 — 싱글 샷",
  },
  {
    id: "00000000-0000-4000-8000-000000000102",
    name: "바닐라 라떼",
    price: 52000,
    description: "데모 업소 — 바닐라 시럽",
  },
] as const;

const connectionString = process.env.DATABASE_URL?.trim() ?? "";
if (!connectionString.startsWith("postgres")) {
  console.error("[coupon:seed] DATABASE_URL=postgresql://… 필요");
  process.exit(1);
}

const prisma = createPostgresPrisma(connectionString);

async function upsertAgencyProducts(
  agencyId: string,
  items: ReadonlyArray<{
    id: string;
    name: string;
    price: number;
    description: string;
  }>,
) {
  for (const item of items) {
    await prisma.couponProduct.upsert({
      where: { id: item.id },
      update: {
        name: item.name,
        description: item.description,
        price: item.price,
        isActive: true,
        agencyId,
      },
      create: {
        id: item.id,
        agencyId,
        name: item.name,
        description: item.description,
        price: item.price,
        isActive: true,
      },
    });
  }
}

async function main() {
  const agency = await prisma.couponAgency.upsert({
    where: { loginId: "2d_sketch_cafe" },
    update: {
      name: STORE.name,
      bankName: "Vietcombank",
      bankAccount: "1234567890",
      bankHolder: STORE.name,
      commissionFixed: 3000,
    },
    create: {
      name: STORE.name,
      loginId: "2d_sketch_cafe",
      passwordHash: await bcrypt.hash("password123", 10),
      bankName: "Vietcombank",
      bankAccount: "1234567890",
      bankHolder: STORE.name,
      commissionFixed: 3000,
    },
  });

  const demoAgency = await prisma.couponAgency.upsert({
    where: { loginId: "other_cafe" },
    update: {
      name: "다른 카페 (테스트)",
      bankName: "Techcombank",
      bankAccount: "9876543210",
      bankHolder: "Demo Cafe",
      commissionFixed: 3000,
      commissionPercent: 5,
    },
    create: {
      name: "다른 카페 (테스트)",
      loginId: "other_cafe",
      passwordHash: await bcrypt.hash("password123", 10),
      bankName: "Techcombank",
      bankAccount: "9876543210",
      bankHolder: "Demo Cafe",
      commissionFixed: 3000,
      commissionPercent: 5,
    },
  });

  const user = await prisma.user.upsert({
    where: { email: "buyer@example.com" },
    update: { name: "호케이 테스트 구매자" },
    create: {
      name: "호케이 테스트 구매자",
      email: "buyer@example.com",
      phone: "+84901234567",
    },
  });

  await upsertAgencyProducts(agency.id, MENU);
  await upsertAgencyProducts(demoAgency.id, DEMO_CAFE_MENU);

  const americanoId = MENU[0].id;
  const existingWalletItem = await prisma.couponWalletItem.findFirst({
    where: { userId: user.id, productId: americanoId, status: "issued" },
  });

  if (!existingWalletItem) {
    await prisma.couponWalletItem.create({
      data: {
        userId: user.id,
        productId: americanoId,
        status: "issued",
      },
    });
  }

  const staffSeed = [
    { name: "Manager (사장)", role: "manager" as const, pin: "5678" },
    { name: "Scanner Linh", role: "scanner" as const, pin: "1234" },
    { name: "Cashier Minh", role: "cashier" as const, pin: "4321" },
  ];

  for (const s of staffSeed) {
    const existing = await prisma.couponAgencyStaff.findFirst({
      where: { agencyId: agency.id, name: s.name },
    });
    const pinHash = await bcrypt.hash(s.pin, 10);
    if (existing) {
      await prisma.couponAgencyStaff.update({
        where: { id: existing.id },
        data: { pinHash, role: s.role, isActive: true },
      });
    } else {
      await prisma.couponAgencyStaff.create({
        data: {
          agencyId: agency.id,
          name: s.name,
          role: s.role,
          pinHash,
        },
      });
    }
  }

  const demoPosKey = "pos_demo_2d_sketch_cafe";
  const existingPos = await prisma.couponPosDevice.findFirst({
    where: { agencyId: agency.id, name: "카운터 POS (데모)" },
  });
  const posKeyHash = await bcrypt.hash(demoPosKey, 10);
  if (existingPos) {
    await prisma.couponPosDevice.update({
      where: { id: existingPos.id },
      data: { apiKeyHash: posKeyHash, isActive: true },
    });
  } else {
    await prisma.couponPosDevice.create({
      data: {
        agencyId: agency.id,
        name: "카운터 POS (데모)",
        apiKeyHash: posKeyHash,
      },
    });
  }

  console.log("Coupon seed complete —", STORE.name);
  console.log("  Agency login: 2d_sketch_cafe / password123");
  console.log("  Demo agency: other_cafe / password123");
  console.log("  Buyer:", user.email);
  console.log("  Staff PINs: manager 5678 · scanner 1234 · cashier 4321");
  console.log(`  POS demo key: ${demoPosKey}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
