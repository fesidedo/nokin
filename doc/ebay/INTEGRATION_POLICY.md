# eBay Integration Policy

This document captures the rules that govern how this project interacts with the
eBay Developer APIs. Its primary purpose is to keep us compliant with eBay's
**Marketplace User Account Deletion/Closure** requirements while running on the
opt-out (exemption) path.

Read this before writing any code that calls an eBay API, and again before
adding any feature that persists data returned by eBay.

## Decision: we opt out

We have opted out of subscribing to eBay Marketplace Account Deletion/Closure
notifications via the "not persisting eBay data" exemption.

**Rationale.** This project is a Nikon lens browser. Our current use of the
eBay API is to display active market listings (Buy It Now + live auctions) for
specific lens models next to each lens in our catalog. We do not store any eBay user
identifiers, and we have no product features tied to eBay user identity. We
therefore qualify for the exemption.

Running a production HTTPS callback endpoint (with challenge-response handshake,
signature verification, 24h/30-day compliance windows, and a user-data deletion
routine) would be disproportionate infrastructure for a system that never
stores eBay user data in the first place.

## Exemption reason to submit on the opt-out form

Use the following text (or a close paraphrase) as the "Additional information"
note on eBay's opt-out confirmation page:

> Application queries the eBay Browse API to display current
> listings for specific camera lens models as market context. Only anonymous
> listing metadata (item ID, title, price, condition, end date, image URL,
> listing URL) is cached short-term for rate-limit relief. No eBay user
> identifiers (username, userId, eiasToken) and no seller or buyer identity
> fields are stored. The application has no user-linked features that reference
> eBay users.

If eBay's form requires selecting a predefined reason radio button, pick the
one that matches "application does not persist eBay user data / only uses
public listing data for display purposes".

## What we are allowed to cache

When calling eBay Browse API endpoints (`item_summary/search`,
`item/{item_id}`, etc.), we may persist the following listing fields in any
local cache, database, or static build artifact:

- `itemId`
- `title`
- `price.value`, `price.currency`
- `condition`, `conditionId`
- `itemWebUrl` (the "view on eBay" link)
- `image.imageUrl`, `thumbnailImages[*].imageUrl`
- `itemEndDate`
- `soldDate` (for completed/sold lookups if that API access is enabled later)
- `buyingOptions` (e.g. `FIXED_PRICE`, `AUCTION`)
- `itemLocation.country` (coarse geography only, for shipping context)
- Derived aggregates we compute ourselves (min/max/median sold price, sample
  count, last refresh timestamp)

These are all properties of the listing or of aggregate market data, not of an
eBay user.

## What we must never persist

The following fields must not be written to disk, committed to git, included
in a static build artifact, or stored in any database we control:

- `seller.username`
- `seller.userId` (if surfaced)
- `seller.feedbackScore`, `seller.feedbackPercentage`
- Any buyer-side username, userId, or bid history
- `eiasToken` (in any shape or form)
- Any field eBay documents as an identifier for a natural person

If we need any of these fields at runtime (for example, to display a seller's
feedback score on a listing card), we may fetch and render them for the
duration of a single user request, but they must not be captured in any
persistent store or cache. In practice the cleanest rule is: **don't request
these fields at all, and don't include them in the response projection we pass
to our cache layer.**

## Cache TTL policy

- Treat all eBay responses as transient market data, not part of our own
  dataset.
- Per-query cache TTL: **1 hour** for active listings, **24 hours** for sold
  listings (sold data changes less frequently).
- Do not build long-lived mirrors of eBay listings. If the same listing is seen
  across multiple refreshes, we overwrite the prior entry rather than building
  a history table.
- Caches must be easy to purge wholesale. A simple "delete the cache and let
  it rebuild" operation is sufficient.

## Triggers that would force us to switch to subscribing

The opt-out is valid only as long as the statements in our exemption reason
remain true. Before shipping any of the following, we must switch from opt-out
to subscribed (and build out the callback endpoint, signature verification,
and deletion routine):

- Persisting any `seller.*` identity field, `eiasToken`, or any buyer-side
  identifier, even in a short-lived cache keyed by user.
- Introducing user accounts that are linked to eBay identities (e.g. "sign in
  with eBay", or storing a mapping from our users to eBay userIds).
- Building a "trusted seller" or seller-reputation feature that keys on
  `seller.username` or `seller.userId`.
- Adding watchlists, saved searches, or per-user history that references any
  eBay user identifier.
- Any feature that surfaces per-buyer behavior (e.g. "this buyer purchased
  this lens").

When any of the above becomes a requirement, re-read eBay's "Marketplace User
Account Deletion" guide in full and then complete the subscribe flow:

1. Prepare a production HTTPS endpoint that supports GET (challenge) and POST
   (notifications).
2. Implement the SHA-256 challenge-response handshake
   (`challengeCode + verificationToken + endpoint`), returning the hash as
   JSON with `Content-Type: application/json` and no BOM.
3. Integrate one of the official Event Notification SDKs (Java, Node.js,
   .NET, PHP, Go) to verify the `x-ebay-signature` header on every POST.
4. Implement a deletion routine that removes all stored records matching the
   notification's `userId`, `username`, and `eiasToken` in a way that cannot
   be reversed by normal system privileges.
5. Set up monitoring on the endpoint's availability (24h of unacknowledged
   notifications marks it down and starts a 30-day compliance clock).

## Operational reminders

- All eBay API secrets (App ID, Cert ID, Dev ID, OAuth tokens) live in
  environment variables on the serverless function, never in the static site
  bundle, never in git.
- When adding a new eBay API call, document it briefly in
  `doc/RESEARCH_RESOURCES.md` so we have a running map of which endpoints we
  touch.
- Before adding any new cached field, check this document's "allowed" and
  "must never persist" lists. If the field is not covered, update this
  document before writing the code.

## Review cadence

- Re-read this document when starting any eBay-related feature.
- Review at least once per year even if nothing changes, to catch drift
  between intent and actual behavior.
