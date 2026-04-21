# Implementation Handoff Checklist (Scraper Phase)

Use this checklist before starting parser/scraper code.
Execution order and delivery milestones are in `doc/data-model/lenses/SCRAPER_IMPLEMENTATION_PLAN.md`.

## 1) Identity and ID Rules

- [ ] Default input source is local snapshots:
  - [ ] `data/source/lenses.html`
  - [ ] `data/source/specs.html`
- [ ] Core pipeline runs without network access.
- [ ] Implement `base_key = type_norm + focal_signature + aperture_signature`.
- [ ] Implement stable ID policy exactly:
  - [ ] append normalized/sorted token suffix whenever `variant_tokens` are present.
  - [ ] use `base_key` only when `variant_tokens` are empty.
  - [ ] append fallback disambiguator only if still colliding.
- [ ] Ensure section headers are never used in identity generation.

## 2) Normalization Contracts

- [ ] Type normalization map defined (`Ai`, `Ai-S`, `AF`, `AF-S`, etc.).
- [ ] Focal signature parser handles primes and zooms.
- [ ] Aperture signature parser handles single/range formats.
- [ ] Variant token parser:
  - [ ] normalizes case
  - [ ] applies alias-to-canonical mapping
  - [ ] deduplicates
  - [ ] sorts deterministically
  - [ ] joins suffix with `_` and never emits `__` inside token suffix

## 3) Merge Contracts (`lenses` + `specs`)

- [ ] Join first by `base_key`.
- [ ] Resolve collisions to `stable_id`.
- [ ] Output one canonical key per field (no `*_summary` vs `*_spec` duplicates).
- [ ] Apply field precedence/fallback policy for overlaps.
- [ ] Include provenance references to both pages when merged.
- [ ] Populate `field_sources` for consolidated fields when feasible.

## 4) JSON Output Contract

- [ ] Output conforms to `doc/data-model/lenses/JSON_SCHEMA_DRAFT.md`.
- [ ] Required identity fields always present.
- [ ] Required provenance fields always present.
- [ ] Include warnings/merge flags for uncertain joins.

## 5) Test Fixtures for First Implementation

- [ ] Unique ID case fixture (no collision).
- [ ] Token-suffix case fixture (for example `new`) even without collision.
- [ ] Collision case fixture using fallback disambiguator.
- [ ] One merged fixture with both summary and technical spec fields populated.

## 6) QA and Determinism Checks

- [ ] Re-running ingestion on unchanged source produces identical `stable_id`s.
- [ ] Token order variations do not change ID output.
- [ ] Token alias variations (for example `ED` vs `ed`) do not change ID output.
- [ ] Row reordering in source page does not change `stable_id`.

## 7) Explicit Non-Goals (for first code pass)

- [ ] Do not implement camera compatibility engine yet.
- [ ] Do not implement AI conversion mapping yet.
- [ ] Do not implement eBay enrichment in ingestion phase.
