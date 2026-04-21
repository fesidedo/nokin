import type { MarketplaceId } from "./types";

export const ALLOWED_MARKETPLACES = [
  "EBAY_US",
  "EBAY_GB",
  "EBAY_DE",
  "EBAY_FR",
  "EBAY_IT",
  "EBAY_ES",
  "EBAY_CA",
  "EBAY_AU",
] as const satisfies readonly MarketplaceId[];

export const DEFAULT_MARKETPLACE: MarketplaceId = "EBAY_US";
export const MARKETPLACE_STORAGE_KEY = "nokin.marketplace";

const MARKETPLACE_LABELS: Record<MarketplaceId, string> = {
  EBAY_US: "eBay US",
  EBAY_GB: "eBay UK",
  EBAY_DE: "eBay Germany",
  EBAY_FR: "eBay France",
  EBAY_IT: "eBay Italy",
  EBAY_ES: "eBay Spain",
  EBAY_CA: "eBay Canada",
  EBAY_AU: "eBay Australia",
};

export function marketplaceLabel(id: MarketplaceId): string {
  return MARKETPLACE_LABELS[id];
}

export function isMarketplaceId(value: string): value is MarketplaceId {
  return (ALLOWED_MARKETPLACES as readonly string[]).includes(value);
}

export function parseMarketplaceId(input: string | null | undefined): MarketplaceId | null {
  const normalized = (input ?? "").trim().toUpperCase();
  if (!normalized) return null;
  return isMarketplaceId(normalized) ? normalized : null;
}

export function readMarketplacePreference(): MarketplaceId | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(MARKETPLACE_STORAGE_KEY);
    return parseMarketplaceId(raw);
  } catch {
    return null;
  }
}

export function writeMarketplacePreference(market: MarketplaceId): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MARKETPLACE_STORAGE_KEY, market);
  } catch {
    // Best effort only - app can continue with in-memory state.
  }
}
