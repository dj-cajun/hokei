import { CouponStaffRole } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import type { CouponStaffContext } from "./context";
import { CouponApiError } from "./errors";
import { scanRedemption } from "./redemptions";

function assertManager(staff?: CouponStaffContext | null) {
  if (!staff || staff.role !== CouponStaffRole.manager) {
    throw new CouponApiError(403, "FORBIDDEN", "Manager role required");
  }
}

export async function resolvePosDevice(apiKey: string) {
  const trimmed = apiKey.trim();
  if (!trimmed) return null;

  const devices = await prisma.couponPosDevice.findMany({
    where: { isActive: true },
    include: { agency: { select: { id: true, isActive: true } } },
  });

  for (const device of devices) {
    if (!device.agency.isActive) continue;
    const ok = await bcrypt.compare(trimmed, device.apiKeyHash);
    if (!ok) continue;

    await prisma.couponPosDevice.update({
      where: { id: device.id },
      data: { lastUsedAt: new Date() },
    });

    return {
      agency: { id: device.agencyId },
      posDevice: { id: device.id, name: device.name },
    };
  }

  return null;
}

export function listPosDevices(agencyId: string) {
  return prisma.couponPosDevice.findMany({
    where: { agencyId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      isActive: true,
      lastUsedAt: true,
      createdAt: true,
    },
  });
}

export async function createPosDevice(
  agencyId: string,
  name: string,
  staff: CouponStaffContext,
) {
  assertManager(staff);
  const trimmed = name.trim();
  if (!trimmed) {
    throw new CouponApiError(403, "FORBIDDEN", "Device name required");
  }

  const rawKey = `pos_${randomBytes(24).toString("hex")}`;
  const apiKeyHash = await bcrypt.hash(rawKey, 10);
  const device = await prisma.couponPosDevice.create({
    data: {
      agencyId,
      name: trimmed,
      apiKeyHash,
    },
    select: { id: true, name: true, createdAt: true },
  });

  return {
    device,
    apiKey: rawKey,
    header: "X-Pos-Api-Key",
    scanUrl: "/pos/scan",
  };
}

export async function revokePosDevice(
  agencyId: string,
  deviceId: string,
  staff: CouponStaffContext,
) {
  assertManager(staff);
  const device = await prisma.couponPosDevice.findFirst({
    where: { id: deviceId, agencyId },
  });
  if (!device) {
    throw new CouponApiError(404, "NOT_FOUND", "Device not found");
  }
  await prisma.couponPosDevice.update({
    where: { id: deviceId },
    data: { isActive: false },
  });
  return { success: true, id: deviceId };
}

export function posScan(
  qrPayload: string,
  agencyId: string,
  posDeviceId: string,
  posDeviceName: string,
) {
  return scanRedemption(qrPayload, agencyId, null, {
    posDeviceId,
    posDeviceName,
  });
}
