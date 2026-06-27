import { describe, expect, it, vi } from "vitest";
import { getAdContactEmail, getContactEmail, getContactInboxEmail } from "./contact-emails";

describe("contact-emails", () => {
  it("defaults contact email", () => {
    vi.stubEnv("CONTACT_EMAIL", "");
    expect(getContactEmail()).toBe("webmaster@hokei.vn");
  });

  it("defaults ad contact email", () => {
    vi.stubEnv("AD_CONTACT_EMAIL", "");
    expect(getAdContactEmail()).toBe("ads@hokei.vn");
  });

  it("uses CONTACT_INBOX_EMAIL for form delivery", () => {
    vi.stubEnv("CONTACT_INBOX_EMAIL", "owner@gmail.com");
    expect(getContactInboxEmail("ads")).toBe("owner@gmail.com");
    expect(getContactInboxEmail("general")).toBe("owner@gmail.com");
  });
});
