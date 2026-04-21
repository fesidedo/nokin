import type { SensorFormat } from "../types";

export interface SensorFormatFilterProps {
  value: SensorFormat;
  onChange: (next: SensorFormat) => void;
}

const OPTIONS: ReadonlyArray<{ id: SensorFormat; label: string }> = [
  { id: "all", label: "All Sensors" },
  { id: "fx", label: "FX" },
  { id: "dx", label: "DX" },
];

export function SensorFormatFilter({ value, onChange }: SensorFormatFilterProps) {
  return (
    <div className="segmented" role="radiogroup" aria-label="Sensor format filter">
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
