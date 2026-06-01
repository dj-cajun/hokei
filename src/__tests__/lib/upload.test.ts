import { describe, expect, it } from "vitest";
import { getUploadKind } from "@/lib/upload";

describe("upload", () => {
  it("classifies image MIME as IMAGE", () => {
    expect(getUploadKind("image/jpeg")).toBe("IMAGE");
    expect(getUploadKind("image/webp")).toBe("IMAGE");
  });

  it("classifies documents as FILE", () => {
    expect(getUploadKind("application/pdf")).toBe("FILE");
    expect(getUploadKind("text/plain")).toBe("FILE");
  });
});
