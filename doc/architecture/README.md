# Architecture Docs

Cross-cutting architecture documents for the Nikon lens explorer.

## Contents

- `SYSTEM_ARCHITECTURE.md` — the end-to-end system diagram, component
  responsibilities, technology validation (Cloudflare Pages + Pages Functions,
  React on the frontend, language choice on the Worker side), and a rundown of
  Cloudflare-specific restrictions we need to design around.
- `CACHING.md` — the caching strategy: which Cloudflare layer caches what,
  current TTLs, the four available layers (browser, CDN, Workers Cache API,
  Workers KV), and when to escalate beyond the free edge-cache tier.
- `MARKET_DATA.md` — `/api/market` endpoint contract, eBay query strategy,
  junk-listing filtering rules, and how BIN/auction buckets are built.

Each subdomain of the system has its own deeper doc folder: data modeling
under `doc/data-model/`, eBay integration policy under `doc/ebay/`. Start here
when you want the whole-system picture, then drill into those folders for the
details.
