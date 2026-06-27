const base = process.argv[2] ?? "https://www.hokei.vn";
const paths = ["/", "/news", "/community", "/login", "/search"];

async function main() {
  for (const path of paths) {
    const res = await fetch(base + path);
    const html = await res.text();
    const errorUi =
      html.includes("문제가 발생했습니다") ||
      html.includes("Application error");
    const digests = (html.match(/"digest":"\d+"/g) ?? []).length;
    const video = html.includes("youtube-nocookie.com/embed");
    console.log(
      `${path} ${res.status} ${errorUi ? "ERROR_UI" : "no-error-ui"} digests=${digests} video=${video}`
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
