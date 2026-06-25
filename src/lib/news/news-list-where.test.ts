import { describe, expect, it } from "vitest";
import { newsAutomatedWhere } from "@/lib/news/news-list-where";

describe("newsAutomatedWhere", () => {
  it("includes automated and curated http-source posts with visibility", () => {
    expect(newsAutomatedWhere).toMatchObject({
      AND: expect.arrayContaining([
        expect.objectContaining({ status: "PUBLISHED" }),
        expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({ isAutomated: true }),
            expect.objectContaining({
              isAutomated: false,
              sourceUrl: { startsWith: "http" },
            }),
          ]),
        }),
      ]),
    });
  });
});
