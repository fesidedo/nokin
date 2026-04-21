# AI Conversions Data Model (Placeholder)

Status: draft placeholder for upcoming model design.

## Source page

- `http://www.photosynthesis.co.nz/nikon/aimod.html`

## Intended scope

- Canonical representation for AI conversion kit and compatibility information.
- References from conversion records to lens families or lens variants (with join confidence).
- Separate handling for narrative content vs tabular content.
- Provenance tracking for each extracted conversion rule/entry.

## Open design questions

- How to model text-heavy conversion guidance in a queryable way.
- Exact join strategy to lens records when mappings are heuristic.
- Whether supplier/contact tables belong in the same dataset or a related one.

## Planned docs in this folder

- `AI_CONVERSION_DATA_MODEL_SPEC.md`
- `AI_CONVERSION_JSON_SCHEMA_DRAFT.md`
- `AI_CONVERSION_RECORD_EXAMPLES.md`
