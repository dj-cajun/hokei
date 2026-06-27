import { describe, expect, it } from "vitest";
import { formatContactInquiryMessage } from "./contact-inquiry-dm";

describe("formatContactInquiryMessage", () => {
  it("includes inquiry metadata", () => {
    const body = formatContactInquiryMessage({
      kind: "ads",
      name: "김사장",
      email: "owner@example.com",
      subject: "배너 광고",
      body: "메인에 올리고 싶습니다.",
    });
    expect(body).toContain("[광고·제휴 문의]");
    expect(body).toContain("김사장");
    expect(body).toContain("owner@example.com");
    expect(body).toContain("메인에 올리고 싶습니다.");
  });
});
