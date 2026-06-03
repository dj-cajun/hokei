import { chromium } from "@playwright/test";

const base = process.env.PLAYWRIGHT_BASE_URL ?? "https://hokei-peach.vercel.app";

const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(msg.text());
});

await page.goto(base + "/", { waitUntil: "networkidle", timeout: 60_000 });
await page.waitForTimeout(2000);

const errorUi = await page.getByText("문제가 발생했습니다").isVisible().catch(() => false);
const video = await page.getByLabel("하이라이트 영상").isVisible().catch(() => false);

console.log(JSON.stringify({ errorUi, video, errors: errors.slice(0, 5) }));
await browser.close();
process.exit(errorUi ? 1 : 0);
