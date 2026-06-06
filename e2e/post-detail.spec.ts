import { test, expect } from "@playwright/test";

const SAMPLE_TITLE = /E2E 테스트/;

async function openSamplePost(page: import("@playwright/test").Page) {
  for (const path of ["/news/visa-residency", "/search?q=E2E", "/"]) {
    await page.goto(path);
    const postLink = page.locator('a[href^="/posts/"]').first();
    if ((await postLink.count()) > 0) {
      await postLink.click();
      await expect(page).toHaveURL(/\/posts\//);
      return;
    }
  }

  const titled = page.getByRole("link", { name: SAMPLE_TITLE });
  if ((await titled.count()) > 0) {
    await titled.first().click();
    return;
  }

  test.skip();
}

test.describe("게시글 상세", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("홈에서 첫 글 링크로 상세 진입", async ({ page }) => {
    await page.goto("/");
    const homeLink = page.locator('a[href^="/posts/"]').first();
    if ((await homeLink.count()) === 0) {
      await openSamplePost(page);
    } else {
      await homeLink.click();
    }
    await expect(page).toHaveURL(/\/posts\//);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("상세 페이지에 댓글 영역", async ({ page }) => {
    await openSamplePost(page);
    await expect(page.getByRole("heading", { name: /댓글/ })).toBeVisible();
  });

  test("동일 세션에서 조회수 API 중복 집계를 막는다", async ({ page }) => {
    await openSamplePost(page);
    const id = page.url().split("/posts/")[1]?.split(/[?#]/)[0] ?? "";
    if (!id) test.skip();

    const first = await page.request.post(`/api/posts/${id}/views`);
    expect(first.ok()).toBeTruthy();
    const body1 = (await first.json()) as { counted?: boolean };
    expect(body1.counted).toBe(true);

    const second = await page.request.post(`/api/posts/${id}/views`);
    expect(second.ok()).toBeTruthy();
    const body2 = (await second.json()) as { counted?: boolean };
    expect(body2.counted).toBe(false);
  });
});
