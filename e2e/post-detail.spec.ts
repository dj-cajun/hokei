import { test, expect } from "@playwright/test";

test.describe("게시글 상세", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("홈에서 첫 글 링크로 상세 진입", async ({ page }) => {
    await page.goto("/");
    const link = page.locator('a[href^="/posts/"]').first();
    if ((await link.count()) === 0) {
      await page.goto("/news/visa-residency");
      const fallback = page.locator('a[href^="/posts/"]').first();
      if ((await fallback.count()) === 0) test.skip();
      await fallback.click();
    } else {
      await link.click();
    }
    await expect(page).toHaveURL(/\/posts\//);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("상세 페이지에 댓글 영역", async ({ page }) => {
    await page.goto("/");
    const link = page.locator('a[href^="/posts/"]').first();
    if ((await link.count()) === 0) {
      await page.goto("/news/visa-residency");
      const fallback = page.locator('a[href^="/posts/"]').first();
      if ((await fallback.count()) === 0) test.skip();
      await fallback.click();
    } else {
      await link.click();
    }
    await expect(
      page.getByRole("heading", { name: /댓글/ })
    ).toBeVisible();
  });

  test("동일 세션에서 조회수 API 중복 집계를 막는다", async ({ page, request }) => {
    await page.goto("/news/visa-residency");
    const link = page.locator('a[href^="/posts/"]').first();
    if ((await link.count()) === 0) test.skip();

    const href = await link.getAttribute("href");
    const id = href?.replace(/^\/posts\//, "") ?? "";
    if (!id) test.skip();

    const first = await request.post(`/api/posts/${id}/views`);
    expect(first.ok()).toBeTruthy();
    const body1 = (await first.json()) as { counted?: boolean };
    expect(body1.counted).toBe(true);

    const second = await request.post(`/api/posts/${id}/views`);
    expect(second.ok()).toBeTruthy();
    const body2 = (await second.json()) as { counted?: boolean };
    expect(body2.counted).toBe(false);
  });
});
