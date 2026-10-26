"use client";

import { ArrowDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Thread } from "@/lib/types";
import { isStreaming } from "@/lib/store";
import { MessageItem } from "./MessageItem";

const NEAR_BOTTOM = 96;

export function MessageList({ thread }: { thread: Thread }) {
  const scroller = useRef<HTMLDivElement>(null);
  const pinned = useRef(true);
  const [away, setAway] = useState(false);
  const busy = isStreaming(thread);
  const last = thread.messages[thread.messages.length - 1];

  function toBottom(smooth: boolean) {
    const el = scroller.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  }

  function onScroll() {
    const el = scroller.current;
    if (!el) return;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM;
    pinned.current = near;
    setAway(!near);
  }

  useEffect(() => {
    pinned.current = true;
    toBottom(false);
  }, [thread.id]);

  useEffect(() => {
    if (pinned.current) toBottom(false);
  }, [last?.content, last?.id]);

  return (
    <div className="relative h-full">
      <div ref={scroller} onScroll={onScroll} className="h-full overflow-y-auto" data-search-root>
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-7 px-4 py-6 sm:px-6">
          {thread.messages.map((message) => (
            <MessageItem key={message.id} threadId={thread.id} message={message} busy={busy} />
          ))}
        </div>
      </div>
      {away && (
        <button
          type="button"
          onClick={() => toBottom(true)}
          className="rise absolute bottom-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium shadow-md hover:bg-surface-2"
        >
          <ArrowDown size={13} aria-hidden />
          Jump to latest
        </button>
      )}
    </div>
  );
}
