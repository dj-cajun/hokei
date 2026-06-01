import { describe, expect, it, afterEach } from "vitest";
import { isBlobStorageEnabled } from "@/lib/upload-blob";

describe("upload-blob", () => {
  const prev = process.env.BLOB_READ_WRITE_TOKEN;

  afterEach(() => {
    if (prev === undefined) delete process.env.BLOB_READ_WRITE_TOKEN;
    else process.env.BLOB_READ_WRITE_TOKEN = prev;
  });

  it("disabled without token", () => {
    delete process.env.BLOB_READ_WRITE_TOKEN;
    expect(isBlobStorageEnabled()).toBe(false);
  });

  it("enabled with token", () => {
    process.env.BLOB_READ_WRITE_TOKEN = "vercel_blob_xxx";
    expect(isBlobStorageEnabled()).toBe(true);
  });
});
