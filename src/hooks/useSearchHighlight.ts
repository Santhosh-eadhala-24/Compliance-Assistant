import { useEffect, useState, useSyncExternalStore } from "react";
import type { RefObject } from "react";

function createCountStore() {
  let value = 0;
  const listeners = new Set<() => void>();
  return {
    get: () => value,
    set(next: number) {
      if (next === value) return;
      value = next;
      listeners.forEach((l) => l());
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

function collectRanges(root: HTMLElement, query: string): Range[] {
  const ranges: Range[] = [];
  const needle = query.toLowerCase();
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const parent = node.parentElement;
    if (!parent || parent.closest("button, [data-no-search]")) continue;
    const haystack = (node.textContent ?? "").toLowerCase();
    for (let at = haystack.indexOf(needle); at !== -1; at = haystack.indexOf(needle, at + needle.length)) {
      const range = new Range();
      range.setStart(node, at);
      range.setEnd(node, at + needle.length);
      ranges.push(range);
    }
  }
  return ranges;
}

/**
 * Highlights every match of `query` inside `root` using the CSS Custom Highlight API,
 * so the rendered Markdown is never modified. Returns the match count.
 * `version` should change whenever the rendered content changes.
 */
export function useSearchHighlight(
  root: RefObject<HTMLElement | null>,
  query: string,
  active: number,
  version: unknown,
): number {
  const [store] = useState(createCountStore);
  const count = useSyncExternalStore(store.subscribe, store.get, () => 0);

  useEffect(() => {
    const registry = typeof CSS !== "undefined" ? CSS.highlights : undefined;
    const el = root.current;
    if (!registry || !el) return;

    registry.delete("search");
    registry.delete("search-active");

    const q = query.trim();
    const ranges = q ? collectRanges(el, q) : [];
    store.set(ranges.length);
    if (ranges.length === 0) return;

    const current = ranges[((active % ranges.length) + ranges.length) % ranges.length];
    registry.set("search", new Highlight(...ranges));
    registry.set("search-active", new Highlight(current));

    return () => {
      registry.delete("search");
      registry.delete("search-active");
    };
  }, [root, query, active, version, store]);

  useEffect(() => {
    const el = root.current;
    const q = query.trim();
    if (!el || !q) return;
    const ranges = collectRanges(el, q);
    if (ranges.length === 0) return;
    const current = ranges[((active % ranges.length) + ranges.length) % ranges.length];
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    current.startContainer.parentElement?.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
    // Scroll only when the query or active match changes, not while a reply streams in.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, active]);

  return count;
}
