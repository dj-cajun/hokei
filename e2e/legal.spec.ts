import { test, expect } from "@playwright/test";

test.describe("법적·문의 페이지", () => {
  test("개인정보처리방침", async ({ page }) => {
    await page.goto("/privacy");
    await expect(
      page.getByRole("heading", { name: "개인정보처리방침", level: 1 })
    ).toBeVisible();
  });

  test("이용약관", async ({ page }) => {
    await page.goto("/terms");
    await expect(page.getByRole("heading", { name: /이용약관/ })).toBeVisible();
  });

  test("문의하기 폼", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.getByRole("heading", { name: "문의하기" })).toBeVisible();
    await expect(page.getByLabel("이름")).toBeVisible();
    await expect(page.getByRole("button", { name: "메일 앱으로 보내기" })).toBeVisible();
  });

  test("쪽지함은 로그인 필요", async ({ page }) => {
    await page.goto("/messages");
    await expect(page).toHaveURL(/\/login/);
  });
});
