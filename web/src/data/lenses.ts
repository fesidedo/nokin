/**
 * Lens dataset loader.
 *
 * Fetches `/lenses.v1.json` (served from `web/public/`) exactly once and
 * memoises the derived `Lens[]` view-model. All derivation happens here so
 * the rest of the UI can treat lenses as plain, indexable records.
 */

import type { Lens, LensDataset, LensTypeId, RawLens } from "../types";

let cache: Promise<Lens[]> | null = null;

const DATASET_URL = "/lenses.v1.json";

/** Lazily fetch + derive the lens list. Subsequent calls reuse the promise. */
export function getLenses(): Promise<Lens[]> {
  if (!cache) {
    cache = loadAndDerive();
  }
  return cache;
}

/** Test hook: drop the memoised promise so the next `getLenses()` refetches. */
export function __resetLensCache(): void {
  cache = null;
}

async function loadAndDerive(): Promise<Lens[]> {
  const res = await fetch(DATASET_URL, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    throw new Error(`lenses.v1.json: HTTP ${res.status} ${res.statusText}`);
  }
  const dataset = (await res.json()) as LensDataset;
  return dataset.lenses.map(deriveLens);
}

/** Public entry: transform a raw record into the UI view-model. */
export function deriveLens(raw: RawLens): Lens {
  const focal_min_mm = raw.focal_min_mm ?? 0;
  const focal_max_mm = raw.focal_max_mm ?? focal_min_mm;
  const max_aperture_min = raw.max_aperture_min ?? 0;
  const max_aperture_max = raw.max_aperture_max ?? max_aperture_min;

  const lens_type = deriveLensType(raw);
  const display_name = buildDisplayName(raw, {
    focal_min_mm,
    focal_max_mm,
    max_aperture_min,
    max_aperture_max,
  });
  const search_haystack = buildSearchHaystack(raw, display_name);

  return {
    stable_id: raw.stable_id,
    display_name,
    lens_type,
    focal_min_mm,
    focal_max_mm,
    max_aperture_min,
    max_aperture_max,
    is_zoom: raw.is_zoom,
    feature_tokens: raw.feature_tokens ?? [],
    variant_tokens: raw.variant_tokens ?? [],
    search_haystack,
    raw,
  };
}

/**
 * Map a record to one of the filter-facing lens types. `af-s` lenses with a
 * `g` variant token bump up to the dedicated `af-s-g` bucket (the G body
 * drops the aperture ring, which is the distinction the UI surfaces).
 * Any `type_norm` outside the filter's vocabulary goes to `other` so the
 * lens still appears under "All" but is unreachable from a specific
 * lens-type filter.
 */
export function deriveLensType(raw: RawLens): Lens["lens_type"] {
  const variants = raw.variant_tokens ?? [];
  if (raw.type_norm === "af-s" && variants.includes("g")) {
    return "af-s-g";
  }

  const known: ReadonlyArray<Exclude<LensTypeId, "all">> = [
    "f",
    "ai",
    "ai-s",
    "af",
    "af-s",
    "af-s-g",
    "z",
  ];
  for (const t of known) {
    if (raw.type_norm === t) return t;
  }
  return "other";
}

/**
 * Assemble a human-readable name from the normalised numeric fields. We
 * prefer the structured focal/aperture data over parsing `lens_raw` because
 * the numeric fields are already canonicalised by the ingestion pipeline.
 */
function buildDisplayName(
  raw: RawLens,
  nums: {
    focal_min_mm: number;
    focal_max_mm: number;
    max_aperture_min: number;
    max_aperture_max: number;
  },
): string {
  const focal =
    nums.focal_min_mm === nums.focal_max_mm
      ? `${formatNumber(nums.focal_min_mm)}mm`
      : `${formatNumber(nums.focal_min_mm)}-${formatNumber(nums.focal_max_mm)}mm`;

  const aperture =
    nums.max_aperture_min === nums.max_aperture_max
      ? `f/${formatNumber(nums.max_aperture_min)}`
      : `f/${formatNumber(nums.max_aperture_min)}-${formatNumber(nums.max_aperture_max)}`;

  const type = (raw.type_raw || "").trim();
  const features = (raw.features_raw || "").trim();

  return [type, focal, aperture, features].filter(Boolean).join(" ");
}

function formatNumber(n: number): string {
  if (!Number.isFinite(n) || n === 0) return "?";
  return Number.isInteger(n) ? n.toString() : n.toString();
}

/**
 * Lowercased concatenation of every field Fuse might usefully score against.
 * Computed once so each keystroke just does substring / Fuse comparisons over
 * a ready string rather than reshaping records on the fly.
 */
function buildSearchHaystack(raw: RawLens, display_name: string): string {
  const parts = [
    display_name,
    raw.lens_raw,
    raw.type_raw,
    raw.type_norm,
    raw.focal_signature,
    raw.aperture_signature,
    ...(raw.feature_tokens ?? []),
    ...(raw.variant_tokens ?? []),
    raw.features_raw ?? "",
  ];
  return parts.filter(Boolean).join(" ").toLowerCase();
}
