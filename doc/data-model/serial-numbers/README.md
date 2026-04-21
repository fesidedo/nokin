# Serial Numbers Data Model (Placeholder)

Status: draft placeholder for upcoming model design.

## Source page

- `http://www.photosynthesis.co.nz/nikon/serialno.html`

## Intended scope

- Serial block child records linked to lens `stable_id`.
- Canonical serial range representation (`start`, `confirmed`, `end`, `qty`, `date`, `notes`).
- Version/sub-version timeline support for one lens family across multiple rows.
- Provenance metadata for each serial block.

## Open design questions

- Canonical parsing strategy for non-standard serial notations.
- How to represent overlap/conflicts between serial blocks.
- Whether chronology should be source-order, date-order, or both.

## Planned docs in this folder

- `SERIAL_DATA_MODEL_SPEC.md`
- `SERIAL_JSON_SCHEMA_DRAFT.md`
- `SERIAL_RECORD_EXAMPLES.md`
