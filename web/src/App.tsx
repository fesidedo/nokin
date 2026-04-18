import { useEffect, useMemo, useReducer, useState } from "react";
import { CategoryFilter } from "./components/CategoryFilter";
import { LensDetailModal } from "./components/LensDetailModal";
import { LensTypeFilter } from "./components/LensTypeFilter";
import { ResultsGrid } from "./components/ResultsGrid";
import { ResultsList } from "./components/ResultsList";
import { SearchBar } from "./components/SearchBar";
import type { ViewMode } from "./components/ViewModeToggle";
import { ViewModeToggle } from "./components/ViewModeToggle";
import { getLenses } from "./data/lenses";
import { isBrowseMode, searchLenses } from "./search/search";
import type { Lens, LensCategory, LensTypeId } from "./types";

interface AppState {
  query: string;
  category: LensCategory;
  lensType: LensTypeId;
  viewMode: ViewMode;
  selectedStableId: string | null;
}

type Action =
  | { type: "setQuery"; query: string }
  | { type: "setCategory"; category: LensCategory }
  | { type: "setLensType"; lensType: LensTypeId }
  | { type: "setViewMode"; viewMode: ViewMode }
  | { type: "select"; stable_id: string }
  | { type: "deselect" };

const initialState: AppState = {
  query: "",
  category: "all",
  lensType: "all",
  viewMode: "list",
  selectedStableId: null,
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "setQuery":
      return { ...state, query: action.query };
    case "setCategory":
      // Switching away from Lenses implicitly resets the lens-type filter so
      // the hidden selector does not leave a ghost filter active.
      return {
        ...state,
        category: action.category,
        lensType: action.category === "lenses" ? state.lensType : "all",
      };
    case "setLensType":
      return { ...state, lensType: action.lensType };
    case "setViewMode":
      return { ...state, viewMode: action.viewMode };
    case "select":
      return { ...state, selectedStableId: action.stable_id };
    case "deselect":
      return { ...state, selectedStableId: null };
    default:
      return state;
  }
}

type LoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; lenses: Lens[] }
  | { status: "error"; message: string };

export function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [load, setLoad] = useState<LoadState>({ status: "idle" });

  useEffect(() => {
    let cancelled = false;
    setLoad({ status: "loading" });
    getLenses()
      .then((lenses) => {
        if (!cancelled) setLoad({ status: "ready", lenses });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setLoad({
          status: "error",
          message: err instanceof Error ? err.message : "unknown",
        });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const results = useMemo<Lens[]>(() => {
    if (load.status !== "ready") return [];
    return searchLenses(
      state.query,
      { category: state.category, lensType: state.lensType },
      load.lenses,
    );
  }, [load, state.query, state.category, state.lensType]);

  const phase: "landing" | "searching" =
    state.query.length > 0 || state.lensType !== "all" ? "searching" : "landing";

  const browseMode = isBrowseMode(state.query, {
    category: state.category,
    lensType: state.lensType,
  });

  const selectedLens = useMemo<Lens | null>(() => {
    if (!state.selectedStableId || load.status !== "ready") return null;
    return load.lenses.find((l) => l.stable_id === state.selectedStableId) ?? null;
  }, [state.selectedStableId, load]);

  return (
    <main className={`app app--${phase}`}>
      <div className="app__control-bar">
        <CategoryFilter
          value={state.category}
          onChange={(category) => dispatch({ type: "setCategory", category })}
        />
        {state.category === "lenses" && (
          <LensTypeFilter
            value={state.lensType}
            onChange={(lensType) => dispatch({ type: "setLensType", lensType })}
          />
        )}
        <SearchBar
          value={state.query}
          onChange={(q) => dispatch({ type: "setQuery", query: q })}
          autoFocus
        />
      </div>

      {phase === "searching" && (
        <div className="app__results">
          <div className="app__results-header">
            <span className="app__result-count">
              {load.status === "ready"
                ? `${results.length} result${results.length === 1 ? "" : "s"}`
                : ""}
            </span>
            <ViewModeToggle
              value={state.viewMode}
              onChange={(viewMode) => dispatch({ type: "setViewMode", viewMode })}
            />
          </div>

          {load.status === "loading" && (
            <p className="app__hint">Loading lens dataset...</p>
          )}
          {load.status === "error" && (
            <p className="app__hint app__hint--error">
              Failed to load dataset: {load.message}
            </p>
          )}
          {load.status === "ready" && results.length === 0 && (
            <p className="app__hint">No lenses match.</p>
          )}
          {load.status === "ready" && results.length > 0 && (
            state.viewMode === "list" ? (
              <ResultsList
                lenses={results}
                browseMode={browseMode}
                onSelect={(stable_id) => dispatch({ type: "select", stable_id })}
              />
            ) : (
              <ResultsGrid
                lenses={results}
                browseMode={browseMode}
                onSelect={(stable_id) => dispatch({ type: "select", stable_id })}
              />
            )
          )}
        </div>
      )}

      <LensDetailModal
        lens={selectedLens}
        onClose={() => dispatch({ type: "deselect" })}
      />
    </main>
  );
}
