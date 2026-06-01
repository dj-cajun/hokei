import { test, expect } from "@playwright/test";

test.describe("게시글 상세", () => {
  test("홈에서 첫 글 링크로 상세 진입", async ({ page }) => {
    await page.goto("/");
    const link = page.locator('a[href^="/posts/"]').first();
    const count = await link.count();
    if (count === 0) {
      test.skip();
      return;
    }
    await link.click();
    await expect(page).toHaveURL(/\/posts\//);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("상세 페이지에 댓글 영역", async ({ page }) => {
    await page.goto("/");
    const link = page.locator('a[href^="/posts/"]').first();
    if ((await link.count()) === 0) {
      test.skip();
      return;
    }
    await link.click();
    await expect(page.getByText("댓글")).toBeVisible();
  });
});
