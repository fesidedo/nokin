import { describe, expect, it } from "vitest";
import {
  ALLOWED_MARKETPLACES,
  DEFAULT_MARKETPLACE,
  isMarketplaceId,
  parseMarketplace,
} from "./marketplace";

describe("marketplace allowlist parser", () => {
  it("accepts every allowlisted marketplace", () => {
    for (const id of ALLOWED_MARKETPLACES) {
      expect(isMarketplaceId(id)).toBe(true);
      expect(parseMarketplace(id)).toBe(id);
    }
  });

  it("normalizes mixed-case values", () => {
    expect(parseMarketplace("ebay_us")).toBe("EBAY_US");
    expect(parseMarketplace("eBaY_Gb")).toBe("EBAY_GB");
  });

  it("falls back to default when value is invalid/missing", () => {
    expect(parseMarketplace(null)).toBe(DEFAULT_MARKETPLACE);
    expect(parseMarketplace("")).toBe(DEFAULT_MARKETPLACE);
    expect(parseMarketplace("EBAY_MARS")).toBe(DEFAULT_MARKETPLACE);
  });
});
