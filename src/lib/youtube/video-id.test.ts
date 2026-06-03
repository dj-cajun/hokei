import { describe, expect, it } from "vitest";
import {
  buildYouTubeEmbedSrc,
  parseYouTubeFromUrl,
  splitContentWithYouTubeEmbeds,
} from "@/lib/youtube/video-id";

describe("parseYouTubeFromUrl", () => {
  it("parses watch URL", () => {
    expect(
      parseYouTubeFromUrl("https://www.youtube.com/watch?v=d-fY16xMeT4&t=12")
    ).toEqual({ videoId: "d-fY16xMeT4", startSeconds: 12 });
  });

  it("parses youtu.be", () => {
    expect(parseYouTubeFromUrl("https://youtu.be/dQw4w9WgXcQ")).toEqual({
      videoId: "dQw4w9WgXcQ",
    });
  });

  it("parses embed URL", () => {
    expect(
      parseYouTubeFromUrl("https://www.youtube.com/embed/d-fY16xMeT4")
    ).toEqual({ videoId: "d-fY16xMeT4" });
  });

  it("rejects non-youtube", () => {
    expect(parseYouTubeFromUrl("https://example.com/watch?v=abc")).toBeNull();
  });
});

describe("buildYouTubeEmbedSrc", () => {
  it("uses embed path not watch", () => {
    const src = buildYouTubeEmbedSrc("d-fY16xMeT4", { mute: true, autoplay: true });
    expect(src).toContain("youtube-nocookie.com/embed/d-fY16xMeT4");
    expect(src).toContain("mute=1");
    expect(src).not.toContain("/watch");
  });
});

describe("splitContentWithYouTubeEmbeds", () => {
  it("splits text around youtube link", () => {
    const parts = splitContentWithYouTubeEmbeds(
      "안녕하세요\nhttps://www.youtube.com/watch?v=d-fY16xMeT4\n감사합니다"
    );
    expect(parts).toHaveLength(3);
    expect(parts[1]).toEqual({
      type: "youtube",
      videoId: "d-fY16xMeT4",
      startSeconds: undefined,
    });
  });
});
