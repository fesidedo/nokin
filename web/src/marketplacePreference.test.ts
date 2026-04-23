import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  DEFAULT_MARKETPLACE,
  MARKETPLACE_STORAGE_KEY,
  marketplaceHost,
  marketplaceLabel,
  parseMarketplaceId,
  readMarketplacePreference,
  writeMarketplacePreference,
} from "./marketplacePreference";

describe("marketplacePreference", () => {
  const originalWindow = (globalThis as any).window as Window | undefined;

  class MemoryStorage {
    private readonly store = new Map<string, string>();
    getItem(key: string): string | null {
      return this.store.has(key) ? this.store.get(key)! : null;
    }
    setItem(key: string, value: string): void {
      this.store.set(key, value);
    }
    clear(): void {
      this.store.clear();
    }
  }

  beforeEach(() => {
    const localStorage = new MemoryStorage();
    (globalThis as any).window = { localStorage };
    localStorage.clear();
  });

  afterEach(() => {
    (globalThis as any).window = originalWindow;
  });

  it("parses valid marketplace IDs and rejects invalid ones", () => {
    expect(parseMarketplaceId("EBAY_US")).toBe("EBAY_US");
    expect(parseMarketplaceId("ebay_de")).toBe("EBAY_DE");
    expect(parseMarketplaceId("EBAY_MARS")).toBeNull();
    expect(parseMarketplaceId(null)).toBeNull();
  });

  it("reads and writes marketplace preference in localStorage", () => {
    expect(readMarketplacePreference()).toBeNull();
    writeMarketplacePreference("EBAY_AU");
    expect(window.localStorage.getItem(MARKETPLACE_STORAGE_KEY)).toBe("EBAY_AU");
    expect(readMarketplacePreference()).toBe("EBAY_AU");
  });

  it("returns null when stored value is invalid", () => {
    window.localStorage.setItem(MARKETPLACE_STORAGE_KEY, "NOT_REAL");
    expect(readMarketplacePreference()).toBeNull();
  });

  it("exposes display labels for UI", () => {
    expect(marketplaceLabel(DEFAULT_MARKETPLACE)).toBe("eBay US");
    expect(marketplaceLabel("EBAY_GB")).toBe("eBay UK");
  });

  it("maps marketplace IDs to the expected eBay hosts", () => {
    expect(marketplaceHost("EBAY_US")).toBe("www.ebay.com");
    expect(marketplaceHost("EBAY_GB")).toBe("www.ebay.co.uk");
    expect(marketplaceHost("EBAY_DE")).toBe("www.ebay.de");
    expect(marketplaceHost("EBAY_CA")).toBe("www.ebay.ca");
  });
});
