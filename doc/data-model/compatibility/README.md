# Compatibility Data Model (Placeholder)

Status: draft placeholder for upcoming model design.

## Source basis

Compatibility is mostly inferred across multiple sources rather than provided as one explicit table:

- `http://www.photosynthesis.co.nz/nikon/lenses.html`
- `http://www.photosynthesis.co.nz/nikon/specs.html`
- `http://www.photosynthesis.co.nz/nikon/accessory.html`
- Optional future extension:
  - `http://www.photosynthesis.co.nz/nikon/camera.html`

## Intended scope

- Rule-based `lens <-> accessory` compatibility model (primary).
- Optional future extension: `camera <-> lens` compatibility model.
- Optional future extension: `camera <-> accessory` compatibility model (direct or lens-mediated).
- Explainable outputs with reason codes and confidence.

## Proposed output concepts

- `compatibility_subject_type` (`lens_accessory` | `camera_lens` | `camera_accessory`)
- `left_id`, `right_id` (domain IDs such as `stable_id`, `accessory_record_id`, `camera_id`)
- `status` (`compatible` | `limited` | `incompatible` | `unknown`)
- `reason_codes[]`
- `evidence_refs[]` (source fields/tokens used)
- `rules_version`
- `confidence`

## Open design questions

- Should `lens <-> accessory` be represented as one record per lens variant or at a broader family level?
- For future camera work, should `camera <-> accessory` be only direct, or inferred through compatible lenses?
- Should compatibility be represented as one unified table or separate datasets per pair type?
- Which lens/accessory tokens are authoritative when source signals conflict?
- How should manual overrides and exceptions be tracked?

## Planned docs in this folder

- `COMPATIBILITY_MODEL_SPEC.md`
- `COMPATIBILITY_RULES_DRAFT.md`
- `COMPATIBILITY_JSON_SCHEMA_DRAFT.md`
- `COMPATIBILITY_RECORD_EXAMPLES.md`
