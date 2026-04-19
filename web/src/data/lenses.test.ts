import { describe, expect, it } from "vitest";
import { deriveLens, deriveLensType } from "./lenses";
import type { RawLens } from "../types";

function makeRaw(overrides: Partial<RawLens>): RawLens {
  return {
    stable_id: "test__50__f1_4",
    type_raw: "AF-S",
    type_norm: "af-s",
    lens_raw: "50/1.4 G",
    lens_norm: "50_1_4_g",
    focal_signature: "50",
    aperture_signature: "f1_4",
    variant_tokens: [],
    feature_tokens: [],
    focal_min_mm: 50,
    focal_max_mm: 50,
    max_aperture_min: 1.4,
    max_aperture_max: 1.4,
    is_zoom: false,
    features_raw: null,
    ...overrides,
  };
}

describe("deriveLensType", () => {
  it("promotes AF-S with a `g` variant token to the af-s-g bucket", () => {
    const raw = makeRaw({ type_norm: "af-s", variant_tokens: ["g"] });
    expect(deriveLensType(raw)).toBe("af-s-g");
  });

  it("promotes AF-S with an `e` variant token to the af-s-g bucket (E-series, no ring)", () => {
    const raw = makeRaw({ type_norm: "af-s", variant_tokens: ["e"] });
    expect(deriveLensType(raw)).toBe("af-s-g");
  });

  it("keeps AF-S with only a `vr` variant token in the af-s bucket (at least one AF-S VR still has an aperture ring)", () => {
    const raw = makeRaw({ type_norm: "af-s", variant_tokens: ["vr"] });
    expect(deriveLensType(raw)).toBe("af-s");
  });

  it("still promotes AF-S when a ring-dropping marker co-exists with `vr`", () => {
    const raw = makeRaw({ type_norm: "af-s", variant_tokens: ["g", "vr"] });
    expect(deriveLensType(raw)).toBe("af-s-g");
  });

  it("leaves AF-S without any no-aperture-ring marker in the af-s bucket", () => {
    const raw = makeRaw({ type_norm: "af-s", variant_tokens: ["ed", "if"] });
    expect(deriveLensType(raw)).toBe("af-s");
  });

  it("only promotes AF-S (not AF, not Z) when the variant token is present", () => {
    expect(deriveLensType(makeRaw({ type_norm: "af", variant_tokens: ["g"] }))).toBe("af");
    expect(deriveLensType(makeRaw({ type_norm: "z", variant_tokens: ["e"] }))).toBe("z");
    expect(deriveLensType(makeRaw({ type_norm: "ai-s", variant_tokens: ["e"] }))).toBe("ai-s");
  });

  it("maps known type_norm values directly", () => {
    for (const t of ["f", "ai", "ai-s", "af", "af-s", "z"] as const) {
      expect(deriveLensType(makeRaw({ type_norm: t }))).toBe(t);
    }
  });

  it("falls back to `other` for unknown type_norm values", () => {
    expect(deriveLensType(makeRaw({ type_norm: "af-p" }))).toBe("other");
    expect(deriveLensType(makeRaw({ type_norm: "a-c" }))).toBe("other");
  });
});

describe("deriveLens", () => {
  it("produces a display name and lowercased haystack including all searchable tokens", () => {
    const raw = makeRaw({
      type_raw: "AF-S",
      lens_raw: "70-300/4.5-6.3 G ED VR",
      focal_signature: "70-300",
      aperture_signature: "f4_5-6_3",
      focal_min_mm: 70,
      focal_max_mm: 300,
      max_aperture_min: 4.5,
      max_aperture_max: 6.3,
      is_zoom: true,
      feature_tokens: ["ed", "vr"],
      variant_tokens: ["g"],
      features_raw: "G ED VR",
    });
    const lens = deriveLens(raw);
    expect(lens.display_name).toContain("70-300mm");
    expect(lens.display_name).toContain("f/4.5-6.3");
    expect(lens.display_name).toContain("AF-S");
    // Display name is built from variant_tokens uppercased, not features_raw.
    expect(lens.display_name).toContain("G");
    expect(lens.display_name).not.toContain("ED");
    expect(lens.display_name).not.toContain("VR");
    expect(lens.lens_type).toBe("af-s-g");
    expect(lens.search_haystack).toContain("70-300");
    expect(lens.search_haystack).toContain("af-s");
    expect(lens.search_haystack).toContain("g");
    expect(lens.search_haystack).toBe(lens.search_haystack.toLowerCase());
  });

  it("joins multiple variant tokens in the display name, all uppercased", () => {
    const raw = makeRaw({
      type_raw: "AF-S",
      focal_min_mm: 24,
      focal_max_mm: 70,
      max_aperture_min: 2.8,
      max_aperture_max: 2.8,
      is_zoom: true,
      variant_tokens: ["g", "vr"],
    });
    const lens = deriveLens(raw);
    expect(lens.display_name).toBe("AF-S 24-70mm f/2.8 G VR");
  });

  it("omits the variant suffix when no variant tokens are present", () => {
    const raw = makeRaw({
      type_raw: "AI",
      focal_min_mm: 50,
      focal_max_mm: 50,
      max_aperture_min: 1.4,
      max_aperture_max: 1.4,
      is_zoom: false,
      variant_tokens: [],
    });
    const lens = deriveLens(raw);
    expect(lens.display_name).toBe("AI 50mm f/1.4");
  });

  it("normalises missing numeric fields to safe zero defaults", () => {
    const raw = makeRaw({
      focal_min_mm: null,
      focal_max_mm: null,
      max_aperture_min: null,
      max_aperture_max: null,
    });
    const lens = deriveLens(raw);
    expect(lens.focal_min_mm).toBe(0);
    expect(lens.focal_max_mm).toBe(0);
    expect(lens.max_aperture_min).toBe(0);
    expect(lens.max_aperture_max).toBe(0);
  });
});
