/**
 * Shared types for the market data contract between the frontend and the
 * Pages Function. Mirrored in `functions/_lib/types.ts` — keep both in sync.
 * Will be extracted to a shared folder once the contract stabilizes.
 */

export interface ListingSummary {
  itemId: string;
  title: string;
  price: { value: string; currency: string } | null;
  condition: string | null;
  conditionId: string | null;
  itemWebUrl: string | null;
  imageUrl: string | null;
  thumbnailUrls: string[];
  itemEndDate: string | null;
  buyingOptions: string[];
  itemLocation: { country: string | null };
}

export type MarketplaceId =
  | "EBAY_US"
  | "EBAY_GB"
  | "EBAY_DE"
  | "EBAY_FR"
  | "EBAY_IT"
  | "EBAY_ES"
  | "EBAY_CA"
  | "EBAY_AU";

/**
 * Response shape for `/api/market?q=<lens display name>`. Mirrored in
 * `functions/_lib/types.ts` — keep both in sync.
 *
 * Two independent buckets so the modal can render them separately and
 * survive a partial failure. `errors` is populated only for the branches
 * that failed.
 */
export interface MarketResponse {
  query: string;
  marketplace_used: MarketplaceId;
  bin: ListingSummary[];
  auction: ListingSummary[];
  fetched_at: string;
  errors?: {
    bin?: string;
    auction?: string;
  };
}

export interface ApiErrorBody {
  error: string;
  [key: string]: unknown;
}

/* -------------------------------------------------------------------------- */
/*  Lens domain                                                               */
/* -------------------------------------------------------------------------- */

/** Top-level general filter. More categories land when their datasets do. */
export type LensCategory = "all" | "lenses";

/** Lens-type quick filter. `all` = no type restriction. */
export type LensTypeId =
  | "all"
  | "f"
  | "ai"
  | "ai-s"
  | "af"
  | "af-s"
  | "z";

/** Sensor coverage filter (`all` = no sensor-size restriction). */
export type SensorFormat = "all" | "fx" | "dx";

/** Aperture-ring filter (`all` = no ring-state restriction). */
export type ApertureRingFilter = "all" | "has_ring" | "no_ring";

/**
 * Shape of each record inside `lenses.v1.json`. Typed permissively because the
 * detail modal passes it straight through; only the fields the derivation
 * layer reads are required.
 */
export interface RawLens {
  stable_id: string;
  type_raw: string;
  type_norm: string;
  lens_raw: string;
  lens_norm: string;
  focal_signature: string;
  aperture_signature: string;
  variant_tokens: string[];
  feature_tokens: string[];
  focal_min_mm: number | null;
  focal_max_mm: number | null;
  max_aperture_min: number | null;
  max_aperture_max: number | null;
  is_zoom: boolean;
  sensor_format: "fx" | "dx" | "unknown";
  has_aperture_ring_estimate: boolean | null;
  features_raw?: string | null;
  [key: string]: unknown;
}

/** Envelope wrapping the array of `RawLens` records. */
export interface LensDataset {
  version: string;
  generated_at: string;
  lenses: RawLens[];
}

/**
 * UI-facing lens view-model. Derived once at load time; everything the UI
 * rendering and search paths need lives on this type.
 */
export interface Lens {
  stable_id: string;
  display_name: string;
  lens_type: Exclude<LensTypeId, "all"> | "other";
  focal_min_mm: number;
  focal_max_mm: number;
  max_aperture_min: number;
  max_aperture_max: number;
  is_zoom: boolean;
  sensor_format: Exclude<SensorFormat, "all"> | "unknown";
  has_aperture_ring_estimate: boolean | null;
  feature_tokens: readonly string[];
  variant_tokens: readonly string[];
  search_haystack: string;
  raw: RawLens;
}
