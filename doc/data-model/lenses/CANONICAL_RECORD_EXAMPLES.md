# Canonical Record Examples

These examples illustrate how the v1 ID policy and merged model work in practice.

## 1) Unique base key (no disambiguator needed)

```json
{
  "stable_id": "ai-s__28__f3_5",
  "base_key": "ai-s__28__f3_5",
  "disambiguator": null,
  "join_confidence": "exact",
  "type_raw": "Ai-S",
  "type_norm": "ai-s",
  "lens_raw": "28/3.5",
  "lens_norm": "28_f3_5",
  "focal_signature": "28",
  "aperture_signature": "f3_5",
  "variant_tokens": [],
  "serial_no_raw": "2100001 - 2139599",
  "date_raw": "Jul 1981 - Mar 1983",
  "notes_raw": null,
  "optic_raw": "6/6",
  "angle_raw": "74°",
  "blades_raw": "7",
  "close_focus_raw": "0.3",
  "macro_raw": "1:7.4",
  "focus_throw_raw": "90°",
  "filter_raw": "52",
  "diam_raw": "63",
  "length_raw": "46.5",
  "weight_raw": "220",
  "hood_raw": "HN-2",
  "angle_dx_raw": "53°",
  "min_aperture_raw": "22",
  "total_length_raw": "54.5",
  "features_raw": null,
  "focal_min_mm": 28,
  "focal_max_mm": 28,
  "max_aperture_min": 3.5,
  "max_aperture_max": 3.5,
  "is_zoom": false,
  "feature_tokens": [],
  "source_pages": ["lenses", "specs"],
  "source_urls": [
    "http://www.photosynthesis.co.nz/nikon/lenses.html",
    "http://www.photosynthesis.co.nz/nikon/specs.html"
  ],
  "source_row_refs": [
    {"source_page": "lenses", "source_row_id": "lenses:413", "source_section": "28"},
    {"source_page": "specs", "source_row_id": "specs:397", "source_section": "28"}
  ],
  "field_sources": {
    "serial_no_raw": "lenses",
    "date_raw": "lenses",
    "notes_raw": "lenses",
    "optic_raw": "specs",
    "angle_raw": "specs",
    "blades_raw": "specs",
    "close_focus_raw": "specs",
    "macro_raw": "specs",
    "focus_throw_raw": "specs",
    "filter_raw": "specs",
    "diam_raw": "specs",
    "length_raw": "specs",
    "total_length_raw": "specs",
    "weight_raw": "specs",
    "hood_raw": "lenses",
    "features_raw": "specs"
  },
  "parser_version": "v1-draft",
  "last_seen_at": "2026-04-16T00:00:00Z",
  "warnings": [],
  "merge_flags": []
}
```

## 2) Variant token suffix (always appended when present)

Example concept:
- Row includes variant marker `New`.
- Token suffix is appended even if no collision is present.

```json
{
  "stable_id": "af__24__f2_8__new",
  "base_key": "af__24__f2_8",
  "disambiguator": "new",
  "join_confidence": "high",
  "type_raw": "AF",
  "type_norm": "af",
  "lens_raw": "24/2.8 New",
  "lens_norm": "24_f2_8_new",
  "focal_signature": "24",
  "aperture_signature": "f2_8",
  "variant_tokens": ["new"],
  "serial_no_raw": "300001 - 349027",
  "date_raw": "Jun 1991 - Sep 1994",
  "notes_raw": null,
  "optic_raw": "8/8",
  "angle_raw": "84°",
  "blades_raw": "7",
  "close_focus_raw": "0.3",
  "filter_raw": "52",
  "diam_raw": "64.5",
  "length_raw": "45",
  "weight_raw": "255",
  "features_raw": null,
  "source_pages": ["lenses", "specs"],
  "source_urls": [
    "http://www.photosynthesis.co.nz/nikon/lenses.html",
    "http://www.photosynthesis.co.nz/nikon/specs.html"
  ],
  "source_row_refs": [
    {"source_page": "lenses", "source_row_id": "lenses:521", "source_section": "24"},
    {"source_page": "specs", "source_row_id": "specs:505", "source_section": "24"}
  ],
  "parser_version": "v1-draft",
  "last_seen_at": "2026-04-16T00:00:00Z",
  "warnings": [],
  "merge_flags": []
}
```

## 3) Same base key and no token, fallback disambiguator

When explicit marker tokens are absent and collision remains:
- append deterministic fallback (for example earliest serial start)

```json
{
  "stable_id": "af__50__f1_8__s2000001",
  "base_key": "af__50__f1_8",
  "disambiguator": "s2000001",
  "join_confidence": "heuristic",
  "type_raw": "AF",
  "type_norm": "af",
  "lens_raw": "50/1.8",
  "lens_norm": "50_f1_8",
  "focal_signature": "50",
  "aperture_signature": "f1_8",
  "variant_tokens": [],
  "serial_no_raw": "2000001 - 2120844",
  "date_raw": "Sep 1986 - Mar 1987",
  "optic_raw": "6/5",
  "angle_raw": "46°",
  "blades_raw": "7",
  "close_focus_raw": "0.6",
  "filter_raw": "52",
  "diam_raw": "64.5",
  "length_raw": "42.5",
  "weight_raw": "155",
  "features_raw": null,
  "source_pages": ["lenses", "specs"],
  "source_urls": [
    "http://www.photosynthesis.co.nz/nikon/lenses.html",
    "http://www.photosynthesis.co.nz/nikon/specs.html"
  ],
  "source_row_refs": [
    {"source_page": "lenses", "source_row_id": "lenses:760", "source_section": "45-50 slow"},
    {"source_page": "specs", "source_row_id": "specs:745", "source_section": "45-50 slow"}
  ],
  "parser_version": "v1-draft",
  "last_seen_at": "2026-04-16T00:00:00Z",
  "warnings": ["base_key_collision", "fallback_disambiguator_used"],
  "merge_flags": ["base_key_collision"]
}
```

## 4) Expected ID Generation Outputs

Input tuple -> output:
- `(Ai-S, 28, f3.5, [])` -> `ai-s__28__f3_5`
- `(AF, 24, f2.8, [new])` -> `af__24__f2_8__new`
- `(AF-S, 24-70, f2.8, [g,ed])` -> `af-s__24-70__f2_8__ed_g`

Note:
- Variant tokens are always appended when present (sorted, deduplicated, normalized).
- Fallback suffix is appended only if collision still exists after token suffix application.

## 4.1 Token Ordering and Encoding Examples

Input tokens -> canonical suffix:
- `[G, ED]` -> `ed_g`
- `[ed, g, ED]` -> `ed_g` (deduplicated after normalization)
- `[VR, IF, ED]` -> `ed_if_vr`

Separator rules:
- `_` is used inside token suffix.
- `__` is used only between stable ID segments.

## 5) Consolidation Rule Demonstration

The canonical object remains flat and does not keep duplicated source-specific keys.

Example:
- Keep only `blades_raw` in output.
- Use `field_sources.blades_raw = "specs"` (or `"lenses"` if fallback used).
