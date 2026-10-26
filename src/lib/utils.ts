import type { Thread } from "./types";

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export interface ThreadGroup {
  label: string;
  threads: Thread[];
}

const DAY = 24 * 60 * 60 * 1000;

function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Groups threads into Pinned / Today / Yesterday / Previous 7 Days / Older. */
export function groupThreads(threads: Thread[], now: number): ThreadGroup[] {
  const today = startOfDay(now);
  const buckets: Record<string, Thread[]> = {
    Pinned: [],
    Today: [],
    Yesterday: [],
    "Previous 7 Days": [],
    Older: [],
  };

  const sorted = [...threads].sort((a, b) => b.updatedAt - a.updatedAt);
  for (const thread of sorted) {
    if (thread.pinned) buckets.Pinned.push(thread);
    else if (thread.updatedAt >= today) buckets.Today.push(thread);
    else if (thread.updatedAt >= today - DAY) buckets.Yesterday.push(thread);
    else if (thread.updatedAt >= today - 7 * DAY) buckets["Previous 7 Days"].push(thread);
    else buckets.Older.push(thread);
  }

  return Object.entries(buckets)
    .filter(([, list]) => list.length > 0)
    .map(([label, list]) => ({ label, threads: list }));
}

export function titleFrom(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return "New chat";
  return clean.length > 42 ? `${clean.slice(0, 41)}…` : clean;
}
