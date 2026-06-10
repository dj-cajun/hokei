/**
 * 회원 권한 변경 (ADMIN ↔ USER)
 * npx tsx scripts/promote-admin.ts <email> [ADMIN|USER]
 * bash scripts/with-pg-env.sh npx tsx scripts/promote-admin.ts sonen2000@gmail.com USER
 */
import "dotenv/config";
import type { Role } from "../src/generated/prisma/client";
import { prisma } from "../src/lib/prisma";

const email = process.argv[2]?.trim().toLowerCase();
const roleArg = (process.argv[3]?.trim().toUpperCase() ?? "ADMIN") as Role;

if (!email) {
  console.error("사용법: npx tsx scripts/promote-admin.ts <email> [ADMIN|USER]");
  process.exit(1);
}

if (roleArg !== "ADMIN" && roleArg !== "USER") {
  console.error("권한은 ADMIN 또는 USER만 가능합니다.");
  process.exit(1);
}

async function main() {
  const user = await prisma.user.update({
    where: { email },
    data: { role: roleArg },
    select: { email: true, name: true, role: true },
  });
  console.log("권한 변경 완료:", user);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
