# Accessories Data Model (Placeholder)

Status: draft placeholder for upcoming model design.

## Source page

- `http://www.photosynthesis.co.nz/nikon/accessory.html`

## Intended scope

- Canonical accessory compatibility record linked to lens `stable_id`.
- Structured representation of accessory columns (`filter`, `hood`, `alt_hood`, `case`, teleconverter flags, `other`).
- Raw marker preservation plus optional decoded compatibility semantics.
- Provenance and join-confidence metadata.

## Open design questions

- Whether teleconverter columns should become booleans, enums, or both raw + parsed.
- How to model lens-level vs variant-level accessory compatibility.
- How to represent uncertain or symbolic markers consistently.

## Planned docs in this folder

- `ACCESSORY_DATA_MODEL_SPEC.md`
- `ACCESSORY_JSON_SCHEMA_DRAFT.md`
- `ACCESSORY_RECORD_EXAMPLES.md`
