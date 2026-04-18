from __future__ import annotations

import json
import re
from html import unescape
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator

LENSES_SOURCE_URL = "http://www.photosynthesis.co.nz/nikon/lenses.html"
SPECS_SOURCE_URL = "http://www.photosynthesis.co.nz/nikon/specs.html"
PARSER_VERSION = "v1-local-snapshot"

LENSES_HEADERS = [
    "type_raw",
    "lens_cell_raw",
    "serial_no_raw",
    "date_raw",
    "notes_raw",
    "optic_raw",
    "angle_raw",
    "blades_raw",
    "close_focus_raw",
    "macro_raw",
    "focus_throw_raw",
    "filter_raw",
    "diam_raw",
    "length_raw",
    "weight_raw",
    "hood_raw",
]

SPECS_HEADERS = [
    "type_raw",
    "lens_cell_raw",
    "optic_raw",
    "angle_raw",
    "angle_dx_raw",
    "min_aperture_raw",
    "blades_raw",
    "close_focus_raw",
    "macro_raw",
    "focus_throw_raw",
    "filter_raw",
    "diam_raw",
    "length_raw",
    "total_length_raw",
    "weight_raw",
    "features_raw",
]

# Alias normalization used before token sorting/dedup.
TOKEN_ALIAS_MAP = {
    "d-type": "d",
    "nikkor": "nikkor",
}

TOKEN_CLEAN_RE = re.compile(r"[^a-z0-9-]+")
MM_OR_CM_RE = re.compile(
    r"(?P<focal>\d+(?:\.\d+)?(?:-\d+(?:\.\d+)?)?)\s*(?P<unit>mm|cm)?\s*/\s*(?P<aperture>\d+(?:\.\d+)?(?:-\d+(?:\.\d+)?)?)",
    re.IGNORECASE,
)


@dataclass
class ParsedRow:
    source_page: str
    source_url: str
    source_row_index: int
    source_section: str | None
    data: dict[str, Any]


def clean_text(value: str | None) -> str | None:
    if value is None:
        return None
    collapsed = re.sub(r"\s+", " ", value.replace("\xa0", " ")).strip()
    return collapsed or None


def slugify(value: str) -> str:
    lowered = value.lower().strip()
    lowered = lowered.replace("&", " and ")
    lowered = lowered.replace("·", " ")
    lowered = TOKEN_CLEAN_RE.sub("_", lowered)
    lowered = re.sub(r"_+", "_", lowered).strip("_")
    return lowered


def normalize_type(type_raw: str) -> str:
    return slugify(type_raw).replace("_", "-")


def normalize_number_token(value: str) -> str:
    return value.replace(".", "_")


def normalize_range_token(raw: str) -> str:
    return "-".join(normalize_number_token(p) for p in raw.split("-"))


def parse_focal_and_aperture(lens_raw: str) -> tuple[str, str, str]:
    match = MM_OR_CM_RE.search(lens_raw)
    if not match:
        return "unknown", "f_unknown", lens_raw

    focal_raw = match.group("focal")
    unit = (match.group("unit") or "").lower()
    aperture_raw = match.group("aperture")

    focal_sig = normalize_range_token(focal_raw)
    if unit == "cm":
        focal_sig = convert_cm_signature_to_mm(focal_sig)

    aperture_sig = f"f{normalize_range_token(aperture_raw)}"
    remainder = clean_text(lens_raw[match.end() :]) or ""
    return focal_sig, aperture_sig, remainder


def convert_cm_signature_to_mm(signature: str) -> str:
    def convert_part(part: str) -> str:
        numeric = float(part.replace("_", "."))
        mm_value = numeric * 10.0
        if mm_value.is_integer():
            return str(int(mm_value))
        return normalize_number_token(str(mm_value).rstrip("0").rstrip("."))

    return "-".join(convert_part(piece) for piece in signature.split("-"))


def tokenize_variant_suffix(suffix: str) -> list[str]:
    if not suffix:
        return []

    raw = re.sub(r"[()]", " ", suffix)
    raw = raw.replace("·", " ").replace("/", " ").replace(",", " ")
    candidates = re.split(r"\s+|-", raw)
    out: list[str] = []
    for token in candidates:
        t = token.strip().lower()
        if not t:
            continue
        t = TOKEN_ALIAS_MAP.get(t, t)
        t = re.sub(r"[^a-z0-9-]", "", t)
        if not t:
            continue
        out.append(t)
    return sorted(set(out))


