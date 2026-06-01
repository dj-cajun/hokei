import { test, expect } from "@playwright/test";

test.describe("홈", () => {
  test("메인 페이지가 로드된다", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/호케이|Hokei/i);
  });

  test("검색 페이지 안내가 보인다", async ({ page }) => {
    await page.goto("/search");
    await expect(page.getByRole("heading", { name: "검색" })).toBeVisible();
  });

  test("404 페이지", async ({ page }) => {
    await page.goto("/this-page-does-not-exist-xyz");
    await expect(page.getByText("404")).toBeVisible();
  });
});
