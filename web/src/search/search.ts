/**
 * Lens search / browse entry point.
 *
 * Single function drives both interaction modes:
 *   - empty query + specific lens type  -> deterministic browse-mode sort
 *   - non-empty query                   -> Fuse.js typo-tolerant ranked match
 *   - empty query + no lens type        -> empty (landing screen)
 *
 * Keeping both code paths behind one signature means the UI never has to
 * know about "modes"; it just calls `searchLenses` and renders what comes
 * back.
 */

import Fuse from "fuse.js";
import type {
  ApertureRingFilter,
  Lens,
  LensCategory,
  LensTypeId,
  SensorFormat,
} from "../types";

export interface SearchFilters {
  category: LensCategory;
  lensType: LensTypeId;
  sensorFormat: SensorFormat;
  apertureRing: ApertureRingFilter;
}

/**
 * Fuse weights. `display_name` dominates because it is the human label users
 * read on-screen; `search_haystack` is the broad catch-all so typos on
 * feature tokens or raw lens strings still resolve.
 */
const FUSE_OPTIONS: ConstructorParameters<typeof Fuse<Lens>>[1] = {
  includeScore: false,
  ignoreLocation: true,
  threshold: 0.35,
  keys: [
    { name: "display_name", weight: 0.6 },
    { name: "search_haystack", weight: 0.4 },
  ],
};

export function searchLenses(
  query: string,
  filters: SearchFilters,
  lenses: readonly Lens[],
): Lens[] {
  const trimmed = query.trim();
  const filtered = applyFilters(filters, lenses);

  if (trimmed === "") {
    if (filters.lensType === "all") return [];
    return [...filtered].sort(browseSort);
  }

  const fuse = new Fuse(filtered, FUSE_OPTIONS);
  return fuse.search(trimmed).map((r) => r.item);
}

function applyFilters(
  filters: SearchFilters,
  lenses: readonly Lens[],
): readonly Lens[] {
  if (filters.category !== "all" && filters.category !== "lenses") return [];
  let out = lenses;

  if (filters.lensType !== "all") {
    out = out.filter((l) => l.lens_type === filters.lensType);
  }

  if (filters.sensorFormat !== "all") {
    out = out.filter((l) => l.sensor_format === filters.sensorFormat);
  }

  if (filters.apertureRing !== "all") {
    const wantRing = filters.apertureRing === "has_ring";
    out = out.filter((l) => l.has_aperture_ring_estimate === wantRing);
  }

  return out;
}

/**
 * Catalog-style sort for browse mode: primes before zooms, then each group
 * ordered by minimum focal length, then widest-range-first, then fastest
 * aperture. Stable enough to feel like leafing through a catalog.
 */
export function browseSort(a: Lens, b: Lens): number {
  if (a.is_zoom !== b.is_zoom) return a.is_zoom ? 1 : -1;
  if (a.focal_min_mm !== b.focal_min_mm) return a.focal_min_mm - b.focal_min_mm;
  if (a.focal_max_mm !== b.focal_max_mm) return a.focal_max_mm - b.focal_max_mm;
  return a.max_aperture_min - b.max_aperture_min;
}

/**
 * True when results should render as separated Primes / Zooms sections.
 * Matches the browse-mode branch in `searchLenses` so callers don't need
 * to duplicate the condition.
 */
export function isBrowseMode(query: string, filters: SearchFilters): boolean {
  return query.trim() === "" && filters.lensType !== "all";
}
