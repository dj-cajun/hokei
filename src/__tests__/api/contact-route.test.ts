import { describe, expect, it, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/contact/route";

vi.mock("@/lib/messages/contact-inquiry-dm", () => ({
  deliverContactInquiryDm: vi.fn().mockResolvedValue(undefined),
}));

describe("POST /api/contact", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () => "",
      })
    );
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("EMAIL_FROM", "Hokei <hello@hokei.vn>");
  });

  it("rejects empty body", async () => {
    const res = await POST(
      new Request("http://localhost/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "ads",
          name: "",
          email: "a@b.com",
          subject: "test",
          body: "1234567890",
        }),
      })
    );
    expect(res.status).toBe(400);
  });

  it("sends ads inquiry", async () => {
    const res = await POST(
      new Request("http://localhost/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "ads",
          name: "홍길동",
          email: "user@example.com",
          subject: "배너 문의",
          body: "광고 문의 내용입니다.",
        }),
      })
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as { ok: boolean };
    expect(json.ok).toBe(true);
    expect(fetch).toHaveBeenCalled();
  });
});
