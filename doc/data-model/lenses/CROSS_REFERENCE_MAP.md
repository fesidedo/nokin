# Cross-Reference Map Across Nikon Pages

This document maps how records can be linked between source pages and where joins are strong vs weak.

## Core design principle

Use a layered identity model:
1. Preserve each row exactly as source (`raw_*` fields).
2. Build a normalized lens identity key for linking.
3. Keep join confidence metadata (`exact`, `high`, `heuristic`, `manual`).

## A) Lens-centric joins (primary)

Pages:
- `lenses.html`
- `serialno.html`
- `specs.html`
- `accessory.html`

Best join keys:
- normalized `Type`
- parsed focal signature
- parsed aperture signature

Recommended composite join:
- `base_key = normalize(type) + focal_signature + aperture_signature`
- `stable_id = base_key` when no variant token suffix applies
- `stable_id = base_key + token_suffix` when variant tokens are present (always)
- append fallback suffix only if collision remains after token suffix

Section handling:
- Treat `section` as optional metadata, not identity.
- Use section labels only for display grouping or secondary filtering.

Why not single-column keys:
- No guaranteed global unique ID column exists.
- `Lens` string alone is ambiguous and formatting-noisy.
- `Type` alone is too broad.
- `type + focal + aperture` can still collide for revised entries, so variant token suffix and fallback disambiguation are required.

## B) Serial-number-aware joins

Strong source:
- `serialno.html` (contains start/confirmed/end and notes)

Link strategy:
- Join by `base_key` first.
- Finalize `stable_id` using always-on token suffix policy, then fallback disambiguation if needed.
- Attach serial blocks as child records:
  - `serial_blocks[] = {start, confirmed_raw, end, qty, date_raw, notes}`

Use case:
- Rich "version timeline" view in lens details.

## C) Specs joins

Strong source:
- `specs.html`

Link strategy:
- Join by `base_key`, then finalize against `stable_id`.
- Keep both parsed and raw specs:
  - `optic_raw`, `angle_raw`, `features_raw`, etc.
  - parsed numerics where possible (`focal_min_mm`, `focal_max_mm`, etc.)

## D) Accessories joins

Strong source:
- `accessory.html`

Link strategy:
- Join by `base_key`, then finalize against `stable_id`.
- Store compatibility fields as structured object:
  - `accessories.filter`
  - `accessories.hood`
  - `accessories.alt_hood`
  - `accessories.case`
  - `accessories.teleconverter_flags = {201,301,14A,14B,14E,20E}`
  - `accessories.other`

## E) Camera-to-lens compatibility joins (inferred, not explicit)

Source:
- `camera.html`

Important:
- There is no explicit table that says "camera X supports lens Y."
- Compatibility is inferred via camera feature flags and lens type/mount generation.

Practical inference inputs:
- Camera `Features` tokens (for example `AF`, `AI`, `Pre-AI`, `E`)
- Lens `Type` family (`F`, `Pre-AI`, `Ai`, `Ai-S`, `AF`, `AF-D`, `AF-S`, `G`, `E`, etc.)

Recommendation:
- Implement a separate compatibility rules engine, not a direct SQL-style join.
- Output should include reason codes:
  - `compatible`, `limited`, `incompatible`, `unknown`
  - plus explanation text.

## F) AI conversion links

Source:
- `aimod.html`

Potential cross-link fields:
- AI kit numbers
- Lens type/description and serial ranges

Recommendation:
- Treat AI conversion data as a separate dataset with references to lens families.
- Join confidence likely `heuristic` unless exact kit/lens mapping is standardized during parsing.

## G) Trade page links

Source:
- `trade.html`

Potential links:
- AI kit numbers and serial ranges can relate to conversion data.
- Accessory item names may match accessory nomenclature.

Recommendation:
- Keep as optional marketplace dataset.
- Do not rely on it for canonical historical specs/serials.

## Join confidence model

Track confidence per link:
- `exact`: canonical normalized key match with no ambiguity.
- `high`: strong normalized match with minor formatting differences.
- `heuristic`: fuzzy/partial match requiring assumptions.
- `manual`: explicitly curated override.

This will prevent silent bad joins and support future QA tooling.
