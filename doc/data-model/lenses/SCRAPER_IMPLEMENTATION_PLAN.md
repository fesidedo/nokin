# Lens Scraper Implementation Plan (Agent-Ready)

This plan turns the checklist into an execution sequence for building the first working ingestion pipeline.

## Goal

Implement v1 ingestion that:
- parses `lenses.html` and `specs.html`
- merges into one canonical flat lens record per `stable_id`
- outputs JSON conforming to `doc/data-model/lenses/JSON_SCHEMA_DRAFT.md`

## Inputs (Authoritative Specs)

- `doc/data-model/lenses/ID_STRATEGY_DRAFT.md`
- `doc/data-model/lenses/LENS_DATA_MODEL_SPEC.md`
- `doc/data-model/lenses/JSON_SCHEMA_DRAFT.md`
- `doc/data-model/lenses/CANONICAL_RECORD_EXAMPLES.md`
- `doc/data-model/lenses/IMPLEMENTATION_HANDOFF_CHECKLIST.md`

## Source Input Mode (Locked for v1)

Use local snapshots as default input:
- `data/source/lenses.html`
- `data/source/specs.html`

Notes:
- Do not require network fetching for the core pipeline.
- Optional live-refresh/fetch mode can be added later, but must not be required for tests or normal runs.

## Out of Scope (v1)

- `serialno.html` enrichment
- `accessory.html` enrichment
- camera compatibility
- AI conversion mapping
- eBay enrichment

## Phase 1: Project Scaffold

Deliverables:
- scraper module layout (fetch, parse, normalize, merge, validate, emit)
- reproducible run entrypoint
- output folder for generated dataset

Acceptance criteria:
- one command runs end-to-end pipeline
- generated output file is deterministic on repeated runs

## Phase 2: Source Ingestion

Deliverables:
- fetch/load adapters for:
  - `data/source/lenses.html`
  - `data/source/specs.html`
- raw row extraction with source metadata:
  - `source_page`
  - `source_row_index`
  - `source_section` (metadata only)

Acceptance criteria:
- parser skips repeated header rows safely
- section labels are captured but never treated as identity

## Phase 3: Normalization + Signatures

Deliverables:
- type normalization map
- focal signature parser
- aperture signature parser
- variant token parser with locked token contract:
  - lowercase
  - alias-to-canonical mapping
  - dedupe after mapping
  - lexicographic sort
  - `_` joiner only (no `__` inside token suffix)

Acceptance criteria:
- signature outputs match `CANONICAL_RECORD_EXAMPLES.md`
- token order/alias variations produce identical token suffix

## Phase 4: Stable ID Generation

Deliverables:
- `base_key = type_norm + "__" + focal_signature + "__" + aperture_signature`
- `stable_id` generation policy:
  - append token suffix whenever tokens are present
  - append fallback suffix only for remaining collisions

Acceptance criteria:
- same row always yields same `stable_id`
- row order changes do not change `stable_id`
- collision fallback is deterministic

## Phase 5: Cross-Page Merge (`lenses` + `specs`)

Deliverables:
- join by `base_key`, finalize by `stable_id`
- one canonical flat object (no summary/spec duplicate fields)
- field precedence + fallback policy per spec
- provenance population:
  - `source_pages`
  - `source_urls`
  - `source_row_refs`
  - `field_sources` (when feasible)

Acceptance criteria:
- merged object includes both timeline and technical fields
- disambiguated IDs retain full technical fields (no data loss)

## Phase 6: Validation + Quality Flags

Deliverables:
- JSON schema validation against `JSON_SCHEMA_DRAFT.md`
- warning/flag generation:
  - `base_key_collision`
  - `missing_spec_row`
  - `missing_summary_row`
  - `token_parse_uncertain`

Acceptance criteria:
- pipeline fails loudly on schema-invalid output
- warnings are present without breaking full export

## Phase 7: Tests and Fixtures

Required fixtures:
- unique ID case
- token-suffix case without collision
- fallback disambiguator collision case
- merged record with summary + technical fields

Required QA checks:
- rerun determinism
- token order invariance
- token alias invariance (`ED` vs `ed`)
- source row order invariance

Acceptance criteria:
- all fixture tests pass in CI/local test command

## Suggested Task Breakdown For Another Agent

1. Build parsing and raw extraction for both pages.
2. Implement normalization/signature/token modules.
3. Implement stable ID generator and collision resolver.
4. Implement merge engine + provenance builder.
5. Add schema validator and warning generation.
6. Add fixtures/tests and determinism checks.
7. Wire CLI entrypoint and write final dataset.

## Definition of Done

- End-to-end command generates valid canonical lens dataset.
- Output aligns with all five lens docs listed in Inputs.
- Checklist in `IMPLEMENTATION_HANDOFF_CHECKLIST.md` is fully satisfiable.
- No v1 out-of-scope domains are implemented.

## Handoff Prompt Template (for coding agent)

Use this prompt when delegating implementation:

"Implement the lens ingestion pipeline described in `doc/data-model/lenses/SCRAPER_IMPLEMENTATION_PLAN.md`. Follow the ID and token rules exactly from `ID_STRATEGY_DRAFT.md`, enforce schema from `JSON_SCHEMA_DRAFT.md`, and satisfy every item in `IMPLEMENTATION_HANDOFF_CHECKLIST.md`. Keep scope to `lenses.html` + `specs.html` only."
