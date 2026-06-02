import { describe, expect, it } from "vitest";
import { attachmentUrlsToDelete } from "@/lib/posts/attachment-sync";

describe("attachmentUrlsToDelete", () => {
  it("keeps URLs still present in next list", () => {
    const existing = [{ url: "/uploads/a.jpg" }, { url: "/uploads/b.pdf" }];
    const next = [
      { url: "/uploads/a.jpg" },
      { url: "/uploads/c.png" },
    ];
    expect(attachmentUrlsToDelete(existing, next)).toEqual([
      "/uploads/b.pdf",
    ]);
  });

  it("returns empty when attachments field omitted", () => {
    expect(attachmentUrlsToDelete([{ url: "/a" }], undefined)).toEqual([]);
  });
});
