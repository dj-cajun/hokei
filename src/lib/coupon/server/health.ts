import { prisma } from "@/lib/prisma";

export async function checkCouponHealth() {
  let db = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    db = true;
  } catch {
    db = false;
  }

  return {
    status: db ? "ok" : "degraded",
    db,
    time: new Date().toISOString(),
    version: process.env.npm_package_version ?? "0.0.1",
  };
}
