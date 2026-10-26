"use client";

import { PanelLeft, Search, SquarePen, UploadCloud } from "lucide-react";
import { useRef, useState, useSyncExternalStore } from "react";
import { QUICK_PROMPTS } from "@/lib/assistant";
import { useSearchHighlight } from "@/hooks/useSearchHighlight";
import { readFiles } from "@/lib/files";
import {
  getServerSnapshot,
  getSnapshot,
  isStreaming,
  newChat,
  sendMessage,
  stopStreaming,
  subscribe,
} from "@/lib/store";
import type { Attachment } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Composer } from "./Composer";
import { EmptyState } from "./EmptyState";
import { IconButton } from "./IconButton";
import { MessageList } from "./MessageList";
import { SearchBar } from "./SearchBar";
import { Sidebar } from "./Sidebar";
import { ThemeToggle } from "./ThemeToggle";

const WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 240;
const MIN_WIDTH = 160;
const MAX_WIDTH = 480;
const widthListeners = new Set<() => void>();

function readWidth(): number {
  try {
    const saved = Number(window.localStorage.getItem(WIDTH_KEY));
    return saved >= MIN_WIDTH && saved <= MAX_WIDTH ? saved : DEFAULT_WIDTH;
  } catch {
    return DEFAULT_WIDTH;
  }
}

function saveWidth(width: number) {
  try {
    window.localStorage.setItem(WIDTH_KEY, String(width));
  } catch {
    // The width still changes for this session.
  }
  widthListeners.forEach((listener) => listener());
}

function subscribeWidth(listener: () => void): () => void {
  widthListeners.add(listener);
  return () => widthListeners.delete(listener);
}

export function ChatApp() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const thread = state.threads.find((t) => t.id === state.activeId);
  const streaming = isStreaming(thread);

  const [desktopOpen, setDesktopOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const sidebarWidth = useSyncExternalStore(subscribeWidth, readWidth, () => DEFAULT_WIDTH);
  const [pending, setPending] = useState<Attachment[]>([]);
  const [notices, setNotices] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const dragDepth = useRef(0);

  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const feed = useRef<HTMLDivElement>(null);
  const matches = useSearchHighlight(feed, searchOpen ? query : "", active, thread?.messages);

  function startResize(e: React.PointerEvent) {
    e.preventDefault();
    const move = (ev: PointerEvent) => saveWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, Math.round(ev.clientX))));
    const stop = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
      document.body.style.userSelect = "";
    };
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
  }

  function toggleSidebar() {
    if (window.matchMedia("(min-width: 768px)").matches) setDesktopOpen((v) => !v);
    else setMobileOpen((v) => !v);
  }

  async function addFiles(files: File[]) {
    if (files.length === 0) return;
    const result = await readFiles(files, pending.length);
    setPending((current) => [...current, ...result.attachments]);
    setNotices(result.errors);
  }

  function send(text: string) {
    sendMessage(text, pending);
    setPending([]);
    setNotices([]);
  }

  function closeSearch() {
    setSearchOpen(false);
    setQuery("");
    setActive(0);
  }

  function hasFiles(e: React.DragEvent) {
    return Array.from(e.dataTransfer.types).includes("Files");
  }

  return (
    <div
      className="flex h-dvh overflow-hidden bg-bg text-ink"
      style={{ "--sidebar-w": `${sidebarWidth}px` } as React.CSSProperties}
    >
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
        />
      )}
      <Sidebar
        threads={state.threads}
        activeId={state.activeId}
        onNavigate={() => setMobileOpen(false)}
        onToggle={toggleSidebar}
        className={cn(
          "fixed inset-y-0 left-0 z-40 md:static md:z-auto",
          mobileOpen ? "flex" : "hidden",
          desktopOpen ? "md:flex" : "md:hidden",
        )}
      />
      {desktopOpen && (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize sidebar"
          onPointerDown={startResize}
          onDoubleClick={() => saveWidth(DEFAULT_WIDTH)}
          className="relative z-10 -mx-1.5 hidden w-3 shrink-0 cursor-col-resize touch-none md:block after:absolute after:inset-y-0 after:left-1/2 after:w-0.5 after:-translate-x-1/2 after:transition-colors hover:after:bg-accent/60"
        />
      )}

      <div
        className="relative flex min-w-0 flex-1 flex-col"
        onDragEnter={(e) => {
          if (!hasFiles(e)) return;
          dragDepth.current += 1;
          setDragging(true);
        }}
        onDragOver={(e) => {
          if (hasFiles(e)) e.preventDefault();
        }}
        onDragLeave={(e) => {
          if (!hasFiles(e)) return;
          dragDepth.current = Math.max(0, dragDepth.current - 1);
          if (dragDepth.current === 0) setDragging(false);
        }}
        onDrop={(e) => {
          if (!hasFiles(e)) return;
          e.preventDefault();
          dragDepth.current = 0;
          setDragging(false);
          void addFiles(Array.from(e.dataTransfer.files));
        }}
      >
        <header className="flex h-14 shrink-0 items-center gap-1 border-b border-line bg-surface px-3">
          <IconButton label="Show sidebar" onClick={toggleSidebar} className={desktopOpen ? "md:hidden" : ""}>
            <PanelLeft size={18} aria-hidden />
          </IconButton>
          {!desktopOpen && (
            <IconButton label="New chat" onClick={newChat} className="hidden md:inline-flex">
              <SquarePen size={18} aria-hidden />
            </IconButton>
          )}
          <h1 className="mx-2 min-w-0 flex-1 truncate text-sm font-medium">{thread?.title ?? "New chat"}</h1>
          {thread && (
            <IconButton
              label="Search in conversation"
              active={searchOpen}
              onClick={() => (searchOpen ? closeSearch() : setSearchOpen(true))}
            >
              <Search size={18} aria-hidden />
            </IconButton>
          )}
          <ThemeToggle />
        </header>

        {searchOpen && thread && (
          <SearchBar
            query={query}
            count={matches}
            active={active}
            onQuery={(value) => {
              setQuery(value);
              setActive(0);
            }}
            onStep={(delta) => setActive((i) => i + delta)}
            onClose={closeSearch}
          />
        )}

        <main ref={feed} className="min-h-0 flex-1">
          {thread ? <MessageList key={thread.id} thread={thread} /> : <EmptyState onPick={send} />}
        </main>

        <Composer
          attachments={pending}
          notices={notices}
          streaming={streaming}
          suggestions={thread && !streaming ? QUICK_PROMPTS : undefined}
          onPick={send}
          onFiles={(files) => void addFiles(files)}
          onRemove={(id) => setPending((current) => current.filter((f) => f.id !== id))}
          onSend={send}
          onStop={() => thread && stopStreaming(thread.id)}
        />

        {dragging && (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-bg/80 p-6 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-accent bg-surface px-10 py-8 text-center">
              <UploadCloud size={28} className="text-accent" aria-hidden />
              <p className="text-sm font-medium">Drop files to attach</p>
              <p className="text-xs text-muted">PDF, TXT, MD, JSON, CSV, or DOCX up to 5 MB</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}