# Lens Data Model Spec (v1)

This document defines the canonical merged lens record for the first ingestion slice.

Scope:
- Merge `lenses.html` + `specs.html` into one lens entity model.
- Do not implement scraper logic in this phase.

## 1) Canonical Record Shape

Each lens row in the final dataset is one canonical flat object with:
- identity
- naming
- consolidated lens fields (no duplicated summary/spec keys)
- provenance

### 1.1 Identity block
- `stable_id` (string, required)
- `base_key` (string, required)
- `disambiguator` (string, nullable)
- `join_confidence` (`exact` | `high` | `heuristic` | `manual`)

### 1.2 Naming block
- `type_raw` (string, required)
- `type_norm` (string, required)
- `lens_raw` (string, required)
- `lens_norm` (string, required)
- `focal_signature` (string, required)
- `aperture_signature` (string, required)
- `variant_tokens` (array of strings, required; may be empty)

### 1.3 Timeline block
- `serial_no_raw` (string, nullable)
- `date_raw` (string, nullable)
- `notes_raw` (string, nullable)

### 1.4 Consolidated lens fields (single canonical keys)
- `optic_raw` (string, nullable)
- `angle_raw` (string, nullable)
- `angle_dx_raw` (string, nullable)
- `min_aperture_raw` (string, nullable)
- `blades_raw` (string, nullable)
- `close_focus_raw` (string, nullable)
- `macro_raw` (string, nullable)
- `focus_throw_raw` (string, nullable)
- `filter_raw` (string, nullable)
- `diam_raw` (string, nullable)
- `length_raw` (string, nullable)
- `total_length_raw` (string, nullable)
- `weight_raw` (string, nullable)
- `hood_raw` (string, nullable)
- `features_raw` (string, nullable)

### 1.5 Normalized parsed block (best effort)
- `focal_min_mm` (number, nullable)
- `focal_max_mm` (number, nullable)
- `max_aperture_min` (number, nullable)
- `max_aperture_max` (number, nullable)
- `is_zoom` (boolean)
- `feature_tokens` (array of strings)

### 1.6 Provenance block
- `source_pages` (array, required; expected: `["lenses","specs"]` in this slice)
- `source_urls` (array of strings)
- `source_row_refs` (array of objects):
  - `source_page`
  - `source_row_id`
  - `source_section` (metadata only)
- `field_sources` (object, optional; maps each consolidated field to source page used)
- `parser_version` (string)
- `last_seen_at` (ISO timestamp string)

## 2) Stable ID Policy (Locked)

Base key:
- `base_key = slug(type_norm + "__" + focal_signature + "__" + aperture_signature)`

Final stable ID:
1. Build `base_key`.
2. If `variant_tokens` are present, always append canonical token suffix (normalized, deduplicated, sorted).
3. If collision still exists, append deterministic fallback from serial/date hints.

Notes:
- Section headers are not identity.
- Variant tokens are sorted and deduplicated before stable ID suffix generation.
- Token encoding contract for stable IDs:
  - canonicalize token aliases before sorting
  - sort lexicographically
  - join token suffix with `_`
  - reserve `__` for top-level ID segment boundaries only

## 3) Merge Rules (`lenses.html` + `specs.html`)

Join candidate key:
- `base_key`

Match flow:
1. Build normalized naming signatures on both pages.
2. Match by `base_key`.
3. Generate `stable_id` with always-on token suffix policy, then apply fallback on remaining collisions.
4. Merge fields into one canonical record.

Field precedence (no duplicate keys in output):
- For overlapping columns, select one canonical value per field.
- Default precedence:
  - technical fields (`optic_raw`, `angle_raw`, `blades_raw`, dimensions, etc.): prefer `specs.html`
  - timeline/context fields (`serial_no_raw`, `date_raw`, `notes_raw`, `hood_raw`): prefer `lenses.html`
- If preferred source is empty, fallback to the other page.
- Record final source choice in `field_sources` when available.

## 4) Data Quality Flags

Each record may include:
- `warnings` (array of strings)
- `merge_flags` (array), examples:
  - `base_key_collision`
  - `missing_spec_row`
  - `missing_summary_row`
  - `token_parse_uncertain`

## 5) Out-of-Scope for This Slice

- Full normalization of every numeric field.
- Camera compatibility rule engine.
- AI conversion mapping.
- Accessory and serial detail child datasets (linked in next slice).
