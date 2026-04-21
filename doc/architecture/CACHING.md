# Caching Strategy

How the Nikon lens explorer caches data across Cloudflare's free tier layers,
and when to escalate. Scope: read-only public data (lens dataset, eBay market
lookups). We have no per-user or authenticated responses yet.

## Current state (prototype)

| Thing cached | Where | TTL | Implemented in |
|---|---|---|---|
| eBay OAuth app access token | Workers Cache API (`caches.default`), per-POP | `expires_in - safety margin` (~2 h) | `web/functions/_lib/cache.ts` |
| `/api/market` response | Cloudflare CDN cache (edge, in front of the Function) | `s-maxage=3600` | `Cache-Control` header in `web/functions/api/market.ts` |
| `/api/market` response (client) | User's browser | `max-age=300` | same header |
| `/api/market` response (stale) | CDN, served while a background refresh runs | `stale-while-revalidate=600` | same header |
| Static assets (`index.html`, JS bundles, `lenses.v1.json`) | Cloudflare CDN cache | Managed by Pages defaults | Cloudflare Pages |

This gets us the "free" caching tier. Same query within an hour in the same
region: Function is skipped entirely, eBay quota untouched. Browsers
re-request at most every 5 minutes. For 10 minutes beyond the edge's 1 h
window, users see a stale copy instantly while the edge refreshes in the
background.

## The four Cloudflare caching layers

In rough order of cost and complexity:

### 1. Browser cache — `Cache-Control: max-age=...`

Per-user, lives in the client. Controlled entirely by the `Cache-Control`
header we return. Zero infrastructure cost.

- **Use for:** "the same user is going to see this a few times in a row."
- **Avoid when:** data is sensitive or must always be fresh for the acting
  user (not our problem — our API is read-only and public).

### 2. CDN cache — `Cache-Control: s-maxage=...` and `stale-while-revalidate=...`

Cloudflare's edge POP transparently caches the Response *in front of* the
Function. Requests that hit a warm POP never invoke the Function and never
hit eBay. This is the workhorse cache for us.

- **Keyed by** the full URL including query string. No `Authorization`
  header or cookie may vary per request (they'd bust the cache or, worse,
  leak between users).
- **Scope:** per-POP. A warm London POP doesn't warm Sydney. Usually fine
  unless traffic is globally spread and eBay starts rate-limiting.
- **Verify with:** `curl -I https://<host>/api/market` — look for
  `cf-cache-status: HIT` on the second request.
- **Stale-while-revalidate:** lets the edge serve an expired cached copy
  instantly while it asynchronously fetches a fresh one. Users never wait
  for eBay, and the cached view is only as stale as the SWR window.

### 3. Workers Cache API — `caches.default` inside the Function

The same storage as the CDN cache, but programmatic. Inside the Function
you call `caches.default.match(key)` / `.put(key, response)` with
synthetic `Request` objects as keys.

- **Use for:** things that aren't the Response itself. Today: the OAuth
  token. Future candidates: reshaped upstream payloads we want to key
  under our own hash instead of the public URL.
- **Also per-POP**, same consistency properties as layer 2.
- **Custom cache keys:** lets us cache a reshaped/projected version of an
  eBay response keyed by `(stable_id, sold_vs_active)` instead of the
  public URL. Handy once we support multiple market query modes.

### 4. Workers KV — globally replicated key-value store

Eventually consistent (~60 s write propagation), fast reads worldwide
after first hydration. Requires provisioning a KV namespace and binding
it in `wrangler.jsonc`.

- **Use for:** cross-POP sharing of expensive-to-mint data — primarily
  the OAuth token if we ever observe it being re-minted per POP at a
  rate that worries us.
- **Not for:** low-latency writes or anything that needs strict
  consistency. Writes are eventually consistent.
- **Not free at scale:** there's a paid tier past the free quota; we
  should not reach for this unless Cache API is demonstrably
  insufficient.

### Adjacent but not caches

- **D1** (SQLite at the edge) — persistent relational storage. Overkill
  for caching.
- **R2** — object storage. Useful for large blobs (think: a sold-listings
  archive), not hot-path caching.
- **Durable Objects** — strong consistency / coordination primitive. Not
  a cache.

## Escalation path

Start cheap, escalate when metrics justify it:

1. **Today:** browser + CDN via `Cache-Control`, Cache API for the OAuth
   token. This is Steps 1–3.
2. **If eBay API quota gets tight or tail latency spikes:** custom cache
   keys via the Workers Cache API for reshaped responses. Same layer,
   finer granularity.
3. **If the OAuth token endpoint sees per-POP churn:** move
   `cache.ts` from Cache API to Workers KV, keeping the same read/write
   shape so no caller changes. Add a KV binding in `wrangler.jsonc`.
4. **If traffic gets high and hot queries repeat globally:** KV for
   `/api/market` response bodies too, still fronted by CDN cache.

Don't do 3 or 4 pre-emptively — KV isn't free at scale and adds a
binding/provisioning step. The edge CDN is enough until proven otherwise.

## TTL decisions

- **Active listings (`/api/market`)** — 1 h edge (`s-maxage`), 5 min
  browser (`max-age`), 10 min SWR. Active prices change slowly enough that
  an hour-old snapshot is fine for our UI; if a user wants the latest they
  can wait 5 min or hard-refresh.
- **Sold listings (future)** — 24 h edge. They're historical; backdating
  doesn't move.
- **OAuth token** — `expires_in - safety_margin` (eBay returns ~2 h; we
  expire ours a few minutes early).
- **Static dataset (`lenses.v1.json`)** — treat as immutable per release.
  When we cut a new version of the dataset we'll bump the filename
  (`lenses.v2.json`) and publish cache-busting headers for the old one.

## Cache-busting / invalidation

- **By URL change:** the cleanest approach. New dataset → new filename.
  New API shape → new route (`/api/market/v2`) or new query parameter.
- **Purge via dashboard:** Cloudflare dashboard → Caching → Configuration
  → Purge Everything (or Purge by URL). Nuclear option; use sparingly.
- **Manual within a Function:** `cache.delete(cacheKey)`. Requires
  holding the exact synthetic cache key — used for the OAuth token if we
  ever need to force a re-mint.

## Gotchas

- A Response with `Set-Cookie`, `Authorization`, or a `Vary: *` header
  won't be cached by the CDN. Keep the Function's responses stateless.
- The CDN cache key includes the full query string. Keep our URL shape
  canonical — don't sprinkle tracking params, don't randomize order.
- `Cache-Control: no-store` on the Function response disables *all* of
  layer 1 and layer 2. Never use it for GET endpoints unless the body
  legitimately varies per request.
- Local `wrangler pages dev` does not run the edge CDN cache. Only the
  Cache API (layer 3) works locally. Test CDN behavior against a real
  Pages deployment.
