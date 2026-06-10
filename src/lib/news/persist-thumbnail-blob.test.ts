import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@vercel/blob", () => ({
  put: vi.fn(),
}));

import { put } from "@vercel/blob";
import {
  isNewsThumbnailBlobUrl,
  persistNewsThumbnailToBlob,
} from "@/lib/news/persist-thumbnail-blob";

describe("persist-thumbnail-blob", () => {
  const prevToken = process.env.BLOB_READ_WRITE_TOKEN;

  afterEach(() => {
    vi.restoreAllMocks();
    if (prevToken === undefined) delete process.env.BLOB_READ_WRITE_TOKEN;
    else process.env.BLOB_READ_WRITE_TOKEN = prevToken;
  });

  it("detects blob URLs", () => {
    expect(
      isNewsThumbnailBlobUrl(
        "https://abc.public.blob.vercel-storage.com/news/thumbnails/x.jpg"
      )
    ).toBe(true);
    expect(isNewsThumbnailBlobUrl("https://cdn.example.com/a.jpg")).toBe(false);
  });

  it("returns null when blob storage disabled", async () => {
    delete process.env.BLOB_READ_WRITE_TOKEN;
    const result = await persistNewsThumbnailToBlob(
      "https://cdn.insidevina.com/news/photo/x.jpg",
      "https://example.com/article"
    );
    expect(result).toBeNull();
  });

  it("returns existing blob URL without upload", async () => {
    process.env.BLOB_READ_WRITE_TOKEN = "vercel_blob_test";
    const existing =
      "https://abc.public.blob.vercel-storage.com/news/thumbnails/x.jpg";
    const result = await persistNewsThumbnailToBlob(
      existing,
      "https://example.com/article"
    );
    expect(result).toBe(existing);
    expect(put).not.toHaveBeenCalled();
  });
});
