import {
  EbayApiError,
  getAppToken,
  searchAuctionsEndingSoon,
  searchBinListings,
} from "../_lib/ebay";
import { validateEnv } from "../_lib/env";
import { isJunkListing } from "../_lib/filters";
import type { FunctionEnv, ListingSummary, MarketResponse } from "../_lib/types";

/**
 * Market data endpoint: GET `/api/market?q=<lens display name>`.
 *
 * Fires two Browse searches in parallel (Buy-It-Now and live auctions),
 * strips junk listings, and returns the top 3 of each bucket. Auctions
 * are sorted ascending on `itemEndDate` so "ending soonest" surfaces
 * first; the sort is done server-side because the Browse API does not
 * expose an `endingSoonest` sort value.
 *
 * The over-fetch limit (`PREFETCH_LIMIT`) is larger than the display
 * count so the junk filter can discard noise (broken / for parts /
 * untested listings, condition id 7000) without starving the bucket.
 */

const PREFETCH_LIMIT = 25;
const DISPLAY_LIMIT = 3;

export const onRequestGet: PagesFunction<FunctionEnv> = async ({ env, request }) => {
  const validation = validateEnv(env);
  if (!validation.ok) {
    return json(500, { error: "missing_env", missing: validation.missing });
  }

  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  if (!q) {
    return json(400, { error: "missing_query" });
  }

  try {
    const token = await getAppToken(validation.env);

    const [binResult, auctionResult] = await Promise.allSettled([
      searchBinListings(validation.env, token, { q, limit: PREFETCH_LIMIT }),
      searchAuctionsEndingSoon(validation.env, token, { q, limit: PREFETCH_LIMIT }),
    ]);

    const { listings: bin, error: binError } = finalizeBucket(binResult, "bin");
    const { listings: auction, error: auctionError } = finalizeBucket(
      auctionResult,
      "auction",
    );

    const errors: MarketResponse["errors"] = {};
    if (binError) errors.bin = binError;
    if (auctionError) errors.auction = auctionError;

    const body: MarketResponse = {
      query: q,
      bin,
      auction,
      fetched_at: new Date().toISOString(),
      ...(Object.keys(errors).length > 0 ? { errors } : {}),
    };

    return json(200, body, {
      "Cache-Control":
        "public, s-maxage=3600, max-age=300, stale-while-revalidate=600",
    });
  } catch (err) {
    // Only hit when both buckets fail via a shared upstream problem
    // (typically OAuth). Per-bucket errors are swallowed above.
    if (err instanceof EbayApiError) {
      return json(502, {
        error: err.kind,
        status: err.status,
        ebay_message: err.ebayMessage,
      });
    }
    return json(500, {
      error: "internal",
      message: err instanceof Error ? err.message : "unknown",
    });
  }
};

/**
 * Turn a settled Browse call into the bucket we expose to the client.
 *
 * For auctions we sort ascending by `itemEndDate` so the soonest-ending
 * ones surface first; listings with no `itemEndDate` (very rare, but the
 * field is nullable on our projection) are pushed to the tail so they
 * don't clog the top of the list.
 */
function finalizeBucket(
  result: PromiseSettledResult<ListingSummary[]>,
  bucket: "bin" | "auction",
): { listings: ListingSummary[]; error: string | undefined } {
  if (result.status === "rejected") {
    return { listings: [], error: describeError(result.reason) };
  }

  const filtered = result.value.filter((l) => !isJunkListing(l));
  const ordered =
    bucket === "auction" ? [...filtered].sort(byEndDateAscNullsLast) : filtered;
  return { listings: ordered.slice(0, DISPLAY_LIMIT), error: undefined };
}

function byEndDateAscNullsLast(a: ListingSummary, b: ListingSummary): number {
  const aHas = typeof a.itemEndDate === "string" && a.itemEndDate.length > 0;
  const bHas = typeof b.itemEndDate === "string" && b.itemEndDate.length > 0;
  if (aHas && bHas) return a.itemEndDate! < b.itemEndDate! ? -1 : a.itemEndDate! > b.itemEndDate! ? 1 : 0;
  if (aHas) return -1;
  if (bHas) return 1;
  return 0;
}

function describeError(reason: unknown): string {
  if (reason instanceof EbayApiError) {
    return `${reason.kind} (status ${reason.status})`;
  }
  if (reason instanceof Error) return reason.message;
  return "unknown";
}

function json(status: number, body: unknown, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...extraHeaders,
    },
  });
}
