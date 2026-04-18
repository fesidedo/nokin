# nokin-web

Vite + React SPA plus a Cloudflare Pages Function that calls the eBay Browse
API. This directory is the Cloudflare Pages project root; the Python
ingestion pipeline at the repo root (`src/nokin_lens_ingest/`, `data/`) is
unrelated to the Pages build.

See [../doc/architecture/SYSTEM_ARCHITECTURE.md](../doc/architecture/SYSTEM_ARCHITECTURE.md)
for the full component picture and
[../doc/ebay/INTEGRATION_POLICY.md](../doc/ebay/INTEGRATION_POLICY.md) for the
eBay field allow-list this slice enforces.

## What this prototype does

1. Browser loads the SPA (a bare page with a Refresh button and a `<pre>` dump).
2. On mount the SPA fetches `/api/market`.
3. The Pages Function at `functions/api/market.ts`:
   - Reads `EBAY_APP_ID`, `EBAY_CERT_ID`, and optional `EBAY_BASE_URL` from the env.
   - Gets an OAuth application access token (cached in the Cloudflare Cache API).
   - Calls `GET /buy/browse/v1/item_summary/search?q=nikon&limit=5` with `X-EBAY-C-MARKETPLACE-ID: EBAY_US`.
   - Projects each item to an allow-listed subset (see `functions/_lib/ebay.ts:projectListing`).
   - Returns `{ query, active, fetched_at }` as JSON.
4. The SPA renders the JSON.

## Requirements

- **Node.js 22.12+ (LTS recommended).** Vite 8, Vitest 4, and Rolldown all
  require Node 20.19+ or 22.12+. Node 21 will emit engine warnings and may
  install fine on some machines but is unsupported upstream.
- **npm 10+** (bundled with Node 22).
- **eBay Developer credentials.** App ID (Client ID) and Cert ID (Client
  Secret) for either production or sandbox. OAuth flow is identical; only
  the credentials and base URL differ.

## Local development

### First-time setup

```powershell
cd web
cp .dev.vars.example .dev.vars
# Edit .dev.vars and paste your EBAY_APP_ID and EBAY_CERT_ID values.
# EBAY_BASE_URL defaults to production; change to https://api.sandbox.ebay.com if needed.
npm install
```

`.dev.vars` is gitignored. Wrangler loads it automatically for `wrangler pages dev`.

### Day-to-day commands

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server only (`http://localhost:5173`). Fastest HMR. `/api/*` calls will 404 because no Function is running. Use when iterating on UI only. |
| `npm run dev:full` | Runs Vite **and** `wrangler pages dev` in parallel (via `concurrently`). Wrangler proxies to Vite's port and serves Functions at the same origin. Open `http://localhost:8788` to exercise the full stack. |
| `npm run build` | Type-checks with `tsc --noEmit` (via VS Code) and runs `vite build`. Outputs to `dist/`. |
| `npm run preview` | Serves the built `dist/` through `wrangler pages dev` for a production-like preview at `http://localhost:8788`. |
| `npm run typecheck` | Standalone type-check without building. |
| `npm test` | Runs the Vitest suite once. |
| `npm run test:watch` | Vitest watch mode. |

### Expected output

With valid production credentials, `GET http://localhost:8788/api/market`
returns something like:

```json
{
  "query": "nikon",
  "active": [
    {
      "itemId": "v1|123456|0",
      "title": "Nikon D750 Digital SLR Camera Body",
      "price": { "value": "449.00", "currency": "USD" },
      "condition": "USED_EXCELLENT",
      "conditionId": "3000",
      "itemWebUrl": "https://www.ebay.com/itm/123456",
      "imageUrl": "https://i.ebayimg.com/.../s-l300.jpg",
      "thumbnailUrls": ["..."],
      "itemEndDate": null,
      "buyingOptions": ["FIXED_PRICE"],
      "itemLocation": { "country": "US" }
    }
  ],
  "fetched_at": "2026-04-18T18:00:00.000Z"
}
```

### Error shapes (for debugging)

