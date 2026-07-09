import { afterEach, describe, expect, it } from "vitest";
import {
  getAdSenseClientId,
  getAdSenseSlot,
  isAdSenseEnabled,
} from "@/lib/ads/adsense-config";

describe("adsense-config", () => {
  const envBackup = { ...process.env };

  afterEach(() => {
    process.env = { ...envBackup };
  });

  it("is disabled without client id", () => {
    delete process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
    expect(isAdSenseEnabled()).toBe(false);
  });

  it("resolves home and article slots", () => {
    process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME = "111";
    process.env.NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE = "222";
    expect(getAdSenseSlot("home")).toBe("111");
    expect(getAdSenseSlot("article")).toBe("222");
  });

  it("feed slot falls back to home when feed env is unset", () => {
    process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME = "111";
    delete process.env.NEXT_PUBLIC_ADSENSE_SLOT_FEED;
    expect(getAdSenseSlot("feed")).toBe("111");
  });

  it("feed slot prefers dedicated env when set", () => {
    process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME = "111";
    process.env.NEXT_PUBLIC_ADSENSE_SLOT_FEED = "333";
    expect(getAdSenseSlot("feed")).toBe("333");
  });

  it("getAdSenseClientId trims whitespace", () => {
    process.env.NEXT_PUBLIC_ADSENSE_CLIENT = "  ca-pub-test  ";
    expect(getAdSenseClientId()).toBe("ca-pub-test");
    expect(isAdSenseEnabled()).toBe(true);
  });
});
