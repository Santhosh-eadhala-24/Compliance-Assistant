import { useSyncExternalStore } from "react";

const MINUTE = 60_000;

function subscribe(listener: () => void): () => void {
  const timer = window.setInterval(listener, MINUTE);
  return () => window.clearInterval(timer);
}

/** Current time rounded to the minute, so date groups refresh without re-rendering constantly. */
export function useNow(): number {
  return useSyncExternalStore(
    subscribe,
    () => Math.floor(Date.now() / MINUTE) * MINUTE,
    () => 0,
  );
}