def token_suffix(variant_tokens: list[str]) -> str | None:
    if not variant_tokens:
        return None
    return "_".join(sorted(set(variant_tokens)))


def parse_lens_cell(value: str) -> dict[str, Any]:
    lens_raw = clean_text(value) or ""
    focal_sig, aperture_sig, suffix = parse_focal_and_aperture(lens_raw)
    variant_tokens = tokenize_variant_suffix(suffix)
    return {
        "lens_raw": lens_raw,
        "lens_norm": slugify(lens_raw),
        "focal_signature": focal_sig,
        "aperture_signature": aperture_sig,
        "variant_tokens": variant_tokens,
    }


def parse_serial_start(serial_raw: str | None) -> int | None:
    if not serial_raw:
        return None
    match = re.search(r"(\d{3,})", serial_raw.replace("?", ""))
    if not match:
        return None
    return int(match.group(1))


def strip_html(value: str) -> str:
    without_tags = re.sub(r"<[^>]+>", " ", value)
    return clean_text(unescape(without_tags)) or ""


def extract_table_rows(path: Path, source_page: str, source_url: str, headers: list[str]) -> list[ParsedRow]:
    # Source pages are declared as iso8859-1.
    lines = path.read_text(encoding="iso-8859-1", errors="replace").splitlines()
    rows: list[ParsedRow] = []
    source_row_index = 0
    section: str | None = None

    for line in lines:
        section_match = re.search(r"<b>([^<]+)</b>\s*<a href=\"#top\">top</a>", line, flags=re.IGNORECASE)
        if section_match:
            section = clean_text(section_match.group(1))
            continue

        if "<tr" not in line.lower() or "<td" not in line.lower():
            continue

        parts = re.split(r"<td[^>]*>", line, flags=re.IGNORECASE)
        if len(parts) <= 2:
            continue

        cells = [strip_html(chunk) for chunk in parts[1:]]
        if len(cells) < len(headers):
            continue
        cells = cells[: len(headers)]

        # Skip accidental key/legend rows.
        if cells and cells[0].lower() == "type":
            continue
        if not cells[0] or not cells[1]:
            continue

        row_data = dict(zip(headers, cells))
        rows.append(
            ParsedRow(
                source_page=source_page,
                source_url=source_url,
                source_row_index=source_row_index,
                source_section=section,
                data=row_data,
            )
        )
        source_row_index += 1
    return rows


def enrich_with_identity(row: ParsedRow) -> dict[str, Any]:
    parsed_lens = parse_lens_cell(row.data["lens_cell_raw"])
    type_raw = row.data["type_raw"] or ""
    type_norm = normalize_type(type_raw)
    base_key = f"{type_norm}__{parsed_lens['focal_signature']}__{parsed_lens['aperture_signature']}"
    token_part = token_suffix(parsed_lens["variant_tokens"])
    initial_stable = f"{base_key}__{token_part}" if token_part else base_key
    return {
        **row.data,
        **parsed_lens,
        "type_raw": type_raw,
        "type_norm": type_norm,
        "base_key": base_key,
        "initial_stable_id": initial_stable,
        "source_row_ref": {
            "source_page": row.source_page,
            "source_row_id": f"{row.source_page}:{row.source_row_index}",
            "source_section": row.source_section,
        },
    }


def pair_rows_by_base_key(
    lenses_rows: list[dict[str, Any]], specs_rows: list[dict[str, Any]]
) -> list[tuple[dict[str, Any] | None, dict[str, Any] | None]]:
    grouped_lenses: dict[str, list[dict[str, Any]]] = {}
    grouped_specs: dict[str, list[dict[str, Any]]] = {}
    for row in lenses_rows:
        grouped_lenses.setdefault(row["base_key"], []).append(row)
    for row in specs_rows:
        grouped_specs.setdefault(row["base_key"], []).append(row)

    all_base_keys = sorted(set(grouped_lenses) | set(grouped_specs))
    pairs: list[tuple[dict[str, Any] | None, dict[str, Any] | None]] = []

    for base_key in all_base_keys:
        l_items = sorted(
            grouped_lenses.get(base_key, []),
            key=lambda r: r["source_row_ref"]["source_row_id"],
        )
        s_items = sorted(
            grouped_specs.get(base_key, []),
            key=lambda r: r["source_row_ref"]["source_row_id"],
        )
        count = max(len(l_items), len(s_items))
        for index in range(count):
            pairs.append(
                (
                    l_items[index] if index < len(l_items) else None,
                    s_items[index] if index < len(s_items) else None,
                )
            )
    return pairs


