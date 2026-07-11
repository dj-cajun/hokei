import type { CouponStaffRole } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signCouponJwt, verifyCouponJwt } from "./jwt";

export async function loginAgency(loginId: string, password: string) {
  const agency = await prisma.couponAgency.findUnique({ where: { loginId } });
  if (!agency || !agency.isActive) {
    return null;
  }

  const valid = await bcrypt.compare(password, agency.passwordHash);
  if (!valid) {
    return null;
  }

  const token = await signCouponJwt(
    { sub: agency.id, loginId: agency.loginId, type: "agency" },
    "7d",
  );

  return {
    token,
    agency: { id: agency.id, name: agency.name, loginId: agency.loginId },
  };
}

export async function validateAgency(agencyId: string) {
  return prisma.couponAgency.findFirst({
    where: { id: agencyId, isActive: true },
  });
}

export async function attachStaffFromHeader(
  agencyId: string,
  staffToken?: string,
): Promise<
  { id: string; name: string; role: CouponStaffRole } | undefined
> {
  if (!staffToken?.trim()) return undefined;
  try {
    const payload = await verifyCouponJwt<{
      sub: string;
      agencyId: string;
      role: CouponStaffRole;
      type: string;
    }>(staffToken);
    if (payload.type !== "agency_staff" || payload.agencyId !== agencyId) {
      return undefined;
    }
    const staff = await prisma.couponAgencyStaff.findFirst({
      where: { id: payload.sub, agencyId, isActive: true },
      select: { id: true, name: true, role: true },
    });
    return staff ?? undefined;
  } catch {
    return undefined;
  }
}

export async function issuePartnerTokenForHokei(
  agencyLoginId: string,
  hokeiUserId: string,
) {
  const agency = await prisma.couponAgency.findFirst({
    where: { loginId: agencyLoginId, isActive: true },
  });
  if (!agency) return null;

  const token = await signCouponJwt(
    {
      sub: agency.id,
      loginId: agency.loginId,
      type: "agency",
      hokeiUserId,
    },
    "7d",
  );

  return {
    token,
    agency: { id: agency.id, name: agency.name, loginId: agency.loginId },
  };
}

export function parseAgencyTokenFromHeaders(
  headers: Record<string, string | undefined>,
  cookieHeader?: string,
): string | null {
  const auth = headers.authorization ?? headers.Authorization;
  if (auth?.startsWith("Bearer ")) {
    return auth.slice(7);
  }

  if (cookieHeader) {
    const match = cookieHeader.match(/(?:^|;\s*)agency_token=([^;]+)/);
    if (match?.[1]) {
      return decodeURIComponent(match[1]);
    }
  }

  return null;
}

export async function buildAgencyContext(
  headers: Record<string, string | undefined>,
  cookieHeader?: string,
) {
  const token = parseAgencyTokenFromHeaders(headers, cookieHeader);
  if (!token) return null;

  try {
    const payload = await verifyCouponJwt<{
      sub: string;
      type: string;
      hokeiUserId?: string;
    }>(token);
    if (payload.type !== "agency") return null;

    const agency = await validateAgency(payload.sub);
    if (!agency) return null;

    const staffToken =
      headers["x-staff-token"] ?? headers["X-Staff-Token"];
    const staff = await attachStaffFromHeader(agency.id, staffToken);

    return {
      agency: { id: agency.id, name: agency.name, loginId: agency.loginId },
      staff,
      userId: payload.hokeiUserId,
    };
  } catch {
    return null;
  }
}
