import type { Lens } from "../types";
import { LensCard } from "./LensCard";

export interface ResultsListProps {
  lenses: readonly Lens[];
  browseMode: boolean;
  onSelect: (stable_id: string) => void;
}

/**
 * Vertical list rendering. In browse mode we split primes from zooms with a
 * subheading on each group; in typed-search mode (relevance order) we just
 * emit a flat list so the Fuse ranking isn't visually re-segmented.
 */
export function ResultsList({ lenses, browseMode, onSelect }: ResultsListProps) {
  if (!browseMode) {
    return (
      <ul className="results-list" role="list">
        {lenses.map((l) => (
          <li key={l.stable_id} className="results-list__item">
            <LensCard lens={l} onClick={onSelect} variant="list" />
          </li>
        ))}
      </ul>
    );
  }

  const primes = lenses.filter((l) => !l.is_zoom);
  const zooms = lenses.filter((l) => l.is_zoom);
  return (
    <>
      {primes.length > 0 && (
        <section className="results-section">
          <h2 className="results-section__title">Primes</h2>
          <ul className="results-list" role="list">
            {primes.map((l) => (
              <li key={l.stable_id} className="results-list__item">
                <LensCard lens={l} onClick={onSelect} variant="list" />
              </li>
            ))}
          </ul>
        </section>
      )}
      {zooms.length > 0 && (
        <section className="results-section">
          <h2 className="results-section__title">Zooms</h2>
          <ul className="results-list" role="list">
            {zooms.map((l) => (
              <li key={l.stable_id} className="results-list__item">
                <LensCard lens={l} onClick={onSelect} variant="list" />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
