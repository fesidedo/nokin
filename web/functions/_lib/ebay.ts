import { readCachedToken, writeCachedToken } from "./cache";
import type { ValidatedEnv } from "./env";
import type {
  EbayBrowseResponse,
  EbayItemSummary,
  EbayTokenResponse,
  ListingSummary,
} from "./types";

/**
 * eBay marketplace used for Browse API calls. Hardcoded for the prototype;
 * surfaced as a constant so future callers can parameterize later.
 */
export const MARKETPLACE_ID = "EBAY_US";

/** Safety margin subtracted from `expires_in` when caching the token. */
const TOKEN_REFRESH_MARGIN_SECONDS = 60;

/** Scope required for the public Browse API. */
const BROWSE_SCOPE = "https://api.ebay.com/oauth/api_scope";

export class EbayApiError extends Error {
  readonly kind: "oauth_failed" | "browse_failed";
  readonly status: number;
  readonly ebayMessage: string;

  constructor(kind: "oauth_failed" | "browse_failed", status: number, ebayMessage: string) {
    super(`${kind} (status ${status}): ${ebayMessage}`);
    this.kind = kind;
    this.status = status;
    this.ebayMessage = ebayMessage;
  }
}

/**
 * Return an application access token, using the Cache API to avoid a round-trip
 * to eBay's OAuth endpoint on every request.
 */
export async function getAppToken(env: ValidatedEnv): Promise<string> {
  const cached = await readCachedToken(env.baseUrl);
  if (cached) return cached;

  const tokenResponse = await requestNewAppToken(env);
  const ttl = Math.max(0, tokenResponse.expires_in - TOKEN_REFRESH_MARGIN_SECONDS);
  await writeCachedToken(env.baseUrl, tokenResponse.access_token, ttl);
  return tokenResponse.access_token;
}

async function requestNewAppToken(env: ValidatedEnv): Promise<EbayTokenResponse> {
  const url = `${env.baseUrl}/identity/v1/oauth2/token`;
  const basic = btoa(`${env.appId}:${env.certId}`);
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    scope: BROWSE_SCOPE,
  });

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await safeReadText(res);
    throw new EbayApiError("oauth_failed", res.status, truncate(text, 512));
  }

  return (await res.json()) as EbayTokenResponse;
}

export interface SearchParams {
  q: string;
  limit: number;
  /**
   * Optional Browse API `filter` clauses. Each entry is a single filter
   * expression (e.g. `buyingOptions:{FIXED_PRICE}`) and the fetcher joins
   * them with commas, which is how Browse expects multi-filter calls.
   */
  filter?: string[];
  /** Optional Browse API `sort` value (e.g. `newlyListed`, `price`, `-price`). */
  sort?: string;
}

/**
 * Low-level Browse API search. Composes query/filter/sort params and
 * projects every returned item through `projectListing` so the allow-list
 * in `doc/ebay/INTEGRATION_POLICY.md` is enforced at the single choke point.
 */
async function runBrowseSearch(
  env: ValidatedEnv,
  token: string,
  params: SearchParams,
): Promise<ListingSummary[]> {
  const url = new URL(`${env.baseUrl}/buy/browse/v1/item_summary/search`);
  url.searchParams.set("q", params.q);
  url.searchParams.set("limit", String(params.limit));
  if (params.filter && params.filter.length > 0) {
    url.searchParams.set("filter", params.filter.join(","));
  }
  if (params.sort) {
    url.searchParams.set("sort", params.sort);
  }

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "X-EBAY-C-MARKETPLACE-ID": MARKETPLACE_ID,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const text = await safeReadText(res);
    throw new EbayApiError("browse_failed", res.status, truncate(text, 512));
  }

  const body = (await res.json()) as EbayBrowseResponse;
  const items = body.itemSummaries ?? [];
  return items.map(projectListing);
}

/**
 * Default relevance-ordered Browse search with no buying-option or
 * condition filters. Kept for the legacy prototype path; new callers
 * should use the bucket-specific helpers below.
 */
export async function searchActiveListings(
  env: ValidatedEnv,
  token: string,
  params: Pick<SearchParams, "q" | "limit">,
): Promise<ListingSummary[]> {
  return runBrowseSearch(env, token, params);
}

export interface BucketSearchParams {
  q: string;
  /**
   * Over-fetch limit. The endpoint filters junk listings (condition 7000,
   * titles containing "broken", "for parts", etc.) post-fetch and slices
   * down to the display count, so we pull more than we show.
   */
  limit: number;
}

/**
 * Buy-It-Now bucket: FIXED_PRICE only, NEW or USED condition.
 *
 * The Browse API default is already FIXED_PRICE, but we set the filter
 * explicitly to make intent obvious and to keep the two bucket functions
 * structurally symmetric.
 */
export async function searchBinListings(
  env: ValidatedEnv,
  token: string,
  params: BucketSearchParams,
): Promise<ListingSummary[]> {
  return runBrowseSearch(env, token, {
    q: params.q,
    limit: params.limit,
    filter: ["buyingOptions:{FIXED_PRICE}", "conditions:{NEW|USED}"],
  });
}

/**
 * Auction bucket: live AUCTION listings, NEW or USED condition.
 *
 * Note: we intentionally do NOT pass an `itemEndDate` window filter. eBay
 * auctions are capped at ~10-day durations by the platform, so any live
 * auction matching the query is a valid candidate. The caller (the
 * `/api/market` handler) sorts the returned items by `itemEndDate`
 * ascending to surface the ones ending soonest. This keeps the net as
 * wide as possible for lenses where auction listings are rare.
 */
export async function searchAuctionsEndingSoon(
  env: ValidatedEnv,
  token: string,
  params: BucketSearchParams,
): Promise<ListingSummary[]> {
  return runBrowseSearch(env, token, {
    q: params.q,
    limit: params.limit,
    filter: ["buyingOptions:{AUCTION}", "conditions:{NEW|USED}"],
  });
}

/**
 * Project a raw eBay item into our allow-listed shape. This is the single
 * choke point that enforces `doc/ebay/INTEGRATION_POLICY.md`: any eBay field
 * not explicitly picked here cannot leave the function.
 *
 * Exported for unit testing.
 */
export function projectListing(item: EbayItemSummary): ListingSummary {
  const price =
    item.price && typeof item.price.value === "string" && typeof item.price.currency === "string"
      ? { value: item.price.value, currency: item.price.currency }
      : null;

  const thumbnailUrls = Array.isArray(item.thumbnailImages)
    ? item.thumbnailImages
        .map((t) => (typeof t?.imageUrl === "string" ? t.imageUrl : null))
        .filter((u): u is string => u !== null)
    : [];

  return {
    itemId: typeof item.itemId === "string" ? item.itemId : "",
    title: typeof item.title === "string" ? item.title : "",
    price,
    condition: typeof item.condition === "string" ? item.condition : null,
    conditionId: typeof item.conditionId === "string" ? item.conditionId : null,
    itemWebUrl: typeof item.itemWebUrl === "string" ? item.itemWebUrl : null,
    imageUrl: typeof item.image?.imageUrl === "string" ? item.image.imageUrl : null,
    thumbnailUrls,
    itemEndDate: typeof item.itemEndDate === "string" ? item.itemEndDate : null,
    buyingOptions: Array.isArray(item.buyingOptions)
      ? item.buyingOptions.filter((b): b is string => typeof b === "string")
      : [],
    itemLocation: {
      country: typeof item.itemLocation?.country === "string" ? item.itemLocation.country : null,
    },
  };
}

async function safeReadText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return "";
  }
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}\u2026`;
}