| HTTP | Body | Meaning |
|---|---|---|
| `500` | `{ "error": "missing_env", "missing": [...] }` | One or more env vars are unset. Check `.dev.vars` (local) or Pages secrets (prod). |
| `502` | `{ "error": "oauth_failed", "status": ..., "ebay_message": "..." }` | OAuth token fetch failed. Usually bad credentials or eBay outage. |
| `502` | `{ "error": "browse_failed", "status": ..., "ebay_message": "..." }` | Token worked but Browse call failed. Could be scope, marketplace header, or rate-limit issues. |
| `500` | `{ "error": "internal", "message": "..." }` | Unexpected throw. Check Wrangler logs. |

## One-time Cloudflare Pages setup

Do this once per environment (preview, production).

1. Push the repo to GitHub if it is not already there.
2. Cloudflare dashboard -> **Workers & Pages** -> **Create** -> **Pages** -> **Connect to Git** -> select the repo.
3. Build configuration:
   - Production branch: `main` (or whatever branch the repo uses).
   - Framework preset: **None** (Vite preset also fine).
   - Build command: `npm run build`
   - Build output directory: `dist`
   - **Root directory (advanced): `web`** &larr; critical. This is what tells Pages to `npm install` and build inside this subfolder.
4. After the first deploy, go to **Settings** -> **Variables and secrets** and add:
   - `EBAY_APP_ID` (type: **Secret**)
   - `EBAY_CERT_ID` (type: **Secret**)
   - `EBAY_BASE_URL` (type: **Environment variable**, optional &mdash; defaults to `https://api.ebay.com` if unset)
5. Redeploy so the new secrets are picked up by the Functions runtime.
6. Visit `https://<project>.pages.dev` and confirm the page shows 5 trimmed listings.

The **SPA routing** toggle in Pages settings is *not* needed for this slice
(only one route). Enable it when we add React Router so client-side deep
links do not 404.

## What to look for when validating the deploy

- Page renders without CSS or JS errors.
- JSON dump shows exactly 5 listings.
- No listing contains `seller`, `username`, `userId`, `eiasToken`, or any
  other banned field. `JSON.stringify(response).includes("seller")` in the
  browser console should be `false`.
- A refresh within ~2h does not trigger a new OAuth token fetch. To verify
  locally, add a temporary `console.log` in
  `functions/_lib/ebay.ts:requestNewAppToken` and watch the Wrangler output
  &mdash; the second refresh should not log anything from that function.

## Layout

```
web/
  package.json
  tsconfig.json          # covers src/ and functions/
  tsconfig.node.json     # for vite.config.ts tooling
  vite.config.ts         # also defines Vitest config
  index.html             # SPA entry HTML
  .dev.vars.example      # template; copy to .dev.vars (gitignored)
  src/
    main.tsx             # React root
    App.tsx              # single component; fetch + render
    api.ts               # typed /api/market fetch wrapper
    types.ts             # client-side contract types
    styles.css
  functions/
    api/
      market.ts          # GET /api/market handler
    _lib/
      ebay.ts            # OAuth + Browse + projectListing (allow-list)
      ebay.test.ts       # projection unit test
      cache.ts           # Cache API wrapper for OAuth token
      env.ts             # env validation
      types.ts           # server-side contract types (mirror of src/types.ts)
```

## Known caveats

- **Types duplicated.** `src/types.ts` and `functions/_lib/types.ts` share
  `ListingSummary` and `MarketResponse`. Kept in sync manually for now;
  extract to a shared folder when the contract stabilizes.
- **Browser caches the HTML file.** If a deploy swap seems stale, hard-refresh
  (Ctrl+Shift+R).
- **Wrangler port conflicts.** If 5173 or 8788 is in use,
  `npm run dev:full` will fail. Kill the offending process or edit
  `vite.config.ts` / `package.json` scripts.
- **npm optional-deps bug on Windows.** If `vite build` ever errors with
  "Cannot find native binding" for Rolldown, run
  `rm -r node_modules package-lock.json; npm install` and retry &mdash;
  this is [npm#4828](https://github.com/npm/cli/issues/4828).
