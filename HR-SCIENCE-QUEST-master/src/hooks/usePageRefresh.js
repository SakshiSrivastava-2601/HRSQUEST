import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

/**
 * Calls `loader` on:
 *   - initial mount,
 *   - every time the route's `location.key` changes (covers back/forward),
 *   - tab `visibilitychange` -> visible (BFCache restore in Chrome/Edge),
 *   - window `focus` (covers tab switching back),
 *   - `pageshow` events with `persisted=true` (full BFCache restore).
 *
 * Dedupes:
 *   - React StrictMode dev double-mount (same location.key + deps → run once),
 *   - rapid event bursts (focus + visibilitychange firing back-to-back).
 *
 * A real dep change (e.g. subjectId switches) ALWAYS triggers a fresh load,
 * even if the previous one is still in flight.
 *
 * NOTE: pass `loader` via `useCallback` so its identity is stable across renders.
 */
export default function usePageRefresh(loader, deps = []) {
  const location = useLocation();
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  // Key of the most recent mount/dep-change run (so StrictMode's
  // mount→unmount→mount cycle doesn't double-fire on the same dep set).
  const lastRunKeyRef = useRef(null);
  // Timestamp of the last event-driven invocation, used as a short debounce
  // so focus + visibilitychange firing together only triggers once.
  const lastEventAtRef = useRef(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    let cancelled = false;
    let currentKey;
    try {
      currentKey = `${location.key}|${JSON.stringify(deps)}`;
    } catch {
      currentKey = `${location.key}|${Date.now()}`;
    }

    const callLoader = () => {
      if (cancelled) return;
      let result;
      try {
        result = loaderRef.current?.();
      } catch {
        return;
      }
      if (result && typeof result.catch === "function") {
        result.catch(() => {});
      }
    };

    // Mount / dep-change: run only if this key hasn't already been served.
    // (Same key on a remount = StrictMode dev double-invoke → skip the second.)
    if (lastRunKeyRef.current !== currentKey) {
      lastRunKeyRef.current = currentKey;
      callLoader();
    }

    const callLoaderForEvent = () => {
      const now = Date.now();
      if (now - lastEventAtRef.current < 500) return;
      lastEventAtRef.current = now;
      callLoader();
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") callLoaderForEvent();
    };
    const handlePageShow = (event) => {
      if (event.persisted) callLoaderForEvent();
    };
    const handleFocus = () => callLoaderForEvent();

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("focus", handleFocus);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("focus", handleFocus);
    };
  }, [location.key, ...deps]);
}
