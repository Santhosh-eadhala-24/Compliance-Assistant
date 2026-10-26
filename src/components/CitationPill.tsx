"use client";

import { BookOpen, ExternalLink } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getCitation } from "@/lib/citations";

const WIDTH = 340;
const MARGIN = 12;

interface Position {
  left: number;
  top: number;
  above: boolean;
}

export function CitationPill({ id, fallback }: { id: string; fallback: string }) {
  const citation = getCitation(id);
  const [position, setPosition] = useState<Position | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const dialogId = useId();
  const open = position !== null;

  useEffect(() => {
    if (!open) return;
    const close = () => setPosition(null);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPosition(null);
        buttonRef.current?.focus();
      }
    };
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!popoverRef.current?.contains(target) && !buttonRef.current?.contains(target)) close();
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
  }, [open]);

  if (!citation) return <span>{fallback}</span>;

  function toggle() {
    if (open) {
      setPosition(null);
      return;
    }
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const above = window.innerHeight - rect.bottom < 240 && rect.top > 240;
    setPosition({
      left: Math.max(MARGIN, Math.min(rect.left, window.innerWidth - WIDTH - MARGIN)),
      top: above ? rect.top - 8 : rect.bottom + 8,
      above,
    });
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={open ? dialogId : undefined}
        className="mx-0.5 inline-flex items-center gap-1 rounded-full border border-cite/25 bg-cite-soft px-2 py-px align-baseline text-[0.78rem] font-medium text-cite transition-colors hover:border-cite/60 aria-expanded:border-cite"
      >
        <BookOpen size={11} aria-hidden />
        {citation.label}
      </button>
      {open &&
        createPortal(
          <div
            ref={popoverRef}
            id={dialogId}
            role="dialog"
            aria-label={`${citation.label} source`}
            style={{
              position: "fixed",
              left: position.left,
              top: position.top,
              width: `min(${WIDTH}px, calc(100vw - ${MARGIN * 2}px))`,
              transform: position.above ? "translateY(-100%)" : undefined,
            }}
            className="rise z-50 rounded-xl border border-line bg-surface p-4 text-left shadow-xl"
          >
            <p className="text-xs font-medium text-cite">{citation.source}</p>
            <h4 className="mt-0.5 text-sm font-semibold text-ink">{citation.title}</h4>
            <blockquote className="mt-3 border-l-2 border-cite/40 pl-3 text-sm leading-relaxed text-ink/90">
              {citation.excerpt}
            </blockquote>
            <p className="mt-2 text-xs text-muted">Paraphrased excerpt. Confirm against the source.</p>
            <a
              href={citation.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
            >
              Open source document
              <ExternalLink size={13} aria-hidden />
            </a>
          </div>,
          document.body,
        )}
    </>
  );
}
