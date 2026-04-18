import type { LensCategory } from "../types";

export interface CategoryFilterProps {
  value: LensCategory;
  onChange: (next: LensCategory) => void;
}

const OPTIONS: ReadonlyArray<{ id: LensCategory; label: string }> = [
  { id: "all", label: "All" },
  { id: "lenses", label: "Lenses" },
];

export function CategoryFilter({ value, onChange }: CategoryFilterProps) {
  return (
    <div className="segmented" role="radiogroup" aria-label="Category filter">
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