def choose(preferred: str, lenses_row: dict[str, Any] | None, specs_row: dict[str, Any] | None, field: str) -> tuple[Any, str | None]:
    left = lenses_row.get(field) if lenses_row else None
    right = specs_row.get(field) if specs_row else None
    if preferred == "specs":
        return (right, "specs") if right else ((left, "lenses") if left else (None, None))
    return (left, "lenses") if left else ((right, "specs") if right else (None, None))


def parse_numeric_bounds(signature: str) -> tuple[float | None, float | None]:
    if signature in {"unknown", "f_unknown"}:
        return None, None
    value = signature[1:] if signature.startswith("f") else signature
    parts = value.split("-")
    parsed: list[float] = []
    for part in parts:
        try:
            parsed.append(float(part.replace("_", ".")))
        except ValueError:
            return None, None
    if not parsed:
        return None, None
    if len(parsed) == 1:
        return parsed[0], parsed[0]
    return min(parsed), max(parsed)


def build_candidate_record(lenses_row: dict[str, Any] | None, specs_row: dict[str, Any] | None) -> dict[str, Any]:
    primary = specs_row or lenses_row
    assert primary is not None

    field_sources: dict[str, str] = {}

    timeline_fields = ["serial_no_raw", "date_raw", "notes_raw", "hood_raw"]
    technical_fields = [
        "optic_raw",
        "angle_raw",
        "angle_dx_raw",
        "min_aperture_raw",
        "blades_raw",
        "close_focus_raw",
        "macro_raw",
        "focus_throw_raw",
        "filter_raw",
        "diam_raw",
        "length_raw",
        "total_length_raw",
        "weight_raw",
        "features_raw",
    ]

    merged: dict[str, Any] = {
        "stable_id": primary["initial_stable_id"],
        "base_key": primary["base_key"],
        "disambiguator": None,
        "join_confidence": "exact" if lenses_row and specs_row else "heuristic",
        "type_raw": primary["type_raw"],
        "type_norm": primary["type_norm"],
        "lens_raw": primary["lens_raw"],
        "lens_norm": primary["lens_norm"],
        "focal_signature": primary["focal_signature"],
        "aperture_signature": primary["aperture_signature"],
        "variant_tokens": primary["variant_tokens"],
    }

    for field in timeline_fields:
        value, source = choose("lenses", lenses_row, specs_row, field)
        merged[field] = value
        if source:
            field_sources[field] = source

    for field in technical_fields:
        value, source = choose("specs", lenses_row, specs_row, field)
        merged[field] = value
        if source:
            field_sources[field] = source

    focal_min, focal_max = parse_numeric_bounds(merged["focal_signature"])
    aperture_min, aperture_max = parse_numeric_bounds(merged["aperture_signature"])
    merged["focal_min_mm"] = focal_min
    merged["focal_max_mm"] = focal_max
    merged["max_aperture_min"] = aperture_min
    merged["max_aperture_max"] = aperture_max
    merged["is_zoom"] = bool(merged["focal_signature"] and "-" in merged["focal_signature"])
    merged["feature_tokens"] = tokenize_variant_suffix(merged.get("features_raw") or "")

    source_pages = []
    source_urls = []
    source_row_refs = []
    for row in [lenses_row, specs_row]:
        if not row:
            continue
        page = row["source_row_ref"]["source_page"]
        if page not in source_pages:
            source_pages.append(page)
        url = LENSES_SOURCE_URL if page == "lenses" else SPECS_SOURCE_URL
        if url not in source_urls:
            source_urls.append(url)
        source_row_refs.append(row["source_row_ref"])

    merged["source_pages"] = source_pages
    merged["source_urls"] = source_urls
    merged["source_row_refs"] = source_row_refs
    merged["field_sources"] = field_sources
    merged["parser_version"] = PARSER_VERSION
    merged["last_seen_at"] = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

    warnings: list[str] = []
    merge_flags: list[str] = []
    if lenses_row is None:
        warnings.append("missing_summary_row")
        merge_flags.append("missing_summary_row")
    if specs_row is None:
        warnings.append("missing_spec_row")
        merge_flags.append("missing_spec_row")
    if primary["focal_signature"] == "unknown" or primary["aperture_signature"] == "f_unknown":
        warnings.append("token_parse_uncertain")
        merge_flags.append("token_parse_uncertain")
    merged["warnings"] = warnings
    merged["merge_flags"] = merge_flags
    return merged


