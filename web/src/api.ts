import type { ApiErrorBody, MarketResponse } from "./types";

export class ApiError extends Error {
  readonly status: number;
  readonly body: ApiErrorBody;

  constructor(status: number, body: ApiErrorBody) {
    super(`API error ${status}: ${body.error}`);
    this.status = status;
    this.body = body;
  }
}

export async function fetchMarket(signal?: AbortSignal): Promise<MarketResponse> {
  const res = await fetch("/api/market", { signal });
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
