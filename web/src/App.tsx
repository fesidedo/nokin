import { useEffect, useMemo, useReducer, useState } from "react";
import { ApertureRingFilter } from "./components/ApertureRingFilter";
import { CategoryFilter } from "./components/CategoryFilter";
import { LensDetailModal } from "./components/LensDetailModal";
import { LensTypeFilter } from "./components/LensTypeFilter";
import { ResultsGrid } from "./components/ResultsGrid";
import { ResultsList } from "./components/ResultsList";
import { SearchBar } from "./components/SearchBar";
import { SensorFormatFilter } from "./components/SensorFormatFilter";
import type { ViewMode } from "./components/ViewModeToggle";
import { ViewModeToggle } from "./components/ViewModeToggle";
import { getLenses } from "./data/lenses";
import { isBrowseMode, searchLenses } from "./search/search";
import type {
  ApertureRingFilter as ApertureRingFilterValue,
  Lens,
  LensCategory,
  LensTypeId,
  SensorFormat,
} from "./types";

interface AppState {
  query: string;
  category: LensCategory;
  lensType: LensTypeId;
  sensorFormat: SensorFormat;
  apertureRing: ApertureRingFilterValue;
  viewMode: ViewMode;
  selectedStableId: string | null;
}

type Action =
  | { type: "setQuery"; query: string }
  | { type: "setCategory"; category: LensCategory }
  | { type: "setLensType"; lensType: LensTypeId }
  | { type: "setSensorFormat"; sensorFormat: SensorFormat }
  | { type: "setApertureRing"; apertureRing: ApertureRingFilterValue }
  | { type: "setViewMode"; viewMode: ViewMode }
  | { type: "select"; stable_id: string }
  | { type: "deselect" };

const initialState: AppState = {
  query: "",
  category: "all",
  lensType: "all",
  sensorFormat: "all",
  apertureRing: "all",
  viewMode: "list",
  selectedStableId: null,
};

function shouldShowSensorFilter(lensType: LensTypeId): boolean {
  return lensType === "af" || lensType === "af-s" || lensType === "z";
}

function shouldShowApertureRingFilter(lensType: LensTypeId): boolean {
  return lensType === "af" || lensType === "af-s";
}

function getForcedApertureRing(
  lensType: LensTypeId,
  sensorFormat: SensorFormat,
): ApertureRingFilterValue | null {
  if (lensType === "af" && sensorFormat === "fx") return "has_ring";
  if (lensType === "af" && sensorFormat === "dx") return "no_ring";
  if (lensType === "af-s" && sensorFormat === "dx") return "no_ring";
  return null;
}

function normalizeFilters(
  category: LensCategory,
  lensType: LensTypeId,
  sensorFormat: SensorFormat,
  apertureRing: ApertureRingFilterValue,
): Pick<AppState, "lensType" | "sensorFormat" | "apertureRing"> {
  if (category !== "lenses") {
    return { lensType: "all", sensorFormat: "all", apertureRing: "all" };
  }

  const normalizedSensor = shouldShowSensorFilter(lensType) ? sensorFormat : "all";
  const normalizedRing = shouldShowApertureRingFilter(lensType) ? apertureRing : "all";
  const forced = getForcedApertureRing(lensType, normalizedSensor);

  return {
    lensType,
    sensorFormat: normalizedSensor,
    apertureRing: forced ?? normalizedRing,
  };
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "setQuery":
      return { ...state, query: action.query };
    case "setCategory":
      return {
        ...state,
        category: action.category,
        ...normalizeFilters(
          action.category,
          state.lensType,
          state.sensorFormat,
          state.apertureRing,
        ),
      };
    case "setLensType": {
      return {
        ...state,
        ...normalizeFilters(
          state.category,
          action.lensType,
          state.sensorFormat,
          state.apertureRing,
        ),
      };
    }
    case "setSensorFormat":
      return {
        ...state,
        ...normalizeFilters(
          state.category,
          state.lensType,
          action.sensorFormat,
          state.apertureRing,
        ),
      };
    case "setApertureRing":
      return {
        ...state,
        ...normalizeFilters(
          state.category,
          state.lensType,
          state.sensorFormat,
          action.apertureRing,
        ),
      };
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
      {
        category: state.category,
        lensType: state.lensType,
        sensorFormat: state.sensorFormat,
        apertureRing: state.apertureRing,
      },
      load.lenses,
    );
  }, [
    load,
    state.query,
    state.category,
    state.lensType,
    state.sensorFormat,
    state.apertureRing,
  ]);

  const phase: "landing" | "searching" =
    state.query.length > 0 ||
    state.lensType !== "all" ||
    state.sensorFormat !== "all" ||
    state.apertureRing !== "all"
      ? "searching"
      : "landing";

  const browseMode = isBrowseMode(state.query, {
    category: state.category,
    lensType: state.lensType,
    sensorFormat: state.sensorFormat,
    apertureRing: state.apertureRing,
  });

  const showSensorFilter = state.category === "lenses" && shouldShowSensorFilter(state.lensType);
  const showApertureRingFilter =
    state.category === "lenses" && shouldShowApertureRingFilter(state.lensType);
  const forcedApertureRing = getForcedApertureRing(state.lensType, state.sensorFormat);

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
        {showSensorFilter && (
          <SensorFormatFilter
            value={state.sensorFormat}
            onChange={(sensorFormat) => dispatch({ type: "setSensorFormat", sensorFormat })}
          />
        )}
        {showApertureRingFilter && (
          <ApertureRingFilter
            value={state.apertureRing}
            onChange={(apertureRing) => dispatch({ type: "setApertureRing", apertureRing })}
            disabled={forcedApertureRing !== null}
          />
        )}
        {showApertureRingFilter && forcedApertureRing && (
          <span className="app__filter-note">
            Aperture ring locked to{" "}
            {forcedApertureRing === "has_ring" ? "Has Ring" : "No Ring"} for this type/sensor
            combination.
          </span>
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
