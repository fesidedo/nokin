import type { Lens } from "../types";

export interface LensCardProps {
  lens: Lens;
  onClick: (stable_id: string) => void;
  variant: "list" | "grid";
}

/**
 * Minimal card representation. Styling is intentionally bare-bones this pass
 * (typography + padding + border); visual polish is a follow-up plan.
 */
export function LensCard({ lens, onClick, variant }: LensCardProps) {
  return (
    <button
      type="button"
      className={`lens-card lens-card--${variant}`}
      onClick={() => onClick(lens.stable_id)}
    >
      <span className="lens-card__title">{lens.display_name}</span>
      <span className="lens-card__meta">
        {lens.is_zoom ? "Zoom" : "Prime"}
        {lens.focal_min_mm > 0 ? ` \u00b7 ${formatFocal(lens)}` : ""}
      </span>
    </button>
  );
}

function formatFocal(lens: Lens): string {
  if (lens.focal_min_mm === lens.focal_max_mm) return `${lens.focal_min_mm}mm`;
  return `${lens.focal_min_mm}-${lens.focal_max_mm}mm`;
}
