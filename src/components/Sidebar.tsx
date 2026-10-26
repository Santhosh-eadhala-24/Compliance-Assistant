"use client";

import { Check, Ellipsis, PanelLeft, Pencil, Pin, PinOff, ShieldCheck, SquarePen, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNow } from "@/hooks/useNow";
import { deleteThread, newChat, renameThread, selectThread, togglePin } from "@/lib/store";
import type { Thread } from "@/lib/types";
import { cn, groupThreads } from "@/lib/utils";

interface SidebarProps {
  threads: Thread[];
  activeId: string | null;
  className?: string;
  onNavigate: () => void;
  onToggle: () => void;
}

type Mode = "idle" | "rename" | "delete";

interface MenuPos {
  left: number;
  top: number;
  above: boolean;
}

const MENU_WIDTH = 176;

function ThreadRow({ thread, active, onNavigate }: { thread: Thread; active: boolean; onNavigate: () => void }) {
  const [mode, setMode] = useState<Mode>("idle");
  const [title, setTitle] = useState(thread.title);
  const [menu, setMenu] = useState<MenuPos | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menuEl = useRef<HTMLDivElement>(null);
  const menuOpen = menu !== null;

  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenu(null);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenu(null);
        trigger.current?.focus();
      }
    };
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!menuEl.current?.contains(target) && !trigger.current?.contains(target)) close();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [menuOpen]);

  function toggleMenu() {
    if (menuOpen) {
      setMenu(null);
      return;
    }
    const rect = trigger.current?.getBoundingClientRect();
    if (!rect) return;
    const above = window.innerHeight - rect.bottom < 160;
    setMenu({
      left: Math.max(8, rect.right - MENU_WIDTH),
      top: above ? rect.top - 4 : rect.bottom + 4,
      above,
    });
  }

  function commitRename() {
    if (title.trim()) renameThread(thread.id, title);
    setMode("idle");
  }

  if (mode === "rename") {
    return (
      <li className="px-1">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            commitRename();
          }}
          className="flex items-center gap-1 rounded-lg border border-accent bg-surface px-2 py-1"
        >
          <input
            autoFocus
            value={title}
            maxLength={60}
            aria-label="Thread name"
            onChange={(e) => setTitle(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                setTitle(thread.title);
                setMode("idle");
              }
            }}
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
        </form>
      </li>
    );
  }

  if (mode === "delete") {
    return (
      <li className="px-1">
        <div className="flex items-center gap-1 rounded-lg bg-surface-2 py-1.5 pl-3 pr-1 text-sm">
          <span className="min-w-0 flex-1 truncate">Delete this chat?</span>
          <button
            type="button"
            aria-label="Confirm delete"
            onClick={() => deleteThread(thread.id)}
            className="rounded-md p-1.5 text-danger hover:bg-line"
          >
            <Check size={15} aria-hidden />
          </button>
          <button
            type="button"
            aria-label="Cancel delete"
            onClick={() => setMode("idle")}
            className="rounded-md p-1.5 text-muted hover:bg-line"
          >
            <X size={15} aria-hidden />
          </button>
        </div>
      </li>
    );
  }

  const itemClass =
    "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-surface-2";

  return (
    <li className="px-1">
      <div
        className={cn(
          "group relative flex items-center rounded-lg transition-colors",
          active ? "bg-accent-soft" : "hover:bg-surface-2",
        )}
      >
        <button
          type="button"
          onClick={() => {
            selectThread(thread.id);
            onNavigate();
          }}
          aria-current={active ? "page" : undefined}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-3 py-2 text-left text-sm"
        >
          {thread.pinned && <Pin size={12} className="shrink-0 text-accent" aria-hidden />}
          <span className={cn("truncate", active && "font-medium")}>{thread.title}</span>
        </button>
        <button
          ref={trigger}
          type="button"
          onClick={toggleMenu}
          aria-label="Chat options"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          className={cn(
            "absolute right-1 rounded-md bg-inherit p-1.5 text-muted opacity-0 transition-opacity hover:text-ink focus-visible:opacity-100 group-hover:opacity-100 pointer-coarse:opacity-100",
            menuOpen && "opacity-100 text-ink",
          )}
        >
          <Ellipsis size={16} aria-hidden />
        </button>
      </div>
      {menu &&
        createPortal(
          <div
            ref={menuEl}
            role="menu"
            aria-label="Chat options"
            style={{
              position: "fixed",
              left: menu.left,
              top: menu.top,
              width: MENU_WIDTH,
              transform: menu.above ? "translateY(-100%)" : undefined,
            }}
            className="rise z-50 rounded-xl border border-line bg-surface p-1 shadow-xl"
          >
            <button
              type="button"
              role="menuitem"
              className={itemClass}
              onClick={() => {
                setMenu(null);
                togglePin(thread.id);
              }}
            >
              {thread.pinned ? <PinOff size={16} aria-hidden /> : <Pin size={16} aria-hidden />}
              {thread.pinned ? "Unpin" : "Pin"}
            </button>
            <button
              type="button"
              role="menuitem"
              className={itemClass}
              onClick={() => {
                setMenu(null);
                setTitle(thread.title);
                setMode("rename");
              }}
            >
              <Pencil size={16} aria-hidden />
              Rename
            </button>
            <div className="my-1 border-t border-line" role="separator" />
            <button
              type="button"
              role="menuitem"
              className={cn(itemClass, "text-danger")}
              onClick={() => {
                setMenu(null);
                setMode("delete");
              }}
            >
              <Trash2 size={16} aria-hidden />
              Delete
            </button>
          </div>,
          document.body,
        )}
    </li>
  );
}

export function Sidebar({ threads, activeId, className, onNavigate, onToggle }: SidebarProps) {
  const now = useNow();
  const groups = now === 0 ? [] : groupThreads(threads, now);

  return (
    <aside className={cn("w-[var(--sidebar-w,18rem)] shrink-0 flex-col border-r border-line bg-surface", className)} aria-label="Conversations">
      <div className="flex items-center gap-2 px-4 pb-2 pt-4">
        <div className="flex size-7 items-center justify-center rounded-lg bg-accent text-accent-ink">
          <ShieldCheck size={16} aria-hidden />
        </div>
        <span className="text-sm font-semibold tracking-tight">Glynac Compliance</span>
        <button
          type="button"
          onClick={onToggle}
          aria-label="Hide sidebar"
          title="Hide sidebar"
          className="ml-auto rounded-lg p-1.5 text-muted transition-colors hover:bg-surface-2 hover:text-ink"
        >
          <PanelLeft size={18} aria-hidden />
        </button>
      </div>
      <div className="px-3 py-2">
        <button
          type="button"
          onClick={() => {
            newChat();
            onNavigate();
          }}
          className="flex w-full items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-medium transition-colors hover:border-accent hover:bg-accent-soft"
        >
          <SquarePen size={16} aria-hidden />
          New chat
        </button>
      </div>
      <nav className="min-h-0 flex-1 overflow-y-auto pb-4">
        {groups.length === 0 && <p className="px-4 py-6 text-sm text-muted">Your conversations will appear here.</p>}
        {groups.map((group) => (
          <section key={group.label} className="mt-3">
            <h2 className="px-4 pb-1 text-xs font-medium text-muted">{group.label}</h2>
            <ul>
              {group.threads.map((thread) => (
                <ThreadRow key={thread.id} thread={thread} active={thread.id === activeId} onNavigate={onNavigate} />
              ))}
            </ul>
          </section>
        ))}
      </nav>
    </aside>
  );
}