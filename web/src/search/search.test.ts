import { describe, expect, it } from "vitest";
import { isBrowseMode, searchLenses } from "./search";
import type { Lens } from "../types";

function makeLens(overrides: Partial<Lens> & { stable_id: string }): Lens {
  return {
    stable_id: overrides.stable_id,
    display_name: overrides.display_name ?? overrides.stable_id,
    lens_type: overrides.lens_type ?? "af-s",
    focal_min_mm: overrides.focal_min_mm ?? 50,
    focal_max_mm: overrides.focal_max_mm ?? 50,
    max_aperture_min: overrides.max_aperture_min ?? 1.8,
    max_aperture_max: overrides.max_aperture_max ?? 1.8,
    is_zoom: overrides.is_zoom ?? false,
    feature_tokens: overrides.feature_tokens ?? [],
    variant_tokens: overrides.variant_tokens ?? [],
    search_haystack:
      overrides.search_haystack ?? (overrides.display_name ?? overrides.stable_id).toLowerCase(),
    raw: overrides.raw ?? ({} as Lens["raw"]),
  };
}

const fixtures: Lens[] = [
  makeLens({
    stable_id: "af-s__50__f1_8",
    display_name: "AF-S 50mm f/1.8",
    lens_type: "af-s",
    focal_min_mm: 50,
    focal_max_mm: 50,
    is_zoom: false,
    search_haystack: "af-s 50mm f/1.8 nikkor prime",
  }),
  makeLens({
    stable_id: "af-s__24__f1_4",
    display_name: "AF-S 24mm f/1.4 G",
    lens_type: "af-s-g",
    focal_min_mm: 24,
    focal_max_mm: 24,
    is_zoom: false,
    variant_tokens: ["g"],
    search_haystack: "af-s 24mm f/1.4 g nikkor",
  }),
  makeLens({
    stable_id: "af-s__70-200__f2_8",
    display_name: "AF-S 70-200mm f/2.8",
    lens_type: "af-s",
    focal_min_mm: 70,
    focal_max_mm: 200,
    is_zoom: true,
    search_haystack: "af-s 70-200mm f/2.8 zoom telephoto",
  }),
  makeLens({
    stable_id: "af-s__24-70__f2_8",
    display_name: "AF-S 24-70mm f/2.8",
    lens_type: "af-s",
    focal_min_mm: 24,
    focal_max_mm: 70,
    is_zoom: true,
    search_haystack: "af-s 24-70mm f/2.8 zoom",
  }),
  makeLens({
    stable_id: "z__50__f1_8",
    display_name: "Z 50mm f/1.8 S",
    lens_type: "z",
    focal_min_mm: 50,
    is_zoom: false,
    search_haystack: "z 50mm f/1.8 s nikkor",
  }),
];

describe("searchLenses", () => {
  it("returns an empty list on the landing branch (no query, lensType=all)", () => {
    const results = searchLenses("", { category: "all", lensType: "all" }, fixtures);
    expect(results).toEqual([]);
  });

  it("browse mode returns filtered lenses with primes before zooms, sorted by focal_min asc", () => {
    const results = searchLenses("", { category: "lenses", lensType: "af-s" }, fixtures);

    // Only af-s lenses (not af-s-g, not z) are included.
    expect(results.map((l) => l.stable_id)).toEqual([
      "af-s__50__f1_8", // prime, focal 50
      "af-s__24-70__f2_8", // zoom, focal 24
      "af-s__70-200__f2_8", // zoom, focal 70
    ]);

    // Primes come before zooms.
    const firstZoomIdx = results.findIndex((l) => l.is_zoom);
    expect(results.slice(0, firstZoomIdx).every((l) => !l.is_zoom)).toBe(true);
    expect(results.slice(firstZoomIdx).every((l) => l.is_zoom)).toBe(true);
  });

  it("typed queries apply the lensType pre-filter before the fuzzy ranking", () => {
    const results = searchLenses(
      "50",
      { category: "lenses", lensType: "af-s" },
      fixtures,
    );
    const ids = results.map((l) => l.stable_id);
    expect(ids).toContain("af-s__50__f1_8");
    // z__50 must not slip through even though its haystack matches.
    expect(ids).not.toContain("z__50__f1_8");
    // af-s-g 24/1.4 must not slip through because the lensType filter is af-s.
    expect(ids).not.toContain("af-s__24__f1_4");
  });

  it("typo-tolerant matching ranks the best hit near the top", () => {
    const results = searchLenses(
      "70-20", // intentional typo / partial match for 70-200
      { category: "all", lensType: "all" },
      fixtures,
    );
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]!.stable_id).toBe("af-s__70-200__f2_8");
  });
});

describe("isBrowseMode", () => {
  it("is true only when query is empty AND a specific lens type is picked", () => {
    expect(isBrowseMode("", { category: "lenses", lensType: "af-s" })).toBe(true);
    expect(isBrowseMode("", { category: "lenses", lensType: "all" })).toBe(false);
    expect(isBrowseMode("50", { category: "lenses", lensType: "af-s" })).toBe(false);
    expect(isBrowseMode(" ", { category: "lenses", lensType: "af-s" })).toBe(true);
  });
});
