import { describe, expect, it, afterEach } from "vitest";
import { GET } from "@/app/ads.txt/route";

describe("ads.txt", () => {
  const prev = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

  afterEach(() => {
    if (prev === undefined) {
      delete process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
    } else {
      process.env.NEXT_PUBLIC_ADSENSE_CLIENT = prev;
    }
  });

  it("returns 404 when AdSense client is not configured", async () => {
    delete process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
    const res = await GET();
    expect(res.status).toBe(404);
  });

  it("returns ads.txt line when client is set", async () => {
    process.env.NEXT_PUBLIC_ADSENSE_CLIENT = "ca-pub-1234567890123456";
    const res = await GET();
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain("google.com, pub-1234567890123456, DIRECT");
  });
});
