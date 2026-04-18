import type { LensTypeId } from "../types";

export interface LensTypeFilterProps {
  value: LensTypeId;
  onChange: (next: LensTypeId) => void;
}

const OPTIONS: ReadonlyArray<{ id: LensTypeId; label: string }> = [
  { id: "all", label: "All" },
  { id: "f", label: "F" },
  { id: "ai", label: "AI" },
  { id: "ai-s", label: "AI-S" },
  { id: "af", label: "AF" },
  { id: "af-s", label: "AF-S" },
  { id: "af-s-g", label: "AF-S G" },
  { id: "z", label: "Z" },
];

export function LensTypeFilter({ value, onChange }: LensTypeFilterProps) {
  return (
    <div className="segmented" role="radiogroup" aria-label="Lens type filter">
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
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
