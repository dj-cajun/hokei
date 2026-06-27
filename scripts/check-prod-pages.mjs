const base = process.argv[2] ?? "https://www.hokei.vn";
const paths = [
  "/",
  "/news",
  "/community",
  "/login",
  "/search",
  "/partners",
  "/store/saigon-bbq-demo",
  "/store/2d-sketch-cafe",
];

const homeBannerChecks = [
  "제휴 상단 배너",
  "/partners/",
];

async function checkPath(path) {
  const res = await fetch(base + path);
  const html = await res.text();
  const errorUi =
    html.includes("문제가 발생했습니다") ||
    html.includes("Application error");
  const digests = (html.match(/"digest":"\d+"/g) ?? []).length;
  const video = html.includes("youtube-nocookie.com/embed");

  let bannerOk = true;
  if (path === "/") {
    bannerOk = homeBannerChecks.every((needle) => html.includes(needle));
  }

  const ok = res.status === 200 && !errorUi && bannerOk;

  console.log(
    `${path} ${res.status} ${errorUi ? "ERROR_UI" : "no-error-ui"} digests=${digests} video=${video}${path === "/" ? ` banner=${bannerOk ? "ok" : "MISSING"}` : ""} ${ok ? "OK" : "FAIL"}`
  );

  return ok;
}

async function main() {
  let allOk = true;
  for (const path of paths) {
    const ok = await checkPath(path);
    if (!ok) allOk = false;
  }
  if (!allOk) {
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
