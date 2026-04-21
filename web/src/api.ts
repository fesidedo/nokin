import type { ApiErrorBody, MarketResponse, MarketplaceId } from "./types";

export class ApiError extends Error {
  readonly status: number;
  readonly body: ApiErrorBody;

  constructor(status: number, body: ApiErrorBody) {
    super(`API error ${status}: ${body.error}`);
    this.status = status;
    this.body = body;
  }
}

export async function fetchMarket(
  q: string,
  marketplace: MarketplaceId,
  signal?: AbortSignal,
): Promise<MarketResponse> {
  const params = new URLSearchParams({ q, marketplace });
  const res = await fetch(`/api/market?${params.toString()}`, { signal });
  const contentType = res.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");

  if (!res.ok) {
    const body: ApiErrorBody = isJson
      ? ((await res.json()) as ApiErrorBody)
      : { error: "non_json_error", raw: await res.text() };
    throw new ApiError(res.status, body);
  }

  if (!isJson) {
    throw new ApiError(res.status, {
      error: "unexpected_content_type",
      contentType,
    });
  }

  return (await res.json()) as MarketResponse;
}
