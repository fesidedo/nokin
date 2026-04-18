import type { Lens } from "../types";
import { LensCard } from "./LensCard";

export interface ResultsGridProps {
  lenses: readonly Lens[];
  browseMode: boolean;
  onSelect: (stable_id: string) => void;
}

/**
 * Grid rendering. Mirrors `ResultsList` but with a CSS-grid container per
 * section; the browse-mode splitting between primes and zooms is preserved.
 */
export function ResultsGrid({ lenses, browseMode, onSelect }: ResultsGridProps) {
  if (!browseMode) {
    return (
      <div className="results-grid">
        {lenses.map((l) => (
          <LensCard key={l.stable_id} lens={l} onClick={onSelect} variant="grid" />
        ))}
      </div>
    );
  }

  const primes = lenses.filter((l) => !l.is_zoom);
  const zooms = lenses.filter((l) => l.is_zoom);
  return (
    <>
      {primes.length > 0 && (
        <section className="results-section">
          <h2 className="results-section__title">Primes</h2>
          <div className="results-grid">
            {primes.map((l) => (
              <LensCard key={l.stable_id} lens={l} onClick={onSelect} variant="grid" />
            ))}
          </div>
        </section>
      )}
      {zooms.length > 0 && (
        <section className="results-section">
          <h2 className="results-section__title">Zooms</h2>
          <div className="results-grid">
            {zooms.map((l) => (
              <LensCard key={l.stable_id} lens={l} onClick={onSelect} variant="grid" />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
