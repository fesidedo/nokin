/**
 * Thin wrapper around the Cloudflare Cache API for caching the eBay
 * application access token. Keyed by a synthetic request URL so different
 * base URLs (production vs sandbox) never collide.
 *
 * DOM lib's `CacheStorage` type omits the Cloudflare-specific `default`
 * property; declare it here so this module is the only place that needs the
 * cast.
 */

declare global {
  interface CacheStorage {
    readonly default: Cache;
  }
}

const TOKEN_CACHE_KEY_PREFIX = "https://internal.nokin.cache/ebay/app-token";

function tokenCacheRequest(baseUrl: string): Request {
  return new Request(`${TOKEN_CACHE_KEY_PREFIX}?base=${encodeURIComponent(baseUrl)}`, {
    method: "GET",
  });
}

export async function readCachedToken(baseUrl: string): Promise<string | null> {
  const cache = caches.default;
  const res = await cache.match(tokenCacheRequest(baseUrl));
  if (!res) return null;

  const body = await res.text();
  if (!body) return null;

  return body;
}

/**
 * Cache the raw access token string with a `Cache-Control: max-age=<ttl>`
 * header. The Cache API will evict it when the freshness window elapses.
 */
export async function writeCachedToken(
  baseUrl: string,
  accessToken: string,
  ttlSeconds: number,
): Promise<void> {
  if (ttlSeconds <= 0) return;
  const cache = caches.default;
  const res = new Response(accessToken, {
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": `max-age=${Math.floor(ttlSeconds)}`,
    },
  });
  await cache.put(tokenCacheRequest(baseUrl), res);
}
