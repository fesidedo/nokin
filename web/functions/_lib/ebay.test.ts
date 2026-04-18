import { describe, expect, it } from "vitest";
import { projectListing } from "./ebay";

describe("projectListing", () => {
  it("keeps allow-listed fields and drops seller/buyer identity fields", () => {
    const rawItem = {
      itemId: "v1|123|0",
      title: "Nikon AF-S 50mm f/1.4G",
      price: { value: "450.00", currency: "USD" },
      condition: "USED_EXCELLENT",
      conditionId: "3000",
      itemWebUrl: "https://www.ebay.com/itm/123",
      image: { imageUrl: "https://i.ebayimg.com/a.jpg" },
      thumbnailImages: [
        { imageUrl: "https://i.ebayimg.com/t1.jpg" },
        { imageUrl: "https://i.ebayimg.com/t2.jpg" },
      ],
      itemEndDate: "2026-05-01T00:00:00.000Z",
      buyingOptions: ["FIXED_PRICE"],
      itemLocation: { country: "US", postalCode: "94103" },

      seller: {
        username: "camera_store_42",
        userId: "SELLER_USER_ID_12345",
        feedbackPercentage: "99.8",
        feedbackScore: 4210,
      },
      eiasToken: "nY+sHZ2PrBmdj6wVnYquBJuBfg==",
      bidCount: 3,
      buyerGuaranteeCount: 0,
    };

    const projected = projectListing(rawItem);

    expect(projected).toEqual({
      itemId: "v1|123|0",
      title: "Nikon AF-S 50mm f/1.4G",
      price: { value: "450.00", currency: "USD" },
      condition: "USED_EXCELLENT",
      conditionId: "3000",
      itemWebUrl: "https://www.ebay.com/itm/123",
      imageUrl: "https://i.ebayimg.com/a.jpg",
      thumbnailUrls: ["https://i.ebayimg.com/t1.jpg", "https://i.ebayimg.com/t2.jpg"],
      itemEndDate: "2026-05-01T00:00:00.000Z",
      buyingOptions: ["FIXED_PRICE"],
      itemLocation: { country: "US" },
    });

    const serialized = JSON.stringify(projected);
    expect(serialized).not.toContain("seller");
    expect(serialized).not.toContain("username");
    expect(serialized).not.toContain("userId");
    expect(serialized).not.toContain("feedback");
    expect(serialized).not.toContain("eiasToken");
    expect(serialized).not.toContain("postalCode");
    expect(serialized).not.toContain("bidCount");
  });

  it("gracefully handles missing/null fields", () => {
    const projected = projectListing({});

    expect(projected).toEqual({
      itemId: "",
      title: "",
      price: null,
      condition: null,
      conditionId: null,
      itemWebUrl: null,
      imageUrl: null,
      thumbnailUrls: [],
      itemEndDate: null,
      buyingOptions: [],
      itemLocation: { country: null },
    });
  });
});
