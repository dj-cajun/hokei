import { Prisma } from "@/generated/prisma/client";
import { describe, expect, it } from "vitest";
import { mergeVisiblePostWhere, visiblePostWhere } from "@/lib/moderation";

const postHasModeration = "moderationStatus" in Prisma.PostScalarFieldEnum;

describe("moderation filters", () => {
  it("visiblePostWhere requires published visible posts", () => {
    expect(visiblePostWhere).toEqual(
      postHasModeration
        ? { status: "PUBLISHED", moderationStatus: "VISIBLE" }
        : { status: "PUBLISHED" }
    );
  });

  it("mergeVisiblePostWhere ANDs with extra filters", () => {
    expect(
      mergeVisiblePostWhere({ isAutomated: true }).AND
    ).toEqual([visiblePostWhere, { isAutomated: true }]);
  });
});
