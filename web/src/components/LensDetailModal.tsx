import { useEffect, useRef, useState } from "react";
import { ApiError, fetchMarket } from "../api";
import { marketplaceLabel } from "../marketplacePreference";
import type { Lens, ListingSummary, MarketResponse, MarketplaceId, RawLens } from "../types";

export interface LensDetailModalProps {
  lens: Lens | null;
  marketplace: MarketplaceId;
  onClose: () => void;
}

/**
 * Detail overlay for a selected lens. Renders nothing when `lens === null`.
 * Closes on backdrop click, ESC, or the explicit close button. Keeps focus
 * inside the dialog while it is open so keyboard users can navigate within
 * the panel.
 */
export function LensDetailModal({ lens, marketplace, onClose }: LensDetailModalProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!lens) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [lens, onClose]);

  useEffect(() => {
    if (lens && closeBtnRef.current) closeBtnRef.current.focus();
  }, [lens]);

  if (!lens) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={lens.display_name}
        className="modal-panel"
      >
        <header className="modal-panel__header">
          <h2 className="modal-panel__title">{lens.display_name}</h2>
          <button
            ref={closeBtnRef}
            type="button"
            className="modal-panel__close"
            onClick={onClose}
            aria-label="Close"
          >
            &times;
          </button>
        </header>

        <section className="modal-panel__body">
          <SpecsBlock lens={lens} />
          <MarketSection lens={lens} marketplace={marketplace} />
        </section>
      </div>
    </div>
  );
}

