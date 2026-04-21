# Trade / Market Data Model (Placeholder)

Status: draft placeholder for upcoming model design.

## Source page

- `http://www.photosynthesis.co.nz/nikon/trade.html`

## Intended scope

- Optional marketplace dataset separate from canonical historical catalog data.
- AI kit sale entries and accessory sale entries in a normalized listing format.
- Basic listing lifecycle metadata (captured date, status if known).
- Provenance and parsing confidence for all entries.

## Open design questions

- Whether this dataset should be persisted historically or treated as ephemeral snapshots.
- How tightly trade entries should link to canonical lens/accessory entities.
- Whether to combine with eBay enrichment model or keep as separate source domains.

## Planned docs in this folder

- `TRADE_DATA_MODEL_SPEC.md`
- `TRADE_JSON_SCHEMA_DRAFT.md`
- `TRADE_RECORD_EXAMPLES.md`
