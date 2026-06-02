import { Prisma } from "@/generated/prisma/client";
import type { Prisma as PrismaTypes } from "@/generated/prisma/client";

/** Prisma Client 재생성 전(구 스키마)에도 런타임 오류 없이 동작 */
const postHasModeration =
  "moderationStatus" in Prisma.PostScalarFieldEnum;
const commentHasHidden = "isHidden" in Prisma.CommentScalarFieldEnum;

/** 공개 목록·검색에 노출되는 게시글 */
export const visiblePostWhere: PrismaTypes.PostWhereInput = postHasModeration
  ? { status: "PUBLISHED", moderationStatus: "VISIBLE" }
  : { status: "PUBLISHED" };

export function mergeVisiblePostWhere(
  where: PrismaTypes.PostWhereInput
): PrismaTypes.PostWhereInput {
  return {
    AND: [visiblePostWhere, where],
  };
}

export const visibleCommentWhere: PrismaTypes.CommentWhereInput =
  commentHasHidden ? { isHidden: false } : {};
