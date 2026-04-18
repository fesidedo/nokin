import { EbayApiError, getAppToken, searchActiveListings } from "../_lib/ebay";
import { validateEnv } from "../_lib/env";
import type { FunctionEnv, MarketResponse } from "../_lib/types";

/**
 * Prototype endpoint: hardcoded `q=nikon&limit=5` against eBay Browse API.
 * When the real UI lands, this handler will read `q` (or `stable_id`) from
 * the request query.
 */

const PROTOTYPE_QUERY = "nikon";
const PROTOTYPE_LIMIT = 5;

export const onRequestGet: PagesFunction<FunctionEnv> = async ({ env }) => {
  const validation = validateEnv(env);
  if (!validation.ok) {
    return json(500, { error: "missing_env", missing: validation.missing });
  }

  try {
    const token = await getAppToken(validation.env);
    const active = await searchActiveListings(validation.env, token, {
      q: PROTOTYPE_QUERY,
      limit: PROTOTYPE_LIMIT,
    });

    const body: MarketResponse = {
      query: PROTOTYPE_QUERY,
      active,
      fetched_at: new Date().toISOString(),
    };

    return json(200, body, {
      "Cache-Control": "no-store",
    });
  } catch (err) {
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

function json(status: number, body: unknown, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...extraHeaders,
    },
  });
}
