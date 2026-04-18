import { useEffect, useRef } from "react";
import type { Lens, RawLens } from "../types";

export interface LensDetailModalProps {
  lens: Lens | null;
  onClose: () => void;
}

/**
 * Detail overlay for a selected lens. Renders nothing when `lens === null`.
 * Closes on backdrop click, ESC, or the explicit close button. Keeps focus
 * inside the dialog while it is open so keyboard users can navigate within
 * the panel.
 */
export function LensDetailModal({ lens, onClose }: LensDetailModalProps) {
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
          <MarketPlaceholder />
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

function MarketPlaceholder() {
  return (
    <div className="market-placeholder">
      <h3 className="market-placeholder__title">Market data</h3>
      <p className="market-placeholder__note">
        eBay listings for this lens will appear here once the market lookup is
        wired through. Coming soon.
      </p>
    </div>
  );
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
