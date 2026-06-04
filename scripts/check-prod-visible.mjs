import { chromium, devices } from "@playwright/test";

const base = "https://hokei-peach.vercel.app";
const browser = await chromium.launch();
const page = await browser.newPage({ ...devices["iPhone 13"] });

await page.goto(base + "/", { waitUntil: "networkidle", timeout: 60_000 });
await page.waitForTimeout(3000);

const texts = {
  error: await page.getByText("문제가 발생").isVisible().catch(() => false),
  loading: await page.getByText("불러오는 중").isVisible().catch(() => false),
  write: await page.getByText("글쓰기").count(),
  headline: await page.getByLabel("헤드라인").isVisible().catch(() => false),
  video: await page.getByLabel("하이라이트 영상").isVisible().catch(() => false),
  community: await page.getByText("커뮤니티", { exact: true }).first().isVisible().catch(() => false),
  firstPost: await page.getByText("첫 커뮤니티").count(),
  noPosts: await page.getByText("글이 없습니다").isVisible().catch(() => false),
  hokei: await page.getByText("HOKEI").first().isVisible().catch(() => false),
};

console.log(JSON.stringify(texts, null, 2));
await browser.close();