function SpecsBlock({ lens }: { lens: Lens }) {
  const rows = buildSpecRows(lens.raw);
  return (
    <div className="specs-block">
      <h3 className="specs-block__title">Specifications</h3>
      <dl className="specs-block__grid">
        {rows.map(([label, value]) => (
          <div key={label} className="specs-block__row">
            <dt className="specs-block__label">{label}</dt>
            <dd className="specs-block__value">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Market data                                                               */
/* -------------------------------------------------------------------------- */

type MarketStatus = "loading" | "ok" | "error";

interface MarketState {
  status: MarketStatus;
  data: MarketResponse | null;
  error: string | null;
}

/**
 * Fetch the market payload for a specific lens. Re-fires whenever the
 * target display name changes and cancels in-flight requests on unmount
 * or lens switch so the user doesn't see stale data for the previous
 * lens flash in after a quick click-through.
 */
function useMarketData(query: string, marketplace: MarketplaceId): MarketState {
  const [state, setState] = useState<MarketState>({
    status: "loading",
    data: null,
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    setState({ status: "loading", data: null, error: null });

    fetchMarket(query, marketplace, controller.signal)
      .then((data) => {
        if (cancelled) return;
        setState({ status: "ok", data, error: null });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
        const message =
          err instanceof ApiError
            ? `${err.status} ${err.body.error ?? "error"}`
            : err instanceof Error
              ? err.message
              : "Unknown error";
        setState({ status: "error", data: null, error: message });
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [query, marketplace]);

  return state;
}

function MarketSection({ lens, marketplace }: { lens: Lens; marketplace: MarketplaceId }) {
  const market = useMarketData(lens.display_name, marketplace);

  return (
    <div className="market-section">
      <h3 className="market-section__title">Market data</h3>
      <p className="market-section__query">
        Searched eBay for <code>{lens.display_name}</code>
      </p>
      <p className="market-section__market">Marketplace: {marketplaceLabel(marketplace)}</p>

      <MarketBucket
        title="Buy It Now"
        status={market.status}
        listings={market.data?.bin ?? []}
        bucketError={market.data?.errors?.bin}
        topLevelError={market.status === "error" ? market.error : null}
        emptyLabel="No matching Buy-It-Now listings right now."
      />

      <MarketBucket
        title="Auctions ending soon"
        status={market.status}
        listings={market.data?.auction ?? []}
        bucketError={market.data?.errors?.auction}
        topLevelError={market.status === "error" ? market.error : null}
        emptyLabel="No live auctions for this lens right now."
        showEndCountdown
      />
    </div>
  );
}

interface MarketBucketProps {
  title: string;
  status: MarketStatus;
  listings: ListingSummary[];
  bucketError: string | undefined;
  topLevelError: string | null;
  emptyLabel: string;
  showEndCountdown?: boolean;
}

function MarketBucket({
  title,
  status,
  listings,
  bucketError,
  topLevelError,
  emptyLabel,
  showEndCountdown = false,
}: MarketBucketProps) {
  return (
    <section className="market-bucket">
      <h4 className="market-bucket__title">{title}</h4>

      {status === "loading" ? (
        <ul className="market-bucket__list market-bucket__list--skeleton">
          {[0, 1, 2].map((i) => (
            <li key={i} className="market-listing market-listing--skeleton" aria-hidden="true" />
          ))}
        </ul>
      ) : topLevelError ? (
        <p className="market-bucket__error">Failed to load: {topLevelError}</p>
      ) : bucketError ? (
        <p className="market-bucket__error">Failed to load: {bucketError}</p>
      ) : listings.length === 0 ? (
        <p className="market-bucket__empty">{emptyLabel}</p>
      ) : (
        <ul className="market-bucket__list">
          {listings.map((l) => (
            <MarketListingRow
              key={l.itemId || l.itemWebUrl || l.title}
              listing={l}
              showEndCountdown={showEndCountdown}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function MarketListingRow({
  listing,
  showEndCountdown,
}: {
  listing: ListingSummary;
  showEndCountdown: boolean;
}) {
  const price = listing.price
    ? `${listing.price.currency} ${listing.price.value}`
    : "Price not listed";
  const conditionBits = [listing.condition, listing.itemLocation.country].filter(
    (s): s is string => typeof s === "string" && s.length > 0,
  );
  const endsLabel = showEndCountdown ? formatEndsIn(listing.itemEndDate) : null;

  return (
    <li className="market-listing">
      <div className="market-listing__main">
        {listing.itemWebUrl ? (
          <a
            className="market-listing__title"
            href={listing.itemWebUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {listing.title}
          </a>
        ) : (
          <span className="market-listing__title">{listing.title}</span>
        )}
        <div className="market-listing__meta">
          <span className="market-listing__price">{price}</span>
          {conditionBits.length > 0 && (
            <span className="market-listing__condition">{conditionBits.join(" · ")}</span>
          )}
          {endsLabel && <span className="market-listing__ends">{endsLabel}</span>}
        </div>
      </div>
    </li>
  );
}

/**
 * Humanise the time remaining on an auction. Deliberately lo-fi: no
 * interval ticker, so the value is stale the moment the modal opens.
 * That's fine for this context — the user is skimming, not watching a
 * countdown clock.
 */
function formatEndsIn(endIso: string | null): string | null {
  if (!endIso) return null;
  const end = Date.parse(endIso);
  if (Number.isNaN(end)) return null;
  const diffMs = end - Date.now();
  if (diffMs <= 0) return "Ended";

  const minutes = Math.floor(diffMs / 60_000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days >= 1) {
    const remHours = hours % 24;
    return remHours > 0 ? `Ends in ${days}d ${remHours}h` : `Ends in ${days}d`;
  }
  if (hours >= 1) {
    const remMinutes = minutes % 60;
    return remMinutes > 0 ? `Ends in ${hours}h ${remMinutes}m` : `Ends in ${hours}h`;
  }
  return `Ends in ${Math.max(1, minutes)}m`;
}

/**
 * Pick out the raw spec fields that are meaningful to a human skimming the
 * panel. We keep this conservative rather than dumping every ingested field
 * - the detail panel's job here is a quick glance, not a data browser.
 */
function buildSpecRows(raw: RawLens): ReadonlyArray<[string, string]> {
  const rows: Array<[string, string]> = [];
  const push = (label: string, value: unknown) => {
    if (value == null) return;
    const str = String(value).trim();
    if (!str || str === "-" || str === "?") return;
    rows.push([label, str]);
  };

  push("Stable ID", raw.stable_id);
  push("Type", raw.type_raw);
  push("Model", raw.lens_raw);
  push("Focal (mm)", raw.focal_signature);
  push("Max aperture", raw.aperture_signature);
  push("Min aperture", raw.min_aperture_raw);
  push("Optical construction", raw.optic_raw);
  push("Aperture blades", raw.blades_raw);
  push("Angle of view", raw.angle_raw);
  push("Angle (DX)", raw.angle_dx_raw);
  push("Closest focus (m)", raw.close_focus_raw);
  push("Max reproduction", raw.macro_raw);
  push("Filter size (mm)", raw.filter_raw);
  push("Diameter (mm)", raw.diam_raw);
  push("Length (mm)", raw.length_raw);
  push("Weight (g)", raw.weight_raw);
  push("Features", raw.features_raw);
  push("Serial numbers", raw.serial_no_raw);
  push("Production dates", raw.date_raw);
  push("Hood", raw.hood_raw);
  push("Notes", raw.notes_raw);

  return rows;
}
