import { describe, expect, it } from "vitest";
import { assertAllowedUpload, sniffMimeType } from "@/lib/file-sniff";

describe("file-sniff", () => {
  it("detects JPEG magic bytes", () => {
    const buf = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]);
    expect(sniffMimeType(buf)).toBe("image/jpeg");
  });

  it("rejects executable disguised as image", () => {
    const buf = Buffer.from([0x4d, 0x5a, 0, 0, 0, 0, 0, 0]);
    expect(() =>
      assertAllowedUpload(buf, "image/jpeg")
    ).toThrow(/허용되지 않는/);
  });
});
