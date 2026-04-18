import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, fetchMarket } from "./api";
import type { ApiErrorBody, MarketResponse } from "./types";

type FetchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: MarketResponse }
  | { status: "error"; httpStatus: number | null; body: ApiErrorBody };

export function App() {
  const [state, setState] = useState<FetchState>({ status: "idle" });
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState({ status: "loading" });
    fetchMarket(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          setState({ status: "success", data });
        }
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        if (err instanceof ApiError) {
          setState({ status: "error", httpStatus: err.status, body: err.body });
        } else if (err instanceof Error) {
          setState({
            status: "error",
            httpStatus: null,
            body: { error: "network", message: err.message },
          });
        } else {
          setState({
            status: "error",
            httpStatus: null,
            body: { error: "unknown" },
          });
        }
      });
  }, []);

  useEffect(() => {
    load();
    return () => abortRef.current?.abort();
  }, [load]);

  return (
    <main className="app">
      <header className="app__header">
        <h1>Nokin &mdash; eBay prototype</h1>
        <p className="app__subtitle">
          Hardcoded query: <code>q=nikon</code>, <code>limit=5</code>. Proves the
          Cloudflare Pages + Pages Functions + eBay Browse API wiring.
        </p>
        <button type="button" onClick={load} disabled={state.status === "loading"}>
          {state.status === "loading" ? "Loading\u2026" : "Refresh"}
        </button>
      </header>

      <section className="app__body">
        {state.status === "idle" && <p>Initializing\u2026</p>}
        {state.status === "loading" && <p>Fetching market data\u2026</p>}
        {state.status === "error" && (
          <div className="app__error">
            <p>
              <strong>Request failed</strong>
              {state.httpStatus !== null ? ` (HTTP ${state.httpStatus})` : ""}.
            </p>
            <pre>{JSON.stringify(state.body, null, 2)}</pre>
          </div>
        )}
        {state.status === "success" && (
          <div className="app__success">
            <p>
              {state.data.active.length} listings &middot; fetched at{" "}
              <time dateTime={state.data.fetched_at}>{state.data.fetched_at}</time>
            </p>
            <pre>{JSON.stringify(state.data, null, 2)}</pre>
          </div>
        )}
      </section>
    </main>
  );
}
