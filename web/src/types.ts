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

export interface MarketResponse {
  query: string;
  active: ListingSummary[];
  fetched_at: string;
}

export interface ApiErrorBody {
  error: string;
  [key: string]: unknown;
}
