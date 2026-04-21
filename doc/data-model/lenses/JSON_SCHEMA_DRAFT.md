# JSON Schema Draft (v1 Lens Dataset)

This is a formal draft schema for the merged `lenses + specs` canonical dataset.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://nokin.local/schema/lenses.v1.json",
  "title": "Nokin Lens Dataset v1",
  "type": "object",
  "required": ["version", "generated_at", "lenses"],
  "properties": {
    "version": { "type": "string" },
    "generated_at": { "type": "string", "format": "date-time" },
    "lenses": {
      "type": "array",
      "items": { "$ref": "#/$defs/lensRecord" }
    }
  },
  "$defs": {
    "joinConfidence": {
      "type": "string",
      "enum": ["exact", "high", "heuristic", "manual"]
    },
    "sourceRowRef": {
      "type": "object",
      "required": ["source_page", "source_row_id"],
      "properties": {
        "source_page": { "type": "string" },
        "source_row_id": { "type": "string" },
        "source_section": { "type": "string" }
      },
      "additionalProperties": false
    },
    "lensRecord": {
      "type": "object",
      "required": [
        "stable_id",
        "base_key",
        "join_confidence",
        "type_raw",
        "type_norm",
        "lens_raw",
        "lens_norm",
        "focal_signature",
        "aperture_signature",
        "variant_tokens",
        "source_pages",
        "source_urls",
        "source_row_refs",
        "parser_version",
        "last_seen_at",
        "is_zoom",
        "feature_tokens",
        "sensor_format",
        "has_aperture_ring_estimate"
      ],
      "properties": {
        "stable_id": { "type": "string", "minLength": 1 },
        "base_key": { "type": "string", "minLength": 1 },
        "disambiguator": { "type": ["string", "null"] },
        "join_confidence": { "$ref": "#/$defs/joinConfidence" },

        "type_raw": { "type": "string" },
        "type_norm": { "type": "string" },
        "lens_raw": { "type": "string" },
        "lens_norm": { "type": "string" },
        "focal_signature": { "type": "string" },
        "aperture_signature": { "type": "string" },
        "variant_tokens": {
          "type": "array",
          "items": { "type": "string" },
          "uniqueItems": true
        },

        "serial_no_raw": { "type": ["string", "null"] },
        "date_raw": { "type": ["string", "null"] },
        "notes_raw": { "type": ["string", "null"] },
        "optic_raw": { "type": ["string", "null"] },
        "angle_raw": { "type": ["string", "null"] },
        "angle_dx_raw": { "type": ["string", "null"] },
        "min_aperture_raw": { "type": ["string", "null"] },
        "blades_raw": { "type": ["string", "null"] },
        "close_focus_raw": { "type": ["string", "null"] },
        "macro_raw": { "type": ["string", "null"] },
        "focus_throw_raw": { "type": ["string", "null"] },
        "filter_raw": { "type": ["string", "null"] },
        "diam_raw": { "type": ["string", "null"] },
        "length_raw": { "type": ["string", "null"] },
        "total_length_raw": { "type": ["string", "null"] },
        "weight_raw": { "type": ["string", "null"] },
        "hood_raw": { "type": ["string", "null"] },
        "features_raw": { "type": ["string", "null"] },

        "focal_min_mm": { "type": ["number", "null"] },
        "focal_max_mm": { "type": ["number", "null"] },
        "max_aperture_min": { "type": ["number", "null"] },
        "max_aperture_max": { "type": ["number", "null"] },
        "is_zoom": { "type": "boolean" },
        "feature_tokens": {
          "type": "array",
          "items": { "type": "string" },
          "uniqueItems": true
        },
        "sensor_format": {
          "type": "string",
          "enum": ["fx", "dx", "unknown"]
        },
        "has_aperture_ring_estimate": {
          "type": ["boolean", "null"]
        },

        "source_pages": {
          "type": "array",
          "items": { "type": "string" },
          "minItems": 1
        },
        "source_urls": {
          "type": "array",
          "items": { "type": "string" },
          "minItems": 1
        },
        "source_row_refs": {
          "type": "array",
          "items": { "$ref": "#/$defs/sourceRowRef" },
          "minItems": 1
        },
        "field_sources": {
          "type": "object",
          "additionalProperties": { "type": "string" }
        },
        "parser_version": { "type": "string" },
        "last_seen_at": { "type": "string", "format": "date-time" },

        "warnings": {
          "type": "array",
          "items": { "type": "string" }
        },
        "merge_flags": {
          "type": "array",
          "items": { "type": "string" }
        }
      },
      "additionalProperties": false
    }
  },
  "additionalProperties": false
}
```

## Required Identity + Core Field Checklist

The schema enforces required fields for:
- deterministic identity (`stable_id`, `base_key`, `join_confidence`)
- canonical naming (`type_norm`, `focal_signature`, `aperture_signature`)
- traceability (`source_pages`, `source_urls`, `source_row_refs`, `parser_version`, `last_seen_at`)
