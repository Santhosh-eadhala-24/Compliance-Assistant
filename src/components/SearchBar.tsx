"use client";

import { ChevronDown, ChevronUp, Search, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { IconButton } from "./IconButton";

interface SearchBarProps {
  query: string;
  count: number;
  active: number;
  onQuery: (value: string) => void;
  onStep: (delta: number) => void;
  onClose: () => void;
}

export function SearchBar({ query, count, active, onQuery, onStep, onClose }: SearchBarProps) {
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    input.current?.focus();
  }, []);

  const position = count === 0 ? 0 : (((active % count) + count) % count) + 1;

  return (
    <div role="search" className="rise border-b border-line bg-surface px-4 py-2 sm:px-6">
      <div className="mx-auto flex w-full max-w-3xl items-center gap-2">
        <Search size={16} className="text-muted" aria-hidden />
        <input
          ref={input}
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onStep(e.shiftKey ? -1 : 1);
            }
            if (e.key === "Escape") onClose();
          }}
          placeholder="Search this conversation"
          aria-label="Search this conversation"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
        />
        <span className="shrink-0 text-xs tabular-nums text-muted" aria-live="polite">
          {query.trim() ? (count === 0 ? "No matches" : `${position} of ${count}`) : ""}
        </span>
        <IconButton label="Previous match" className="size-8" disabled={count === 0} onClick={() => onStep(-1)}>
          <ChevronUp size={16} aria-hidden />
        </IconButton>
        <IconButton label="Next match" className="size-8" disabled={count === 0} onClick={() => onStep(1)}>
          <ChevronDown size={16} aria-hidden />
        </IconButton>
        <IconButton label="Close search" className="size-8" onClick={onClose}>
          <X size={16} aria-hidden />
        </IconButton>
      </div>
    </div>
  );
}
