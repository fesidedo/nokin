import { describe, expect, it } from "vitest";
import { isJunkListing, JUNK_TITLE_PATTERNS } from "./filters";
import type { ListingSummary } from "./types";

function makeListing(overrides: Partial<ListingSummary>): ListingSummary {
  return {
    itemId: "v1|test|0",
    title: "Nikon AF-S 70-200mm f/2.8G ED VR",
    price: { value: "499.99", currency: "USD" },
    condition: "Used",
    conditionId: "3000",
    itemWebUrl: "https://www.ebay.com/itm/0",
    imageUrl: null,
    thumbnailUrls: [],
    itemEndDate: null,
    buyingOptions: ["FIXED_PRICE"],
    itemLocation: { country: "US" },
    ...overrides,
  };
}

describe("isJunkListing", () => {
  it("rejects listings with conditionId 7000 even if the title looks clean", () => {
    const listing = makeListing({
      title: "Nikon AF-S 70-200mm f/2.8G ED VR",
      conditionId: "7000",
    });
    expect(isJunkListing(listing)).toBe(true);
  });

  it("accepts clean, typical Nikon lens titles across common conditions", () => {
    const cleanTitles = [
      "Nikon AF-S 70-200mm f/2.8G ED VR",
      "Nikon AI 50mm f/1.4 Manual Focus Lens",
      "Nikkor 24-70mm f/2.8 E ED VR - Like New",
      "Nikon Z 85mm f/1.8 S Prime",
      "Nikon AF-S NIKKOR 14-24mm f/2.8G ED - Mint Condition",
    ];
    for (const title of cleanTitles) {
      expect(isJunkListing(makeListing({ title }))).toBe(false);
    }
  });

  const junkTitles = [
    "Nikon 50mm f/1.8 - for parts",
    "AF-S 70-200mm PARTS ONLY",
    "Nikkor 24mm lens not working",
    "Nikon 28mm lens, not functional",
    "AI 50mm f/1.4 - broken aperture ring",
    "AF-S 70-300mm damaged glass",
    "Nikkor 35mm as-is",
    "Nikkor 35mm AS IS",
    "Nikon 50mm (as is)",
    "Nikon 105mm f/2.8 - Read description before bidding",
    "AI-S 135mm f/2 read the description",
    "Nikkor 70-200mm - needs repair",
    "Nikon AF 50mm spares",
    "Nikon AF 50mm spare",
    "Nikon Z 24-70mm untested",
    "Nikkor 50mm 1.8 - empty box",
    "BOX ONLY Nikon 70-200mm AF-S",
  ];

  it.each(junkTitles)("rejects junk title: %s", (title) => {
    expect(isJunkListing(makeListing({ title }))).toBe(true);
  });

  it("does not trip on 'repair' appearing as a substring of an unrelated word", () => {
    // "unrepairable" would match /\brepair\b/ only if \b is ambiguous; confirm
    // our word-boundary anchors behave so "unrepairable" is NOT flagged, but a
    // bare "needs repair" IS.
    expect(isJunkListing(makeListing({ title: "Nikon Repairman-Recommended 50mm" }))).toBe(
      false,
    );
    expect(isJunkListing(makeListing({ title: "Nikon AF 50mm needs repair soon" }))).toBe(true);
  });

  it("handles empty titles defensively (treat as not-junk)", () => {
    expect(isJunkListing(makeListing({ title: "" }))).toBe(false);
  });

  it("exposes JUNK_TITLE_PATTERNS as a non-empty readonly array", () => {
    expect(JUNK_TITLE_PATTERNS.length).toBeGreaterThan(0);
    for (const re of JUNK_TITLE_PATTERNS) {
      expect(re).toBeInstanceOf(RegExp);
    }
  });
});
