import type { ApertureRingFilter as ApertureRingFilterValue } from "../types";

export interface ApertureRingFilterProps {
  value: ApertureRingFilterValue;
  onChange: (next: ApertureRingFilterValue) => void;
  disabled?: boolean;
}

const OPTIONS: ReadonlyArray<{ id: ApertureRingFilterValue; label: string }> = [
  { id: "all", label: "All Rings" },
  { id: "has_ring", label: "Has Ring" },
  { id: "no_ring", label: "No Ring" },
];

export function ApertureRingFilter({ value, onChange, disabled = false }: ApertureRingFilterProps) {
  return (
    <div className="segmented" role="radiogroup" aria-label="Aperture ring filter">
      {OPTIONS.map((opt) => {
        const selected = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={selected}
            className={`segmented__btn${selected ? " segmented__btn--on" : ""}`}
            onClick={() => onChange(opt.id)}
            disabled={disabled}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
