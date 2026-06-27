/**
 * 도메인 연결 후 런칭 설정 — Resend 도메인·DNS 안내·프로덕션 점검
 * npm run launch:setup
 * npm run launch:setup -- --resend-only
 * npm run launch:setup -- --check-only
 */
import { spawnSync } from "child_process";

const DOMAIN = "hokei.vn";
const SITE = "https://www.hokei.vn";
const EMAIL_FROM = `Hokei <hello@${DOMAIN}>`;

const args = new Set(process.argv.slice(2));
const resendOnly = args.has("--resend-only");
const checkOnly = args.has("--check-only");

type ResendDomain = {
  id: string;
  name: string;
  status: string;
  records?: Array<{
    record: string;
    name: string;
    type: string;
    value: string;
    priority?: number;
    status?: string;
  }>;
};

async function resendFetch(path: string, init?: RequestInit) {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) {
    console.error("[launch] RESEND_API_KEY 없음 — Vercel production env 확인");
    process.exit(1);
  }
  const res = await fetch(`https://api.resend.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  const text = await res.text();
  let json: unknown;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    throw new Error(
      `Resend ${path} ${res.status}: ${typeof json === "object" && json && "message" in json ? String((json as { message: string }).message) : text.slice(0, 200)}`
    );
  }
  return json;
}

async function listDomains(): Promise<ResendDomain[]> {
  const data = (await resendFetch("/domains")) as { data?: ResendDomain[] };
  return data.data ?? [];
}

async function ensureResendDomain(): Promise<ResendDomain> {
  const existing = (await listDomains()).find(
    (d) => d.name === DOMAIN || d.name === `www.${DOMAIN}`
  );
  if (existing) {
    console.log(`[launch] Resend 도메인 이미 등록됨: ${existing.name} (${existing.status})`);
    const detail = (await resendFetch(`/domains/${existing.id}`)) as ResendDomain;
    return detail;
  }

  console.log(`[launch] Resend에 ${DOMAIN} 등록 중…`);
  const created = (await resendFetch("/domains", {
    method: "POST",
    body: JSON.stringify({ name: DOMAIN }),
  })) as ResendDomain;
  const detail = (await resendFetch(`/domains/${created.id}`)) as ResendDomain;
  return detail;
}

function printDnsRecords(domain: ResendDomain) {
  const records = domain.records ?? [];
  if (records.length === 0) {
    console.log("[launch] DNS 레코드 없음 — Resend 대시보드에서 확인하세요.");
    return;
  }
  console.log("\n=== Resend DNS (도메인 등록업체에 추가) ===\n");
  for (const r of records) {
    const host = r.name === DOMAIN || r.name === "@" ? DOMAIN : r.name;
    console.log(`  ${r.type}  ${host}`);
    console.log(`       ${r.value}`);
    if (r.priority != null) console.log(`       priority: ${r.priority}`);
    console.log("");
  }
  console.log(
    "도메인이 Vercel에 연결돼 있어도 DNS는 등록업체(Nameserver)에서 관리합니다.\n"
  );
}

function vercelEnvSet(key: string, value: string) {
  spawnSync("npx", ["vercel", "env", "rm", key, "production", "--yes"], {
    stdio: "ignore",
  });
  const r = spawnSync(
    "npx",
    ["vercel", "env", "add", key, "production"],
    { input: value, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }
  );
  if (r.status !== 0) {
    console.warn(`[launch] Vercel env ${key} 설정 실패`);
    return false;
  }
  console.log(`[launch] Vercel ${key} = ${value}`);
  return true;
}

async function syncEmailFromIfVerified(status: string) {
  if (status !== "verified") {
    console.log(
      `[launch] Resend 도메인 미인증 (${status}) — DNS 추가 후 다시 실행하세요.`
    );
    return;
  }
  const current = process.env.EMAIL_FROM?.trim();
  if (current === EMAIL_FROM) {
    console.log(`[launch] EMAIL_FROM 이미 ${EMAIL_FROM}`);
    return;
  }
  console.log(`[launch] EMAIL_FROM 업데이트: ${current ?? "(없음)"} → ${EMAIL_FROM}`);
  vercelEnvSet("EMAIL_FROM", EMAIL_FROM);
}

async function checkProduction() {
  console.log("\n=== 프로덕션 점검 ===\n");

  const checks: Array<{ name: string; url: string; expect: (t: string, h: Headers) => boolean }> = [
    {
      name: "홈",
      url: SITE,
      expect: (t) => t.includes("호케이"),
    },
    {
      name: "robots.txt",
      url: `${SITE}/robots.txt`,
      expect: (t) => t.includes(SITE),
    },
    {
      name: "sitemap.xml",
      url: `${SITE}/sitemap.xml`,
      expect: (t) => t.includes(SITE),
    },
    {
      name: "ads.txt",
      url: `${SITE}/ads.txt`,
      expect: (_t, h) => h.get("content-type")?.includes("text") ?? false,
    },
  ];

  for (const c of checks) {
    try {
      const res = await fetch(c.url, { redirect: "follow" });
      const text = await res.text();
      const ok = res.ok && c.expect(text, res.headers);
      console.log(`  ${ok ? "✓" : "✗"} ${c.name} (${res.status})`);
      if (!ok && c.name === "ads.txt") {
        console.log("      → AdSense ca-pub 설정 후 ads.txt 활성화");
      }
    } catch (e) {
      console.log(`  ✗ ${c.name} — ${e instanceof Error ? e.message : e}`);
    }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  console.log(`\n  NEXT_PUBLIC_SITE_URL: ${siteUrl ?? "(미설정)"}`);
  console.log(`  GOOGLE_SITE_VERIFICATION: ${process.env.GOOGLE_SITE_VERIFICATION ? "설정됨" : "미설정"}`);
  console.log(`  NEXT_PUBLIC_ADSENSE_CLIENT: ${process.env.NEXT_PUBLIC_ADSENSE_CLIENT ? "설정됨" : "미설정"}`);

  console.log(`
=== 수동 완료 (Google 콘솔) ===

1. Search Console (https://search.google.com/search-console)
   - 속성: ${SITE}
   - 인증: HTML 태그 → content 값만 복사
   - Vercel: GOOGLE_SITE_VERIFICATION=<content> 추가 후 재배포
   - 사이트맵: ${SITE}/sitemap.xml

2. AdSense (https://adsense.google.com)
   - 사이트 추가: ${SITE}
   - 발급된 ca-pub-xxx → Vercel NEXT_PUBLIC_ADSENSE_CLIENT
   - 광고 단위 2개 → SLOT_HOME, SLOT_ARTICLE
   - 재배포 후 ${SITE}/ads.txt 확인

3. Resend DNS 인증 후 이메일 가입 테스트
`);
}

async function main() {
  console.log(`[launch] 호케이 런칭 설정 — ${SITE}\n`);

  if (!checkOnly) {
    try {
      const domain = await ensureResendDomain();
      printDnsRecords(domain);
      await syncEmailFromIfVerified(domain.status);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("401") || msg.includes("restricted")) {
        console.log(`[launch] Resend API 키가 발송 전용입니다 — 대시보드에서 도메인을 추가하세요.`);
        console.log(`       https://resend.com/domains → Add Domain → ${DOMAIN}`);
        console.log(`       DNS 레코드 추가 후 Verified 되면 EMAIL_FROM을 ${EMAIL_FROM} 으로 변경\n`);
      } else {
        throw e;
      }
    }
  }

  if (!resendOnly) {
    await checkProduction();
  }
}

main().catch((e) => {
  console.error("[launch] 실패:", e instanceof Error ? e.message : e);
  process.exit(1);
});
