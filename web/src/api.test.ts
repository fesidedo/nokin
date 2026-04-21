import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, fetchMarket } from "./api";

describe("fetchMarket", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends q and marketplace as query parameters", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(
          JSON.stringify({
            query: "nikon af-s 50mm",
            marketplace_used: "EBAY_GB",
            bin: [],
            auction: [],
            fetched_at: "2026-01-01T00:00:00.000Z",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );

    await fetchMarket("nikon af-s 50mm", "EBAY_GB");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const firstArg = fetchMock.mock.calls[0]?.[0];
    expect(String(firstArg)).toContain("/api/market?");
    expect(String(firstArg)).toContain("q=nikon+af-s+50mm");
    expect(String(firstArg)).toContain("marketplace=EBAY_GB");
  });

  it("throws ApiError on non-OK response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "missing_query" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(fetchMarket("", "EBAY_US")).rejects.toBeInstanceOf(ApiError);
  });
});
