import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

describe("coupon config — store registry", () => {
  const envBackup = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...envBackup };
    delete process.env.NEXT_PUBLIC_COUPON_STORE_MAP;
    process.env.NEXT_PUBLIC_COUPON_ENABLED_SLUGS = "2d-sketch-cafe,demo-cafe";
  });

  afterEach(() => {
    process.env = envBackup;
    vi.resetModules();
  });

  async function loadConfig() {
    return import("@/lib/coupon/config");
  }

  it("maps 2d-sketch-cafe to 2d_sketch_cafe", async () => {
    const { agencyLoginIdForStore, isCouponStore } = await loadConfig();
    expect(agencyLoginIdForStore("2d-sketch-cafe")).toBe("2d_sketch_cafe");
    expect(isCouponStore("2d-sketch-cafe")).toBe(true);
  });

  it("demo-cafe maps to other_cafe when enabled", async () => {
    const { agencyLoginIdForStore, isCouponStore } = await loadConfig();
    expect(agencyLoginIdForStore("demo-cafe")).toBe("other_cafe");
    expect(isCouponStore("demo-cafe")).toBe(true);
  });

  it("rejects enabled slug without registry mapping", async () => {
    process.env.NEXT_PUBLIC_COUPON_ENABLED_SLUGS = "unknown-cafe";
    const { isCouponStore, agencyLoginIdForStore } = await loadConfig();
    expect(agencyLoginIdForStore("unknown-cafe")).toBeUndefined();
    expect(isCouponStore("unknown-cafe")).toBe(false);
  });

  it("merges NEXT_PUBLIC_COUPON_STORE_MAP from env", async () => {
    process.env.NEXT_PUBLIC_COUPON_STORE_MAP =
      "new-partner:new_partner_login:New Partner";
    process.env.NEXT_PUBLIC_COUPON_ENABLED_SLUGS = "new-partner";
    const { agencyLoginIdForStore, couponStoreLabel, listEnabledCouponStores } =
      await loadConfig();
    expect(agencyLoginIdForStore("new-partner")).toBe("new_partner_login");
    expect(couponStoreLabel("new-partner")).toBe("New Partner");
    expect(listEnabledCouponStores()).toHaveLength(1);
  });
});
