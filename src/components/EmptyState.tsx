"use client";

import { ShieldCheck } from "lucide-react";
import { QUICK_PROMPTS } from "@/lib/assistant";

interface EmptyStateProps {
  onPick: (prompt: string) => void;
}

export function EmptyState({ onPick }: EmptyStateProps) {
  return (
    <div className="mx-auto flex h-full w-full max-w-2xl flex-col items-center justify-center px-4 text-center">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-accent text-accent-ink">
        <ShieldCheck size={26} aria-hidden />
      </div>
      <h1 className="mt-5 text-2xl font-semibold tracking-tight">Ask a compliance question</h1>
      <p className="mt-2 max-w-md text-sm text-muted">
        Get answers with source citations, or attach a document and have it checked against the rules.
      </p>
      <ul className="mt-8 grid w-full gap-2 sm:grid-cols-2">
        {QUICK_PROMPTS.map((item) => (
          <li key={item.label}>
            <button
              type="button"
              onClick={() => onPick(item.prompt)}
              className="h-full w-full rounded-xl border border-line bg-surface px-4 py-3 text-left text-sm transition-colors hover:border-accent hover:bg-accent-soft"
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
