import type { Role } from "@/generated/prisma/client";

/** UI·API에서 관리자 여부 판단 — USER에게 관리자 버튼 노출 방지 */
export function isAdminRole(role: Role | string | null | undefined): boolean {
  return role === "ADMIN";
}
