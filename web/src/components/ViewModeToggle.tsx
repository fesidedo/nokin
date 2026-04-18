export type ViewMode = "list" | "grid";

export interface ViewModeToggleProps {
  value: ViewMode;
  onChange: (next: ViewMode) => void;
}

const OPTIONS: ReadonlyArray<{ id: ViewMode; label: string }> = [
  { id: "list", label: "List" },
  { id: "grid", label: "Grid" },
];

export function ViewModeToggle({ value, onChange }: ViewModeToggleProps) {
  return (
    <div className="segmented segmented--sm" role="radiogroup" aria-label="Result view mode">
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
