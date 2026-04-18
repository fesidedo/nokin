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

export interface MarketResponse {
  query: string;
  active: ListingSummary[];
  fetched_at: string;
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
