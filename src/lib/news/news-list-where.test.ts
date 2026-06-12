import { describe, expect, it } from "vitest";
import { newsAutomatedWhere } from "@/lib/news/news-list-where";

describe("newsAutomatedWhere", () => {
  it("includes automated and curated http-source posts", () => {
    expect(newsAutomatedWhere).toMatchObject({
      status: "PUBLISHED",
      OR: expect.arrayContaining([
        expect.objectContaining({ isAutomated: true }),
        expect.objectContaining({
          isAutomated: false,
          sourceUrl: { startsWith: "http" },
        }),
      ]),
    });
  });
});
