# Market Data Flow

This document defines how lens-level market data is fetched, filtered, and
returned by the Cloudflare Pages Function.

## Endpoint contract

- Route: `GET /api/market?q=<lens display name>`
- Query param:
  - `q` (required): the search text sent to eBay Browse API

If `q` is missing or blank, the endpoint returns:

```json
{ "error": "missing_query" }
```

with HTTP `400`.

Successful responses return:

```ts
interface MarketResponse {
  query: string;
  bin: ListingSummary[];
  auction: ListingSummary[];
  fetched_at: string;
  errors?: {
    bin?: string;
    auction?: string;
  };
}
```

Notes:

- `bin` contains up to 3 Buy-It-Now listings.
- `auction` contains up to 3 live auction listings.
- `errors` is optional and per-bucket. If one upstream call fails, the other
  bucket can still be returned.

## Upstream eBay strategy

The Function performs two Browse API calls in parallel (`Promise.allSettled`):

1. Buy-It-Now bucket:
   - `filter=buyingOptions:{FIXED_PRICE},conditions:{NEW|USED}`
2. Auction bucket:
   - `filter=buyingOptions:{AUCTION},conditions:{NEW|USED}`

Both calls over-fetch with `limit=25`, then the Function filters and truncates
to 3 visible items.

## Why there is no auction time window filter

We intentionally do not apply an `itemEndDate:[now..X]` window. eBay auctions
are inherently short-lived, so removing the window gives the widest possible
net for low-volume lenses while still showing "ending soonest" by sorting
ascending on `itemEndDate` server-side.

## Junk listing filter

After projection, listings are dropped when either is true:

- `conditionId === "7000"` ("For parts or not working")
- listing title matches denylist patterns such as:
  - `for parts`, `parts only`, `not working`, `broken`, `damaged`, `as-is`,
    `repair`, `spares`, `untested`, `empty box`, `box only`

Implementation:

- `web/functions/_lib/filters.ts`
- tests: `web/functions/_lib/filters.test.ts`

## Caching

`/api/market` responses include:

- `s-maxage=3600`
- `max-age=300`
- `stale-while-revalidate=600`

Because Cloudflare caches by full URL, each distinct `q` value has its own
edge cache entry.

## Client usage

The lens detail modal calls:

- `fetchMarket(lens.display_name, signal)`

The modal renders two independent sections (Buy It Now and Auctions ending
soon), each with loading, empty, and error states.
