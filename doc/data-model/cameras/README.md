# Cameras Data Model (Placeholder)

Status: draft placeholder for upcoming model design.

## Source page

- `http://www.photosynthesis.co.nz/nikon/camera.html`

## Intended scope

- Canonical camera record shape (one row per camera entry).
- Stable camera identity strategy (`camera_id`) and disambiguation policy.
- Normalized capability tokens relevant to lens compatibility (for example `AF`, `AI`, `Pre-AI`, `E`).
- Provenance and field-source tracking.

## Open design questions

- How to split camera "family" vs "variant" identity.
- Which camera fields should be normalized in v1 vs kept raw.
- How to handle mixed/compact notation in feature columns.

## Planned docs in this folder

- `CAMERA_DATA_MODEL_SPEC.md`
- `CAMERA_JSON_SCHEMA_DRAFT.md`
- `CAMERA_RECORD_EXAMPLES.md`
