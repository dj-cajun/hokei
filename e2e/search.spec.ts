import { test, expect } from "@playwright/test";

test.describe("검색", () => {
  test("2글자 이상 검색 결과 또는 안내", async ({ page }) => {
    await page.goto("/search?q=호치민");
    await expect(page.getByRole("heading", { name: "검색" })).toBeVisible();
    const body = await page.locator("main").textContent();
    expect(body?.length).toBeGreaterThan(0);
  });
});
