import type { PartnerCategory } from "@/generated/prisma/client";

export const PARTNER_CATEGORY_LABELS: Record<PartnerCategory, string> = {
  FOOD: "음식·맛집",
  BEAUTY: "미용",
  CLINIC: "병원·클리닉",
  SERVICE: "생활서비스",
  OTHER: "기타",
};
