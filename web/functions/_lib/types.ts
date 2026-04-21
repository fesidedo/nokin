/**
 * Server-side mirror of `web/src/types.ts`. Keep both in sync until we
 * extract a shared folder.
 */

export interface ListingSummary {
  itemId: string;
  title: string;
  price: { value: string; currency: string } | null;
  condition: string | null;
  conditionId: string | null;
  itemWebUrl: string | null;
  imageUrl: string | null;
  thumbnailUrls: string[];
  itemEndDate: string | null;
  buyingOptions: string[];
  itemLocation: { country: string | null };
}

export type MarketplaceId =
  | "EBAY_US"
  | "EBAY_GB"
  | "EBAY_DE"
  | "EBAY_FR"
  | "EBAY_IT"
  | "EBAY_ES"
  | "EBAY_CA"
  | "EBAY_AU";

/**
 * Response shape for `/api/market?q=<lens display name>`.
 *
 * The endpoint runs two Browse searches in parallel and exposes them as
 * separate buckets so the UI can render them independently (and so a
 * failure on one branch doesn't take the other down with it).
 *
 * - `bin`     -> up to 3 active Buy-It-Now listings (relevance-ordered).
 * - `auction` -> up to 3 live auctions, server-sorted by soonest end time
 *   (listings with a null `itemEndDate` pushed to the tail).
 * - `errors`  -> optional per-bucket error message. Present only when the
 *   corresponding Browse call failed; the sibling bucket still renders.
 */
export interface MarketResponse {
  query: string;
  marketplace_used: MarketplaceId;
  bin: ListingSummary[];
  auction: ListingSummary[];
  fetched_at: string;
  errors?: {
    bin?: string;
    auction?: string;
  };
}

/** Environment bindings provided by Cloudflare Pages. */
export interface FunctionEnv {
  EBAY_APP_ID: string;
  EBAY_CERT_ID: string;
  /** Optional. Defaults to https://api.ebay.com. */
  EBAY_BASE_URL?: string;
}

/** Shape eBay returns from /buy/browse/v1/item_summary/search. */
export interface EbayBrowseResponse {
  itemSummaries?: EbayItemSummary[];
  total?: number;
}

/**
 * Partial shape of an eBay Browse API item. Only the fields we actively
 * consume are typed. The projection function intentionally does NOT return
 * unknown fields, so adding more here does not risk leaking them out.
 */
export interface EbayItemSummary {
  itemId?: string;
  title?: string;
  price?: { value?: string; currency?: string };
  condition?: string;
  conditionId?: string;
  itemWebUrl?: string;
  image?: { imageUrl?: string };
  thumbnailImages?: Array<{ imageUrl?: string }>;
  itemEndDate?: string;
  buyingOptions?: string[];
  itemLocation?: { country?: string };
  [key: string]: unknown;
}

export interface EbayTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}