def is_non_lens_record(record: dict[str, Any]) -> bool:
    """Return True for rows that are teleconverters, mount adapters, or focus units.

    Source pages include these alongside real lenses. They cannot be parsed into a
    focal/aperture signature, so they end up with the `unknown`/`f_unknown` sentinels.
    They are not lenses, so we drop them from the lens dataset.
    """
    return record.get("focal_signature") == "unknown" or record.get("aperture_signature") == "f_unknown"


def drop_non_lens_records(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [record for record in records if not is_non_lens_record(record)]


def apply_fallback_disambiguation(records: list[dict[str, Any]]) -> None:
    grouped: dict[str, list[dict[str, Any]]] = {}
    for record in records:
        grouped.setdefault(record["stable_id"], []).append(record)

    for stable_id, dupes in grouped.items():
        if len(dupes) == 1:
            continue
        for record in dupes:
            if "base_key_collision" not in record["warnings"]:
                record["warnings"].append("base_key_collision")
            if "base_key_collision" not in record["merge_flags"]:
                record["merge_flags"].append("base_key_collision")

        dupes_sorted = sorted(
            dupes,
            key=lambda r: (
                parse_serial_start(r.get("serial_no_raw")) or 10**15,
                r["source_row_refs"][0]["source_row_id"] if r.get("source_row_refs") else "",
            ),
        )
        for idx, record in enumerate(dupes_sorted, start=1):
            serial_start = parse_serial_start(record.get("serial_no_raw"))
            fallback = f"s{serial_start}" if serial_start is not None else f"r{idx}"
            record["stable_id"] = f"{stable_id}__{fallback}"
            record["disambiguator"] = fallback
            if "fallback_disambiguator_used" not in record["warnings"]:
                record["warnings"].append("fallback_disambiguator_used")


def load_schema_from_markdown(schema_doc_path: Path) -> dict[str, Any]:
    content = schema_doc_path.read_text(encoding="utf-8")
    match = re.search(r"```json\s*(\{.*\})\s*```", content, flags=re.DOTALL)
    if not match:
        raise ValueError("Could not find JSON schema code block in markdown file.")
    return json.loads(match.group(1))


def validate_output(dataset: dict[str, Any], schema: dict[str, Any]) -> None:
    validator = Draft202012Validator(schema)
    errors = sorted(validator.iter_errors(dataset), key=lambda e: list(e.path))
    if not errors:
        return
    lines = ["Dataset failed JSON schema validation:"]
    for err in errors[:10]:
        path = ".".join(str(p) for p in err.path) or "<root>"
        lines.append(f"- {path}: {err.message}")
    raise ValueError("\n".join(lines))


def run_pipeline(
    lenses_html_path: Path,
    specs_html_path: Path,
    schema_doc_path: Path,
    output_json_path: Path,
) -> dict[str, Any]:
    lenses_raw = extract_table_rows(lenses_html_path, "lenses", LENSES_SOURCE_URL, LENSES_HEADERS)
    specs_raw = extract_table_rows(specs_html_path, "specs", SPECS_SOURCE_URL, SPECS_HEADERS)

    lenses_rows = [enrich_with_identity(row) for row in lenses_raw]
    specs_rows = [enrich_with_identity(row) for row in specs_raw]

    paired = pair_rows_by_base_key(lenses_rows, specs_rows)
    candidates = [build_candidate_record(lenses_row, specs_row) for lenses_row, specs_row in paired]
    candidates = drop_non_lens_records(candidates)
    apply_fallback_disambiguation(candidates)

    dataset = {
        "version": "v1-draft",
        "generated_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "lenses": sorted(candidates, key=lambda row: row["stable_id"]),
    }

    schema = load_schema_from_markdown(schema_doc_path)
    validate_output(dataset, schema)

    output_json_path.parent.mkdir(parents=True, exist_ok=True)
    output_json_path.write_text(json.dumps(dataset, ensure_ascii=True, indent=2), encoding="utf-8")
    return dataset

