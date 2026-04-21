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

export function isMarketplaceId(value: string): value is MarketplaceId {
  return (ALLOWED_MARKETPLACES as readonly string[]).includes(value);
}

export function parseMarketplace(input: string | null): MarketplaceId {
  const normalized = (input ?? "").trim().toUpperCase();
  if (!normalized) return DEFAULT_MARKETPLACE;
  return isMarketplaceId(normalized) ? normalized : DEFAULT_MARKETPLACE;
}
