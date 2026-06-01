import { test, expect } from "@playwright/test";

test.describe("SEO", () => {
  test("robots.txt", async ({ request }) => {
    const res = await request.get("/robots.txt");
    expect(res.ok()).toBeTruthy();
    const text = await res.text();
    expect(text).toContain("Sitemap:");
  });

  test("sitemap.xml", async ({ request }) => {
    const res = await request.get("/sitemap.xml");
    expect(res.ok()).toBeTruthy();
    const text = await res.text();
    expect(text).toContain("<urlset");
  });
});
