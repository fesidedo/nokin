# ID Strategy Draft

This draft proposes stable IDs for ingestion and cross-page linking before any parser implementation.

## 1) Raw row ID (source-local)

Goal:
- Uniquely identify each ingested row exactly as found on a page.

Proposed fields:
- `source_page` (for example `serialno`, `specs`, `accessory`, `lenses`, `camera`)
- `source_row_index` (0-based row order in the full page stream)

ID:
- `raw_row_id = source_page + ":" + source_row_index`

## 2) Lens stable ID (cross-page, one ID per row)

Goal:
- Produce one deterministic stable ID per lens row that remains readable.

Base components (family-first):
- `type_norm`
- `focal_signature` (parsed from lens name, for example `24`, `24-70`)
- `aperture_signature` (parsed max aperture, for example `f2_8`, `f3_5-4_5`)

Base key:
- `base_key = slug(type_norm + "__" + focal_signature + "__" + aperture_signature)`

Variant token suffix policy:
1. Normalize, deduplicate, and sort variant tokens from lens modifiers such as `new`, `d`, `g`, `ed`, `if`, `vr`, etc.
2. If variant tokens exist, always append them to the stable ID as a suffix.
3. If no variant tokens exist, do not append a token suffix.

Token encoding contract:
1. Lowercase all tokens.
2. Map aliases/surface forms to canonical tokens before sorting (example: `ED` -> `ed`, `G` -> `g`, `D-Type` -> `d`).
3. Remove duplicates after canonical mapping.
4. Sort tokens lexicographically (ASCII ascending).
5. Join sorted tokens with single underscore: `token_suffix = token1 + "_" + token2 + ...`.
6. Reserve double underscore `__` as the stable ID segment separator. Token suffix must never contain `__`.
7. Only allow `[a-z0-9-]` characters in canonical tokens.

Collision policy:
1. Build initial stable ID from `base_key` plus token suffix when present.
2. If collision still exists, append deterministic fallback (earliest serial start where available, otherwise intro year token).

Stable ID:
- `stable_id = base_key` (no variant tokens, no fallback needed)
- `stable_id = base_key + "__" + token_suffix` (variant tokens present)
- `stable_id = base_key + "__" + token_suffix + "__" + fallback` (collision after token suffix)
- `stable_id = base_key + "__" + fallback` (no variant tokens and collision)

Notes:
- Do not include section headers in stable IDs. Sections are presentation/grouping labels and may change independently of lens identity.
- Keep `source_section` as optional metadata only, for UI grouping or provenance.
- Preserve original text columns for auditability.

## 3) Lens family ID (grouping level)

Goal:
- Group variants of the same optical/focal family.

Derived components:
- `type_norm`
- `focal_signature`
- `aperture_signature`

ID:
- `lens_family_id = slug(type_norm + "__" + focal_signature + "__" + aperture_signature)`

Use:
- UI grouping and family timelines.
- Not for strict joins.

## 4) Camera ID

Goal:
- Stable identifier per camera model line/variant.

Components:
- normalized camera display name from `camera.html` row (`D850`, `Z6 II`, etc.)
- optional announced date token if needed to split ambiguous entries

ID:
- `camera_id = slug(camera_name_norm [+ "__" + announced_date_norm])`

## 5) Serial block ID

Goal:
- Preserve multiple serial ranges per variant without flattening mistakes.

Parent:
- `stable_id`

ID:
- `serial_block_id = stable_id + ":serial:" + index`

Fields:
- `start_no_raw`
- `confirmed_raw`
- `end_no_raw`
- `qty_raw`
- `date_raw`

## 6) Accessory compatibility record ID

Goal:
- Attach accessories/hood/filter/teleconverter flags per lens variant row.

Parent:
- `stable_id`

ID:
- `accessory_record_id = stable_id + ":acc:" + index`

## 7) Inferred compatibility ID (camera <-> lens)

Goal:
- Track computed compatibility links separately from source data.

ID:
- `compatibility_id = camera_id + "::" + stable_id`

Fields:
- `status` (`compatible` | `limited` | `incompatible` | `unknown`)
- `reason_codes[]`
- `rules_version`
- `confidence`

## 8) Required metadata on all IDs

For traceability:
- `source_url`
- `source_page`
- `last_seen_at`
- `parser_version`
- `join_confidence` (for linked records)

This supports later re-parsing and safe schema evolution when adding more Nikon pages.
