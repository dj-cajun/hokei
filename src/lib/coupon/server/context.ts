import type { CouponStaffRole } from "@/generated/prisma/client";

export type CouponAgencyContext = {
  id: string;
  name?: string;
  loginId?: string;
};

export type CouponStaffContext = {
  id: string;
  name: string;
  role: CouponStaffRole;
};

export type CouponPosDeviceContext = {
  id: string;
  name: string;
};

export type CouponRequestContext = {
  agency: CouponAgencyContext;
  staff?: CouponStaffContext;
  posDevice?: CouponPosDeviceContext;
  userId?: string;
};
